import {getTeacherUser} from '@/lib/teacher-auth';
import Teacher from './teacher';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export default async function Page(){const user=await getTeacherUser();if(!user)return <main className="login"><h1>Geen toegang tot deze werkjes</h1><p>Open deze missie via je leerkrachtaccount in de spelletjesmaker.</p><a href="/">Naar de missies</a></main>;return <Teacher/>;}
