import {BookOpen} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';

export default function Help(){
  return <Dialog>
    <DialogTrigger asChild><button className="button help-trigger"><BookOpen size={19}/> Uitleg</button></DialogTrigger>
    <DialogContent className="drawing-help" aria-describedby="drawing-help-description">
      <DialogHeader className="drawing-help-heading">
        <DialogTitle>Van kleurplaat naar een bewegend figuurtje</DialogTitle>
        <DialogDescription id="drawing-help-description">De volledige uitleg voor de leerkracht. Een gsm werkt ook: je hoeft geen app te installeren.</DialogDescription>
      </DialogHeader>
      <div className="drawing-help-body" tabIndex={0} role="region" aria-label="Stappenplan tekenwereld">
        <p className="help-summary"><b>Zo werkt het:</b> tekenblad afdrukken → inkleuren → klas-QR scannen → foto maken → figuurtje uitsnijden → versturen → bekijken op het smartboard.</p>

        <section className="help-qr-note" aria-labelledby="help-qr-title">
          <h2 id="help-qr-title">Let op: er zijn twee verschillende QR-codes</h2>
          <p><b>De klas-QR scan je met de camera van je gsm of tablet.</b> Deze opent de website waarop je een tekening kunt insturen. De leerkracht maakt deze QR via ‘iPads verbinden’.</p>
          <p><b>De QR op het kleurblad hoef je niet apart te scannen.</b> Die bevat alleen een herkenningscode voor de tekenwereld, geen weblink. De tool leest deze code zelf uit de foto van het blad.</p>
          <p>Zegt je gsm bij de QR op het kleurblad dat er geen geschikte app is? Je hebt de verkeerde QR gescand. Installeer niets: scan de <b>klas-QR</b>.</p>
        </section>

        <section><h2>Wat heb je nodig?</h2><ul>
          <li>Een computer met internet, eventueel verbonden met het smartboard.</li>
          <li>Je bestaande account voor de gratis collega-versie van Zisa.</li>
          <li>Een printer, wit papier en kleurmateriaal.</li>
          <li>Een gsm of tablet met camera en internet. Kinderen hebben geen eigen account nodig.</li>
        </ul><p>Je kunt ook zelf een foto op je computer kiezen. Die werkwijze staat verderop.</p></section>

        <ol className="help-steps">
          <li><h2>Kies een leefwereld en druk de bladen af</h2>
            <p>Open de tekenwereld op je computer en kies bovenaan <b>Aquarium, Bloementuin, Ruimtewereld of Fantasiebos</b>. Klik op <b>‘Bibliotheek’</b>.</p>
            <p>Kies een kleurplaat, een ontwerpblad of een vrij tekenblad. Klik bij één blad op <b>‘Print’</b>. Je kunt ook meerdere bladen aanvinken en <b>‘Print selectie’</b> kiezen, of alle bladen van de gekozen wereld afdrukken via <b>‘Print deze wereld’</b>.</p>
            <p>Druk af op wit A4-papier. Een blad uit het aquarium hoort straks in de klaswereld Aquarium.</p>
          </li>
          <li><h2>Laat de kinderen kleuren of tekenen</h2>
            <p>Kleur het figuurtje in of versier het ontwerpblad. Laat het papier <b>rondom het figuurtje wit</b>. Bij vrij tekenen: teken één groot wezen met een duidelijke, zo veel mogelijk gesloten omtrek.</p>
            <p>Laat de QR op het blad vrij. Die helpt de tool later om het juiste tekenblad te herkennen. Een witte plek binnen een goed gesloten omtrek kan behouden blijven; wit buiten het figuurtje wordt weggehaald.</p>
          </li>
          <li><h2>Zet de klaswereld klaar op het smartboard</h2>
            <p>Klik op je computer op <b>‘Klasomgeving’</b> en kies dezelfde leefwereld als op het tekenblad. Dit is de plek waar de echte kindertekeningen verschijnen.</p>
            <p>Klik op <b>‘iPads verbinden’</b> en daarna op <b>‘Maak de klas-QR’</b>. Ondanks de knopnaam werkt dit ook met een <b>gsm of een andere tablet</b>.</p>
            <p>Toon de QR op het scherm of kies <b>‘Klas-QR afdrukken’</b> en leg de afdruk bij de toestellen. Dezelfde QR kan door meerdere kinderen worden gebruikt. Hij is 12 uur geldig.</p>
            <p>Laat de klaswereld op je computer open. Met <b>‘Toon de leefwereld op volledig scherm’</b> maak je ruimte voor de tekeningen.</p>
          </li>
          <li><h2>Scan de klas-QR met de gsm of tablet</h2>
            <p>Open de gewone camera van het toestel. Richt die op de <b>klas-QR van stap 3</b>, niet op de QR op het kleurblad. Tik op de link die de camera toont.</p>
            <p>De pagina <b>‘Stuur je wezen naar de klas’</b> opent in de browser. Controleer of daar de juiste leefwereld staat. Er is geen app of ChatGPT-account nodig en kinderen hoeven niet in te loggen.</p>
            <p>Scannen lukt niet? Via <b>‘Kopieer iPad-link’</b> kan de leerkracht de link openen op het andere toestel. Op de leerlingpagina kun je ook de klascode invullen.</p>
          </li>
          <li><h2>Maak een foto van het ingekleurde blad</h2>
            <p>Tik op de leerlingpagina op <b>‘Maak een foto’</b>. Geef toestemming voor de camera als je toestel daarom vraagt. Je kunt ook <b>‘Kies een foto’</b> gebruiken voor een foto die al op het toestel staat.</p>
            <p>Leg het blad plat, zorg voor goed licht en fotografeer recht van boven. Vermijd schaduwen van handen of het toestel. Neem eerst het hele blad in beeld, inclusief de kleine blad-QR.</p>
            <p>De tool probeert het blad uit die foto te herkennen. Controleer daarna bij <b>‘Mijn tekenblad’</b> of het juiste figuurtje gekozen is. Je kunt dit altijd zelf aanpassen.</p>
          </li>
          <li><h2>Snijd alleen het figuurtje uit</h2>
            <p>Trek met je vinger of muis een kader rond het getekende wezen op de foto. Laat een kleine witte marge rondom, maar houd de naam, bladtekst, QR-code en tafel buiten het kader.</p>
            <p>Zorg dat staarten, vleugels en voelsprieten binnen het kader blijven. Staat de foto gedraaid? Gebruik <b>‘Foto draaien’</b>. Met <b>‘Hele foto’</b> maak je het kader weer groot en kun je opnieuw beginnen.</p>
          </li>
          <li><h2>Geef je wezen een naam en bekijk het voorbeeld</h2>
            <p>Vul <b>‘Naam van het wezen’</b> in, bijvoorbeeld Blub. Controleer het tekenblad, de beweging en waar het wezen hoort: in het water, in de lucht of op de grond. Bij een vrije tekening kies je de beweging zelf.</p>
            <p>Klik op <b>‘Maak mijn bewegende voorbeeld’</b>. De tool verwijdert het witte papier rondom en toont het bewegende figuurtje.</p>
            <p>Blijft er veel papier zichtbaar, of verdwijnen stukjes van de tekening? Pas de instelling voor papierverwijdering aan en maak het voorbeeld opnieuw. Controleer ook het kader. Zo nodig maak je een nieuwe foto met beter licht. De grootte en kijkrichting kun je bij het voorbeeld aanpassen.</p>
          </li>
          <li><h2>Stuur het figuurtje naar de klaswereld</h2>
            <p>Is het voorbeeld goed? Tik op de gsm of tablet op <b>‘Stuur naar onze wereld’</b>. Wacht tot de bevestiging verschijnt.</p>
            <p>Op de computer of het smartboard verschijnt het figuurtje normaal binnen enkele seconden in de gekozen <b>klasomgeving</b>. Laat die pagina open en verbonden met internet.</p>
            <p>Het volgende kind kan dezelfde klas-QR scannen. Op het toestel kun je ook <b>‘Nog een tekening toevoegen’</b> kiezen.</p>
          </li>
          <li><h2>Rond de activiteit af</h2>
            <p>Verlaat volledig scherm met <b>‘Volledig scherm sluiten’</b> of <b>Esc</b>. Open <b>‘iPads verbinden’</b> en kies <b>‘Insturen sluiten’</b> als er geen nieuwe tekeningen meer mogen binnenkomen.</p>
            <p>Een nieuwe klas-QR maken maakt de vorige QR ongeldig. Voor een andere leefwereld kies je die wereld en maak je daar een nieuwe QR voor.</p>
            <p>Opgeslagen kindertekeningen blijven bij je collega-account bewaard. Met het prullenbakje bij een bewoner kun je die verwijderen. Via <b>‘Terug naar de tools’</b> verlaat je de tekenwereld.</p>
          </li>
        </ol>

        <section><h2>Eerst zelf proberen, zonder gsm of tablet</h2>
          <p>Open de <b>klasomgeving</b> op je computer en kies een leefwereld. Klik bovenaan op <b>‘Tekening toevoegen’</b> en daarna op <b>‘Kies een foto’</b>. Kies een foto van een ingekleurd blad die op je computer staat.</p>
          <p>Volg stappen 6 en 7 hierboven. De laatste knop heet op de computer <b>‘Laat mijn wezen los!’</b>. Je hebt voor deze werkwijze geen klas-QR nodig.</p>
        </section>
        <section><h2>Wat doet de testomgeving?</h2>
          <p>Met <b>‘Testomgeving’</b> probeer je de ingebouwde voorbeeldfiguren uit, zonder zelf een foto te maken. Kies een leefwereld en een figuur. Met <b>‘Bekijk in de testwereld’</b> zie je het bewegen op volledig scherm.</p>
          <p>Om een ander figuur te testen, klik je op <b>‘Volledig scherm sluiten’</b> of druk je op <b>Esc</b>. Kies <b>‘Ander figuurtje uitproberen’</b> of de tab <b>‘Testomgeving’</b>. Via de vier wereldknoppen bovenaan kun je ook een andere leefwereld kiezen.</p>
          <p>Testfiguren zijn tijdelijk. Echte ingezonden tekeningen staan apart onder <b>‘Klasomgeving’</b>. Klik op die tab om weer naar het werk van de kinderen te gaan.</p>
        </section>
        <section><h2>Als iets niet lukt</h2><ul>
          <li><b>‘Geen geschikte app’ bij het scannen:</b> scan de klas-QR uit ‘iPads verbinden’, niet de code op het kleurblad.</li>
          <li><b>De klasverbinding is gesloten of verlopen:</b> maak op de computer een nieuwe klas-QR en scan die opnieuw. Een oude afdruk werkt dan niet meer.</li>
          <li><b>De tekening verschijnt niet:</b> wacht op de verzendbevestiging en controleer op de computer ‘Klasomgeving’, de gekozen leefwereld en de internetverbinding.</li>
          <li><b>Het blad wordt niet herkend:</b> kies het juiste blad zelf bij ‘Mijn tekenblad’. Je hoeft de QR niet opnieuw apart te scannen.</li>
          <li><b>De camera opent niet:</b> controleer de cameratoestemming van je browser of maak eerst een gewone foto en gebruik ‘Kies een foto’.</li>
          <li><b>Een oud figuurtje blijft zichtbaar:</b> tekeningen verdwijnen niet bij het sluiten van de klas-QR. Verwijder een opgeslagen bewoner met het prullenbakje.</li>
        </ul></section>
      </div>
      <div className="drawing-help-footer"><DialogClose asChild><button className="button primary">Uitleg sluiten — terug naar de tekenwereld</button></DialogClose></div>
    </DialogContent>
  </Dialog>;
}
