import hashlib,hmac,json,tempfile,unittest
from pathlib import Path
from service import Service,Denied,Invalid

class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.s=Service(Path(self.tmp.name)/'test.sqlite')
  self.student=self.s.fixture('student-1','student');self.other=self.s.fixture('student-2','student');self.director=self.s.fixture('director','director');self.reviewer=self.s.fixture('reviewer','reviewer');self.finance=self.s.fixture('finance','finance');self.host=self.s.fixture('host','host');self.academic=self.s.fixture('academic','academic')
  self.id=self.s.create_profile(self.student,'Demo Student','Technology','Community learning',50000)
 def tearDown(self):self.s.db.close();self.tmp.cleanup()
 def publish(self):
  self.s.consent(self.student,self.id,'demo-consent-v1');self.s.transition(self.student,self.id,'Submitted');self.s.transition(self.reviewer,self.id,'Under Review');self.s.transition(self.director,self.id,'Approved',50000);self.s.transition(self.director,self.id,'Published')
 def event(self,state='confirmed',id='evt1',**extra):
  e={'id':id,'contribution':'pay1','amount':25000,'currency':'usd','account':'EMANON-SYNTHETIC-TEST','state':state};e.update(extra)
  b=json.dumps(e).encode();self.s.payment_event(b,hmac.new(self.s.webhook_secret,b,hashlib.sha256).hexdigest())
 def placement(self):
  details={'business_name':'Synthetic host','contact':'demo@example.invalid','address':'Demo address','industry':'Technology','positions':1,'schedule':'20 hours per week','supervisor':'Demo supervisor','paid':True,'insurance':'Review evidence','safety':'Review evidence','financial_sponsorship_interest':False,'review_agreement':True}
  h=self.s.host_apply(self.host,details);self.s.host_approve(self.director,h)
  return self.s.place(self.director,'student-1',h,'academic',{'competencies':['Learning'],'start':'2026-10-12','end':'2027-01-03'})
 def test_existing_identity_mapping_unique(self):
  with self.assertRaises(Exception):self.s.fixture('student-1','student')
 def test_private_draft_and_unapproved_public_denial(self):
  self.assertEqual(self.s.private_profile(self.student,self.id)['status'],'Draft');self.assertIsNone(self.s.public_profile('IES-S-000001'))
 def test_cross_student_denied(self):
  with self.assertRaises(Denied):self.s.private_profile(self.other,self.id)
 def test_student_cannot_approve(self):
  with self.assertRaises(Denied):self.s.transition(self.student,self.id,'Approved',100)
 def test_consent_required(self):
  self.s.transition(self.student,self.id,'Submitted');self.s.transition(self.director,self.id,'Under Review')
  with self.assertRaises(Invalid):self.s.transition(self.director,self.id,'Approved',100)
 def test_approved_public_whitelist(self):
  self.publish();p=self.s.public_profile(self.s.code(self.id));self.assertEqual(p['name'],'Demo Student');self.assertNotIn('owner',p);self.assertNotIn('requested',p)
 def test_withdrawal_and_suspension_hide(self):
  self.publish();code=self.s.code(self.id);self.s.transition(self.director,self.id,'Suspended');self.assertIsNone(self.s.public_profile(code));self.s.withdraw(self.student,self.id);self.assertIsNone(self.s.public_profile(code));self.assertEqual(self.s.code(self.id),code)
 def test_codes_cannot_reassign_or_delete(self):
  self.publish()
  with self.assertRaises(Exception):self.s.db.execute('DELETE FROM codes')
  with self.assertRaises(Exception):self.s.db.execute('UPDATE codes SET number=42')
 def test_qr_pdf_link_matches(self):
  self.publish();docs=self.s.documents(self.student,self.id,self.tmp.name)
  self.assertTrue(Path(docs['qr']).exists());data=Path(docs['pdf']).read_bytes();self.assertIn(docs['url'].encode(),data);self.assertIn(b'/Type /Page',data)
 def test_pending_does_not_count(self):
  self.publish();self.s.initiate(self.student,'pay1',self.id,25000);self.assertEqual(self.s.total(self.id),0)
 def test_verified_payment_replay_refund(self):
  self.publish();self.s.initiate(self.student,'pay1',self.id,25000);self.event();self.event();self.assertEqual(self.s.total(self.id),25000);self.event('refunded','evt2');self.assertEqual(self.s.total(self.id),0)
 def test_forged_webhook_denied(self):
  with self.assertRaises(Denied):self.s.payment_event(b'{}','bad')
 def test_payment_account_amount_mismatch(self):
  self.publish();self.s.initiate(self.student,'pay1',self.id,25000)
  with self.assertRaises(Invalid):self.event(account='EPEW')
  with self.assertRaises(Invalid):self.event(amount=100)
 def test_dispute_excluded(self):
  self.publish();self.s.initiate(self.student,'pay1',self.id,25000);self.event();self.event('disputed','evt2');self.assertEqual(self.s.total(self.id),0)
 def test_allocation_separation_and_cap(self):
  self.publish();self.s.initiate(self.student,'pay1',self.id,25000)
  with self.assertRaises(Invalid):self.s.allocate(self.finance,'pay1',100)
  self.event()
  with self.assertRaises(Denied):self.s.allocate(self.director,'pay1',100)
  self.s.allocate(self.finance,'pay1',25000)
  with self.assertRaises(Invalid):self.s.allocate(self.finance,'pay1',1)
 def test_unapproved_host_cannot_place(self):
  details={'business_name':'Unapproved host','contact':'host@example.invalid','address':'Demo address','industry':'Technology','positions':1,'schedule':'20 hours per week','supervisor':'Demo supervisor','paid':True,'insurance':'Pending review','safety':'Pending review','financial_sponsorship_interest':False,'review_agreement':True}
  host=self.s.host_apply(self.host,details)
  with self.assertRaises(Invalid):self.s.place(self.director,'student-1',host,'academic',{'competencies':['Learning']})
 def test_timesheet_duplicate_and_self_approval_denied(self):
  p=self.placement();t=self.s.timesheet(self.student,p,0,240)
  with self.assertRaises(Invalid):self.s.timesheet(self.student,p,0,240)
  with self.assertRaises(Invalid):self.s.timesheet(self.student,p,100,300)
  with self.assertRaises(Denied):self.s.verify_hours(self.student,t)
  self.assertEqual(self.s.verified_minutes(p),0)
 def test_dual_verification_required(self):
  p=self.placement();t=self.s.timesheet(self.student,p,0,240)
  with self.assertRaises(Invalid):self.s.verify_hours(self.academic,t)
  self.s.verify_hours(self.host,t);self.assertEqual(self.s.verified_minutes(p),0);self.s.verify_hours(self.academic,t);self.assertEqual(self.s.verified_minutes(p),240)
 def test_240_hours_completion(self):
  p=self.placement()
  with self.assertRaises(Invalid):self.s.complete(self.academic,p,'report','evaluation')
  for day in range(60):
   t=self.s.timesheet(self.student,p,day*1440,day*1440+240);self.s.verify_hours(self.host,t);self.s.verify_hours(self.academic,t)
  self.assertEqual(self.s.verified_minutes(p),14400);self.s.complete(self.academic,p,'report','evaluation')
 def test_unauthenticated_denied(self):
  with self.assertRaises(Denied):self.s.private_profile('fake',self.id)
 def test_audit_append_only(self):
  with self.assertRaises(Exception):self.s.db.execute("UPDATE audit SET actor='spoof'")

if __name__=='__main__':unittest.main(verbosity=2)
