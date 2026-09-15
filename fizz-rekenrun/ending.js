import {chooseOtherGame} from './navigation.mjs';
// A self-contained finale; scores always come from the completed run.
export function showEnding({player, worlds, replay, menu, sound}) {
  if (!document.querySelector('#endingStyle')) {
    const link = document.createElement('link');
    link.id = 'endingStyle'; link.rel = 'stylesheet';
    link.href = new URL('./ending.css', import.meta.url).href;
    document.head.append(link);
  }
  const screen = document.createElement('section');
  screen.className = 'fizzEnding';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-labelledby', 'endingTitle');
  screen.innerHTML = `<div class="endingStars" aria-hidden="true"></div>
    <div class="endingCard"><p class="endingKicker">VIJF WERELDEN · ÉÉN REKENHELD</p>
    <h2 id="endingTitle">Hoera! Jij hielp Fizz naar de schat!</h2>
    <p>Van de Watervalvallei tot het Sterrenkasteel. Wat een avontuur!</p>
    <div class="endingScene" aria-hidden="true"><div class="endingFox"></div><div class="endingTreasure">🎁</div></div>
    <ol class="endingWorlds"></ol>
    <button class="playButton endingOpen">OPEN JE SCHAT ✨</button>
    <div class="endingReward" hidden aria-live="polite"><h3>🏅 Jij bent een rekenavonturier!</h3>
      <p>Deze medaille is voor jouw doorzettingsvermogen. Fizz is trots op jou!</p>
      <div class="endingStats"></div>
      <p class="endingAccuracy"></p>
      <button class="playButton endingReplay">NOG EEN AVONTUUR ↻</button>
    </div>
    <button class="secondary endingMenu">Terug naar start</button><button class="secondary endingOther">🏠 Ander spel kiezen</button></div>`;
  worlds.forEach(name => {
    const item = document.createElement('li'); item.textContent = '✓ ' + name;
    screen.querySelector('.endingWorlds').append(item);
  });
  for (const [value, label] of [[player.score, 'punten'], [player.coins, 'munten'], [player.solved, 'sommen geoefend']]) {
    const stat = document.createElement('div');
    const number = document.createElement('strong'); number.textContent = value.toLocaleString('nl-BE');
    const caption = document.createElement('span'); caption.textContent = label;
    stat.append(number, caption); screen.querySelector('.endingStats').append(stat);
  }
  screen.querySelector('.endingAccuracy').textContent = `${player.firstTry} van de ${player.solved} sommen meteen juist. Blijven proberen telt ook!`;
  const gameUI = document.querySelector('#gameUI');
  gameUI.inert = true;
  const close = action => { screen.remove(); gameUI.inert = false; action(); };
  screen.querySelector('.endingReplay').onclick = () => close(replay);
  screen.querySelector('.endingMenu').onclick = () => close(menu);
  screen.querySelector('.endingOther').onclick = chooseOtherGame;
  screen.querySelector('.endingOpen').onclick = event => {
    event.currentTarget.hidden = true;
    screen.classList.add('revealed');
    screen.querySelector('.endingTreasure').textContent = '🏆';
    screen.querySelector('.endingReward').hidden = false;
    sound(1046, .35);
    screen.querySelector('.endingReplay').focus({preventScroll:true});
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('i');
      piece.className = 'endingConfetti';
      piece.style.cssText = `--x:${i*2.4}%;--delay:${(i%7)*.13}s;--color:${['#ffe18b','#75edcc','#ff96ae','#aaadff'][i%4]};--turn:${i%2?360:-360}deg`;
      piece.addEventListener('animationend', () => piece.remove(), {once:true});
      screen.append(piece);
    }
  };
  screen.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...screen.querySelectorAll('button')].filter(b => !b.hidden && !b.closest('[hidden]'));
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.body.append(screen);
  screen.querySelector('.endingOpen').focus();
  sound(784, .3);
}
