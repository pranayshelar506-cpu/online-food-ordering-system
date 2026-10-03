// Musafir Cafe server: Express + SQLite. Run with `npm run dev`.
require('dotenv').config();
const path = require('path'), fs = require('fs');
const express = require('express'), session = require('express-session'), helmet = require('helmet');
const rateLimit = require('express-rate-limit'), Database = require('better-sqlite3'), bcrypt = require('bcryptjs');
const { M, COUP } = require('./public/menu-data.js'); // same menu the browser uses, so prices are checked on the server

const db = new Database(path.join(__dirname, 'cafe.db'));
db.exec(`
create table if not exists users(id integer primary key autoincrement, name text, email text unique, phone text, pw text, role text default 'user', joined integer, last integer, off integer default 0);
create table if not exists logs(id integer primary key autoincrement, email text, ok integer, t integer, dev text, ip text);
create table if not exists orders(id text primary key, uid integer, type text, addr text, phone text, note text, items text, sub integer, disc integer, tax integer, fee integer, total integer, coupon text, status text default 'Placed', t integer, pmethod text, pstatus text, ptxn text, pdetail text);
create table if not exists msgs(id integer primary key autoincrement, n text, e text, m text, t integer);
create table if not exists gallery(id integer primary key autoincrement, caption text, t integer);`);
if (!db.prepare("select 1 from users where role='admin'").get())
  db.prepare('insert into users(name,email,phone,pw,role,joined) values(?,?,?,?,?,?)')
    .run('Cafe Admin', 'admin@musafircafe.com', '', bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 12), 'admin', Date.now());

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }), session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me', resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 } }));
const needAdminEarly = (req, res, next) => (req.user = cur(req)) && req.user.role === 'admin' ? next() : res.status(403).json({ ok: false, error: 'Admins only.' });
// Photo upload: the browser resizes the picture to a JPEG, the server checks it and saves it as public/images/menu/<id>.jpg
app.post('/api/admin/photo', express.json({ limit: '3mb' }), needAdminEarly, (req, res) => {
  const id = Number(req.body.id), m = String(req.body.data || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!M[id] || !m) return res.json({ ok: false, error: 'Choose a valid photo.' });
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > 2e6 || buf[0] !== 0xFF || buf[1] !== 0xD8) return res.json({ ok: false, error: 'Photo must be a JPEG under 2 MB.' });
  const dir = path.join(__dirname, 'public', 'images', 'menu'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, id + '.jpg'), buf); res.json({ ok: true });
});
// Gallery photos: saved as public/images/gallery/<id>.jpg
app.post('/api/admin/gallery', express.json({ limit: '3mb' }), needAdminEarly, (req, res) => {
  const m = String(req.body.data || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/), buf = m && Buffer.from(m[1], 'base64');
  if (!buf || buf.length > 2e6 || buf[0] !== 0xFF || buf[1] !== 0xD8) return res.json({ ok: false, error: 'Photo must be a JPEG under 2 MB.' });
  const r = db.prepare('insert into gallery(caption,t) values(?,?)').run(String(req.body.caption || '').trim().slice(0, 80), Date.now());
  const dir = path.join(__dirname, 'public', 'images', 'gallery'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, Number(r.lastInsertRowid) + '.jpg'), buf); res.json({ ok: true });
});
app.post('/api/admin/gallery-delete', express.json({ limit: '3mb' }), needAdminEarly, (req, res) => {
  const id = Number(req.body.id); db.prepare('delete from gallery where id=?').run(id);
  fs.rmSync(path.join(__dirname, 'public', 'images', 'gallery', id + '.jpg'), { force: true }); res.json({ ok: true });
});
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Shapes sent to the browser. Password hashes never leave the server.
const pu = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, joined: u.joined, last: u.last, off: !!u.off });
const po = o => ({ id: o.id, uid: o.uid, type: o.type, addr: o.addr, phone: o.phone, note: o.note, items: JSON.parse(o.items), sub: o.sub, disc: o.disc, tax: o.tax, fee: o.fee, total: o.total, coupon: o.coupon, status: o.status, t: o.t, pay: { method: o.pmethod, status: o.pstatus, txn: o.ptxn, detail: o.pdetail } });
const cur = req => { const u = req.session.uid && db.prepare('select * from users where id=?').get(req.session.uid); return u && !u.off ? u : null; };
const needLogin = (req, res, next) => (req.user = cur(req)) ? next() : res.status(401).json({ ok: false, error: 'Log in first.' });
const needAdmin = (req, res, next) => (req.user = cur(req)) && req.user.role === 'admin' ? next() : res.status(403).json({ ok: false, error: 'Admins only.' });
const dev = req => { const u = req.get('user-agent') || ''; return (/Edg/.test(u) ? 'Edge' : /Chrome/.test(u) ? 'Chrome' : /Firefox/.test(u) ? 'Firefox' : /Safari/.test(u) ? 'Safari' : 'Browser') + (/Mobi/.test(u) ? ' on mobile' : ' on desktop'); };
const logIn = (req, email, ok) => db.prepare('insert into logs(email,ok,t,dev,ip) values(?,?,?,?,?)').run(email, ok ? 1 : 0, Date.now(), dev(req), req.ip);

