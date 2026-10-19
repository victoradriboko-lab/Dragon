import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const data = process.env.DRAGON_DATA || join(root, 'data');
mkdirSync(data, { recursive: true });
const db = new DatabaseSync(join(data, 'dragon.sqlite'));
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY, name TEXT NOT NULL, document TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS printers(id INTEGER PRIMARY KEY, client_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT, manufacturer TEXT NOT NULL, model TEXT NOT NULL, serial TEXT NOT NULL UNIQUE, asset TEXT NOT NULL DEFAULT '', ip TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);`);

if (process.argv.includes('--init')) {
  const email = (process.env.DRAGON_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.DRAGON_ADMIN_PASSWORD || '';
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 256) throw Error('Informe DRAGON_ADMIN_EMAIL e DRAGON_ADMIN_PASSWORD (12 a 256 caracteres).');
  if (db.prepare('SELECT id FROM users LIMIT 1').get()) throw Error('Administrador já cadastrado. Inicialização cancelada.');
  const salt = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO users(email,salt,hash) VALUES(?,?,?)').run(email, salt, scryptSync(password, salt, 64).toString('hex'));
  console.log('Administrador cadastrado. Execute npm start.');
  db.close();
  process.exit(0);
}

const secure = process.env.DRAGON_SECURE_COOKIE === '1';
const configuredOrigin = process.env.DRAGON_ORIGIN;
const attempts = new Map();
const dummySalt = randomBytes(24).toString('hex');
const dummyHash = scryptSync(randomBytes(32), dummySalt, 64);
function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
async function body(req) {
  let value = '';
  for await (const chunk of req) { value += chunk; if (Buffer.byteLength(value) > 16384) fail(413, 'Pedido muito grande.'); }
  try { const parsed = JSON.parse(value); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error(); return parsed; } catch { fail(400, 'Dados inválidos.'); }
}
function text(v, name, required = false) {
  if (typeof v !== 'string' || v.length > 500 || (required && !v.trim())) fail(400, `Preencha corretamente: ${name}.`);
  return v.trim();
}
function fields(table, value) {
  const names = table === 'clients' ? ['name','document','contact','phone','address'] : ['manufacturer','model','serial','asset','ip','location'];
  const result = names.map((n, i) => text(value[n] ?? '', n, table === 'clients' ? i === 0 : i < 3));
  if (table === 'printers') {
    const id = Number(value.client_id);
    if (!Number.isSafeInteger(id) || !db.prepare('SELECT id FROM clients WHERE id=?').get(id)) fail(400, 'Selecione um cliente cadastrado.');
    names.push('client_id'); result.push(id);
  }
  return { names, result };
}
const cookie = token => `dragon_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure ? '; Secure' : ''}`;
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    if (!path.startsWith('/api/')) {
      const files = { '/':'index.html', '/app.js':'app.js', '/styles.css':'styles.css' };
      if (!files[path] || req.method !== 'GET') return json(res, 404, { error: 'Página não encontrada.' });
      res.writeHead(200, { 'Content-Type': path.endsWith('.js') ? 'text/javascript; charset=utf-8' : path.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(readFileSync(join(root, 'public', files[path])));
    }
    if (!['GET','POST','PUT','DELETE'].includes(req.method)) fail(405, 'Método não permitido.');
    if (req.method !== 'GET') {
      const expected = configuredOrigin || `${secure ? 'https' : 'http'}://${req.headers.host}`;
      if (req.headers.origin !== expected || req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Origem não autorizada.');
      if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Use JSON.');
    }
    if (path === '/api/login' && req.method === 'POST') {
      const key = req.socket.remoteAddress;
      const now = Date.now();
      // Limite por endereço, com expiração e tamanho máximo para evitar crescimento sem limite.
      for (const [k,v] of attempts) if (v.until < now) attempts.delete(k);
      const item = attempts.get(key) || { count: 0, until: now + 900000 };
      if (item.count >= 10 || attempts.size > 10000) fail(429, 'Muitas tentativas. Aguarde 15 minutos.');
      const b = await body(req);
      const email = text(b.email ?? '', 'e-mail', true).toLowerCase();
      if (typeof b.password !== 'string' || b.password.length > 256) fail(400, 'Senha inválida.');
      const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
      const hash = scryptSync(b.password, user?.salt || dummySalt, 64);
      if (!timingSafeEqual(hash, user ? Buffer.from(user.hash, 'hex') : dummyHash) || !user) { item.count++; attempts.set(key,item); fail(401,'E-mail ou senha incorretos.'); }
      attempts.delete(key);
      db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
      const token = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
      db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(token,user.id,csrf,now+28800000);
      return json(res,200,{ email:user.email,csrf },{ 'Set-Cookie': cookie(token) });
    }
    const token = /(?:^|;\s*)dragon_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    const session = token && db.prepare('SELECT sessions.*,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(token,Date.now());
    if (!session) fail(401,'Faça login para continuar.');
    if (req.method !== 'GET' && req.headers['x-csrf-token'] !== session.csrf) fail(403,'Sessão inválida. Entre novamente.');
    if (path === '/api/session' && req.method === 'GET') return json(res,200,{ email:session.email,csrf:session.csrf });
    if (path === '/api/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE token=?').run(token); return json(res,200,{ ok:true },{'Set-Cookie':'dragon_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
    if (path === '/api/dashboard' && req.method === 'GET') return json(res,200,{ clients:db.prepare('SELECT count(*) AS n FROM clients').get().n, printers:db.prepare('SELECT count(*) AS n FROM printers').get().n, collectors:0 });
    const match = /^\/api\/(clients|printers)(?:\/(\d+))?$/.exec(path);
    if (!match) fail(404,'Recurso não encontrado.');
    const table = match[1], id = match[2] ? Number(match[2]) : null;
    if (req.method === 'GET' && !id) return json(res,200,table === 'clients' ? db.prepare('SELECT * FROM clients ORDER BY name').all() : db.prepare('SELECT printers.*,clients.name AS client_name FROM printers LEFT JOIN clients ON printers.client_id=clients.id ORDER BY printers.id DESC').all());
    if (id && !db.prepare(`SELECT id FROM ${table} WHERE id=?`).get(id)) fail(404,'Registro não encontrado.');
    if (req.method === 'DELETE' && id) { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id); return json(res,200,{ ok:true }); }
    if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
      const { names,result } = fields(table,await body(req));
      const r = id ? db.prepare(`UPDATE ${table} SET ${names.map(n=>`${n}=?`).join(',')} WHERE id=?`).run(...result,id) : db.prepare(`INSERT INTO ${table}(${names.join(',')}) VALUES(${names.map(()=>'?').join(',')})`).run(...result);
      return json(res,id?200:201,{ id:id || Number(r.lastInsertRowid) });
    }
    fail(405,'Método não permitido.');
  } catch (error) {
    if (error.code === 'ERR_SQLITE_ERROR' && /constraint/i.test(error.message)) return json(res,409,{ error:/FOREIGN KEY/.test(error.message)?'O cliente possui impressoras vinculadas. Transfira ou exclua os equipamentos primeiro.':'Já existe uma impressora com este número de série.' });
    if (!error.status) console.error('Erro interno:', error.code || error.name);
    json(res,error.status || 500,{ error:error.status ? error.message : 'Não foi possível concluir a operação.' });
  }
});
server.listen(Number(process.env.PORT || 3000),process.env.DRAGON_HOST || '127.0.0.1',()=>console.log(`Dragon disponível na porta ${process.env.PORT || 3000}.`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>{ db.close();process.exit(0); }));
