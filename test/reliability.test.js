import test from 'node:test';
import assert from 'node:assert/strict';
import { restrictEmployeeTools, parseBid, validateTurn, missionCompletionStatus, turnOnce, createRuntimeEnsurer, closeRuntimeResources } from '../index.js';

for (const [text, expected] of [
  ['【接单】\nI will not pass this on.', 'accept'],
  ['【不接】\nI accept that this is important.', 'decline'],
  ['\n 【不接】\n工程师可以接单', 'decline'],
  ['Accept\n同事不接也没关系', 'accept'],
  ['Decline\n请工程师接单', 'decline'],
  ['pass\n说明', 'decline'],
  ['passenger counts', 'unclear'],
]) test(`bid: ${JSON.stringify(text)}`, () => assert.equal(parseBid(text), expected));

test('partial output never masks a model error', () => {
  assert.throws(() => validateTurn({ text: 'partial result', error: 'network failure' }), /network failure/);
});
test('empty and whitespace responses fail rather than becoming accepted work', () => {
  for (const text of ['', '  \n', undefined]) assert.throws(() => validateTurn({ text }), /有效输出/);
});
test('valid output is preserved', () => {
  const result = { text: 'done', error: '' };
  assert.equal(validateTurn(result), result);
});
for (const [name, results, cancelled, expected] of [
  ['all delivered', [{ bid: 'accept', status: 'done' }], false, 'done'],
  ['owner failed', [{ bid: 'accept', status: 'failed' }], false, 'failed'],
  ['partial delivery', [{ bid: 'accept', status: 'done' }, { bid: 'accept', status: 'failed' }], false, 'failed'],
  ['pending is not delivered', [{ bid: 'accept', status: 'queued' }], false, 'failed'],
  ['declines ignored', [{ bid: 'decline', status: 'queued' }, { bid: 'accept', status: 'done' }], false, 'done'],
  ['no workers', [], false, 'failed'],
  ['cancellation wins', [{ bid: 'accept', status: 'done' }], true, 'cancelled'],
]) test(`mission: ${name}`, () => assert.equal(missionCompletionStatus(results, cancelled), expected));

const message = (text) => ({ type: 'assistant/message', data: { message: { content: [{ type: 'text', text }] } } });
const end = (error) => ({ type: 'turn/end', data: { reason: error ? { kind: 'error', error: { message: error } } : { kind: 'completed' } } });
function mockAgent(onFollowup = () => {}) {
  const events = []; const cancelCauses = [];
  let cancelCount = 0;
  const agent = { status: 'idle', session: { get seq() { return events.length; }, snapshotEvents: (from) => events.slice(from) },
    followup: (input) => onFollowup(events, input), cancel: cause => { cancelCount++; cancelCauses.push(cause); } };
  return { agent, events, cancelCauses, get cancelCount() { return cancelCount; } };
}
test('instant turn completion is not missed even without a running state', async () => {
  const runtime = mockAgent((events, input) => { assert.equal(input.source.kind, 'user'); assert.ok(input.id); events.push(message('result'), end()); });
  runtime.events.push(message('old result'), end());
  assert.equal((await turnOnce(runtime, 'task', 100, 'test')).text, 'result');
});
test('agent never starts: timeout fails and requests cancellation', async () => {
  const runtime = mockAgent();
  await assert.rejects(turnOnce(runtime, 'task', 10, 'test'), /超时/);
  assert.equal(runtime.cancelCount, 1);
  assert.deepEqual(runtime.cancelCauses, [{ kind: 'parent' }]);
});
test('streaming partial output without completion still times out', async () => {
  const runtime = mockAgent((events) => events.push(message('partial')));
  await assert.rejects(turnOnce(runtime, 'task', 10, 'test'), /超时/);
});
test('model error after output is surfaced', async () => {
  const runtime = mockAgent((events) => events.push(message('partial'), end('model failed')));
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /model failed/);
});
test('empty completed turn fails', async () => {
  const runtime = mockAgent((events) => events.push(end()));
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /有效输出/);
});
test('asynchronous followup rejection is handled', async () => {
  const runtime = mockAgent(() => Promise.reject(new Error('offline')));
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /offline/);
});
test('cancelled before dispatch does not call followup', async () => {
  const runtime = mockAgent(() => assert.fail('must not start'));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test', controller.signal), /取消/);
});
test('cancellation while waiting requests agent cancellation', async () => {
  const runtime = mockAgent(); const controller = new AbortController();
  const promise = turnOnce(runtime, 'task', 1000, 'test', controller.signal);
  controller.abort();
  await assert.rejects(promise, /取消/);
  assert.equal(runtime.cancelCount, 1);
  assert.deepEqual(runtime.cancelCauses, [{ kind: 'user' }]);
});
test('do not enqueue into an already running agent', async () => {
  const runtime = mockAgent(() => assert.fail('must not dispatch')); runtime.agent.status = 'running';
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /其他任务/);
});

