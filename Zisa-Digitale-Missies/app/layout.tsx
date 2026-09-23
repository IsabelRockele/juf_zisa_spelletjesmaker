import type { Metadata } from 'next';
import './globals.css';
import './compact.css';
export const metadata:Metadata={title:'Zisa’s digitale missies',description:'Kies je missie: tekenen, filmpjes bedienen, robotroutes, veilig met media en slim zoeken.',icons:{icon:'/icon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="nl"><body>{children}</body></html>}
