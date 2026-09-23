import type {Metadata} from 'next';
import RobotRoutes from './robot-routes';
import './robot.css';
export const metadata:Metadata={title:'Robotroutes · Zisa’s digitale missies',description:'Maak een stappenplan met pijlen en laat de robot jouw route naar de ster lopen.'};
export default function Page(){return <RobotRoutes/>;}
