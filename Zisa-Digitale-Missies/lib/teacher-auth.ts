import {readHostSession} from '@/integration/host-session';
// Only a server-verified session from zisa_spelletjesmaker is accepted.
export async function getTeacherUser(){
 const session=await readHostSession();
 if(!session || !session.canReceiveClasswork)return null;
 return {userId:session.userId,name:session.displayName};
}
