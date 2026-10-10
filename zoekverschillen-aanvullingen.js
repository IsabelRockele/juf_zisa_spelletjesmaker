/* Alleen de zestien nieuwe prenten. Elke ingreep gebruikt een gecontroleerde
 * uitsnede uit de hertekende prent; alle pixels daarbuiten blijven origineel.
 * Broncoördinaten en omschrijvingen: assets/zoekverschillen-herwerkt/scenes.json. */
(() => {
    'use strict';
    const scenes={
        'drukke-straat': {width:1448,height:1086,changes:[
            ["patch",612.5,66,0,"De schoorsteen op het grote dak is verdwenen.",55,76,null,null],
            ["patch",286,243.5,0,"Het middelste boograam is rechthoekig geworden.",48,95,null,null],
            ["patch",309,502.5,0,"De bus is een dubbeldekker geworden.",516,295,[[51,355],[567,355],[567,575],[515,575],[515,584],[461,587],[379,630],[320,650],[51,650]],null],
            ["patch",721.5,483.5,0,"De bestelwagen is een pick-up geworden.",305,231,[[569,368],[874,368],[874,599],[662,599],[662,577],[569,577]],null],
            ["patch",1176,528,0,"De middelste koplamp van de tram is verdwenen.",36,36,null,null],
            ["patch",988,542.5,0,"De scooter heeft een bezorgbak gekregen.",74,105,null,null],
            ["patch",522.5,692,0,"De auto is een taxi geworden.",397,230,null,null],
            ["patch",1072.5,404,0,"Het verkeerslicht heeft twee lampen in plaats van drie.",87,200,null,null],
            ["patch",348,904,0,"De hond aan de lijn is een poes geworden.",152,132,null,null],
            ["patch",720.5,126,0,"Het ovale gevelraam is rechthoekig geworden.",35,40,null,null]
        ]},
        'bouwwerf': {width:1448,height:1086,changes:[
            ["patch",137,127,0,"De wolk linksboven is verdwenen.",146,88,null,null],
            ["patch",892.5,148,0,"De middelste wolk staat hoger en verder naar rechts.",485,216,null,null],
            ["patch",1192.5,945,0,"De rechter verkeerskegel is een gereedschapskist geworden.",155,180,null,null],
            ["patch",543.5,754.5,0,"De graafbak is een boor geworden.",137,253,null,null],
            ["patch",1055,647.5,0,"De betonmolen is een watertank geworden.",384,213,null,null],
            ["patch",234,994.5,0,"De buizen zijn houten balken geworden.",370,143,null,null],
            ["patch",697,936.5,0,"De middelste verkeerskegel is een houten kist geworden.",142,177,null,null],
            ["patch",516.5,996.5,0,"De onderste verkeerskegel is een emmer geworden.",103,125,null,null],
            ["patch",220.5,512,0,"De deurklink van de kiepwagen is verdwenen.",29,20,null,null],
            ["patch",846.5,443,0,"Het linker raam van het huis heeft een boog gekregen.",109,114,null,null]
        ]},
        'prehistorisch-kamp': {width:1448,height:1086,changes:[
            ["patch",388.5,411,0,"De ingang van de grote tent is gesloten.",177,402,null,null],
            ["patch",768,352,0,"Het grazende hert is een everzwijn geworden.",100,80,null,null],
            ["patch",686,322.5,0,"Het staande hert heeft een kleiner gewei.",112,125,null,null],
            ["patch",1146.5,539,0,"De middelste hangende vis is verdwenen.",51,180,null,null],
            ["patch",1289.5,729,0,"De mand rechts is een pot geworden.",155,142,null,null],
            ["patch",729,825,0,"Het kampvuur is uit.",310,256,null,null],
            ["patch",162.5,932,0,"In de mand liggen paddenstoelen in plaats van bessen.",219,166,null,null],
            ["patch",974.5,1014,0,"Een van de stenen werktuigen op de huid is verdwenen.",83,74,null,null],
            ["patch",1300.5,1017.5,0,"De houten knots is een stenen bijl geworden.",195,99,null,"prehistorisch-kamp-bijl"],
            ["patch",581,1011,0,"Het losse steentje vooraan is verplaatst.",120,104,null,null]
        ]},
        'grotschilderingen': {width:1448,height:1086,changes:[
            ["patch",674,252.5,0,"Het geschilderde paard is een mammoet geworden.",188,205,[[580,150],[768,150],[768,300],[758,320],[730,335],[730,355],[580,355]],"grotschilderingen-mammoet"],
            ["patch",1171.5,208,0,"De geschilderde bizon kijkt de andere kant op.",413,252,[[965,82],[1378,82],[1378,241],[1368,241],[1368,257],[1328,257],[1328,334],[965,334]],null],
            ["patch",652.5,422.5,0,"Het geschilderde hert is verdwenen.",147,167,null,null],
            ["patch",1045.5,420,0,"De middelste handafdruk is een voetafdruk geworden.",105,130,null,null],
            ["patch",1372,288.5,0,"De handafdruk rechtsboven is verdwenen.",80,91,[[1368,243],[1412,243],[1412,334],[1332,334],[1332,257],[1368,257]],null],
            ["patch",342.5,857.5,0,"De linker verfkom is een mand geworden.",175,141,null,null],
            ["patch",645,999.5,0,"Het kleine olielampje is uit.",150,125,null,null],
            ["patch",458.5,931,0,"De voorste verfkom is verdwenen.",155,104,null,null],
            ["patch",1287.5,955,0,"De opgerolde huid is een bundel brandhout geworden.",305,210,null,null],
            ["patch",317,559.5,0,"De vrouw draagt een halsketting met tanden in plaats van kralen.",84,95,null,null]
        ]},
        'romeinse-markt': {width:1448,height:1086,changes:[
            ["patch",270.5,145,0,"Het linker marktdoek heeft een rechte onderrand.",541,200,null,null],
            ["patch",287,401.5,0,"De verkoper houdt een schaal in plaats van een kruik vast.",178,177,null,null],
            ["patch",903,199,0,"Het raam van het achterste huis is verdwenen.",40,56,null,null],
            ["patch",200.5,554,0,"Het kleine schaaltje op de tafel is een kannetje geworden.",145,200,null,null],
            ["patch",660,555.5,0,"De fruitmand onder de middelste kraam is een fruitkist geworden.",122,105,null,null],
            ["patch",1253.5,650,0,"De jongen draagt vissen in plaats van broden.",203,112,null,null],
            ["patch",1050.5,928,0,"De grootste kruik rechtsonder heeft geen oren meer.",145,316,[[978,770],[1123,770],[1123,920],[1090,938],[1090,1086],[978,1086]],null],
            ["patch",1229,966.5,0,"De kleinste kruik rechtsonder heeft twee oren gekregen.",298,239,null,null],
            ["patch",283.5,867,0,"In de voorste fruitmand liggen druiven.",233,110,null,null],
            ["patch",907.5,265,0,"De man in het midden draagt een Romeinse helm.",89,104,null,null]
        ]},
        'egyptische-nijl': {width:1448,height:1086,changes:[
            ["patch",487,269.5,0,"De linker kleine piramide is verdwenen.",180,137,null,null],
            ["patch",652.5,241.5,0,"De rechter kleine piramide is verdwenen.",511,205,null,null],
            ["patch",933,591.5,0,"De middelste ibis is een eend geworden.",166,169,null,null],
            ["patch",1005.5,149.5,0,"De vlag van de zeilboot is verdwenen.",53,57,null,null],
            ["patch",1047,810,0,"De vrouw houdt een ronde pot met twee oren vast.",138,178,null,null],
            ["patch",1108.5,976.5,0,"De fruitmand vooraan is een houten fruitkist geworden.",247,179,null,null],
            ["patch",1276,1022,0,"Het kleine potje is een mandje geworden.",140,112,null,null],
            ["patch",196,250,0,"De tros dadels aan de palmboom is verdwenen.",74,124,null,null],
            ["patch",1391.5,635,0,"De vogel rechts heeft een rechte snavel gekregen.",113,240,null,null],
            ["patch",992.5,302.5,0,"Het zeil is opgerold.",365,365,null,null]
        ]},
        'kasteelleven': {width:1448,height:1086,changes:[
            ["patch",775.5,75,0,"De kasteelvlag is verdwenen.",129,92,null,null],
            ["patch",925.5,481,0,"Het paard is een ezel geworden.",231,286,null,null],
            ["patch",702,672.5,0,"De emmer in de put is een mand geworden.",86,99,null,null],
            ["patch",645.5,920,0,"De linker kip vooraan is een eend geworden.",187,170,null,"kasteelleven-vogels"],
            ["patch",915,817.5,0,"De kip naast de put is een gans geworden.",150,175,null,"kasteelleven-vogels"],
            ["patch",1320,484.5,0,"Het vuur bij de smid is uit.",86,55,null,null],
            ["patch",1122,411.5,0,"De smid houdt een tang in plaats van een hamer vast.",80,115,null,null],
            ["patch",1170,894,0,"Het cakeje op de tafel is een krakeling geworden.",104,88,[[1118,850],[1220,850],[1220,887],[1207,887],[1207,938],[1118,938]],null],
            ["patch",1221,739,0,"De bakker draagt een taart in plaats van een brood.",136,82,null,null],
            ["patch",759,295.5,0,"Het smalle raam van de rechter toren is rond geworden.",58,77,null,null]
        ]},
        'middeleeuwse-markt': {width:1448,height:1086,changes:[
            ["patch",638,41,0,"De vlag op de toren is verdwenen.",42,44,null,null],
            ["patch",633,920,0,"De hond vooraan is een poes geworden.",230,246,null,null],
            ["patch",397,626,0,"De muzikant speelt op een trommel in plaats van een luit.",224,184,null,null],
            ["patch",691.5,592.5,0,"De fontein spuit geen water meer.",241,269,null,null],
            ["patch",130.5,850,0,"De broodmand linksonder is een appelkist geworden.",221,184,null,null],
            ["patch",1338,165.5,0,"Het rechter luik van het grote raam is verdwenen.",72,123,null,null],
            ["patch",1379,715,0,"Het kleine schaaltje op de rechter tafel is verdwenen.",138,140,null,null],
            ["patch",926.5,947,0,"De ton vooraan is een houten kist geworden.",251,244,null,null],
            ["patch",1238.5,894.5,0,"In de mand liggen bollen wol in plaats van rollen stof.",275,209,null,null],
            ["patch",907.5,185.5,0,"De schoorsteen van het achterste huis is rond geworden.",59,75,null,null]
        ]},
        'ontdekkingsreis': {width:1448,height:1086,changes:[
            ["patch",595,67.5,0,"De grote scheepsvlag is rechthoekig geworden.",132,63,null,null],
            ["patch",192.5,119.5,0,"De meeuw linksboven is verdwenen.",177,77,null,null],
            ["patch",1255,105,0,"De meeuw rechtsboven vliegt andersom.",340,90,null,null],
            ["patch",1113.5,427.5,0,"De kapitein houdt een kaart in plaats van een verrekijker vast.",147,153,null,null],
            ["patch",805.5,435.5,0,"De stuurman draagt een hoed in plaats van een hoofddoek.",111,87,null,null],
            ["patch",545,665,0,"De kompasroos op de kaart is verdwenen.",110,104,null,null],
            ["patch",889,760.5,0,"Het anker is verdwenen.",122,241,null,null],
            ["patch",1329,726,0,"De kleine zeilboot is een roeiboot geworden.",198,220,null,null],
            ["patch",151,967.5,0,"De voorste ton is een houten kist geworden.",208,211,null,null],
            ["patch",1280,387,0,"Het middelste raam van de vuurtoren is verdwenen.",36,46,null,null]
        ]},
        'drukkerij': {width:1448,height:1086,changes:[
            ["patch",120,129.5,0,"Een horizontale lat in het raam is verdwenen.",194,33,null,null],
            ["patch",472.5,148,0,"Het bovenste liggende boek op de plank is korter geworden.",105,28,null,null],
            ["patch",489,271.5,0,"Het kleine inktpotje is een kaars geworden.",60,71,null,null],
            ["patch",545.5,479,0,"De klink van de bovenste lade is verdwenen.",47,34,null,null],
            ["patch",218,721.5,0,"Het voorste linkervak van de letterbak is leeg.",178,95,null,null],
            ["patch",647.5,616,0,"De inktrol is een veerpen geworden.",269,152,null,null],
            ["patch",676,327,0,"De man houdt een open boek in plaats van een blad vast.",222,178,null,null],
            ["patch",561,941.5,0,"Het krukje heeft een vierkante zitting.",266,289,null,null],
            ["patch",1253.5,915,0,"Het bovenste boek van de voorste stapel is verdwenen.",327,290,null,null],
            ["patch",832.5,660,0,"Het ronde inktbakje is vierkant geworden.",123,108,null,null]
        ]},
        'stoomtreinstation': {width:1448,height:1086,changes:[
            ["patch",692.5,229,0,"De kleine middelste wolk is verdwenen.",155,86,null,null],
            ["patch",1206,392,0,"De stationsklok wijst zes uur aan.",122,116,null,null],
            ["patch",263.5,316.5,0,"De koplamp van de locomotief is vierkant geworden.",105,129,null,null],
            ["patch",235,758.5,0,"De bovenste koffer op het karretje is een reisknoop geworden.",180,137,null,null],
            ["patch",833,807,0,"De jongen draagt een mand in plaats van een koffer.",80,80,null,null],
            ["patch",978,932,0,"De hoge koffer vooraan is een houten reiskist geworden.",192,164,null,null],
            ["patch",700.5,813.5,0,"De vrouw houdt een opgevouwen paraplu vast.",91,151,null,null],
            ["patch",1390.5,538.5,0,"De deurknop van het station is verdwenen.",33,31,null,null],
            ["patch",398,517,0,"De man draagt een bolhoed in plaats van een hoge hoed.",100,74,null,null],
            ["patch",1060,496.5,0,"Op de hoed van de vrouw staat een strik in plaats van bloemen.",68,51,null,null]
        ]},
        'oude-fabriek': {width:1448,height:1086,changes:[
            ["patch",908.5,255,0,"Het belletje aan de muur is verdwenen.",111,96,null,null],
            ["patch",638,236,0,"De wijzer van de meter wijst de andere kant op.",38,38,null,null],
            ["patch",144,719,0,"De steeksleutel op de tafel is een tang geworden.",144,68,null,null],
            ["patch",224,706.5,0,"De hamer op de tafel is een schroevendraaier geworden.",110,63,null,null],
            ["patch",378,706,0,"Het losse tandwiel is verdwenen.",90,44,null,null],
            ["patch",444.5,888.5,0,"De oliekan onder de tafel is een pot geworden.",81,133,null,null],
            ["patch",302,930,0,"De gereedschapskist onder de tafel is een werkmand geworden.",226,162,null,null],
            ["patch",1329,983,0,"De losse houten kist is een ton geworden.",204,206,null,null],
            ["patch",455.5,768,0,"De knop van de rechter lade is verdwenen.",35,40,null,null],
            ["patch",156,408,0,"De hamer aan de muur is verdwenen.",48,106,null,null]
        ]},
        'sportdag': {width:1536,height:1024,changes:[
            ["patch",370.5,505.5,0,"De voetbal is een basketbal geworden.",75,75,null,null],
            ["patch",59.5,459.5,0,"De kegel helemaal links is verdwenen.",81,101,null,null],
            ["patch",1222.5,709.5,0,"De kegel naast het podium staat verder naar links.",395,145,[[1025,637],[1170,637],[1170,660],[1305,660],[1305,637],[1420,637],[1420,782],[1025,782]],null],
            ["patch",1261.5,922.5,0,"De sporttas is een ballenmand geworden.",247,181,null,null],
            ["patch",922.5,923,0,"De linker drinkfles is verdwenen.",61,120,null,null],
            ["patch",1022,930,0,"De rechter drinkfles is een opgevouwen handdoek geworden.",156,126,null,null],
            ["patch",293,129,0,"Een vlaggetje in de slinger is verdwenen.",48,58,null,null],
            ["patch",463,729.5,0,"Het turntoestel heeft één grote handgreep in plaats van twee.",126,67,null,null],
            ["patch",1226.5,626.5,0,"De medaille is rechthoekig geworden.",37,39,null,null],
            ["patch",685.5,231.5,0,"De bal in de hand van de jongen is een volleybal geworden.",79,77,null,null]
        ]},
        'moderne-stad': {width:1448,height:1086,changes:[
            ["patch",110.5,188,0,"De bloembak op het balkon is verdwenen.",165,140,null,null],
            ["patch",1167,456.5,0,"Het raam van het speelhuisje is vierkant geworden.",70,73,null,null],
            ["patch",173.5,588.5,0,"Het vaasje op de terrastafel is een suikerpotje geworden.",41,53,null,null],
            ["patch",51.5,823.5,0,"In de bloempot staat een cactus.",103,155,null,null],
            ["patch",1334,779.5,0,"De bezorgdoos op de fiets is een mand geworden.",140,143,null,null],
            ["patch",896.5,976.5,0,"De rechter afvalbak is verdwenen.",135,199,null,null],
            ["patch",332.5,867.5,0,"De linker fiets heeft een mandje gekregen.",95,85,null,null],
            ["patch",845.5,124,0,"Het kleine bovenste balkon van het middelste gebouw is verdwenen.",63,50,null,null],
            ["patch",524,650.5,0,"De handtas van de vrouw is rond geworden.",78,65,null,null],
            ["patch",168,320,0,"Het zonnescherm heeft geen strepen meer.",336,112,null,null]
        ]},
        'duurzame-buurt': {width:1448,height:1086,changes:[
            ["patch",354.5,97,0,"De wolk boven het linker huis is verdwenen.",137,80,null,null],
            ["patch",750,189.5,0,"De vogel bij de windmolen vliegt andersom.",78,59,null,null],
            ["patch",1051,77.5,0,"De vogel rechtsboven is verdwenen.",88,77,null,null],
            ["patch",1343.5,582.5,0,"De regenton is een rechthoekige watertank geworden.",181,225,null,null],
            ["patch",1148,558,0,"De middelste afvalbak is verdwenen.",96,124,null,null],
            ["patch",512.5,1011.5,0,"De gieter is een emmer geworden.",179,123,null,null],
            ["patch",74.5,727,0,"De zonnebloem is een boompje geworden.",149,246,null,null],
            ["patch",270,869.5,0,"Het meisje gebruikt een harkje in plaats van een schepje.",88,93,null,null],
            ["patch",332.5,218.5,0,"Het zonnepaneel op het linker dak is een dakraam geworden.",247,127,null,null],
            ["patch",256.5,532.5,0,"De laadkabel tussen de bus en de laadpaal is verdwenen.",103,87,null,null]
        ]},
        'sporthal': {width:1536,height:1024,changes:[
            ["patch",420,122,0,"De volleybal is een basketbal geworden.",72,72,null,null],
            ["patch",366.5,668,0,"Het netje van de tafeltennistafel is verdwenen.",159,122,null,null],
            ["patch",1140,210.5,0,"De shuttle is verdwenen.",54,59,null,null],
            ["patch",1448.5,661,0,"De ballenmand is een sporttas geworden.",157,196,null,null],
            ["patch",193,857,0,"De linker drinkfles op de bank is verdwenen.",62,110,null,null],
            ["patch",294,870.5,0,"De middelste drinkfles is een thermos geworden.",50,97,null,null],
            ["patch",394.5,930.5,0,"De handdoek is opgerold.",125,99,null,null],
            ["patch",1069.5,586,0,"Het hockeydoel heeft geen net meer.",305,216,null,null],
            ["patch",1072,869.5,0,"De hockeybal is een puck geworden.",46,45,null,null],
            ["patch",1422.5,169,0,"De trainer draagt een pet.",101,106,null,null]
        ]}
    };
    const baseUrl=new URL('assets/zoekverschillen-herwerkt/',document.currentScript.src);
    const images=new Map(), pending=new Map();
    function prepare(name) {
        return Promise.all([...new Set([name,...scenes[name].changes.map(c=>c[8]).filter(Boolean)])].map(load));
    }
    function load(name) {
        if(!pending.has(name)) pending.set(name,new Promise((resolve,reject)=>{
            const img=new Image();
            img.onload=()=>{images.set(name,img);resolve();};
            img.onerror=()=>{pending.delete(name);reject(new Error('Kleurplaat kon niet worden geladen.'));};
            img.src=new URL(name+'.png?v=20261010d',baseUrl).href;
        }));
        return pending.get(name);
    }
    function draw(ctx,name,count) {
        const scene=scenes[name];
        if(!scene) return;
        ctx.save();
        ctx.scale(ctx.canvas.width/scene.width,ctx.canvas.height/scene.height);
        for(const [type,x,y,,description,w,h,mask,source] of scene.changes.slice(0,count)) {
            const img=images.get(source||name);
            if(!img) throw new Error('Laad eerst de herwerkte prent.');
            ctx.save();ctx.beginPath();
            if(mask) {mask.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();}
            else ctx.rect(x-w/2,y-h/2,w,h);
            ctx.clip();
            ctx.drawImage(img,0,0,scene.width,scene.height);
            ctx.restore();
        }
        ctx.restore();
    }
    function points(name) {
        const scene=scenes[name];
        return scene.changes.map(([,x,y,,,w,h])=>[x/scene.width,y/scene.height,(Math.hypot(w,h)/2+6)/scene.width]);
    }
    window.ZoekVerschillenAanvullingen={scenes,prepare,draw,points};
})();
