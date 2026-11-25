import * as T from './three.module.min.js';

const offices = {
  product: [-6.3,-4.1,5.9,3.75,0x9367d4], engineering:[0,-4.1,6.1,3.75,0x5489be],
  data:[6.3,-4.1,5.9,3.75,0x3f9a86], quality:[-6.3,.02,5.9,3.65,0xba789d],
  lead:[0,.02,6.1,3.65,0xb0804f], team:[6.3,.02,5.9,3.65,0xa275bb],
};
const BASE_AZIMUTH=.045, BASE_ELEVATION=1.35, BASE_DISTANCE=28.4;
const tint = Object.fromEntries(Object.entries(offices).map(([id,a])=>[id,a[4]]));
const skins=[0xcb9174,0xf1c3a0,0x9d6450,0xe6a883];
const hairs=[0x182133,0x593b2e,0x8b5540,0x252536];
const hash = s => Array.from(String(s)).reduce((a,c)=>(a*31+c.codePointAt(0))>>>0,0);
const railPositions = [[0,0],[-1.01,0],[1.01,0],[-1.01,1.36],[1.01,1.36]];
const densePositions=[[-1.03,-.78],[1.03,-.78],[-1.03,.98],[1.03,.98]];

export function mountOffice3D(host,{pick,language='zh',reducedMotion=false,onLost}={}) {
  const document=host.ownerDocument;
  const view=document.defaultView;
  const scene=new T.Scene();
  scene.background=new T.Color(0xd7d3cd);
  const camera=new T.OrthographicCamera(-10,10,7,-7,.1,100);
  const renderer=new T.WebGLRenderer({alpha:false, antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0xd7d3cd);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.setPixelRatio(Math.min(view.devicePixelRatio||1,1.5));
  const element=renderer.domElement;
  element.setAttribute('aria-hidden','true');
  element.dataset.officeThree=T.REVISION;
  const overlay=document.createElement('div');
  overlay.className='dsc-o3-labels';
  overlay.setAttribute('aria-hidden','true');
  host.replaceChildren(element,overlay);
  const ambient=new T.HemisphereLight(0xfff9f0,0xb0a49c,2.13);
  const key=new T.DirectionalLight(0xffe5c9,2.22); key.position.set(-7,11,6);
  const rim=new T.DirectionalLight(0xc4ddff,.68); rim.position.set(4,8,-6);
  key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:.1,far:37});
  key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00055;key.shadow.normalBias=.035;
  scene.add(ambient,key,rim);
  const materials=new Map(), labels=[], hits=[], stations=new Map();
  const floor=new T.Group(), workers=new T.Group();scene.add(floor,workers);
  const cube=new T.BoxGeometry(1,1,1), ball=new T.SphereGeometry(1,14,10), cylinder=new T.CylinderGeometry(1,1,1,12);
  const mat=(color, mode='standard')=>{
    const id=color+':'+mode;
    if (!materials.has(id)) materials.set(id, mode==='light' ? new T.MeshBasicMaterial({color}) :
      new T.MeshStandardMaterial({color, roughness:.72, metalness:mode==='metal'?.55:.12,
       ...(mode==='glass'?{transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide,roughness:.28,metalness:.18}:{})}));
    return materials.get(id);
  };
  function add(parent, geometry, size, pos, color, mode) {
    const m=new T.Mesh(geometry,mat(color,mode));m.position.set(...pos);m.scale.set(...size);m.receiveShadow=mode!=='light'&&mode!=='glass';m.castShadow=m.receiveShadow&&size[1]>.095&&pos[1]>.10;parent.add(m);return m;
  }
  const box=(parent,w,h,d,x,y,z,c,m)=>add(parent,cube,[w,h,d],[x,y,z],c,m);
  const sphere=(parent,w,h,d,x,y,z,c)=>add(parent,ball,[w,h,d],[x,y,z],c);
  function tube(parent,r,h,x,y,z,c,m){return add(parent,cylinder,[r,h,r],[x,y,z],c,m);}
  function label(parent,text,world,kind,color){
    const node=document.createElement('span');node.textContent=text;node.className='dsc-o3-label dsc-o3-'+kind;
    if(color) node.style.setProperty('--tint','#'+color.toString(16).padStart(6,'0'));
    overlay.appendChild(node);const v=new T.Vector3(...world);parent.updateMatrixWorld(true);
    labels.push({node,p:parent.localToWorld(v),isWorker:kind==='worker'});return node;
  }
  function beam(parent,from,to,r,color) {
    const a=new T.Vector3(...from), b=new T.Vector3(...to);
    const p=a.clone().lerp(b,.5);const o=tube(parent,r,a.distanceTo(b),p.x,p.y,p.z,color);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());return o;
  }
  function lamp(parent,x,z,color) {
    tube(parent,.07,.014,x,.86,z,0x29364c,'metal');
    beam(parent,[x,.86,z],[x,.995,z],.014,0x93a7c5);
    beam(parent,[x,.985,z],[x-.10,1.04,z],.012,0x93a7c5);
    const bulb=sphere(parent,.10,.046,.08,x-.12,1.03,z,color);bulb.material=mat(color,'light');
  }
  function plant(p,x,z,v=0){
    tube(p,.18,.31,x,.165,z, v?0x2b4561:0x292f43,'metal');
    tube(p,.15,.025,x,.32,z,0x141c2b);
    for(let i=0;i<7;i++){const theta=i*2.399;const leaf=sphere(p,.075,.21,.11,x+Math.sin(theta)*.12,.43+(i%3)*.06,z+Math.cos(theta)*.12,i%2?0x328e72:0x64a691);leaf.rotation.set(Math.cos(theta)*.62,theta,Math.sin(theta)*.62);}
  }
  // A deliberately continuous light floor. Small partition gaps are the circulation spine.
  box(floor,19.65,.35,12.98,0,-.25,.28,0x6f655e);
  box(floor,19.31,.17,12.68,0,-.073,.28,0xb2a99e);
  box(floor,19.18,.017,12.56,0,.022,.28,0xc9c5bc);
  for(let x=-9.4;x<9.5;x+=.59)box(floor,.013,.012,12.42,x,.033,.28,0xb6b0a6);
  for(let z=-5.88;z<6.43;z+=.59)box(floor,19.05,.012,.013,0,.034,z,0xb6b0a6);
  const roomLabels={
    lead:['总经理办公室','DIRECTOR'],product:['产品部','PRODUCT'],engineering:['研发部','ENGINEERING'],
    data:['数据部','ANALYTICS'],quality:['质量部','QUALITY'],team:['协作会议室','MEETING ROOM'],
  };
  const roomFloors={product:0xd6cadc,engineering:0xb8ccdf,data:0xbdd3c7,quality:0xdfcbcf,lead:0xc59e74,team:0xd4c8df};
  const roomTags=new Map();
  function casework(g,w,x,z){
    box(g,w,.39,.38,x,.24,z,0xa2a49d);
    box(g,w+.06,.045,.43,x,.451,z,0xece5d8);
    for(let i=0;i<4;i++)box(g,.038,.23,.02,x-w*.36+i*w*.24,.24,z+.204,0xc7ad95);
  }
  for(const [id,[x,z,w,d,color]] of Object.entries(offices)){
    const g=new T.Group();g.position.set(x,0,z);floor.add(g);
    box(g,w-.07,.044,d-.06,0,.052,0,roomFloors[id]);
    const edge=w/2-.04, back=-d/2+.067, front=d/2-.06;
    // Cream partition caps, with open doorways facing the corridor.
    box(g,w,.37,.105,0,.245,back,0xe5e1d6);
    box(g,w,.068,.12,0,.439,back,0xf7f1e8);
    for(const side of [-1,1]){
      box(g,.108,.32,d-.085,edge*side,.222,0,0xe6e0d6);
      box(g,.117,.057,d-.13,edge*side,.41,0,0xede7db);
      box(g,w*.34,.115,.106,side*w*.33,.125,front,0xece6dc);
    }
    box(g,1.28,.033,.10,0,.088,front,color);
    box(g,w*.31,.018,.055,-w*.29,.081,back+.20,color);
    plant(g,w*.40,d*.29,id==='lead'?1:0);
    plant(g,-w*.39,d*.29);
    casework(g,id==='lead'?1.85:1.22,-w*.34,back+.40);
    const cap=label(g,roomLabels[id][language==='en'?1:0],[-w*.31,.31,back+.28],'room',color);
    roomTags.set(id,{cap,title:roomLabels[id][language==='en'?1:0]});
    if(id==='lead'){
      box(g,3.82,.021,2.33,.0,.101,.17,0x9a7d64);
      box(g,3.60,.017,2.13,.0,.114,.17,0xcbb397);
      // Executive wall display is purely decorative; no fabricated performance figures.
      box(g,2.27,.48,.15,.42,.94,back+.27,0x2d3e50);
      box(g,2.12,.38,.024,.42,.95,back+.36,0x405f78);
      for(let i=0;i<5;i++)box(g,.24,.025,.031,-.42+i*.40,.95,back+.377,i%2?0xc9b586:0x80a3b9);
      box(g,.88,.19,.53,1.97,.19,.73,0xa28b77);
      box(g,.81,.26,.47,1.98,.30,.73,0xd5c0a8);
    }
    if(id==='team'){
      const cz=-.59;
      box(g,2.74,.12,1.05,0,.66,cz,0xa98662,'metal');
      box(g,2.63,.055,.99,0,.748,cz,0xe3cbb0);
      for(const dx of [-1.1,1.1]) for(const dz of [-.37,.37])box(g,.065,.55,.065,dx,.36,cz+dz,0x957e6b,'metal');
      for(const dx of [-.68,.68])for(const dz of [-.92,.92]){
        box(g,.43,.12,.42,dx,.36,cz+dz,0x8b87a2);
        tube(g,.05,.29,dx,.18,cz+dz,0x6f6888,'metal');
      }
      box(g,.42,.028,.20,.12,.789,cz-.11,0xf1eada);
      tube(g,.058,.10,-.47,.82,cz+.19,0xe8ddd4);
    }
  }
  // The public corridor ends in reception/lounge furniture, not imaginary employees.
  const lobby=new T.Group();lobby.position.z=4.05;floor.add(lobby);
  box(lobby,18.61,.041,3.50,0,.052,0,0xd9cec1);
  box(lobby,5.72,.024,2.36,0,.079,.17,0xc7b3a1);
  box(lobby,2.70,.52,.65,0,.36,-.16,0xae8870);
  box(lobby,2.88,.098,.76,0,.655,-.16,0xe6d9c9);
  box(lobby,.51,.043,.32,-.69,.729,-.17,0x5e738a);
  tube(lobby,.098,.142,.77,.747,-.14,0xddd3b9);plant(lobby,2.28,.64,1);plant(lobby,-2.30,.64,1);
  for(const x of [-6.23,6.23]){
    box(lobby,4.42,.021,2.41,x,.079,.12,x<0?0xb8c4b4:0xc7bbc8);
    for(const dx of [-1.35,1.35]){
      box(lobby,.81,.28,1.19,x+dx,.22,.15,x<0?0x698b78:0x927b96);
      box(lobby,.71,.20,1.01,x+dx,.43,.15,x<0?0xa3bba2:0xbba9bf);
      box(lobby,.19,.35,1.19,x+dx*1.27,.49,.15,x<0?0x829c87:0xad96ad);
      for(const arm of [-.51,.51])box(lobby,.72,.22,.12,x+dx,.47,.15+arm,x<0?0x8ea892:0xa991a9);
    }
    tube(lobby,.41,.12,x,.35,.14,0xcfb99e);
    tube(lobby,.057,.096,x+.10,.457,.24,0xf0e6d4);
  }
  label(lobby,language==='en'?'RECEPTION':'公司前台',[0,.12,-1.01],'room',0xa48263);
  label(lobby,language==='en'?'LOUNGE':'休息区',[-6.23,.12,-1.08],'room',0x739582);
  label(lobby,language==='en'?'LIBRARY':'资料区',[6.23,.12,-1.08],'room',0x9b82ac);
  const bossAnchor=new T.Vector3(0,.12,1.60);

  function person(g, role, n, color) {
    const look=role||'other', skin=skins[n%4], hair=hairs[(n>>>5)%4];
    const shirt={director:0x273756,product:0x8b60c2,techlead:0x2a7899,engineer:0x3f5c9b,analyst:0x3d8f84,qa:0xa370b2,reviewer:0x8574a7}[look]||color;
    const home=new T.Vector3(0,0,.62);
    const chair=new T.Group();chair.position.copy(home);g.add(chair);
    tube(chair,.075,.34,0,.22,.14,0x626d82,'metal');
    box(chair,.54,.13,.44,0,.43,.13,0x354469);
    box(chair,.60,.62,.11,0,.69,.36,0x354469);
    const p=new T.Group();p.position.copy(home);g.add(p);
    const torso=new T.Group();p.add(torso);
    const body=sphere(torso,.269,.366,.169,0,.75,.04,shirt);body.rotation.x=-.12;
    sphere(torso,.17,.183,.166,0,1.23,-.008,skin);
    sphere(torso,.181,.112,.171,0,1.347,.005,hair);
    if(look==='product'||(n%3===1)){
      sphere(torso,.070,.084,.075,-.092,1.298,.084,hair); sphere(torso,.07,.079,.079,.088,1.282,.096,hair);
    }
    if(look==='qa'){sphere(torso,.082,.096,.064,0,1.366,.089,hair);}
    if(look==='director'){
      box(torso,.05,.20,.019,0,.865,-.129,color,'light');
      beam(torso,[-.27,.91,-.01],[-.19,.985,-.075],.041,0xacc0ed);
    }
    if(look==='engineer'||look==='techlead')for(const s of [-1,1])sphere(torso,.037,.059,.06,s*.131,1.24,.006,0x1a2943);
    if(look==='analyst'||look==='reviewer') {
      for(const s of [-1,1])box(torso,.085,.038,.016,s*.061,1.235,-.131,0xb6e9ff,'metal');
      box(torso,.03,.014,.014,0,1.235,-.142,0xb6e9ff);
    }
    const limbs=[];
    for(const side of [-1,1]){
      const upper=beam(torso,[side*.215,.89,.015],[side*.276,.76,-.12],.068,shirt);
      const lower=beam(torso,[side*.276,.76,-.12],[side*.17,.843,-.34],.056,shirt);
      const hand=sphere(torso,.070,.048,.077,side*.17,.853,-.35,skin);
      const thigh=beam(p,[side*.122,.55,.03],[side*.14,.39,-.25],.079,0x21324a);
      const shin=beam(p,[side*.14,.39,-.25],[side*.14,.105,-.38],.060,0x21324a);
      const shoe=sphere(p,.083,.053,.13,side*.14,.087,-.41,0x202638);
      limbs.push({side,upper,lower,hand,thigh,shin,shoe});
    }
    return {p,torso,limbs,home};
  }
  function station(employee,x,z,room) {
    const hue=tint[room]||0xc18cfa,n=hash(employee.id);
    const g=new T.Group();g.position.set(x,.08,z); workers.add(g);
    const large=room==='lead'&&employee.role==='director';
    box(g,large?2.70:1.72,.095,.86,0,.72,0,large?0x8b674b:0xb4b1a7);
    box(g,large?2.65:1.70,.037,.83,0,.778,0,large?0xcba77e:0xe5e0d6);
    box(g,.25,.026,.20,-.48,.813,.09,0xabbcd1);
    box(g,.19,.023,.24,.39,.818,.26,0xfff4d8);
    box(g,1.53,.025,.021,0,.715,.393,hue,'light');
    for (const xx of [-.67,.67])for(const zz of [-.28,.28])box(g,.049,.63,.049,xx,.39,zz,0x7988a3,'metal');
    box(g,.40,.021,.14,-.087,.81,.27,0xb4c6da);
    sphere(g,.055,.025,.075,.21,.82,.24,0xdde9fd);
    tube(g,.073,.116,.56,.85,.12,0xf3e8d8);tube(g,.056,.008,.56,.910,.12,0x744b32);
    lamp(g,-.61,-.19,hue);
    const monitor=(x,z,w,ay=0)=>{
      const rig=new T.Group();rig.position.set(x,0,z);rig.rotation.y=ay;g.add(rig);
      box(rig,.236,.026,.20,0,.815,0,0x27344e);
      box(rig,.042,.20,.047,0,.929,.022,0x435779,'metal');
      box(rig,w,.36,.063,0,1.084,0,0x1b263b);
      const face=box(rig,w-.075,.29,.008,0,1.084,-.037,0x466591,'light');
      // Front and back in this cutaway carry the same screen tint.
      const back=box(rig,w-.075,.29,.008,0,1.084,.037,0x466591,'light');
      for(let i=0;i<3;i++)box(rig,(w-.17)*(1-i*.16),.014,.009,-.012,1.156-i*.065,.044,hue,'light');
      return [face,back];
    };
    const duel=['engineer','techlead','analyst'].includes(employee.role);
    const screens=duel?[...monitor(-.29,-.08,.55),...monitor(.30,-.06,.53,-.20)]:monitor(.0,-.12,.70);
    const avatar=person(g,employee.role,n,hue);
    const beacon=tube(g,.058,.025,.71,.81,.26,0x8ca3bf,'light');
    const select=box(g,1.75,.014,1.77,0,.015,.25,hue,'glass');select.visible=false;
    // Transparent pick proxy; occlusion and overlap are handled by Raycaster distance.
    const proxy=new T.Mesh(cube,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));proxy.position.set(0,.73,.22);proxy.scale.set(1.72,1.40,1.47);g.add(proxy);
    proxy.userData.id=employee.id;hits.push(proxy);
    // A second, tighter proxy follows a participant away from their desk.
    const movingProxy=new T.Mesh(cube,proxy.material);movingProxy.scale.set(.56,1.38,.48);movingProxy.position.y=.69;avatar.p.add(movingProxy);
    movingProxy.userData.id=employee.id;movingProxy.userData.sharedPickingMaterial=true;
    const tag=label(g,employee.name,[0,.78,1.055], 'worker',hue);
    const tagRecord=labels[labels.length-1];
    stations.set(employee.id,{screens,beacon,select,tag,tagRecord,hue,g,avatar,proxy,movingProxy,kind:'idle',away:false,arrived:false});

  }
  function rebuild(items) {
    for(const label of labels.filter(l=>l.isWorker))label.node.remove();
    for(let i=labels.length-1;i>=0;i--) if(labels[i].isWorker)labels.splice(i,1);
    workers.traverse(m=>{if(m.userData.id&&!m.userData.sharedPickingMaterial)m.material.dispose();});workers.clear();hits.length=0;stations.clear();
    for(const [room,[cx,cz]] of Object.entries(offices)){
      const found=items.filter(e=>e.department===room);
      const layout=found.length>2?densePositions:found.length===2?railPositions.slice(1,3):railPositions.slice(0,1);
      // Dense rosters remain completely reachable in the accessible floor plan.
      found.slice(0,room==='team'?2:layout.length).forEach((e,i)=>{
        const [dx,dz]=room==='team' ? [[-1.05,1.43],[1.05,1.43]][i] : layout[i];
        station(e,cx+dx,cz+dz-(room==='team'?0:.31),room);
      });
    }
  }
  let identity='', theta=BASE_AZIMUTH, elevation=BASE_ELEVATION, distance=BASE_DISTANCE, stopped=false, raf=0, pointers=null, visible=true;
  const ray=new T.Raycaster(), cursor=new T.Vector2(), target=new T.Vector3(0,.21,.25);
  const motion=view.matchMedia?.('(prefers-reduced-motion: reduce)');
  let width=1,height=1;
  const up=new T.Vector3(0,1,0), axis=new T.Vector3(), v1=new T.Vector3(), v2=new T.Vector3();
  const TEAM_X=offices.team[0], TEAM_Z=offices.team[1]-.59;
  const meetingCenter=new T.Vector3(TEAM_X,1.15,TEAM_Z);
  const replyGeometry=new T.SphereGeometry(.075,10,8);
  const replies=[];
  const seenReplies=new Map();
  let receivedBaseline=false;
  function segment(mesh,a,b){
    v1.set(...a);v2.set(...b);axis.subVectors(v2,v1);
    const len=axis.length();
    mesh.position.copy(v1).lerp(v2,.5);mesh.scale.y=len;
    if(len>1e-6)mesh.quaternion.setFromUnitVectors(up,axis.divideScalar(len));
  }
  function pose(st,now,walking,typing,meeting){
    const {p,torso,limbs}=st.avatar;
    torso.position.y=walking?.20+.035*Math.abs(Math.sin(now/115)):0;
    torso.rotation.x=typing?-.13:0;
    for(const l of limbs){
      const x=l.side, phase=now/76+(x>0?1.45:0);
      const keystroke=typing?(Math.sin(phase)*.5+.5):0;
      const swing=walking?.15*Math.sin(now/115+(x>0?Math.PI:0)):0;
      const shoulder=[x*.215,.89,.015];
      const elbow=walking?[x*.26,.675,-swing*.55]:[x*.255,.79+keystroke*.042,-.14];
      const palm=walking?[x*.28,.51,-swing]:[x*.12+keystroke*.055,.845+keystroke*.062,meeting?-.235:-.35+keystroke*.055];
      segment(l.upper,shoulder,elbow);segment(l.lower,elbow,palm);l.hand.position.set(...palm);
      const knee=walking?[x*.12,.41,-swing*.5]:[x*.137,.38,-.24];
      const ankle=walking?[x*.12,.092+Math.max(0,swing)*.35,-swing]:[x*.14,.092,-.39];
      segment(l.thigh,[x*.122,walking?.70:.55,.02],knee);segment(l.shin,knee,ankle);l.shoe.position.set(...ankle);
    }
    st.tagRecord.p.set(st.g.position.x+p.position.x,st.g.position.y+p.position.y+.91,st.g.position.z+p.position.z+.46);
  }
  const anchor=(i,n)=>{
    if(n<=4){
      const slots=[[-.68,.92],[.68,.92],[-.68,-.92],[.68,-.92]];
      return new T.Vector3(TEAM_X+slots[i][0],0,TEAM_Z+slots[i][1]);
    }
    const angle=(i/n)*2*Math.PI;
    return new T.Vector3(TEAM_X+1.35*Math.cos(angle),0,TEAM_Z+1.18*Math.sin(angle));
  };
  const rotationTo=(from,to)=>Math.atan2(from.x-to.x,from.z-to.z);
  function setTarget(st,destination,meeting){
    const local=destination.clone().sub(st.g.position);local.y=0;
    if(st.goal?.distanceToSquared(local)<1e-5&&st.headingToMeeting===meeting)return;
    const worldZ=st.g.position.z+st.avatar.p.position.z;
    const way=[];
    // Leave desks via the central aisle and enter from the collaboration-room edge.
    if(Math.abs(st.avatar.p.position.x-local.x)>1.5||Math.abs(st.avatar.p.position.z-local.z)>2){
      const cross=worldZ < -2 || destination.z < -2 ? -2.06 : 2.05;
      const aisle=cross-st.g.position.z;
      if(Math.abs(worldZ-cross)>.28)way.push(new T.Vector3(st.avatar.p.position.x,0,aisle));
      way.push(new T.Vector3(local.x,0,aisle));
    }
    way.push(local);st.path=way;st.goal=local;st.headingToMeeting=meeting;st.arrived=false;
  }
  function clearReplies(){for(const packet of replies)scene.remove(packet.mesh);replies.length=0;}
  function startReply(st,key,at){
    if(seenReplies.has(key))return;
    seenReplies.set(key,at);
    if(!receivedBaseline||!visible||document.hidden||reducedMotion||motion?.matches)return;
    if(Date.now()-at>15000||at>Date.now()+1500)return;
    const from=st.g.position.clone().add(st.avatar.p.position);
    from.y+=1.48;
    const to=meetingCenter.clone();
    // Ensure a legible direction even for a reply sent while seated by the table.
    const mesh=new T.Mesh(replyGeometry,mat(0xe7519a,'light'));
    mesh.position.copy(from);scene.add(mesh);replies.push({mesh,from,to,start:view.performance.now()});
    if(replies.length>12)scene.remove(replies.shift().mesh);
  }
  function draw(now=0){
    raf=0;if(stopped)return;
    if(!visible||document.hidden){clearReplies();element.dataset.officeAnimating='false';element.dataset.officeReplies='0';return;}
    const animated=!reducedMotion&&!motion?.matches;
    let active=false,typingCount=0,meetingCount=0;
    for(const st of stations.values()){
      const p=st.avatar.p, goal=st.goal||st.avatar.home;
      let walking=false;
      if(!animated){
        p.position.copy(goal);st.path=[];st.arrived=true;
      }else if(st.path?.length){
        const to=st.path[0], dist=p.position.distanceTo(to);
        if(dist<.05){p.position.copy(to);st.path.shift();}
        else{
          const delta=Math.min(75,Math.max(8,now-(st.frameTime||now)));
          p.rotation.y=rotationTo(p.position,to);
          p.position.lerp(to,Math.min(1,(delta*.0075)/dist));
          walking=true;
        }
        st.arrived=st.path.length===0;
      }
      st.frameTime=now;
      const atMeeting=st.headingToMeeting&&st.arrived;
      if(!walking)p.rotation.y=atMeeting?rotationTo(st.g.position.clone().add(p.position),meetingCenter):0;
      const typing=st.kind==='typing'&&!walking&&p.position.distanceToSquared(st.avatar.home)<.01;
      typingCount+=Number(typing);meetingCount+=Number(atMeeting);
      active ||= animated&&(walking||Boolean(st.path?.length)||typing);
      pose(st,now,animated&&walking,animated&&typing,atMeeting);
      st.beacon.scale.x=st.beacon.scale.z=.058*(animated&&typing?1.12+.23*Math.sin(now/235):1);
      st.tag.dataset.motion=st.kind;st.tag.dataset.atMeeting=String(Boolean(atMeeting));
      st.tag.dataset.walking=String(walking);
      const away=p.position.distanceToSquared(st.avatar.home)>.06;
      if(away!==st.away){
        st.away=away;
        const idx=hits.indexOf(away?st.proxy:st.movingProxy);
        if(idx>=0)hits.splice(idx,1,away?st.movingProxy:st.proxy);
      }
    }
    for(let i=replies.length-1;i>=0;i--){
      const packet=replies[i],u=(now-packet.start)/930;
      if(!animated||u>=1){scene.remove(packet.mesh);replies.splice(i,1);continue;}
      active=true;packet.mesh.position.copy(packet.from).lerp(packet.to,Math.max(0,u));packet.mesh.position.y+=Math.sin(Math.PI*Math.max(0,u))*.6;
    }
    camera.position.set(Math.sin(theta)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(theta)*Math.cos(elevation)*distance);
    camera.position.add(target);camera.lookAt(target);camera.updateMatrixWorld();
    const aspect=width/height, fit=Math.max(10.1/Math.max(.1,aspect),6.72), zoomFit=fit*(distance/BASE_DISTANCE);
    camera.left=-zoomFit*aspect;camera.right=zoomFit*aspect;camera.top=zoomFit;camera.bottom=-zoomFit;camera.updateProjectionMatrix();
    const boss=bossAnchor.clone().project(camera);
    host.parentElement?.style.setProperty('--office-boss-x',`${100*Math.max(.14,Math.min(.86,(boss.x+1)/2))}%`);
    host.parentElement?.style.setProperty('--office-boss-y',`${100*Math.max(.21,Math.min(.84,(1-boss.y)/2))}%`);
    renderer.render(scene,camera);
    for(const l of labels){
      const p=l.p.clone().project(camera);
      l.node.style.transform='translate3d('+((p.x+1)*width/2)+'px,'+((1-p.y)*height/2)+'px,0) translate(-50%,-50%)';
      l.node.hidden=Math.abs(p.x)>1.03||Math.abs(p.y)>1.02||p.z>1;
    }
    element.dataset.officeAnimating=String(active);
    element.dataset.officeTyping=String(typingCount);
    element.dataset.officeMeeting=String(meetingCount);
    element.dataset.officeReplies=String(replies.length);
    if(active)schedule();
  }
  const schedule=()=>{if(!stopped&&!raf)raf=view.requestAnimationFrame(draw);};
  function resize(){
    width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);
    renderer.setSize(width,height,false);schedule();
  }
  const clamp=(x,l,r)=>Math.max(l,Math.min(r,x));
  const abort=new AbortController(), opts={signal:abort.signal};
  element.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    pointers={id:e.pointerId,x:e.clientX,y:e.clientY,d:0};element.setPointerCapture(e.pointerId);element.style.cursor='grabbing';
  },opts);
  element.addEventListener('pointermove',e=>{
    if(pointers?.id!==e.pointerId)return;
    const dx=e.clientX-pointers.x,dy=e.clientY-pointers.y;pointers.x=e.clientX;pointers.y=e.clientY;pointers.d+=Math.abs(dx)+Math.abs(dy);
    if(pointers.d>5){theta-=dx*.008;elevation=clamp(elevation+dy*.006,.4,1.45);schedule();}
  },opts);
  element.addEventListener('pointerup',e=>{
    if(pointers?.id!==e.pointerId)return;
    const click=pointers.d<=5;pointers=null;element.style.cursor='grab';
    if(!click)return;
    const bounds=element.getBoundingClientRect();cursor.set((e.clientX-bounds.left)*2/bounds.width-1,-(e.clientY-bounds.top)*2/bounds.height+1);
    ray.setFromCamera(cursor,camera);
    const hit=ray.intersectObjects(hits,false)[0];if(hit)pick?.(hit.object.userData.id);
  },opts);
  const cancel=()=>{pointers=null;element.style.cursor='grab';};
  element.addEventListener('pointercancel',cancel,opts);
  element.addEventListener('lostpointercapture',cancel,opts);
  // Wheel zoom is explicit Ctrl/Command+scroll, leaving ordinary scrolling intact.
  element.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();distance=clamp(distance+e.deltaY*.018,12,42);schedule();}},{...opts,passive:false});
  element.addEventListener('webglcontextlost',e=>{e.preventDefault();onLost?.();},opts);
  const observer=new view.ResizeObserver(resize);observer.observe(host);
  const intersection=view.IntersectionObserver?new view.IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}):null;
  intersection?.observe(host);
  motion?.addEventListener('change',schedule,opts);
  document.addEventListener('visibilitychange',schedule,opts);
  resize();
  return {
    update(items,selected){
      const key=JSON.stringify(items.map(e=>[e.id,e.name,e.role,e.department]));
      if(key!==identity){identity=key;clearReplies();rebuild(items);}
      const participants=items.filter(e=>stations.has(e.id)&&e.verified&&e.motion?.kind==='group'&&typeof e.motion.groupId==='string'&&e.motion.groupId).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
      for(const [room,{cap,title}] of roomTags){
        const count=items.filter(e=>e.department===room).length;
        cap.textContent=title+(count?` · ${count}`:'');
      }
      for(const e of items){const found=stations.get(e.id);if(!found)continue;
        const groupIndex=participants.indexOf(e);
        found.kind=!e.verified?'idle':groupIndex>=0?'group':e.motion?.kind==='typing'?'typing':e.motion?.kind==='reply'?'reply':'idle';
        found.active=found.kind==='typing'||found.kind==='group';
        setTarget(found,groupIndex>=0?anchor(groupIndex,participants.length):found.g.position.clone().add(found.avatar.home),groupIndex>=0);
        const event=e.latestReply||(e.motion?.kind==='reply'?e.motion:null);
        if(e.verified&&event?.kind==='reply'&&typeof event.groupId==='string'&&event.groupId&&typeof event.eventId==='string'&&event.eventId&&Number.isFinite(event.at)){
          startReply(found,JSON.stringify([e.id,event.groupId,event.eventId]),event.at);
        }
        const color=found.active?0x60ffd3:e.verified?0x53738d:0x667685;
        for(const screen of found.screens)screen.material=mat(color,'light');
        found.beacon.material=mat(found.active?0x81ffd3:0x62718f,'light');
        found.select.visible=selected===e.id;
        found.tag.dataset.working=String(found.active);found.tag.dataset.selected=String(selected===e.id);
        found.tag.title=e.status;
      }
      if(items.length)receivedBaseline=true;
      if(seenReplies.size>2048)for(const [id,at] of seenReplies){if(at<Date.now()-30000)seenReplies.delete(id);if(seenReplies.size<=1024)break;}
      schedule();
    },
    adjust(action){
      if(action==='left')theta-=.25;
      if(action==='right')theta+=.25;
      if(action==='in')distance=clamp(distance-2.8,12,42);
      if(action==='out')distance=clamp(distance+2.8,12,42);
      if(action==='reset'){theta=BASE_AZIMUTH;elevation=BASE_ELEVATION;distance=BASE_DISTANCE;}
      schedule();
    },
    destroy(){
      stopped=true;abort.abort();observer.disconnect();intersection?.disconnect();if(raf)view.cancelAnimationFrame(raf);
      scene.traverse(m=>{if(m.userData.id&&!m.userData.sharedPickingMaterial)m.material.dispose();});
      clearReplies();seenReplies.clear();replyGeometry.dispose();cube.dispose();ball.dispose();cylinder.dispose();
      for(const m of materials.values())m.dispose();renderer.dispose();renderer.forceContextLoss();element.remove();overlay.remove();
    },
  };
}