// A provider may not set `running` until after followup returns. The local
// ownership guard must reject a second caller before it can share/cancel a turn.
test('same agent cannot receive overlapping turns before its status updates', async () => {
  const runtime = mockAgent(); const controller = new AbortController();
  const first = turnOnce(runtime, 'first', 1000, 'test', controller.signal);
  await assert.rejects(turnOnce(runtime, 'second', 100, 'test'), /其他任务/);
  controller.abort();
  await assert.rejects(first, /取消/);
  assert.equal(runtime.cancelCount, 1);
  runtime.agent.followup = () => runtime.events.push(message('next'), end());
  await assert.rejects(turnOnce(runtime, 'third', 100, 'test'), /重建运行实例/);
});

for (const kind of ['cancelled', 'disposed', 'unknown', undefined]) {
  test(`non-success terminal reason ${kind} rejects partial output`, async () => {
    const runtime = mockAgent(events => events.push(message('unfinished answer'), { type: 'turn/end', data: { reason: { kind } } }));
    await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /未成功完成/);
  });
}
test('late cancellation events cannot contaminate another dispatch', async () => {
  const runtime = mockAgent(); let dispatches = 0;
  runtime.agent.followup = () => { dispatches++; };
  runtime.agent.cancel = () => { setTimeout(() => runtime.events.push(message('old result'), { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'user' } } } }), 15); };
  await assert.rejects(turnOnce(runtime, 'first', 5, 'test'), /超时/);
  await assert.rejects(turnOnce(runtime, 'second', 100, 'test'), /重建运行实例/);
  await new Promise(resolve => setTimeout(resolve, 30));
  await assert.rejects(turnOnce(runtime, 'third', 100, 'test'), /重建运行实例/);
  assert.equal(dispatches, 1);
  assert.equal(runtime.events.length, 2); // History remains intact, not cleared.
  const replacement = mockAgent(events => events.push(message('new result'), end()));
  assert.equal((await turnOnce(replacement, 'new', 100, 'test')).text, 'new result');
});

