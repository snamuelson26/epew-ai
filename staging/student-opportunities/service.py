"""Isolated synthetic staging service; not a production identity or payment adapter."""
import hashlib, hmac, json, secrets, sqlite3
from datetime import datetime, timezone
from pathlib import Path

class Denied(Exception): pass
class Invalid(Exception): pass

class Service:
 def __init__(self, db, origin='http://127.0.0.1:8765'):
  self.db=sqlite3.connect(db);self.db.row_factory=sqlite3.Row
  self.db.execute('PRAGMA foreign_keys=ON')
  self.origin=origin.rstrip('/');self.sessions={};self.webhook_secret=secrets.token_bytes(32)
  self.db.executescript('''
  CREATE TABLE IF NOT EXISTS identities(id TEXT PRIMARY KEY, organization TEXT NOT NULL, source TEXT NOT NULL, source_id TEXT NOT NULL, role TEXT NOT NULL, UNIQUE(organization,source,source_id));
  CREATE TABLE IF NOT EXISTS profiles(id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL REFERENCES identities(id), status TEXT NOT NULL DEFAULT 'Draft', name TEXT NOT NULL, program TEXT NOT NULL, goal TEXT NOT NULL, requested INTEGER NOT NULL CHECK(requested>0), approved INTEGER, consent TEXT, consent_photo INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1, approved_revision INTEGER, approver TEXT, approved_at TEXT);
  CREATE TABLE IF NOT EXISTS codes(number INTEGER PRIMARY KEY AUTOINCREMENT, profile INTEGER NOT NULL UNIQUE REFERENCES profiles(id));
  CREATE TABLE IF NOT EXISTS contributions(id TEXT PRIMARY KEY, profile INTEGER REFERENCES profiles(id), amount INTEGER NOT NULL CHECK(amount>0), currency TEXT NOT NULL CHECK(currency='usd'), state TEXT NOT NULL CHECK(state IN ('pending','confirmed','refunded','disputed')), allocated INTEGER NOT NULL DEFAULT 0 CHECK(allocated>=0));
  CREATE TABLE IF NOT EXISTS payment_events(id TEXT PRIMARY KEY, digest TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS hosts(id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL REFERENCES identities(id), details TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS placements(id INTEGER PRIMARY KEY AUTOINCREMENT, student TEXT NOT NULL REFERENCES identities(id), host INTEGER NOT NULL REFERENCES hosts(id), academic TEXT NOT NULL REFERENCES identities(id), plan TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS timesheets(id INTEGER PRIMARY KEY AUTOINCREMENT, placement INTEGER NOT NULL REFERENCES placements(id), start INTEGER NOT NULL, end INTEGER NOT NULL CHECK(end>start), host_verified INTEGER NOT NULL DEFAULT 0, academic_verified INTEGER NOT NULL DEFAULT 0, UNIQUE(placement,start,end));
  CREATE TABLE IF NOT EXISTS completions(placement INTEGER PRIMARY KEY REFERENCES placements(id), report TEXT NOT NULL, evaluation TEXT NOT NULL, approver TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS outbox(id INTEGER PRIMARY KEY AUTOINCREMENT, recipient TEXT NOT NULL, event TEXT NOT NULL, record TEXT NOT NULL, UNIQUE(recipient,event,record));
  CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, record TEXT NOT NULL, at TEXT NOT NULL);
  CREATE TRIGGER IF NOT EXISTS immutable_code BEFORE UPDATE ON codes BEGIN SELECT RAISE(ABORT,'Code is immutable'); END;
  CREATE TRIGGER IF NOT EXISTS preserve_code BEFORE DELETE ON codes BEGIN SELECT RAISE(ABORT,'Code cannot be deleted'); END;
  CREATE TRIGGER IF NOT EXISTS immutable_audit BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
  CREATE TRIGGER IF NOT EXISTS preserve_audit BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append only'); END;
  ''')
 def fixture(self,id,role,source='demo-wordpress'):
  # Used only by local seed runner; no public user-creation endpoint.
  with self.db:self.db.execute('INSERT INTO identities VALUES(?,?,?,?,?)',(id,'EMANON',source,id,role))
  token=secrets.token_urlsafe(32);self.sessions[token]=id;return token
 def actor(self,token,roles=None):
  row=self.db.execute('SELECT * FROM identities WHERE id=?',(self.sessions.get(token),)).fetchone()
  if not row or row['organization']!='EMANON' or (roles and row['role'] not in roles):raise Denied('Unauthorized')
  return dict(row)
 def row(self,table,id):
  if table not in {'profiles','hosts','placements','timesheets','contributions'}:raise Invalid('Invalid table')
  r=self.db.execute('SELECT * FROM '+table+' WHERE id=?',(id,)).fetchone()
  if not r:raise Invalid('Unknown record')
  return dict(r)
 def log(self,a,action,id):
  self.db.execute('INSERT INTO audit(actor,action,record,at) VALUES(?,?,?,?)',(a,action,str(id),datetime.now(timezone.utc).isoformat()))
 def notify(self,recipient,event,id):
  self.db.execute('INSERT OR IGNORE INTO outbox(recipient,event,record) VALUES(?,?,?)',(recipient,event,str(id)))
 def create_profile(self,token,name,program,goal,requested):
  a=self.actor(token,{'student'})
  if not all(isinstance(v,str) and 0<len(v)<=2000 for v in [name,program,goal]) or type(requested)!=int or requested<=0:raise Invalid('Invalid application')
  with self.db:
   id=self.db.execute('INSERT INTO profiles(owner,name,program,goal,requested) VALUES(?,?,?,?,?)',(a['id'],name,program,goal,requested)).lastrowid
   self.log(a['id'],'draft_created',id)
  return id
 def private_profile(self,token,id):
  a=self.actor(token);p=self.row('profiles',id)
  if p['owner']!=a['id'] and a['role'] not in {'director','reviewer','finance'}:raise Denied('Private student record')
  return p
 def consent(self,token,id,version):
  a=self.actor(token,{'student'});p=self.row('profiles',id)
  if p['owner']!=a['id']:raise Denied('Not owner')
  if not isinstance(version,str) or not version:raise Invalid('Consent version required')
  with self.db:
   self.db.execute('UPDATE profiles SET consent=? WHERE id=?',(version,id));self.log(a['id'],'consent:'+version,id)
 def withdraw(self,token,id):
  a=self.actor(token,{'student'});p=self.row('profiles',id)
  if p['owner']!=a['id']:raise Denied('Not owner')
  with self.db:
   self.db.execute("UPDATE profiles SET consent=NULL,status='Unpublished' WHERE id=?",(id,));self.log(a['id'],'consent_withdrawn',id)
 def transition(self,token,id,target,approved_amount=None):
  a=self.actor(token);p=self.row('profiles',id)
  rules={'Submitted':({'student'},{'Draft'}),'Under Review':({'reviewer','director'},{'Submitted'}),'Approved':({'director'},{'Under Review'}),'Published':({'director'},{'Approved'}),'Rejected':({'director','reviewer'},{'Under Review'}),'Suspended':({'director'},{'Published','Approved'}),'Unpublished':({'director'},{'Published','Suspended'})}
  if target not in rules:raise Invalid('Unknown transition')
  roles,states=rules[target]
  if a['role'] not in roles or (a['role']=='student' and p['owner']!=a['id']):raise Denied('Transition forbidden')
  if p['status'] not in states:raise Invalid('Invalid state transition')
  if target in {'Approved','Published'} and not p['consent']:raise Invalid('Current consent required')
  if target=='Approved' and (type(approved_amount)!=int or approved_amount<=0 or approved_amount>p['requested']):raise Invalid('Invalid assistance approval')
  if target=='Published' and p['approved_revision']!=p['revision']:raise Invalid('Revision not approved')
  with self.db:
   self.db.execute('UPDATE profiles SET status=? WHERE id=?',(target,id))
   if target=='Approved':
    self.db.execute('UPDATE profiles SET approved=?,approved_revision=revision,approver=?,approved_at=? WHERE id=?',(approved_amount,a['id'],datetime.now(timezone.utc).isoformat(),id))
    self.db.execute('INSERT INTO codes(profile) VALUES(?)',(id,))
   self.log(a['id'],'state:'+target+':consent:'+str(p['consent']),id);self.notify(p['owner'],target,id)
 def code(self,id):
  r=self.db.execute('SELECT number FROM codes WHERE profile=?',(id,)).fetchone()
  if not r:raise Invalid('No approved code')
  return f"IES-S-{r[0]:06d}"
 def public_profile(self,code):
  if not isinstance(code,str) or not code.startswith('IES-S-') or not code[6:].isdigit():return None
  r=self.db.execute("SELECT p.* FROM profiles p JOIN codes c ON c.profile=p.id WHERE c.number=? AND p.status='Published' AND p.consent IS NOT NULL AND p.revision=p.approved_revision",(int(code[6:]),)).fetchone()
  if not r:return None
  return {'code':code,'name':r['name'],'program':r['program'],'goal':r['goal'],'approved_amount_minor':r['approved'],'confirmed_amount_minor':self.total(r['id'])}
 def initiate(self,token,id,profile,amount):
  self.actor(token)
  if profile is not None:
   p=self.row('profiles',profile)
   if p['status']!='Published':raise Invalid('Profile not published')
  if type(amount)!=int or amount<=0:raise Invalid('Invalid amount')
  with self.db:self.db.execute("INSERT INTO contributions VALUES(?,?,?,'usd','pending',0)",(id,profile,amount))
 def payment_event(self,body,signature):
  # Synthetic provider only. This is deliberately NOT Stripe signature verification.
  if not hmac.compare_digest(hmac.new(self.webhook_secret,body,hashlib.sha256).hexdigest(),signature):raise Denied('Invalid synthetic webhook signature')
  e=json.loads(body);c=self.row('contributions',e['contribution'])
  if e['account']!='EMANON-SYNTHETIC-TEST' or e['currency']!=c['currency'] or type(e['amount'])!=int or e['amount']!=c['amount']:raise Invalid('Payment mismatch')
  allowed={'pending':{'confirmed'},'confirmed':{'refunded','disputed'},'refunded':set(),'disputed':set()}
  digest=hashlib.sha256(body).hexdigest()
  existing=self.db.execute('SELECT digest FROM payment_events WHERE id=?',(e['id'],)).fetchone()
  if existing:
   if existing[0]!=digest:raise Invalid('Replayed event changed')
   return
  if e['state'] not in allowed[c['state']]:raise Invalid('Out of order or invalid event')
  with self.db:
   self.db.execute('INSERT INTO payment_events VALUES(?,?)',(e['id'],digest));self.db.execute('UPDATE contributions SET state=? WHERE id=?',(e['state'],c['id']))
   self.log('synthetic-provider','payment:'+e['state'],c['id']);self.notify('finance','payment:'+e['state'],e['id'])
 def total(self,profile):return self.db.execute("SELECT coalesce(sum(amount),0) FROM contributions WHERE profile IS ? AND state='confirmed'",(profile,)).fetchone()[0]
 def allocate(self,token,id,amount):
  a=self.actor(token,{'finance'});c=self.row('contributions',id)
  if c['profile'] is None:raise Invalid('General fund allocation adapter not implemented')
  p=self.row('profiles',c['profile']);current=self.db.execute("SELECT coalesce(sum(allocated),0) FROM contributions WHERE profile=? AND state='confirmed'",(c['profile'],)).fetchone()[0]
  if c['state']!='confirmed' or type(amount)!=int or amount<=0 or c['allocated']+amount>c['amount'] or current+amount>p['approved']:raise Invalid('Allocation exceeds available funds or assistance cap')
  with self.db:self.db.execute('UPDATE contributions SET allocated=allocated+? WHERE id=?',(amount,id));self.log(a['id'],'allocation',id)
 def host_apply(self,token,details):
  a=self.actor(token,{'host'});required={'business_name','contact','address','industry','positions','schedule','supervisor','paid','insurance','safety','financial_sponsorship_interest','review_agreement'}
  if not required<=details.keys() or not details['review_agreement'] or type(details['positions'])!=int or details['positions']<1:raise Invalid('Incomplete host application')
  with self.db:
   id=self.db.execute('INSERT INTO hosts(owner,details) VALUES(?,?)',(a['id'],json.dumps(details))).lastrowid;self.log(a['id'],'host_submitted',id)
  return id
 def host_approve(self,token,id):
  a=self.actor(token,{'director'});self.row('hosts',id)
  with self.db:self.db.execute('UPDATE hosts SET approved=1 WHERE id=?',(id,));self.log(a['id'],'host_approved',id)
 def place(self,token,student,host,academic,plan):
  a=self.actor(token,{'director'});h=self.row('hosts',host)
  for id,role in [(student,'student'),(academic,'academic')]:
   r=self.db.execute('SELECT role,organization FROM identities WHERE id=?',(id,)).fetchone()
   if not r or r['role']!=role or r['organization']!='EMANON':raise Invalid('Invalid assignment identity')
  if not h['approved'] or not plan:raise Invalid('Approved host and learning plan required')
  with self.db:
   id=self.db.execute('INSERT INTO placements(student,host,academic,plan) VALUES(?,?,?,?)',(student,host,academic,json.dumps(plan))).lastrowid;self.log(a['id'],'placement',id)
  return id
 def timesheet(self,token,placement,start,end):
  a=self.actor(token,{'student'});p=self.row('placements',placement)
  if p['student']!=a['id']:raise Denied('Not assigned student')
  if type(start)!=int or type(end)!=int or end<=start or end-start>1440:raise Invalid('Invalid interval in minutes')
  overlap=self.db.execute('SELECT t.id FROM timesheets t JOIN placements p ON p.id=t.placement WHERE p.student=? AND t.start<? AND t.end>?',(a['id'],end,start)).fetchone()
  if overlap:raise Invalid('Overlapping or duplicate timesheet')
  with self.db:
   id=self.db.execute('INSERT INTO timesheets(placement,start,end) VALUES(?,?,?)',(placement,start,end)).lastrowid;self.log(a['id'],'timesheet_submitted',id)
  return id
 def verify_hours(self,token,id):
  a=self.actor(token);t=self.row('timesheets',id);p=self.row('placements',t['placement']);host=self.row('hosts',p['host'])
  if a['role']=='host' and host['owner']==a['id']:column='host_verified'
  elif a['role']=='academic' and p['academic']==a['id']:
   if not t['host_verified']:raise Invalid('Host verification required first')
   column='academic_verified'
  else:raise Denied('Cannot verify hours')
  if t[column]:raise Invalid('Already verified')
  with self.db:self.db.execute('UPDATE timesheets SET '+column+'=1 WHERE id=?',(id,));self.log(a['id'],column,id)
 def verified_minutes(self,id):return self.db.execute('SELECT coalesce(sum(end-start),0) FROM timesheets WHERE placement=? AND host_verified=1 AND academic_verified=1',(id,)).fetchone()[0]
 def complete(self,token,id,report,evaluation):
  a=self.actor(token,{'academic'});p=self.row('placements',id)
  if p['academic']!=a['id']:raise Denied('Not assigned academic supervisor')
  if self.verified_minutes(id)<240*60 or not report or not evaluation:raise Invalid('Completion requirements unmet')
  with self.db:self.db.execute('INSERT INTO completions VALUES(?,?,?,?)',(id,report,evaluation,a['id']));self.log(a['id'],'completed',id)
 def documents(self,token,id,directory):
  p=self.private_profile(token,id)
  if p['status'] not in {'Approved','Published'} or not p['consent']:raise Invalid('Approved consented profile required')
  from reportlab.pdfgen import canvas
  from reportlab.graphics.barcode.qr import QrCodeWidget
  from reportlab.graphics.shapes import Drawing
  from reportlab.graphics import renderPDF,renderSVG
  code=self.code(id);url=self.origin+'/support-student/'+code;folder=Path(directory);folder.mkdir(parents=True,exist_ok=True)
  widget=QrCodeWidget(url);b=widget.getBounds();size=110;drawing=Drawing(size,size,transform=[size/(b[2]-b[0]),0,0,size/(b[3]-b[1]),0,0]);drawing.add(widget)
  renderSVG.drawToFile(drawing,str(folder/(code+'.svg')))
  pdf=canvas.Canvas(str(folder/(code+'.pdf')),pagesize=(612,792));pdf.setTitle('Synthetic staging student support letter')
  pdf.setFont('Helvetica-Bold',19);pdf.drawString(54,728,'EMANON INSTITUTE')
  pdf.setFont('Helvetica',11)
  for y,line in [(698,'DEMONSTRATION ONLY — SYNTHETIC STUDENT'),(662,'Student: '+p['name']),(640,'Program: '+p['program']),(618,'Sponsorship code: '+code),(586,'Please visit the approved profile for educational support information.'),(562,'A contribution is recorded only after verified payment confirmation.'),(526,'This demonstration does not accept payments or issue donation receipts.'),(486,url)]:pdf.drawString(54,y,line[:100])
  pdf.linkURL(url,(54,476,558,501),relative=0);renderPDF.draw(drawing,pdf,54,330);pdf.showPage();pdf.save()
  return {'url':url,'pdf':str(folder/(code+'.pdf')),'qr':str(folder/(code+'.svg'))}
