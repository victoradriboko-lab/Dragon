import { createHash, randomBytes } from 'node:crypto';
import { isIPv4 } from 'node:net';

const digest = token => createHash('sha256').update(token).digest('hex');
const reject = (status,message) => { throw Object.assign(Error(message),{status}); };
const clean = (value,max=500) => typeof value==='string' && value.length<=max ? value.trim() : reject(400,'Texto inválido no relatório.');
const counter = value => value===null || value===undefined ? null : Number.isSafeInteger(value) && value>=0 ? value : reject(400,'Contador inválido.');

export function collectorAPI(db,{json,body}) {
 db.exec(`CREATE TABLE IF NOT EXISTS collectors(id INTEGER PRIMARY KEY,client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,name TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,revoked INTEGER NOT NULL DEFAULT 0,last_seen TEXT,last_scan TEXT,hostname TEXT,version TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS agent_batches(collector_id INTEGER REFERENCES collectors(id),batch_id TEXT NOT NULL,received_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(collector_id,batch_id));
 CREATE TABLE IF NOT EXISTS discoveries(id INTEGER PRIMARY KEY,collector_id INTEGER NOT NULL REFERENCES collectors(id),ip TEXT NOT NULL,manufacturer TEXT NOT NULL,model TEXT NOT NULL,serial TEXT NOT NULL,description TEXT NOT NULL,observed_at TEXT NOT NULL,first_seen TEXT NOT NULL,printer_id INTEGER REFERENCES printers(id) ON DELETE SET NULL,total_pages INTEGER,supplies TEXT NOT NULL DEFAULT '[]',UNIQUE(collector_id,ip,serial));
 CREATE TABLE IF NOT EXISTS printer_readings(id INTEGER PRIMARY KEY,discovery_id INTEGER NOT NULL REFERENCES discoveries(id),observed_at TEXT NOT NULL,total_pages INTEGER,supplies TEXT NOT NULL,UNIQUE(discovery_id,observed_at));`);
 let requests=new Map();
 function listCollectors(){return db.prepare(`SELECT c.id,c.name,c.client_id,c.revoked,c.last_seen,c.last_scan,c.hostname,c.version,c.created_at,clients.name AS client_name FROM collectors c JOIN clients ON clients.id=c.client_id ORDER BY c.id DESC`).all();}
 function listDiscoveries(){return db.prepare(`SELECT d.*,c.client_id,c.name AS collector_name,c.revoked,clients.name AS client_name FROM discoveries d JOIN collectors c ON c.id=d.collector_id JOIN clients ON clients.id=c.client_id WHERE NOT EXISTS(SELECT 1 FROM discoveries newer WHERE newer.collector_id=d.collector_id AND newer.ip=d.ip AND (newer.observed_at>d.observed_at OR (newer.observed_at=d.observed_at AND newer.id>d.id))) ORDER BY d.observed_at DESC,d.id DESC`).all().map(d=>({...d,supplies:JSON.parse(d.supplies)}));}
 async function machine(req,res,path){
  if(path!=='/api/agent/report')return false;
  if(req.method!=='POST')reject(405,'Método não permitido.');
  if(!req.headers['content-type']?.startsWith('application/json'))reject(415,'Use JSON.');
  const token=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'')?.[1];
  const c=token && db.prepare('SELECT * FROM collectors WHERE token_hash=? AND revoked=0').get(digest(token));
  if(!c)reject(401,'Credencial do coletor inválida ou revogada.');
  const now=Date.now();
  for(const [key,value] of requests)if(value.until<now)requests.delete(key);
  const rate=requests.get(c.id)||{count:0,until:now+60000};rate.count++;requests.set(c.id,rate);
  if(rate.count>60)reject(429,'Aguarde antes de reenviar.');
  const b=await body(req,262144);
  if(typeof b.batch_id!=='string'||!/^[a-f0-9-]{16,64}$/.test(b.batch_id))reject(400,'Identificador de lote inválido.');
  if(db.prepare('SELECT 1 FROM agent_batches WHERE collector_id=? AND batch_id=?').get(c.id,b.batch_id)){json(res,200,{ok:true,duplicate:true});return true;}
  const observed=new Date(b.observed_at);
  if(typeof b.observed_at!=='string'||!Number.isFinite(observed.getTime())||observed.getTime()>now+300000||observed.getTime()<now-90*86400000)reject(400,'Data da coleta inválida (máximo 90 dias).');
  const timestamp=observed.toISOString();
  const hostname=clean(b.hostname,200), version=clean(b.version,40);
  if(!Array.isArray(b.printers)||b.printers.length>200)reject(400,'Máximo de 200 equipamentos por lote.');
  const ips=new Set();
  const printers=b.printers.map(p=>{
   if(!p||!isIPv4(p.ip)||ips.has(p.ip))reject(400,'IP inválido ou repetido no lote.');ips.add(p.ip);
   if(!Array.isArray(p.supplies)||p.supplies.length>64)reject(400,'Lista de suprimentos inválida.');
   const supplies=p.supplies.map(s=>({name:clean(s.name,200),level:counter(s.level),capacity:counter(s.capacity),unit:counter(s.unit)}));
   return {ip:p.ip,manufacturer:clean(p.manufacturer),model:clean(p.model),serial:clean(p.serial),description:clean(p.description,2000),total_pages:counter(p.total_pages),supplies:JSON.stringify(supplies)};
  });
  db.exec('BEGIN IMMEDIATE');
  try{
   db.prepare('INSERT INTO agent_batches(collector_id,batch_id) VALUES(?,?)').run(c.id,b.batch_id);
   db.prepare('UPDATE collectors SET last_seen=?,last_scan=CASE WHEN last_scan IS NULL OR last_scan<? THEN ? ELSE last_scan END,hostname=?,version=? WHERE id=?').run(new Date(now).toISOString(),timestamp,timestamp,hostname,version,c.id);
   for(const p of printers){
    db.prepare(`INSERT INTO discoveries(collector_id,ip,manufacturer,model,serial,description,observed_at,first_seen,total_pages,supplies) VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(collector_id,ip,serial) DO UPDATE SET manufacturer=excluded.manufacturer,model=excluded.model,serial=excluded.serial,description=excluded.description,observed_at=excluded.observed_at,total_pages=excluded.total_pages,supplies=excluded.supplies WHERE excluded.observed_at>discoveries.observed_at`).run(c.id,p.ip,p.manufacturer,p.model,p.serial,p.description,timestamp,timestamp,p.total_pages,p.supplies);
    const d=db.prepare('SELECT id FROM discoveries WHERE collector_id=? AND ip=? AND serial=?').get(c.id,p.ip,p.serial);
    db.prepare('INSERT OR IGNORE INTO printer_readings(discovery_id,observed_at,total_pages,supplies) VALUES(?,?,?,?)').run(d.id,timestamp,p.total_pages,p.supplies);
   }
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  json(res,200,{ok:true,accepted:printers.length});return true;
 }
 async function admin(req,res,path){
  if(path==='/api/collectors'&&req.method==='GET'){json(res,200,listCollectors());return true;}
  if(path==='/api/discoveries'&&req.method==='GET'){json(res,200,listDiscoveries());return true;}
  if(path==='/api/collectors'&&req.method==='POST'){
   const b=await body(req),name=clean(b.name,200),client=Number(b.client_id);
   if(!name||!Number.isSafeInteger(client)||!db.prepare('SELECT id FROM clients WHERE id=?').get(client))reject(400,'Informe nome e cliente válido.');
   const token=randomBytes(32).toString('hex');
   const r=db.prepare('INSERT INTO collectors(client_id,name,token_hash) VALUES(?,?,?)').run(client,name,digest(token));
   json(res,201,{id:Number(r.lastInsertRowid),token});return true;
  }
  const revoke=/^\/api\/collectors\/(\d+)\/revoke$/.exec(path);
  if(revoke&&req.method==='POST'){
   const result=db.prepare('UPDATE collectors SET revoked=1 WHERE id=?').run(Number(revoke[1]));
   if(!result.changes)reject(404,'Coletor não encontrado.');json(res,200,{ok:true});return true;
  }
  const approve=/^\/api\/discoveries\/(\d+)\/approve$/.exec(path);
  if(approve&&req.method==='POST'){
   const d=db.prepare('SELECT d.*,c.client_id,c.revoked FROM discoveries d JOIN collectors c ON c.id=d.collector_id WHERE d.id=?').get(Number(approve[1]));
   if(!d)reject(404,'Impressora não encontrada.');
   if(d.revoked)reject(409,'O coletor foi revogado.');
   if(d.printer_id){json(res,200,{id:d.printer_id});return true;}
   if(!d.serial)reject(409,'Sem número de série: cadastre manualmente após identificar o equipamento.');
   const existing=db.prepare('SELECT * FROM printers WHERE serial=?').get(d.serial);
   if(existing&&(existing.client_id!==d.client_id||existing.ip!==d.ip))reject(409,'Número de série já cadastrado em outro local. Verifique o equipamento antes de vincular.');
   const id=existing?.id || Number(db.prepare('INSERT INTO printers(client_id,manufacturer,model,serial,ip) VALUES(?,?,?,?,?)').run(d.client_id,d.manufacturer||'Não informado',d.model||'Não informado',d.serial,d.ip).lastInsertRowid);
   db.prepare('UPDATE discoveries SET printer_id=? WHERE id=?').run(id,d.id);json(res,200,{id});return true;
  }
  const history=/^\/api\/discoveries\/(\d+)\/readings$/.exec(path);
  if(history&&req.method==='GET'){json(res,200,db.prepare('SELECT observed_at,total_pages,supplies FROM printer_readings WHERE discovery_id=? ORDER BY observed_at DESC LIMIT 100').all(Number(history[1])).map(r=>({...r,supplies:JSON.parse(r.supplies)})));return true;}
  return false;
 }
 return {machine,admin};
}
