/* Shared story timeline: every duration reaches the same completed scene. */
const TimerWorld = (() => {
    let sceneSerial = 0;
    const root = typeof document === 'undefined' ? '' : new URL('timer_assets/worlds/', document.currentScript.src).href;
    const asset = name => `${root}${name}.png`;
    const clamp = value => Math.max(0, Math.min(1, value));
    const reveal = (p, start, end = start + .08) => clamp((p-start)/(end-start));
    const ease = p => p*p*(3-2*p);
    const backgrounds = { garden:'garden-path-v2', balloon:'valley', rainbow:'rainbow', aquarium:'ocean-clear', space:'space', star:'night' };
    const chapters = {
        balloon:['Beer vertrekt','Over het dorp','Boven de rivier','Het landingsveld komt in zicht','We gaan landen','Veilig geland!'],
        garden:['Konijn gaat aan het werk','De eerste bloemen','De tuin krijgt kleur','Vlinders komen op bezoek','Nog een beetje water','De hele tuin bloeit!'],
        aquarium:['Op zoek naar de schat','Tussen het koraal','Volg de luchtbelletjes','Daar ligt de schatkist','De schat gaat open','De schat is gevonden!'],
        space:['Klaar voor vertrek','Langs de planeten','Een satelliet onderweg','De maan komt dichtbij','Klaarmaken voor de landing','Veilig op de maan!'],
        rainbow:['De lucht klaart op','De eerste kleuren','Een boog over het gras','Alle kleuren samen','De schatkist gaat open','De regenboog is klaar. De schat is open!'],
        star:['De nacht ontwaakt','De eerste sterren','Een sterrenbeeld verschijnt','Jouw ster groeit','De hemel gaat stralen','Jouw ster straalt!']
    };
    const routes = {
        balloon:[[210,460],[365,340],[620,325],[840,365],[1100,445]],
        garden:[[355,548],[460,550],[590,536],[720,550],[810,555]],
        aquarium:[[170,470],[340,280],[650,430],[910,250],[640,200],[365,375],[490,515],[725,300],[840,410]],
        space:[[300,450],[470,330],[650,350],[805,220],[1005,339]]
    };
    function routeAt(route,p) {
        const position=clamp(p)*(route.length-1), index=Math.min(route.length-2,Math.floor(position));
        const t=position-index, before=route[Math.max(0,index-1)],from=route[index],to=route[index+1],after=route[Math.min(route.length-1,index+2)];
        // A continuous curve avoids stopping abruptly at every bend.
        return [0,1].map(axis=>.5*((2*from[axis])+(-before[axis]+to[axis])*t+(2*before[axis]-5*from[axis]+4*to[axis]-after[axis])*t*t+(-before[axis]+3*from[axis]-3*to[axis]+after[axis])*t*t*t));
    }
    function frame(theme,progress,duration=600) {
        const p=clamp(progress), complete=p===1, travel=clamp(p/.92);
        const encounterCount=Math.max(4,Math.min(24,Math.ceil(duration/120)));
        let route=routes[theme];
        if(theme==='aquarium'&&encounterCount>4) {
            route=[routes.aquarium[0],...Array.from({length:encounterCount*2},(_,i)=>[250+(i*233%680),220+(i*127%280)]),...routes.aquarium.slice(-2)];
        }
        const position=theme==='garden'?gardenFrame(p,duration).position:route?routeAt(route,travel):[600,420];
        const ahead=route?routeAt(route,clamp(travel+.004)):position;
        const direction=ahead[0]<position[0]?-1:1;
        const angle=p>=.90?0:Math.atan2(ahead[1]-position[1],Math.abs(ahead[0]-position[0])||1)*180/Math.PI;
        return { progress:p, complete, arrived:p>=.92,
            position, direction, angle:Math.max(-28,Math.min(28,angle)),
            encounterCount,
            chapter: chapters[theme][complete?5:Math.min(4,Math.floor(p*5))],
            // All reveals finish by 90%; the last 10% belongs to the ending.
            reveals:[.12,.25,.40,.55,.70,.80].map(start=>reveal(p,start,Math.min(.9,start+.10))),
            bloom:reveal(p,.03,.86), treasure:reveal(p,theme==='rainbow'?1-Math.min(.08,3/duration):.92,1), finale:reveal(p,.95,1),
            size:theme==='balloon'?280-70*reveal(p,.75,.92):theme==='space'?235-70*reveal(p,.65,.92):theme==='garden'?170:theme==='aquarium'?195:18+332*travel
        };
    }
    function sprite(index, extra='',sheet='characters') {
        const col=index%3,row=Math.floor(index/3);
        return `<svg ${extra} x="-150" y="-300" width="300" height="300" viewBox="${col*512} ${row*512} 512 512" overflow="hidden"><image href="${asset(sheet)}" width="1536" height="1024"/></svg>`;
    }
    // One chest body stays in place. Only its hinged lid moves; no image swap.
    function chest(x,y,scale=1) {
        return `<g class="hinged-chest" transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="0" rx="106" ry="13" fill="#34412d" opacity=".19"/><svg class="chest-atlas" x="-190" y="-230" width="380" height="253.333" viewBox="0 0 768 512" overflow="hidden"><image href="${asset('chest-animation-v2')}" width="1536" height="1024"/></svg></g>`;
    }
    function rainbowAmount(progress,band,duration=600) { return reveal(progress,band*.045,1-Math.min(.08,3/duration)); }
    function gardenFrame(progress,duration=600) {
        const p=clamp(progress),work=clamp(p/.86)*6,index=Math.min(5,Math.floor(work)),local=Math.min(1,work-index);
        const target=285+index*104,previous=index?target-104:250;
        const walkFraction=Math.min(.3,2/(duration*.86/6));
        const x=previous+(target-previous)*ease(clamp(local/walkFraction));
        const path=[[250,432],[350,449],[450,451],[550,447],[650,442],[805,440]];
        const section=Math.min(4,Math.max(0,path.findIndex((point,i)=>i<5&&x<=path[i+1][0])));
        const t=clamp((x-path[section][0])/(path[section+1][0]-path[section][0]));
        const y=path[section][1]+(path[section+1][1]-path[section][1])*t;
        return {position:[x,y],walking:p<.86&&local<walkFraction,watering:p<.86&&local>=walkFraction&&local<=.94,index,
            growth:Array.from({length:6},(_,i)=>clamp((p-(i+walkFraction)/6*.86)/.18))};
    }
    const butterfly = '<g fill="#efb463" stroke="#693f70" stroke-width="3"><path d="M0 0C-65-56-63 14-8 15-44 51-4 62 0 14 4 62 44 51 8 15 63 14 65-56 0 0Z"/><path d="M0-4V28" fill="none" stroke-width="5"/></g>';
    const bird = '<path d="M-24 4Q-10-15 0 0Q10-15 24 4" fill="none" stroke="#426676" stroke-width="4" stroke-linecap="round"/>';
    const sparkle = '<path d="M0-14 4-4 14 0 4 4 0 14-4 4-14 0-4-4Z" fill="#fff2a9"/>';
    const journeyThemes=['balloon','aquarium','space'];
    function journeyPlan(theme,duration=600) {
        const width=3300+Math.max(60,Math.min(10800,duration))*6;
        const count=Math.ceil((width-1200)/1050)+1;
        const middle=theme==='balloon'?['forest','mountains','valley']:['kelp','shipwreck','ocean-clear'];
        const scenes=Array.from({length:count},(_,i)=>middle[Math.max(0,i-1)%middle.length]);
        scenes[0]=theme==='balloon'?'valley':'kelp';
        scenes[count-1]=theme==='balloon'?'coast':'ocean-clear';
        const panoramaOffset=theme==='balloon'?((1750-((width-1200)*.65+1100))%1845+1845)%1845:0;
        return {count,scenes,width,panoramaOffset};
    }
    function journeyFrame(theme,progress,duration=600) {
        const p=clamp(progress),plan=journeyPlan(theme,duration),camera=clamp(p/.88)*(plan.width-1200);
        const finish=ease(reveal(p,.88,.96));
        const target=theme==='balloon'?[1100,600]:theme==='aquarium'?[820,510]:[1005,339];
        const cruiseY=theme==='balloon'?310+20*Math.sin(camera/700):theme==='aquarium'?370+65*Math.sin(camera/330):345+32*Math.sin(camera/550);
        const cruiseX=theme==='space'?440:380;
        const y=theme==='balloon'&&p<.06?460+(cruiseY-460)*ease(p/.06):cruiseY;
        return {...plan,progress:p,camera,complete:p===1,arrived:p>=.96,
            position:[camera+cruiseX+(target[0]-cruiseX)*finish,y+(target[1]-y)*finish],
            size:theme==='balloon'?270-60*finish:theme==='aquarium'?195:230-65*finish,
            angle:theme==='space'?(78+5*Math.cos(camera/550))*(1-finish):theme==='aquarium'?10*Math.cos(camera/330)*(1-finish):1.6*Math.sin(p*duration*.7)*(1-finish),
            chestOpen:reveal(p,.965,.995),
            segment:Math.min(plan.count-1,Math.floor((camera+600)/1050))};
    }
    function wrapScene(content) {
        const prefix=`timer-scene-${++sceneSerial}-`;
        const markup=`<svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="world-stage"><path d="M0 0h1200v675H0Z"/></clipPath></defs><g clip-path="url(#world-stage)">${content}</g></svg>`;
        return markup.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`);
    }
    function fishFrame(home,y,elapsed,index) {
        // Long horizontal patrol with a smooth turn; tailbeats are independent of timer duration.
        const phase=elapsed*(.08+index%3*.015)+index*1.7;
        const velocity=Math.cos(phase);
        return {x:home+Math.sin(phase)*360,y:y+Math.sin(phase*.8+index)*22,
            direction:Math.sign(velocity||1)*Math.max(.16,Math.min(1,Math.abs(velocity)*5)),angle:Math.sin(phase*.8+index)*4};
    }
    // The drawn flippers extend across the nominal atlas cells. Isolate each full
    // pose, then register all poses by the eye position instead of a fixed grid.
    const turtleFrames=[
        {x:0,clip:'12,350 48,246 128,170 181,143 375,121 478,153 478,189 451,229 420,257 247,402 226,411 207,406'},
        {x:444,clip:'450,350 449,325 489,248 553,183 609,145 819,121 841,127 865,166 868,194 820,358 803,368 668,420 646,415'},
        {x:889,clip:'886,310 987,186 1061,143 1265,120 1290,133 1311,169 1311,196 1293,225 1205,329 1155,365 906,366'},
        {x:1332,clip:'1317,252 1462,156 1518,141 1706,120 1733,134 1753,171 1753,194 1679,345 1642,385 1478,380 1381,340 1317,275'}
    ];
    function swimSprite(kind=0,extra='') {
        if(kind===0) return `<svg ${extra} x="-150" y="-150" width="300" height="300" viewBox="0 60 480 440" overflow="hidden"><defs>${turtleFrames.map((frame,i)=>`<clipPath id="turtle-pose-${i}" clipPathUnits="userSpaceOnUse"><polygon points="${frame.clip}"/></clipPath>`).join('')}</defs>${turtleFrames.map((frame,i)=>`<image class="turtle-pose" data-pose="${i}" href="${asset('swim-cycle-v3')}" width="1774" height="887" clip-path="url(#turtle-pose-${i})" style="display:${i?'none':'inline'}"/>`).join('')}</svg>`;
        return `<svg ${extra} x="-150" y="-150" width="300" height="300" viewBox="0 ${kind*512} 512 512" overflow="hidden"><image href="${asset('swim-cycle-v3')}" width="2048" height="1024"/></svg>`;
    }
    function buildJourney(theme,duration) {
        const plan=journeyPlan(theme,duration),end=plan.width-1200;
        let back='',world='',front='';
        if(theme==='space') {
            back='<defs><radialGradient id="nebula"><stop stop-color="#635294" stop-opacity=".55"/><stop offset="1" stop-color="#12203e" stop-opacity="0"/></radialGradient></defs><path d="M0 0h1200v675H0Z" fill="#0b1733"/>';
            for(const [layer,factor] of [[0,.12],[1,.4],[2,1.15]]) {
                const w=plan.width*factor+1600;
                back+=`<g class="depth-layer" data-factor="${factor}">`;
                if(layer===0) for(let i=0;i<Math.ceil(w/850);i++) back+=`<ellipse cx="${i*850}" cy="${210+i%2*220}" rx="600" ry="310" fill="url(#nebula)"/>`;
                back+=Array.from({length:Math.ceil(w/18)},(_,i)=>`<circle cx="${i*83%w}" cy="${i*137%675}" r="${.7+layer*.6+i%3*.3}" fill="#d8eaff" opacity="${.3+i%4*.15}"/>`).join('')+'</g>';
            }
            for(let i=0;i<plan.count-1;i++) {
                const name=['planet-ringed','planet-coral','planet-blue','planet-gold'][i%4];
                world+=`<image href="${new URL('../'+name+'.png',root).href}" x="${850+i*1050}" y="${i%2?380:65}" width="${220+i%3*60}" height="${220+i%3*60}"/>`;
                if(i%2===0) world+=`<g transform="translate(${1500+i*1050} 190) rotate(-18)"><rect x="-75" y="-20" width="48" height="40" rx="3" fill="#4c79ac" stroke="#b1d4eb" stroke-width="3"/><rect x="27" y="-20" width="48" height="40" rx="3" fill="#4c79ac" stroke="#b1d4eb" stroke-width="3"/><path d="M-65-20v40m14-40v40m88-40v40m14-40v40M-75 0H75" stroke="#a4c6e5"/><rect x="-20" y="-24" width="40" height="48" rx="10" fill="#dfdfcf"/><path d="M0-24V-50m-14 0q14 15 28 0" fill="none" stroke="#c8d4de" stroke-width="4"/></g>`;
            }
            front=`<g class="depth-layer" data-factor="1.45">${Array.from({length:plan.count},(_,i)=>`<g transform="translate(${1500+i*1400} ${i%2?715:115}) scale(.45) rotate(${i*37})">${sprite(4,'','journey-props-v3')}</g>`).join('')}</g>`;
            world+=`<image href="${new URL('../moon.png',root).href}" x="${end+760}" y="300" width="490" height="490"/><ellipse cx="${end+1005}" cy="339" rx="95" ry="17" fill="#c2cbd8" stroke="#8796ad" stroke-width="5"/>`;
        } else {
            const name=theme==='aquarium'?'ocean-panorama-v3':'valley-panorama-v3';
            // Tile a single continuous panorama in world coordinates, with a fixed soft join.
            const panoramaOffset=plan.panoramaOffset;
            back=`<g class="depth-layer" data-factor=".65">`;
            for(let i=0;i<Math.ceil((plan.width*.65+1200+panoramaOffset)/1845);i++) {
                const x=i*1845-panoramaOffset;
                back+=`<defs><linearGradient id="pan-edge-${i}" gradientUnits="userSpaceOnUse" x1="${x}" x2="${x+180}"><stop stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient><mask id="pan-mask-${i}" maskUnits="userSpaceOnUse" x="${x}" y="0" width="2025" height="675"><rect x="${x}" width="2025" height="675" fill="url(#pan-edge-${i})"/></mask></defs><image href="${asset(name)}" x="${x}" width="2025" height="675" preserveAspectRatio="none" ${i?`mask="url(#pan-mask-${i})"`:''}/>`;
            }
            back+='</g>';
            if(theme==='aquarium') {
                world+=Array.from({length:Math.ceil(plan.width/360)},(_,i)=>`<g class="sea-bubbles" data-home="${150+i*360}"><circle cy="0" r="5"/><circle cx="14" cy="32" r="3"/><circle cx="-8" cy="62" r="7"/></g>`).join('');
                world+=`${chest(end+1010,600,.85)}`;
                for(let i=0;i<plan.count*3;i++) {
                    const kind=i%7===4?'jelly':i%7===6?'dolphin':'fish';
                    world+=`<g class="world-resident" data-home="${450+i*390}" data-y="${190+i%4*67}" data-swim="${i}" data-kind="${kind}"><g class="fish-heading">${kind==='fish'?swimSprite(1,'class="fish-cycle"'):sprite(kind==='jelly'?1:2,'class="fish-cycle"','life-sprites')}</g></g>`;
                }
                front='<g class="depth-layer" data-factor="1.15">'+Array.from({length:plan.count*2},(_,i)=>`<g transform="translate(${i*850+650} 705) scale(${i%2?.75:.58})">${sprite(i%2?2:3,'','journey-props-v3')}</g>`).join('')+'</g>';
            } else {
                for(let i=0;i<plan.count;i++) world+=`<g class="world-resident" data-home="${1200+i*1250}" data-y="215" data-swim="${i}"><g transform="scale(.3)" style="filter:hue-rotate(${i%3*45}deg)">${sprite(0)}</g></g>`;
                back+=`<g class="depth-layer" data-factor=".28">${Array.from({length:plan.count},(_,i)=>`<g transform="translate(${i*1100+320} ${230+i%3*34}) scale(.7)">${sprite(i%2?1:5,'','journey-props-v3')}</g>`).join('')}</g>`;
                front=`<g class="depth-layer" data-factor="1.3">${Array.from({length:plan.count},(_,i)=>i*1450+1200>end*1.3+800&&i*1450+1200<end*1.3+1450?'':`<g transform="translate(${i*1450+1200} 810) scale(1.1)">${sprite(0,'','journey-props-v3')}</g>`).join('')}</g>`;
                world+=`<ellipse cx="${end+1100}" cy="600" rx="60" ry="10" fill="#354a32" opacity=".2"/>`;
            }
        }
        const hero=theme==='aquarium'?swimSprite(0,'class="journey-sprite swim-cycle"'):sprite(theme==='space'?3:0,'class="journey-sprite"');
        world+=`<g class="journey-hero"><g class="flight-body">${theme==='space'?'<g class="journey-flame"><path d="M-14 0Q-21 30 0 76 21 30 14 0" fill="#f49b52"/><path d="M-8 0Q-10 24 0 52 10 24 8 0" fill="#fff2bd"/></g>':''}${hero}</g></g>`;
        return wrapScene(`${back}<g class="journey-camera">${world}</g>${front}`);
    }
    function build(theme,duration=600) {
        if(journeyThemes.includes(theme)) return buildJourney(theme,duration);
        let content=theme==='rainbow'
            ? `<image href="${asset('rainbow-meadow-v2')}" width="1200" height="675" preserveAspectRatio="none"/>`
            : `<image class="world-background" href="${asset(backgrounds[theme])}" width="1200" height="675" preserveAspectRatio="xMidYMid slice"/>`;
        if(theme==='balloon') content+=['forest','mountains','coast'].map(name=>`<image class="travel-landscape" href="${asset(name)}" width="1200" height="675" preserveAspectRatio="xMidYMid slice"/>`).join('');
        if(theme==='space') {
            content=`<defs><radialGradient id="deep-space"><stop stop-color="#323769"/><stop offset="1" stop-color="#0b1536"/></radialGradient></defs><path d="M0 0h1200v675H0Z" fill="url(#deep-space)"/><g class="passing-stars">${Array.from({length:100},(_,i)=>`<circle cx="${i*173%2400}" cy="${i*89%675}" r="${1+i%3*.5}" fill="#d9e8ff" opacity="${.3+(i%4)*.2}"/>`).join('')}</g>${['planet-ringed','planet-coral','planet-blue','planet-gold'].map(name=>`<image class="passing-planet" href="${new URL('../'+name+'.png',root).href}" width="270" height="270"/>`).join('')}<image class="space-destination" href="${asset('space')}" width="1200" height="675"/>`;
        }
        if(theme==='garden') {
            content+=Array.from({length:6},(_,i)=>`<g class="flower-plot" transform="translate(${340+i*104} 600)"><ellipse rx="39" ry="10" fill="#705037" stroke="#b49262" stroke-width="3"/><g class="plant-seedling">${sprite(3,'','life-sprites')}</g><g class="plant-bud">${sprite(4,'','life-sprites')}</g><g class="plant-flower" style="filter:hue-rotate(${i%3*25}deg)">${sprite(5,'','life-sprites')}</g></g>`).join('');
            content+=`<g class="garden-water" fill="none" stroke="#d9ffff" stroke-width="2" opacity=".55"><ellipse cx="1080" cy="381" rx="35" ry="5"/><ellipse cx="1045" cy="388" rx="22" ry="3"/><path d="M995 349q7 15 0 27m9-28q7 16 0 25"/></g>`;
            content+=[0,1,2,3,5].map((index,i)=>`<g class="garden-visitor" data-kind="${index}"><g class="${index===0||index===5?'garden-wing':'world-drift'}"><g transform="scale(${index===2?.19:index===1?.20:.14})">${sprite(index,'','garden-life-v2')}</g></g></g>`).join('');

        }
        const heroIndex={balloon:0,garden:1,aquarium:2,space:3,star:4};
        if(theme==='garden') content+=`<g class="game-hero garden-hero"><ellipse cx="-10" cy="0" rx="35" ry="7" fill="#3b4126" opacity=".22"/>${sprite(4,'class="hero-sprite rabbit-cycle"','rabbit-cycle-v3')}</g>`;
        else if(heroIndex[theme]!==undefined) content+=`<g class="game-hero"><g class="world-drift ${theme==='aquarium'?'swimming-body':''}">${theme==='space'?'<g class="rocket-flame"><path d="M-13 0Q-15 26 0 47 15 26 13 0" fill="#f5aa5c"/><path d="M-6 0Q-8 20 0 28 8 20 6 0" fill="#fff2bd"/></g>':''}${theme==='star'?'<g class="star-celebration">':''}${sprite(heroIndex[theme],'class="hero-sprite"')}${theme==='star'?'</g>':''}</g></g>`;
        if(theme==='rainbow') {
            content+=`<defs>${[['#ffb3ba','#ee777f'],['#ffd09b','#f1a259'],['#fff5a5','#ecd265'],['#c9e6a7','#84bd8d'],['#b2e6f3','#74b8dc'],['#b9c7ed','#939cce'],['#e6c3ee','#bf97d0']].map(([light,color],i)=>`<linearGradient id="pretty-band-${i}" x2="0" y2="1"><stop stop-color="${light}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${light}"/></linearGradient>`).join('')}</defs><g>${Array.from({length:7},(_,i)=>`<path class="game-rainbow" data-band="${i}" d="M${270+i*19} 505 A${350-i*19} ${330-i*20} 0 0 1 ${970-i*19} 505" pathLength="1" fill="none" stroke="url(#pretty-band-${i})" stroke-width="21" stroke-linecap="butt"/>`).join('')}</g><svg x="130" y="400" width="330" height="211" viewBox="93 245 838 535" overflow="visible"><image href="${new URL('../../afbeeldingen%20klok/wolk.png',root).href}" width="1024" height="1024"/></svg>${chest(940,600,1.1)}`;
        }
        if(theme==='aquarium') content+=`${chest(1010,447,.85)}${Array.from({length:3},(_,i)=>`<g class="sea-friend"><g class="swimming-body">${sprite(i,'','life-sprites')}</g></g>`).join('')}`;
        if(theme==='balloon') content+=`<g class="passing-balloon">${sprite(0)}</g>`;
        if(theme==='garden') content+='<g class="watering-drops" fill="none" stroke="#ace7f6" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 14"><path d="M0 0Q12 50 0 132M7 0Q25 60 13 132M-6 0Q-6 60-14 128"/></g>';
        for(let i=0;i<(theme==='rainbow'||theme==='garden'?0:6);i++) {
            let drawing;
            if(theme==='garden') drawing=`<g transform="scale(.5)">${butterfly}</g>`;
            else if(theme==='balloon'||theme==='rainbow') drawing=bird;
            else if(theme==='aquarium') drawing=`<circle r="${10+i*2}" fill="#b9f3f0" fill-opacity=".14" stroke="#bcf2ed" stroke-width="2"/>`;
            else if(theme==='space' && i===1) drawing='<g stroke="#a3b8db" stroke-width="3"><path d="M-48-15h30v30h-30zm66 0h30v30H18z" fill="#638ebc"/><rect x="-12" y="-14" width="24" height="28" rx="5" fill="#e9d9bf"/></g>';
            else drawing=sparkle;
            content+=`<g class="world-discovery" data-index="${i}"><g class="world-drift">${drawing}</g></g>`;
        }
        if(theme==='star') content+='<path class="constellation" d="M310 175 460 120 590 195 790 110 940 180" fill="none" stroke="#d2dbfa" stroke-width="2" stroke-dasharray="5 9"/>';
        content+='<g class="world-finale">'+Array.from({length:12},(_,i)=>`<g transform="translate(${450+(i%6)*65} ${150+Math.floor(i/6)*330}) scale(${.45+(i%3)*.2})">${sparkle}</g>`).join('')+'</g>';
        return wrapScene(content);
    }
    function create(host,compact=false) {
        const doc=host.ownerDocument||document;
        const layer=doc.createElement('div');
        layer.className=compact?'mini-world':'story-world';
        layer.setAttribute('aria-hidden','true'); host.prepend(layer);
        let theme='',builtDuration=0,refs={};
        return { render(nextTheme,progress,running,duration=600) {
            if(!backgrounds[nextTheme]) return '';
            if(theme!==nextTheme || (journeyThemes.includes(nextTheme)&&builtDuration!==duration)) {
                theme=nextTheme; builtDuration=duration; layer.dataset.theme=theme; layer.innerHTML=build(theme,duration);
                const one=selector=>layer.querySelector(selector);
                refs={hero:one('.game-hero'),sprite:one('.hero-sprite'),bloom:one('.garden-bloom'),treasure:one('.game-treasure'),closedChest:one('.closed-chest'),flame:one('.rocket-flame'),drops:one('.watering-drops'),constellation:one('.constellation'),finale:one('.world-finale'),bands:[...layer.querySelectorAll('.game-rainbow')],discoveries:[...layer.querySelectorAll('.world-discovery')]};
                refs.lid=one('.chest-lid'); refs.coins=one('.chest-coins');refs.chestAtlas=one('.chest-atlas');refs.gardenVisitors=[...layer.querySelectorAll('.garden-visitor')];
                refs.chest=one('.hinged-chest');
                refs.landscapes=[...layer.querySelectorAll('.travel-landscape')];
                refs.passingBalloon=one('.passing-balloon');
                refs.seaFriends=[...layer.querySelectorAll('.sea-friend')];
                refs.plots=[...layer.querySelectorAll('.flower-plot')].map(plot=>({seed:plot.querySelector('.plant-seedling'),bud:plot.querySelector('.plant-bud'),flower:plot.querySelector('.plant-flower')}));
                refs.stars=one('.passing-stars'); refs.planets=[...layer.querySelectorAll('.passing-planet')]; refs.destination=one('.space-destination');
                refs.background=one('.world-background');
                refs.camera=one('.journey-camera');refs.traveller=one('.journey-hero');refs.travellerSprite=one('.journey-sprite');refs.travellerFlame=one('.journey-flame');
                refs.turtlePoses=[...layer.querySelectorAll('.turtle-pose')];refs.turtlePose=-1;
                refs.residents=[...layer.querySelectorAll('.world-resident')];refs.depth=[...layer.querySelectorAll('.depth-layer')];refs.bubbles=[...layer.querySelectorAll('.sea-bubbles')];
            }
            if(journeyThemes.includes(theme)) {
                const f=journeyFrame(theme,progress,duration);
                layer.classList.toggle('is-moving',running&&!f.arrived);
                layer.classList.toggle('is-complete',f.complete);
                refs.camera.setAttribute('transform',`translate(${-f.camera} 0)`);
                refs.traveller.setAttribute('transform',`translate(${f.position[0]} ${f.position[1]}) rotate(${f.angle} 0 ${-f.size/2})`);
                for(const [name,value] of Object.entries({x:-f.size/2,y:theme==='aquarium'?-f.size*.72:theme==='balloon'?-f.size*503/512:-f.size,width:f.size,height:f.size})) refs.travellerSprite.setAttribute(name,value);
                if(refs.travellerFlame) {refs.travellerFlame.setAttribute('transform',`translate(0 ${-f.size*.105}) scale(${f.size/235})`);refs.travellerFlame.style.opacity=running&&!f.arrived?'1':'0';}
                const elapsed=progress*duration;
                refs.depth.forEach(group=>group.setAttribute('transform',`translate(${-f.camera*Number(group.dataset.factor)} 0)`));
                if(theme==='aquarium') {
                    const pose=Math.floor(elapsed*5)%4;
                    if(pose!==refs.turtlePose) {
                        refs.turtlePose=pose;
                        refs.travellerSprite.setAttribute('viewBox',`${turtleFrames[pose].x} 60 480 440`);
                        refs.turtlePoses.forEach((image,i)=>{image.style.display=i===pose?'inline':'none';});
                    }
                }
                refs.bubbles.forEach((group,i)=>group.setAttribute('transform',`translate(${Number(group.dataset.home)+Math.sin(elapsed*.3+i)*13} ${620-(elapsed*22+i*71)%720})`));
                refs.residents.forEach((resident,i)=>{
                    const home=Number(resident.dataset.home),baseY=Number(resident.dataset.y);
                    if(theme==='aquarium') {
                        const fish=fishFrame(home,baseY,elapsed,i);
                        const visible=fish.x-f.camera>-150&&fish.x-f.camera<1350;
                        resident.style.display=visible?'':'none';if(!visible)return;
                        resident.setAttribute('transform',`translate(${fish.x} ${fish.y})`);
                        const kind=resident.dataset.kind;
                        resident.querySelector('.fish-heading').setAttribute('transform',kind==='jelly'?`scale(${1+Math.sin(elapsed*3)*.06} ${1-Math.sin(elapsed*3)*.08})`:`scale(${fish.direction} 1) rotate(${fish.angle})`);
                        const image=resident.querySelector('.fish-cycle'),size=kind==='dolphin'?150:kind==='jelly'?100:70+(i%3)*16;
                        for(const [key,value] of Object.entries({x:-size/2,y:-size/2,width:size,height:size,viewBox:kind==='fish'?`${Math.floor(elapsed*9+i)%4*512} 512 512 512`:kind==='jelly'?'512 0 512 512':'1024 0 512 512'})) image.setAttribute(key,value);
                    } else resident.setAttribute('transform',`translate(${home+Math.sin(elapsed*.06+i)*100} ${baseY+Math.sin(elapsed*.15+i)*9})`);
                });
                if(refs.travellerFlame) refs.travellerFlame.setAttribute('transform',`translate(0 ${-f.size*.105}) scale(${f.size/235} ${f.size/235*(.85+Math.sin(elapsed*25)*.14)})`);
                if(refs.lid) refs.lid.setAttribute('transform',`rotate(${-38*ease(f.chestOpen)} -95 -145)`);
                if(refs.coins) refs.coins.style.opacity=reveal(f.chestOpen,.15,.65);
                if(refs.chestAtlas) {const cell=Math.min(3,Math.floor(f.chestOpen*4));refs.chestAtlas.setAttribute('viewBox',`${cell%2*768} ${Math.floor(cell/2)*512} 768 512`);}
                return chapters[theme][f.complete?5:f.arrived?4:progress>.84?3:progress>.12?1:0];
            }
            const f=frame(theme,progress,duration),[x,y]=f.position;
            layer.classList.toggle('is-moving',running&&!f.arrived);
            layer.classList.toggle('is-complete',f.complete);
            // No residual fade or movement is allowed after zero.
            if(refs.hero) refs.hero.setAttribute('transform',`translate(${x} ${y})${theme==='aquarium'?` scale(${f.direction} 1) rotate(${20+f.angle*.45} 0 ${-f.size/2})`:theme==='space'?` rotate(${(1-reveal(f.progress,.78,.92))*48} 0 ${-f.size/2})`:''}`);
            if(refs.sprite) { refs.sprite.setAttribute('x',-f.size/2); refs.sprite.setAttribute('y',-f.size); refs.sprite.setAttribute('width',f.size); refs.sprite.setAttribute('height',f.size); }
            if(refs.bloom) refs.bloom.style.opacity=reveal(f.progress,.55,.9);
            if(refs.treasure) refs.treasure.style.opacity=f.treasure;
            if(refs.closedChest) refs.closedChest.style.opacity=1-f.treasure;
            if(refs.flame) { refs.flame.setAttribute('transform',`translate(0 ${-f.size*.105}) scale(${f.size/235})`); refs.flame.style.opacity=running&&!f.arrived?'1':'0'; }
            if(refs.drops) { refs.drops.setAttribute('transform',`translate(${x+60} ${y-70})`); refs.drops.style.opacity=running&&!f.arrived?'1':'0'; }
            if(refs.constellation) refs.constellation.style.opacity=reveal(f.progress,.4,.85);
            if(refs.lid) refs.lid.setAttribute('transform',`rotate(${-38*ease(f.treasure)} -95 -145)`);
            if(refs.coins) refs.coins.style.opacity=reveal(f.treasure,.15,.65);
            if(refs.chestAtlas) {const cell=Math.min(3,Math.floor(f.treasure*4));refs.chestAtlas.setAttribute('viewBox',`${cell%2*768} ${Math.floor(cell/2)*512} 768 512`);}
            if(refs.chest&&theme==='aquarium') refs.chest.style.opacity=reveal(f.progress,.84,.90);
            refs.bands.forEach((band,i)=>{const amount=rainbowAmount(f.progress,i,duration);band.style.strokeDasharray='1';band.style.strokeDashoffset=String(1-amount);band.style.opacity=amount===0?'0':'1';});
            refs.landscapes.forEach((landscape,i)=>{landscape.style.opacity=reveal(f.progress,[.20,.43,.66][i],[.26,.49,.72][i]);});
            if(theme==='balloon'&&f.progress<.78) [refs.background,...refs.landscapes].forEach((landscape,i)=>{
                const local=clamp((f.progress-i*.22)/.25);
                landscape.setAttribute('width',1260);landscape.setAttribute('height',709);landscape.setAttribute('x',-60*local);landscape.setAttribute('y',-18);
            });
            if(theme==='balloon'&&f.progress>=.78) refs.landscapes.forEach(landscape=>{landscape.setAttribute('width',1200);landscape.setAttribute('height',675);landscape.setAttribute('x',0);landscape.setAttribute('y',0);});
            if(refs.passingBalloon) {
                const travel=f.progress*f.encounterCount;
                const part=travel%1;
                refs.passingBalloon.style.opacity=f.progress>.08&&f.progress<.85?String(Math.min(1,part*8,(1-part)*8)):'0';
                refs.passingBalloon.setAttribute('transform',`translate(${1350-part*1550} ${250+Math.sin(travel)*45}) scale(.25)`);
                refs.passingBalloon.style.filter=`hue-rotate(${Math.floor(travel)%3*65}deg)`;
            }
            refs.seaFriends.forEach((friend,i)=>{
                const t=f.progress*Math.max(1,f.encounterCount/3)-i*.28;
                const part=((t%1)+1)%1;
                friend.style.opacity=f.progress<.9&&t>=0?String(Math.min(1,part*8,(1-part)*8)):'0';
                friend.setAttribute('transform',`translate(${i===1?780+Math.sin(part*6)*110:1200-part*1300} ${i===1?520-part*330:290+i*95+Math.sin(part*6)*65}) scale(${i===2?-.6:-.43} ${i===2?.6:.43})`);
            });
            if(theme==='garden') {
                const garden=gardenFrame(progress,duration),elapsed=progress*duration;
                const cell=progress===0?4:garden.walking?Math.floor(elapsed*7)%4:garden.watering?5:4;
                refs.sprite.setAttribute('viewBox',`${cell%3*512} ${Math.floor(cell/3)*512} 512 512`);
                refs.sprite.setAttribute('y',-f.size*[490,488,488,476,483,483][cell]/512);
                refs.sprite.setAttribute('x',-f.size*.57);
                refs.plots.forEach((plot,i)=>{
                    const grow=garden.growth[i],sprout=reveal(grow,0,.23),bud=reveal(grow,.23,.5),bloom=reveal(grow,.58,1);
                    plot.seed.style.opacity=sprout*(1-bud);plot.bud.style.opacity=bud*(1-bloom);plot.flower.style.opacity=bloom;
                    plot.seed.setAttribute('transform',`translate(0 8) scale(.4 ${.12+.28*sprout})`);
                    plot.bud.setAttribute('transform','translate(0 8) scale(.4)');
                    plot.flower.setAttribute('transform',`translate(0 8) scale(${.28+.12*bloom})`);
                });
                if(refs.drops) {refs.drops.setAttribute('transform',`translate(${x+54} ${y-36})`);refs.drops.style.opacity=running&&garden.watering?'1':'0';}
                refs.gardenVisitors.forEach(visitor=>{
                    const kind=Number(visitor.dataset.kind);let px,py,flip=1;
                    if(kind===1) {px=-100+(elapsed*23)%1400;py=175+Math.sin(elapsed*.25)*24;}
                    else if(kind===2) {px=1070+Math.sin(elapsed*.13)*36;py=382;flip=Math.cos(elapsed*.13)>=0?1:-1;}
                    else {const offset=kind===0?0:kind===3?2:4;px=350+offset*95+Math.sin(elapsed*.20+offset)*95;py=kind===3?370+Math.sin(elapsed*.6)*22:415+Math.sin(elapsed*.35+offset)*35;}
                    visitor.setAttribute('transform',`translate(${px} ${py}) scale(${flip} 1)`);
                });
            }
            if(refs.stars) refs.stars.setAttribute('transform',`translate(${-1200*f.progress} 0)`);
            refs.planets.forEach((planet,i)=>{
                const journey=f.progress/.78*f.encounterCount,visit=Math.floor(journey),t=journey%1;
                planet.style.opacity=f.progress<.78&&visit%4===i?String(Math.min(1,t*7,(1-t)*7)):'0';
                planet.setAttribute('x',1200-1600*t);planet.setAttribute('y',i%2?310:120);
                planet.style.filter=`hue-rotate(${Math.floor(visit/4)*25}deg)`;
            });
            if(refs.destination) refs.destination.style.opacity=reveal(f.progress,.76,.87);
            refs.discoveries.forEach((item,i)=>{
                item.style.opacity=String(f.reveals[i]);
                const travel=clamp((f.progress-(.12+i*.13))/.6);
                const px=theme==='aquarium'?230+i*125:200+i*155;
                const py=theme==='garden'?235+(i%3)*58:theme==='aquarium'?490-travel*260:160+(i%3)*55;
                item.setAttribute('transform',`translate(${px+(theme==='garden'?travel*65:0)} ${py})`);
            });
            refs.finale.style.opacity=f.finale;
            return f.chapter;
        }};
    }
    return {create,frame,journeyPlan,journeyFrame,gardenFrame,rainbowAmount,fishFrame};
})();
if(typeof window!=='undefined') window.TimerWorld=TimerWorld;
if(typeof module!=='undefined') module.exports=TimerWorld;
