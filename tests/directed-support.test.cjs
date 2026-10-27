const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { directedTerms } = require('../lib/enterprise/supporters/directedSupportRules.ts');
const { independentTerms } = require('../lib/enterprise/supporters/independentSupportRules.ts');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let db;
before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table supporters(id uuid primary key);
 create table entrepreneurs(id uuid primary key,business_name text,qualified boolean,marketplace_visibility boolean,campaign_status text,created_at timestamptz default now());
 create table supporter_transactions(id uuid primary key default gen_random_uuid(),supporter_id uuid,entrepreneur_id uuid,amount numeric,units integer,frequency text,payment_type text,status text,stripe_checkout_session_id text,stripe_invoice_id text,stripe_customer_id text,stripe_subscription_id text,selection_method text,updated_at timestamptz);
 insert into supporters values('${id(1)}');
 insert into entrepreneurs(id,business_name,qualified,marketplace_visibility,campaign_status) values('${id(2)}','FFR-002',true,true,'Campaign Active'),('${id(3)}','Other business',true,true,'Campaign Active');`);
 const original=fs.readFileSync('supabase/migrations/20260929042736_independent_support_and_whatsapp_interviews.sql','utf8').split('create table public.epew_whatsapp_interviews')[0];
 await db.exec(original+'commit;');
 await db.exec(fs.readFileSync('supabase/migrations/20261027124515_ffr_flexible_support.sql','utf8'));
});
after(async()=>{await db.close()});
test('lump sum accepts exactly $500 and more, rejects subminimum and malformed cents',()=>{
 assert.equal(directedTerms({frequency:'one-time',amount:'500'}).baseCents,50000);
 assert.equal(directedTerms({frequency:'one-time',amount:'750.25'}).baseCents,75025);
 for(const amount of ['499.99','-500','500.001','1e3',Infinity,'',1000000]) assert.throws(()=>directedTerms({frequency:'one-time',amount}));
});
test('recurring terms are server-calculated; old independent pricing is unchanged',()=>{
 assert.equal(directedTerms({frequency:'weekly',units:2,amount:1}).baseCents,20000);
 assert.equal(directedTerms({frequency:'monthly',units:1}).baseCents,43334);
 assert.equal(directedTerms({frequency:'annual',units:1}).baseCents,520000);
 assert.equal(independentTerms({frequency:'monthly',units:1}).baseCents,40000);
 for(const units of [0,1.5,21,Infinity]) assert.throws(()=>directedTerms({frequency:'weekly',units}));
});
async function plan(n,frequency,units,base,target=id(2)) {
 await db.query('insert into epew_independent_support_plans(id,supporter_id,frequency,units,base_cents,selected_entrepreneur_id) values($1,$2,$3,$4,$5,$6)',[id(n),id(1),frequency,units,base,target]);
}
async function paid(n,key,amount,initial=true,subscription=null) {
 return db.query('select epew_record_independent_payment($1,$2,$3,$4,$5,$6,$7,$8)',[id(n),key,amount,initial,'customer',subscription,subscription?null:key,subscription?key:null]);
}
test('database enforces the minimum and reserves annual units for the existing paid-in-full flow',async()=>{
 await assert.rejects(plan(10,'one-time',0,49999),/check constraint/);
 await assert.rejects(plan(11,'annual',1,520000,null),/check constraint/);
 await assert.rejects(plan(12,'annual',1,520000),/check constraint/);await plan(13,'monthly',1,43334);
 await assert.rejects(plan(14,'monthly',1,43334,null),/check constraint/);
});
test('paid cash stays assigned to the selected business; duplicate events create one receipt',async()=>{
 await plan(20,'one-time',0,50000);await paid(20,'checkout-20',50000);await paid(20,'checkout-20',50000);
 await db.query('select epew_allocate_independent_payments()');
 const rows=(await db.query('select entrepreneur_id,selection_method,amount from supporter_transactions where stripe_checkout_session_id=$1',['checkout-20'])).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].entrepreneur_id,id(2));assert.equal(rows[0].selection_method,'self_selected');assert.equal(Number(rows[0].amount),500);
});
test('a hidden selected campaign holds its payment; another business never receives it',async()=>{
 await db.query('update entrepreneurs set marketplace_visibility=false where id=$1',[id(2)]);
 await plan(21,'one-time',0,60000);await paid(21,'checkout-21',60000);
 await db.query('select epew_allocate_independent_payments()');
 assert.equal((await db.query('select entrepreneur_id from epew_independent_support_payments where payment_key=$1',['checkout-21'])).rows[0].entrepreneur_id,null);
 await db.query('update entrepreneurs set marketplace_visibility=true where id=$1',[id(2)]);
 await db.query('select epew_allocate_independent_payments()');
 assert.equal((await db.query('select entrepreneur_id from epew_independent_support_payments where payment_key=$1',['checkout-21'])).rows[0].entrepreneur_id,id(2));
});
test('monthly initial and renewal invoice events are idempotent and check amount and subscription',async()=>{
 await plan(30,'monthly',1,43334);
 await paid(30,'invoice-30',43334,true,'subscription-30');
 await paid(30,'invoice-30',43334,true,'subscription-30');
 await paid(30,'invoice-31',43334,false,'subscription-30');
 await paid(30,'invoice-31',43334,false,'subscription-30');
 await assert.rejects(paid(30,'invoice-bad',43335,false,'subscription-30'),/amount mismatch/);
 await assert.rejects(paid(30,'invoice-wrong',43334,false,'other-subscription'),/Subscription mismatch/);
 assert.equal(Number((await db.query('select count(*) as n from epew_independent_support_payments where plan_id=$1',[id(30)])).rows[0].n),2);
});
