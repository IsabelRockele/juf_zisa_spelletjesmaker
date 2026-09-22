# Klastimer – illustraties en eindscènes

Illustraties gemaakt met de ingebouwde imagegen-tool. Geen externe API of CLI gebruikt.

## Definitieve stijlbrief

Een verzorgde, kleurrijke 2D-avonturenspelwereld voor kinderen van 7–9 jaar: duidelijke contouren, zorgvuldig getekende organische vormen, rustige beweging en herkenbare personages. Geen eenvoudige geometrische pictogrammen, fotorealisme of schilderachtige aquarelstijl. Achtergronden zonder ingebakken tekst of bediening. Personages staan los van de achtergrond in een transparant spriteblad.

## Promptset per onderdeel

- `garden-start.png` / `garden-full.png`: dezelfde tuin met serre, stenen pad, bruggetje en beek; aan het begin kleine groene scheuten, aan het einde overal bloemen. Camerastand en geometrie gelijk houden, zodat de bloei geleidelijk verschijnt.
- `valley.png`: ballonreis over een groene vallei met dorp, rivier en een herkenbaar landingsveld rechts. Open lucht voor de vliegende ballon.
- `ocean.png`: helder turquoise koraalrif, onderwaterboog en schatkist op een rots rechts. Open midden voor de schildpad.
- `space.png`: indigo/violette ruimtewereld met planeten langs de randen en een echte landingsplaats op de maan rechts.
- `night.png`: sterrenkijkplek met observatorium, tent en telescoop. Open nachtlucht voor de groeiende ster en sterrenbeelden.
- `rainbow.png`: zeer rustige blauwe lucht, lage groene heuvels en enkele madeliefjes in de hoeken. Geen dorp, bomen, dieren of andere blikvangers. De timer gebruikt de ondergrond van deze illustratie met een eenvoudige blauwe lucht.
- `characters.png`: zes afzonderlijke figuren in een 3 bij 2 raster: Beer in ballon, Konijn met gieter, schildpad, raket met piloot, gouden ster en geopende schatkist. Transparante achtergrond gecontroleerd.
- `chest-closed.png`: dezelfde spelstijl, een volledig gesloten houten schatkist, afzonderlijk op transparante achtergrond.

## Verloop

Alle werelden gebruiken verstreken tijd gedeeld door ingestelde tijd. Ontdekkingen zijn op 90% volledig zichtbaar. Reisfiguren bereiken hun bestemming op 92%. De laatste fase rondt het verhaal af; bij nul worden overgangen en beweging volledig beëindigd.

Bij de regenboog zijn alle kleuren eerst compleet. Daarna opent de schatkist. De achtergrond blijft rustig en er verschijnen geen vogels of vlinders.

## Controle

De eindbeelden zijn visueel bekeken. De automatische controles vergelijken de volledige eindtoestand voor 1, 2, 5, 10, 20, 30, 45 en 180 minuten. Bediening, pauze/hervatten, een minuut toevoegen, afloop en gedeelde toestand van het zwevende venster hebben aanvullende controles.

Het werkelijk boven andere applicaties blijven staan vereist Document Picture-in-Picture in een ondersteunde desktopbrowser. Dat OS-venstergedrag is niet bevestigd in de ingebouwde voorbeeldbrowser. Het timertabblad moet open blijven.

## Verfijning na visuele feedback

- De regenboog gebruikt opnieuw de oorspronkelijke zachte wolk. Zeven gebogen kleurbanen eindigen achter een vaststaande kist; de onrustige ondergrond met donkere strook is vervangen door een rustige lucht en groen gras.
- De schatkist is nu één getekend object met vaste bodem en scharnierend deksel, in plaats van twee verschillende beelden die overvloeien. Het deksel opent na aankomst tussen 92% en 98,5% van de tijd.
- De ster begint op 18 tekeneenheden en groeit naar 350.
- De tuin heeft zes zichtbare plantvakjes met scheut, knop en geopende bloem. Dat verloop is apart van de achtergrond zichtbaar.
- `ocean-clear.png`: met imagegen is uitsluitend de ingetekende kist uit de onderwaterachtergrond verwijderd. De losse kist verschijnt pas op 84–90% van de reis.
- `life-sprites.png`: transparant 3×2 spriteblad met clownvis, kwal, dolfijn, scheut, bloemknop en bloeiende plant, in dezelfde getekende spelstijl.
- `forest.png`, `mountains.png`, `coast.png`: drie nieuwe ballonlocaties, met boomhutten/watervallen, alpenmeer/viaduct en kust/vuurtoren. Samen met het vertrekdorp vormen ze vier landschappen. Langere timers krijgen meer passerende ballonnen en ontmoetingen.
- De schildpad volgt een vloeiende route met meer trajectdelen bij langere timers. De maan blijft tot 76% van de ruimtereis verborgen; passerende planeten en een bewegende sterrenlaag vullen de reis. De vlam en raket zitten in dezelfde bewegende groep.

Alle nieuwe beelden zijn met ingebouwde imagegen gemaakt; hierboven staat de gebruikte promptbrief per beeld. De begin-, tussen- en eindstanden zijn visueel gecontroleerd.


## Doorlopende reis (22 september)
De zee, het ballonlandschap en de ruimte zijn nu lange SVG-werelden met vaste wereldcoördinaten. Geen achtergrondwissels of dieren die met opacity verschijnen. De camera volgt de hoofdfiguur; bewoners bewegen binnen hun eigen omgeving. De routelengte neemt toe met de gekozen tijd. Onder water liggen koraal, wieren, rotsbogen en scheepswrakken langs de route. De maan en de schat liggen fysiek bij het einde. SVG-verloopnamen zijn uniek per instantie, ook bij verborgen themavoorbeelden. De ster draait één keer en licht op bij voltooiing.
De extra gegenereerde kelp- en scheepswrakachtergronden blijven als ontwerpbronnen bewaard; de doorlopende reis gebruikt ze niet als wisselende schermen.
