export type Field={key:string;label:string;type?:'text'|'email'|'date'|'datetime-local'|'number'|'textarea'|'select';required?:boolean;options?:string[]};
const f=(key:string,label:string,type:Field['type']='text',required=false,options?:string[]):Field=>({key,label,type,required,options});
const status=(options:string[])=>f('status','Status','select',true,options);
const employee=f('employee_id','Employee ID','text',true);
const notes=f('notes','Notes','textarea');
export const topics=['Food Fans culture','Food safety','Menu','Station','POS','Customer service','Pickup/delivery','Opening procedures','Closing procedures'];
export const workforceSchemas:Record<string,{label:string;fields:Field[]}>= {
 applicant:{label:'Job applicants',fields:[f('full_name','Full name','text',true),f('email','Email','email'),f('mobile','Mobile'),f('role_id','Role ID'),f('availability','Availability','textarea'),status(['received','reviewing','interview','offer','hired','not_selected','withdrawn']),notes]},
 role:{label:'Roles',fields:[f('title','Role title','text',true),f('duties','Duties','textarea',true),f('requirements','Training / certification requirements','textarea'),status(['draft','active','inactive'])]},
 employee:{label:'Employees',fields:[f('full_name','Full name','text',true),f('applicant_id','Applicant ID'),f('email','Email','email'),f('mobile','Mobile'),f('role_id','Role ID','text',true),f('start_date','Start date','date'),f('provider_employee_id','Payroll provider employee ID'),status(['onboarding','active','leave','inactive']),notes]},
 availability:{label:'Availability',fields:[employee,f('effective_date','Effective date','date',true),f('availability','Available days / time windows (New York time)','textarea',true),notes]},
 training_plan:{label:'Staff training plan',fields:[f('topic','Training topic','select',true,topics),f('planned_date','Planned training date','date',true),f('trainer','Trainer','text',true),status(['planned','scheduled','cancelled']),notes]},
 training:{label:'Employee training completion',fields:[employee,f('topic','Training topic','select',true,topics),f('planned_date','Planned training date','date',true),f('trainer','Trainer','text',true),f('training_date','Actual training date','date'),status(['planned','in_progress','completed','needs_retraining','cancelled']),f('assessment','Assessment result / evidence','textarea'),f('certification','Certification / evidence reference'),f('retraining_date','Retraining date','date'),notes]},
 certification:{label:'Certifications',fields:[employee,f('name','Certification','text',true),f('issuer','Issuer','text',true),f('reference','Certificate reference','text',true),f('issued_date','Issued date','date'),f('expires_date','Expiration date','date'),status(['pending','verified','expired','revoked']),notes]},
 schedule:{label:'Schedule',fields:[employee,f('starts_at','Shift start (include UTC offset)','text',true),f('ends_at','Shift end (include UTC offset)','text',true),f('station','Station'),status(['draft','published','cancelled']),notes]},
 time_entry:{label:'Time clock / time entries',fields:[employee,f('clock_in','Clock in (ISO date/time with UTC offset)','text',true),f('clock_out','Clock out (ISO date/time with UTC offset)'),f('unpaid_break_minutes','Unpaid break minutes','number',true),status(['open','pending','approved','rejected']),f('approval_evidence','Time review evidence','textarea'),notes]},
 attendance:{label:'Attendance',fields:[employee,f('work_date','Work date','date',true),f('schedule_id','Schedule ID'),status(['present','late','absent','excused']),notes]},
 performance:{label:'Performance reviews',fields:[employee,f('review_date','Review date','date',true),f('reviewer','Reviewer','text',true),f('assessment','Assessment','textarea',true),f('next_action','Next action','textarea'),notes]},
 document:{label:'Private employee document references',fields:[employee,f('title','Document title','text',true),f('attachment_id','Private launch-workspace attachment UUID','text',true),f('category','Category','text',true),f('expires_date','Expiration date','date'),notes]},
 manager_note:{label:'Manager notes',fields:[employee,f('note_date','Note date','date',true),f('note','Manager note','textarea',true),f('follow_up_date','Follow-up date','date')]},
 payroll:{label:'Payroll review / approved export lines',fields:[employee,f('period_start','Pay period start','date',true),f('period_end','Pay period end','date',true),f('regular_hours','Manager-reviewed regular hours','number',true),f('overtime_hours','Manager-reviewed overtime hours','number',true),f('rate_cents','Approved hourly rate (USD cents)','number',true),f('time_entry_ids','Approved time entry IDs (comma separated)','textarea',true),status(['draft','approved']),f('approval_evidence','Payroll review / classification evidence','textarea'),notes]}
};
export function validateWorkforce(raw:unknown){
 if(!raw||typeof raw!=='object')return null;const r=raw as Record<string,unknown>;
 if(typeof r.kind!=='string'||!workforceSchemas[r.kind]||typeof r.record_key!=='string'||!/^[A-Za-z0-9_.:-]{1,100}$/.test(r.record_key)||!Number.isSafeInteger(r.expected_version)||Number(r.expected_version)<0||typeof r.reason!=='string'||!r.reason.trim()||r.reason.length>4000||typeof r.request_id!=='string'||!/^[a-f0-9-]{36}$/i.test(r.request_id)||!r.data||typeof r.data!=='object'||Array.isArray(r.data))return null;
 const d=r.data as Record<string,unknown>,fields=workforceSchemas[r.kind].fields;
 if(Object.keys(d).some(k=>!fields.some(f=>f.key===k)))return null;
 for(const f of fields){const v=d[f.key];if(f.required&&(v===null||v===undefined||v===''))return null;if(v===null||v===undefined||v==='')continue;if(f.type==='number'){if(typeof v!=='number'||!Number.isFinite(v)||v<0)return null;}else if(typeof v!=='string'||v.length>12000||f.options&&!f.options.includes(v))return null;}
 return {kind:r.kind,record_key:r.record_key,expected_version:r.expected_version,data:d,reason:r.reason,request_id:r.request_id};
}
export function csvCell(v:unknown){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
