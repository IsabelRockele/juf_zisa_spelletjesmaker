import type {Metadata} from 'next';
import Safety from './safety';
import './safety.css';
export const metadata:Metadata={title:'Veilig met media · Zisa’s digitale missies',description:'Luister, kies en oefen veilig omgaan met berichten, wachtwoorden, foto’s en schermtijd.'};
export default function Page(){return <Safety/>;}
