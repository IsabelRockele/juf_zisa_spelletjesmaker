import type {Metadata} from 'next';
import Watch from './watch';
import './watch.css';
export const metadata:Metadata={title:'Filmpjes bedienen · Zisa’s digitale missies',description:'Oefen afspelen, pauzeren en stoppen terwijl je een knutselwerkje maakt.'};
export default function Page(){return <Watch/>;}
