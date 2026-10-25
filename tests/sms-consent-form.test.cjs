const {test}=require('node:test');const assert=require('node:assert/strict');
const Module=require('node:module');const original=Module._load;
Module._load=function(name){if(name==='@/app/components/Navbar'||name==='@/app/components/Footer')return ()=>null;return original.apply(this,arguments)};
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const Page=require('../app/entrepreneurs/communication-preferences/page.tsx').default;
const {SMS_DISCLOSURE}=require('../lib/communications/smsConsentPolicy.ts');
test('rendered form has optional unchecked SMS, full disclosure, phone field and adjacent legal links',()=>{
 const html=renderToStaticMarkup(React.createElement(Page));
 const input=html.match(/<input[^>]*id="smsConsent"[^>]*>/)[0];assert.doesNotMatch(input,/checked|required/);
 assert.match(html,/type="tel"/);assert.ok(html.includes(SMS_DISCLOSURE));
 assert.match(html,/href="\/legal\/privacy-policy"/);assert.match(html,/href="\/legal\/terms-of-use"/);
 assert.match(html,/Submit Communication Preferences/);
});
