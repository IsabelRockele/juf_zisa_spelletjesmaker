import type {Metadata} from 'next';
import SearchMission from './search-mission';
import '../veilig/safety.css';
import './search.css';
export const metadata:Metadata={title:'Slim zoeken · Zisa’s digitale missies',description:'Kies een passend zoekmiddel, oefen zoekwoorden en ontdek kindgerichte websites.'};
export default function Page(){return <SearchMission/>;}
