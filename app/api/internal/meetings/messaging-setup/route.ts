import {authorizeScheduler} from '@/lib/appointments/authorizeScheduler';
import {messagingReadiness} from '@/lib/appointments/messageProvider';
export const maxDuration=60;
async function handle(request:Request,create:boolean) {
 if(!await authorizeScheduler(request)) return Response.json({error:'Unauthorized'},{status:401});
 try {return Response.json(await messagingReadiness(create),{headers:{'Cache-Control':'no-store'}});}
 catch(e) {return Response.json({error:'Unable to check messaging setup',code:(e as {code?:number}).code||null},{status:500});}
}
export const GET=(request:Request)=>handle(request,false);
export const POST=(request:Request)=>handle(request,true);
