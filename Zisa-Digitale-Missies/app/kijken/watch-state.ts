export type Phase='start'|'listen'|'watch'|'do'|'resume'|'quieter'|'stop'|'complete';
export type WatchState={phase:Phase;task:number;pauses:number;resumes:number};
export type WatchAction={type:'PLAY'|'PAUSE'|'HEARD'|'TASK_DONE'|'QUIETER'|'STOP'|'RESET'};
export const initialWatchState:WatchState={phase:'start',task:0,pauses:0,resumes:0};
export function watchReducer(s:WatchState,a:WatchAction):WatchState{
 switch(a.type){
 case 'RESET':return {...initialWatchState};
 case 'PLAY':if(s.phase==='start')return {...s,phase:'listen'};if(s.phase==='resume')return {...s,phase:'watch',resumes:s.resumes+1};if(s.phase==='do')return {...s,phase:'watch'};return s;
 case 'HEARD':return s.phase==='listen'?{...s,phase:'watch'}:s;
 case 'PAUSE':return s.phase==='watch'?{...s,phase:'do',pauses:s.pauses+1}:s;
 case 'TASK_DONE':return s.phase==='do'?(s.task<2?{...s,phase:'resume',task:s.task+1}:{...s,phase:'quieter'}):s;
 case 'QUIETER':return s.phase==='quieter'?{...s,phase:'stop'}:s;
 case 'STOP':return s.phase==='stop'?{...s,phase:'complete'}:s;
 }
}
