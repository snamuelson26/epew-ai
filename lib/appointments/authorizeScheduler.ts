import {createHash} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabaseAdmin';
export async function authorizeScheduler(request:Request) {
 const header=request.headers.get('authorization')||'';
 if(process.env.CRON_SECRET && header===`Bearer ${process.env.CRON_SECRET}`) return true;
 if(!header.startsWith('Bearer ')) return false;
 const {data,error}=await supabaseAdmin.from('epew_internal_cron_tokens').select('id').eq('action_key','appointment-reminders').eq('active',true).eq('token_hash',createHash('sha256').update(header.slice(7)).digest('hex')).maybeSingle();
 return !error && Boolean(data);
}
