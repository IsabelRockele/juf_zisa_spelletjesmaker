(function(root) {
  const demoWorlds=['dragon','tug'];
  function edition(path) {
    if(/\/pro\/drakeneiland\/(?:index\.html)?$/i.test(path)) return 'pro';
    if(/\/ontdek\/drakeneiland\/(?:index\.html)?$/i.test(path)) return 'ontdek';
    return 'colleague';
  }
  function config(value,mode) {
    if(mode!=='ontdek') return {...value};
    return {...value,world:demoWorlds.includes(value.world)?value.world:'dragon',operation:['split','add','sub','mix'].includes(value.operation)?value.operation:'add',range:10,bridge:'without',count:2,target:10,duration:90,coop:false,storms:false};
  }
  root.AdventurePolicy={edition,config,demoWorlds};
  if(typeof module!=='undefined') module.exports=root.AdventurePolicy;
})(globalThis);