function runtimeFixture() {
  const runtimes = new Map(); let created = 0; let disposed = 0; let available = true;
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: e => e.version,
    available: () => available,
    spawn: async e => { created++; await new Promise(resolve => setTimeout(resolve, 5));
      return { agent: {}, fingerprint: e.version, handle: { dispose: async () => { disposed++; } } }; },
  });
  return { ensure, runtimes, get created() { return created; }, get disposed() { return disposed; }, stop() { available = false; } };
}
test('concurrent same employee initialization creates exactly one tracked agent', async () => {
  const f = runtimeFixture(); const employee = { id: 'one', version: 1 };
  const results = await Promise.all(Array.from({ length: 10 }, () => f.ensure(employee)));
  assert.equal(f.created, 1); assert.equal(f.runtimes.size, 1);
  for (const result of results) assert.equal(result, f.runtimes.get('one'));
});
test('concurrent configuration replacement disposes once and preserves tracking', async () => {
  const f = runtimeFixture(); await f.ensure({ id: 'one', version: 1 });
  const results = await Promise.all([f.ensure({ id: 'one', version: 2 }), f.ensure({ id: 'one', version: 2 })]);
  assert.equal(f.created, 2); assert.equal(f.disposed, 1); assert.equal(results[0], results[1]);
  assert.equal(f.runtimes.get('one'), results[0]);
});
test('shutdown during creation disposes the late runtime', async () => {
  const f = runtimeFixture(); const pending = f.ensure({ id: 'one', version: 1 });
  await new Promise(resolve => setTimeout(resolve, 1)); f.stop();
  await assert.rejects(pending, /停用/);
  assert.equal(f.created, 1); assert.equal(f.disposed, 1); assert.equal(f.runtimes.size, 0);
});
test('failed spawn does not poison the initialization queue', async () => {
  let count = 0; const runtimes = new Map(); const result = { agent: {}, fingerprint: 1 };
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 1, spawn: async () => { if (++count === 1) throw Error('offline'); return result; } });
  await assert.rejects(ensure({ id: 'one' }), /offline/);
  assert.equal(await ensure({ id: 'one' }), result);
});
test('failed disposal keeps old agent tracked and prevents replacement', async () => {
  const old = { agent: {}, fingerprint: 1, handle: { dispose: async () => { throw Error('dispose failed'); } } };
  const runtimes = new Map([['one', old]]);
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 2, spawn: async () => assert.fail('must not spawn') });
  await assert.rejects(ensure({ id: 'one' }), /dispose failed/);
  assert.equal(runtimes.get('one'), old);
});

test('shutdown during old runtime disposal prevents spawning a replacement', async () => {
  let available = true;
  const old = { agent: {}, fingerprint: 1, handle: { dispose: async () => { available = false; } } };
  const runtimes = new Map([['one', old]]);
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 2, available: () => available,
    spawn: async () => assert.fail('must not spawn after shutdown') });
  await assert.rejects(ensure({ id: 'one' }), /停用/);
  assert.equal(runtimes.size, 0);
});
test('late runtime with failed disposal remains tracked after shutdown', async () => {
  let available = true;
  const runtime = { agent: {}, fingerprint: 1, handle: { dispose: async () => { throw Error('late disposal failed'); } } };
  const runtimes = new Map();
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 1, available: () => available,
    spawn: async () => { available = false; return runtime; } });
  await assert.rejects(ensure({ id: 'one' }), /late disposal failed/);
  assert.equal(runtimes.get('one'), runtime);
});

test('official aborted terminal event rejects partial output', async () => {
  const runtime = mockAgent(events => events.push(message('unfinished answer'),
    { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'user' } } } }));
  await assert.rejects(turnOnce(runtime, 'task', 100, 'test'), /未成功完成：aborted/);
});

test('release waits for creation and never loses a late agent', async () => {
  const f = runtimeFixture(); const creation = f.ensure({ id: 'one', version: 1 });
  const releasing = f.ensure.release('one');
  await creation; await releasing;
  assert.equal(f.created, 1); assert.equal(f.disposed, 1); assert.equal(f.runtimes.size, 0);
});
test('failed release rejects, retains reference and can be retried', async () => {
  let attempts = 0;
  const runtime = { agent: {}, fingerprint: 1, handle: { dispose: async () => { if (++attempts === 1) throw Error('blocked'); } } };
  const runtimes = new Map([['one', runtime]]);
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 1, spawn: async () => assert.fail('not needed') });
  await assert.rejects(ensure.release('one'), /blocked/);
  assert.equal(runtimes.get('one'), runtime);
  await ensure.release('one'); assert.equal(runtimes.size, 0);
});
test('close drains pending creation, disposes once and rejects future creation', async () => {
  const f = runtimeFixture(); const creation = f.ensure({ id: 'one', version: 1 });
  const observed = assert.rejects(creation, /停用/);
  await new Promise(resolve => setTimeout(resolve, 1));
  await f.ensure.close(); await observed;
  assert.equal(f.created, 1); assert.equal(f.disposed, 1); assert.equal(f.runtimes.size, 0);
  await assert.rejects(f.ensure({ id: 'two', version: 1 }), /停用/);
});
test('close reports failures, preserves failed instances and releases others', async () => {
  const bad = { agent: {}, handle: { dispose: async () => { throw Error('blocked'); } } };
  const good = { agent: {}, handle: { dispose: async () => {} } };
  const runtimes = new Map([['bad', bad], ['good', good]]);
  const ensure = createRuntimeEnsurer({ runtimes, fingerprint: () => 1, spawn: async () => assert.fail('not needed') });
  await assert.rejects(ensure.close(), AggregateError);
  assert.equal(runtimes.size, 1); assert.equal(runtimes.get('bad'), bad);
});

