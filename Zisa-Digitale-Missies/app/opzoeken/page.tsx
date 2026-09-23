import type {Metadata} from 'next';
import Lookup from './lookup';
import '../veilig/safety.css';
import '../zoeken/search.css';
import './lookup.css';
export const metadata:Metadata={title:'Zelf opzoeken · Zisa’s digitale missies',description:'Zoek een woord met uitleg, beeld en geluid, of kies een website. Met afdrukbare zoekopdrachten.'};
export default function Page(){return <Lookup/>;}
