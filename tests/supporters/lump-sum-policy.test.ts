import test from 'node:test';
import assert from 'node:assert/strict';
import { lumpSumRate, LUMP_SUM_POLICY_VERSION, validateLumpSumIssue } from '../../lib/enterprise/supporters/lumpSumPolicy';
import { renderLumpSumDocument } from '../../lib/enterprise/supporters/lumpSumDocuments';
test('approved tier boundaries use exact cents',()=>{
  for(const [amount,rate] of [[50000,6],[519999,6],[520000,8],[2000000,8],[2500000,10],[5000000,10],[10000000,12],[20000000,12]]) assert.equal(lumpSumRate(amount),rate);
});
test('unapproved gaps and invalid amounts cannot issue or check out',()=>{
  for(const amount of [49999,0,-1,Infinity,NaN,50000.5,2000001,2499999,5000001,9999999,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>lumpSumRate(amount));
});
const record=()=>({supporterName:'Fictional Supporter <script>',businessName:'Example & Co',businessCode:'TEST-001',amountCents:100000,currency:'USD' as const,receivedDate:'2026-10-15',issueDate:'2026-10-15',maturityDate:'2027-10-15',certificateNumber:'DRAFT-SAMPLE',verifiedReceipt:true,approvedForIssue:true,agreement:{policyVersion:LUMP_SUM_POLICY_VERSION,rate:6 as const,approved:true}});
test('requires approved issue, verified receipt, dates and original agreement',()=>{
  for(const r of [{...record(),verifiedReceipt:false},{...record(),approvedForIssue:false},{...record(),receivedDate:'2026-02-30'},{...record(),maturityDate:'2026-01-01'},{...record(),agreement:{...record().agreement,policyVersion:'historical'}}]) assert.throws(()=>validateLumpSumIssue(r));
});
test('both document types and languages preserve amount, benefit, dates and escaped identity',()=>{
  for(const kind of ['letter','certificate'] as const)for(const lang of ['en','ht'] as const){
    const html=renderLumpSumDocument(record(),kind,lang);
    assert.match(html,/\$1,000\.00/);assert.match(html,/>6%/);assert.match(html,/2027-10-15/);
    assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/REVIEW PREVIEW|MODÈL POU REVIZYON/);
    assert.match(html,/epew-logo.png/);assert.match(html,/epew-ede-ibos-logo.png/);
  }
});
