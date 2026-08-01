(() => {
  'use strict';
  const speak = text => {
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'nl-BE';
    voice.rate = .84;
    speechSynthesis.speak(voice);
  };
  document.querySelectorAll('[data-speak]').forEach(button => button.addEventListener('click',() => speak(button.dataset.speak)));
  const checkOrientation = () => {
    const message = document.getElementById('draai-melding');
    if(message) message.style.visibility = innerHeight > innerWidth ? 'visible' : 'hidden';
  };
  addEventListener('load',checkOrientation);
  addEventListener('resize',checkOrientation);
  addEventListener('orientationchange',checkOrientation);
})();
