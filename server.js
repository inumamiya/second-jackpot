import http from 'node:http';import {readFile} from 'node:fs/promises';import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const PORT=Number(process.env.PORT||3000),DURATION=360000,HIDE=10000,HOST_PASSWORD=process.env.HOST_PASSWORD||'';
let round=0,endAt=0,counts=[0,0,0],selections=new Map(),clients=new Set(),running=false;
const ids=new Map();const cookie=(req,name)=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')))[name];
function user(req,res){let id=cookie(req,'sjid');if(!id||!/^[a-f0-9]{48}$/.test(id)){id=randomBytes(24).toString('hex');res.setHeader('Set-Cookie','sjid='+id+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000'+(req.headers['x-forwarded-proto']==='https'?'; Secure':''))}return id}
function active(){if(running&&Date.now()>=endAt){running=false;broadcast()}return running}
function state(id){let live=active(),hidden=live&&endAt-Date.now()<=HIDE;return {round,running:live,endAt,serverNow:Date.now(),counts:hidden?null:counts,selected:selections.get(id)??null,hidden,started:round>0}}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function broadcast(){for(let c of clients){try{c.res.write('data: '+JSON.stringify(state(c.id))+'\n\n')}catch{clients.delete(c)}}}
async function body(req){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>4096)throw Error('Too large');chunks.push(c)}return JSON.parse(Buffer.concat(chunks).toString()||'{}')}
const server=http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;let id=user(req,res);
if(req.method==='GET'&&path==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(new URL('./index.html',import.meta.url)));return}
if(req.method==='GET'&&path==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});let c={res,id};clients.add(c);res.write('data: '+JSON.stringify(state(id))+'\n\n');req.on('close',()=>clients.delete(c));return}
if(req.method==='GET'&&path==='/api/state')return send(res,200,state(id));
if(req.method==='GET'&&path==='/health')return send(res,200,{ok:true});
if(req.method!=='POST'||!['/api/start','/api/choose','/api/vote'].includes(path))return send(res,404,{error:'Not found'});
try{const b=await body(req);
if(path==='/api/start'){if(!HOST_PASSWORD)return send(res,503,{error:'主催者パスワードが未設定です'});const a=Buffer.from(String(b.password||'')),p=Buffer.from(HOST_PASSWORD);if(a.length!==p.length||!timingSafeEqual(a,p))return send(res,403,{error:'パスワードが違います'});round++;counts=[0,0,0];selections.clear();endAt=Date.now()+DURATION;running=true;broadcast();return send(res,200,{ok:true})}
if(!active())return send(res,409,{error:'現在ゲームは開催されていません'});
if(path==='/api/choose'){if(!Number.isInteger(b.choice)||b.choice<0||b.choice>2)return send(res,400,{error:'陣営が不正です'});if(selections.has(id))return send(res,409,{error:'陣営は変更できません'});selections.set(id,b.choice);broadcast();return send(res,200,{ok:true})}
if(!selections.has(id))return send(res,403,{error:'陣営を選択してください'});const n=b.count;if(!Number.isInteger(n)||n<1||n>50)return send(res,400,{error:'連打数が不正です'});counts[selections.get(id)]+=n;broadcast();return send(res,200,{ok:true});
}catch(e){return send(res,400,{error:'リクエストを処理できませんでした'})}});
setInterval(()=>{active();broadcast()},500);server.listen(PORT,'0.0.0.0',()=>console.log('SECOND JACKPOT listening on '+PORT));