app.get('/api/sync', (req, res) => {
  const u = cur(req), adm = u && u.role === 'admin';
  res.json({
    me: u ? u.id : null,
    users: adm ? db.prepare('select * from users').all().map(pu) : u ? [pu(u)] : [],
    orders: !u ? [] : (adm ? db.prepare('select * from orders order by t desc').all() : db.prepare('select * from orders where uid=? order by t desc').all(u.id)).map(po),
    logs: adm ? db.prepare('select * from logs order by t desc limit 500').all().map(l => ({ ...l, ok: !!l.ok })) : [],
    msgs: adm ? db.prepare('select n,e,m,t from msgs order by t desc').all() : [],
    gallery: db.prepare('select id,caption from gallery order by id desc').all() });
});

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, message: { ok: false, error: 'Too many failed attempts. Try again in 15 minutes.' } });
app.post('/api/login', loginLimit, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(), u = db.prepare('select * from users where email=?').get(email);
  const ok = !!u && !u.off && bcrypt.compareSync(String(req.body.password || ''), u.pw);
  logIn(req, email, ok);
  if (!ok) return res.json({ ok: false, error: u && u.off ? 'This account is blocked. Contact the cafe.' : 'Email or password is wrong.' });
  db.prepare('update users set last=? where id=?').run(Date.now(), u.id);
  req.session.uid = u.id; res.json({ ok: true });
});
app.post('/api/register', (req, res) => {
  const b = req.body, name = String(b.name || '').trim().slice(0, 60), email = String(b.email || '').trim().toLowerCase(), phone = String(b.phone || '').trim(), pw = String(b.password || '');
  const er = !name ? 'Enter your name.' : !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email.' : !/^\d{10}$/.test(phone) ? 'Enter a 10-digit phone number.' : pw.length < 6 ? 'Use at least 6 characters for the password.' : db.prepare('select 1 from users where email=?').get(email) ? 'That email already has an account. Log in instead.' : '';
  if (er) return res.json({ ok: false, error: er });
  const r = db.prepare('insert into users(name,email,phone,pw,joined,last) values(?,?,?,?,?,?)').run(name, email, phone, bcrypt.hashSync(pw, 12), Date.now(), Date.now());
  logIn(req, email, true); req.session.uid = Number(r.lastInsertRowid); res.json({ ok: true });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.post('/api/contact', (req, res) => {
  const n = String(req.body.n || '').trim().slice(0, 60), e = String(req.body.e || '').trim().slice(0, 100), m = String(req.body.m || '').trim().slice(0, 1000);
  if (!n || !/^\S+@\S+\.\S+$/.test(e) || !m) return res.json({ ok: false, error: 'Enter your name, a valid email and a message.' });
  db.prepare('insert into msgs(n,e,m,t) values(?,?,?,?)').run(n, e, m, Date.now()); res.json({ ok: true });
});

// Place an order. Prices, GST and coupon discount are all recalculated here; the browser's totals are ignored.
app.post('/api/order', needLogin, (req, res) => {
  const b = req.body, fail = error => res.json({ ok: false, error });
  const items = (Array.isArray(b.items) ? b.items : []).map(x => ({ m: M[+x.id], q: Math.floor(+x.q) })).filter(x => x.m && x.q >= 1 && x.q <= 50);
  if (!items.length) return fail('Your cart is empty.');
  const type = ['delivery', 'takeaway', 'dinein'].includes(b.type) ? b.type : 'delivery', phone = String(b.phone || '').trim(), addr = String(b.addr || '').trim().slice(0, 300);
  if (!/^\d{10}$/.test(phone)) return fail('Enter a 10-digit phone number.');
  if (type === 'delivery' && !addr) return fail('Enter a delivery address.');
  const sub = items.reduce((a, x) => a + x.m.p * x.q, 0), c = Object.hasOwn(COUP, b.coupon) ? COUP[b.coupon] : null;
  const disc = c && sub >= c[1] ? Math.round(sub * c[0]) : 0, tax = Math.round((sub - disc) * .05), fee = type === 'delivery' ? 30 : 0;
  // Payments are simulated. Only the method, last 4 digits, masked UPI ID and a transaction ID are kept. Never store full card data.
  const p = b.pay || {}, method = ['card', 'upi', 'netbanking', 'cod'].includes(p.method) ? p.method : 'cod'; let detail = '';
  if (method === 'card') { if (!/^\d{4}$/.test(p.last4)) return fail('Enter the last 4 digits of your card.'); detail = (['Visa', 'Mastercard', 'RuPay'].includes(p.net) ? p.net : 'Card') + ' ending ' + p.last4; }
  if (method === 'upi') { const m = String(p.upi || '').trim().match(/^([\w.-]+)@(\w+)$/); if (!m) return fail('Enter a valid UPI ID, like name@bank.'); detail = m[1].slice(0, 2) + '***@' + m[2]; }
  if (method === 'netbanking') detail = ['HDFC', 'SBI', 'ICICI', 'Axis'].includes(p.bank) ? p.bank : 'Bank';
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, ''), id = `MC-${d}-${String(db.prepare('select count(*) c from orders').get().c + 1).padStart(4, '0')}`;
  db.prepare('insert into orders(id,uid,type,addr,phone,note,items,sub,disc,tax,fee,total,coupon,t,pmethod,pstatus,ptxn,pdetail) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.user.id, type, addr, phone, String(b.note || '').slice(0, 200), JSON.stringify(items.map(x => ({ n: x.m.n, q: x.q, p: x.m.p }))), sub, disc, tax, fee, sub - disc + tax + fee, disc ? b.coupon : '', Date.now(), method, method === 'cod' ? 'pending' : 'paid', method === 'cod' ? '-' : 'SIM' + Math.random().toString(36).slice(2, 10).toUpperCase(), detail);
  res.json({ ok: true, id });
});

app.post('/api/admin/status', needAdmin, (req, res) => {
  if (!['Placed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'].includes(req.body.status)) return res.json({ ok: false, error: 'Unknown status.' });
  db.prepare('update orders set status=? where id=?').run(req.body.status, String(req.body.id)); res.json({ ok: true });
});
app.post('/api/admin/block', needAdmin, (req, res) => { db.prepare("update users set off=1-off where id=? and role!='admin'").run(+req.body.id); res.json({ ok: true }); });
app.post('/api/admin/refund', needAdmin, (req, res) => { db.prepare("update orders set pstatus='refunded' where id=? and pstatus='paid'").run(String(req.body.id)); res.json({ ok: true }); });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Musafir Cafe is running at http://localhost:${port}`));
