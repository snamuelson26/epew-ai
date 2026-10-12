"""Run locally with the primary Python runtime. Synthetic only, no outbound calls."""
import html,json,tempfile,hashlib,base64,re
from pathlib import Path
from http.server import BaseHTTPRequestHandler,HTTPServer
from service import Service

folder=Path(tempfile.mkdtemp(prefix='emanon-demo-'))
preview=(Path(__file__).parent/'simple-application-preview.html').read_bytes()
hashes=[]
for tag in ('style','script'):
 for block in re.findall(rb'<'+tag.encode()+rb'>(.*?)</'+tag.encode()+rb'>',preview,re.S):
  hashes.append("'sha256-"+base64.b64encode(hashlib.sha256(block).digest()).decode()+"'")
preview_csp="default-src 'none'; style-src "+' '.join(hashes)+"; script-src "+' '.join(hashes)+"; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"
s=Service(folder/'demo.sqlite');student=s.fixture('synthetic-student','student');director=s.fixture('synthetic-director','director');reviewer=s.fixture('synthetic-reviewer','reviewer')
id=s.create_profile(student,'Demonstration Student','Computer Technology','Develop practical skills and serve the community.',50000)
s.consent(student,id,'synthetic-consent-v1');s.transition(student,id,'Submitted');s.transition(reviewer,id,'Under Review');s.transition(director,id,'Approved',50000);s.transition(director,id,'Published');docs=s.documents(director,id,folder)

class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  status=200;ctype='text/html; charset=utf-8'
  if self.path=='/':
   text='<h1>Emanon Student Opportunities</h1><p>LOCAL STAGING • SYNTHETIC RECORDS ONLY • NO PAYMENT COLLECTION</p><p>Approved profile and personalized QR/PDF demonstration.</p><p><a href="/support-student/'+s.code(id)+'">Open synthetic student profile</a></p><p><a href="/demo-letter.pdf">View personalized one-page letter</a> • <a href="/demo-qr.svg">View QR code</a></p><p>Application, consent, approval, donation ledger and internship controls are exercised by the accompanying automated test suite. Production adapters are not connected.</p>'
   body=text.encode()
  elif self.path=='/apply':
   body=preview
  elif self.path.startswith('/support-student/'):
   p=s.public_profile(self.path.split('/')[-1])
   if not p:status=404;body=b'<h1>Profile unavailable</h1>'
   else:body=('<h1>'+html.escape(p['name'])+'</h1><p>DEMONSTRATION ONLY</p><p>'+html.escape(p['program'])+'</p><p>'+html.escape(p['goal'])+'</p><p>Approved assistance: $500.00 • Confirmed synthetic support: $0.00</p><p>Sponsorship code: '+p['code']+'</p><p>No live donation controls are enabled.</p>').encode()
  elif self.path in {'/demo-letter.pdf','/demo-qr.svg'}:
   # These files contain exclusively synthetic fixtures and are deliberately public locally.
   key='pdf' if self.path.endswith('.pdf') else 'qr';body=Path(docs[key]).read_bytes();ctype='application/pdf' if key=='pdf' else 'image/svg+xml'
  else:status=404;body=b'Not found'
  self.send_response(status);self.send_header('Content-Type',ctype);self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',preview_csp if self.path=='/apply' else "default-src 'self'; frame-ancestors 'none'");self.end_headers();self.wfile.write(body)
 def log_message(self,*args):pass

if __name__=='__main__':
 print('Synthetic local demo: http://127.0.0.1:8765',flush=True)
 HTTPServer(('127.0.0.1',8765),Handler).serve_forever()