test('shutdown awaits runtime disposal before closing storage', async () => {
  const events = [];
  await closeRuntimeResources(async () => {
    events.push('runtime-start'); await new Promise(resolve => setTimeout(resolve, 5)); events.push('runtime-end');
  }, { close: async () => { events.push('store-start'); await Promise.resolve(); events.push('store-end'); } });
  assert.deepEqual(events, ['runtime-start', 'runtime-end', 'store-start', 'store-end']);
});
test('failed runtime cleanup does not close storage', async () => {
  await assert.rejects(closeRuntimeResources(async () => { throw Error('live runtime'); },
    { close: async () => assert.fail('store must remain available') }), /live runtime/);
});
test('storage close failure is reported to the disposer caller', async () => {
  await assert.rejects(closeRuntimeResources(async () => {}, { close: async () => { throw Error('store busy'); } }), /store busy/);
});

for (const [label, skills, expected] of [['empty',[],[]],['missing',undefined,[]],['unknown',['missing'],[]],['mixed',['read','missing','read'],['read']]]) {
 test(`tool allowlist is fail-closed: ${label}`, () => {
  let received;
  restrictEmployeeTools({tools:{restrict(filter){received=filter;}}},skills,['read','write']);
  assert.deepEqual(received,{allow:expected});
 });
}
test('tool restriction failure aborts setup instead of continuing unrestricted', () => {
 assert.throws(()=>restrictEmployeeTools({tools:{restrict(){throw Error('restriction denied');}}},['read'],['read']),/restriction denied/);
 assert.throws(()=>restrictEmployeeTools({},[],[]));
});

test('global employee ownership rejects overlap and stale releases cannot clear a new owner', async () => {
 const {createEmployeeOwnership}=await import('../index.js'); const owners=createEmployeeOwnership();
 const a=owners.acquire('same'); assert.throws(()=>owners.acquire('same'),/其他任务/);
 const other=owners.acquire('other'); assert.equal(other.owns(),true); other.release();
 a.release(); const b=owners.acquire('same'); a.release(); assert.equal(b.owns(),true); b.release();
});
test('workflow budget checks before joining fan-in or expanding repeated inputs', async () => {
 const {boundedJoin,expandWorkflowInput,WORKFLOW_PROMPT_LIMIT:L}=await import('../index.js');
 assert.equal(boundedJoin(['a'.repeat(L)]).length,L);
 assert.throws(()=>boundedJoin(['a'.repeat(L),'b']),/预算/);
 let consumed=0; function* large(){for(let i=0;i<58;i++){consumed++;yield 'x'.repeat(6000);}}
 assert.throws(()=>boundedJoin(large(),'\n\n'),/预算/); assert.equal(consumed,6);
 assert.throws(()=>expandWorkflowInput('{{input}}'.repeat(444),'x'.repeat(349090)),/预算/);
 assert.equal(expandWorkflowInput('{{input}}','x'.repeat(L)).length,L);
 assert.throws(()=>expandWorkflowInput('{{input}}','x'.repeat(L+1)),/预算/);
 assert.equal(expandWorkflowInput('{{input}}+{{input}}','ok'),'ok+ok');
 assert.match(expandWorkflowInput('{{input}}',''),/没有上游输入/);
});
test('workflow output is preserved in full or rejected, never silently truncated as success', async () => {
 const {validateWorkflowOutput}=await import('../index.js');
 assert.equal(validateWorkflowOutput('x'.repeat(5997)+'END'),'x'.repeat(5997)+'END');
 assert.throws(()=>validateWorkflowOutput('x'.repeat(6000)+'END'),/未传给下游/);
});
