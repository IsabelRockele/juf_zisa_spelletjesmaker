document.addEventListener("DOMContentLoaded", function() {
  const blokjesBtn = document.getElementById('blokjes');
  const schijfjesBtn = document.getElementById('schijfjes');

  const kubus = document.getElementById('kubus');
  const staaf = document.getElementById('staaf');
  const schijfGeel = document.getElementById('schijf-geel');
  const schijfGroen = document.getElementById('schijf-groen');

  // Function to show blocks (kubus and staaf) and hide schijfjes
  function toonBlokjes() {
    kubus.style.display = 'inline-block';
    staaf.style.display = 'inline-block';
    schijfGeel.style.display = 'none';
    schijfGroen.style.display = 'none';
  }

  // Function to show schijfjes (geel and groen) and hide blocks
  function toonSchijfjes() {
    kubus.style.display = 'none';
    staaf.style.display = 'none';
    schijfGeel.style.display = 'inline-block';
    schijfGroen.style.display = 'inline-block';
  }

  // Initially hide all tools
  kubus.style.display = 'none';
  staaf.style.display = 'none';
  schijfGeel.style.display = 'none';
  schijfGroen.style.display = 'none';

  // Add event listeners for button clicks
  blokjesBtn.addEventListener('click', function() {
    toonBlokjes();
  });
  schijfjesBtn.addEventListener('click', function() {
    toonSchijfjes();
  });

  // Reset button listener
  document.getElementById('reset').addEventListener('click', () => {
    // Reset the display of tools and re-enable buttons
    kubus.style.display = 'none';
    staaf.style.display = 'none';
    schijfGeel.style.display = 'none';
    schijfGroen.style.display = 'none';

    // Remove all tools from the circles
    document.querySelectorAll('.cirkel').forEach(cirkel => {
      cirkel.innerHTML = ''; // Remove any tool inside the circle
    });

    // Enable the buttons
    blokjesBtn.disabled = false;
    schijfjesBtn.disabled = false;

    console.log("Knoppen en tools opnieuw ingesteld!");
  });

  // NEW: Listener for 'terug' button
  document.getElementById('terug').addEventListener('click', () => {
    console.log("Knop 'Ander schema' geklikt");
    window.location.href = "index.html";
  });

  // Other existing code for drag and drop, wisselknop, etc.
  // (Zet hier gerust je volledige originele code zoals je me eerder stuurde)

  // Dragstart offset helper
  let dragOffset = { x: 0, y: 0 };

  function maakSleepbaar(element) {
    element.addEventListener('dragstart', function(e) {
      const rect = element.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      e.dataTransfer.setData('text/plain', element.id);
      e.dataTransfer.effectAllowed = 'move';
    });
  }

  // Initialize draggable tools
  document.querySelectorAll('.tool').forEach(tool => {
    maakSleepbaar(tool);
  });

  // Dragover and drop listeners for zones
  document.querySelectorAll('.vak, .doel-vak, .wissel-vak, .cirkel').forEach(zone => {
    zone.style.position = 'relative';

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const origineel = document.getElementById(id);
      if (!origineel) return;

      let toolElement;
      const isInSchema = !origineel.closest('#toolbar');

      if (isInSchema) {
        toolElement = origineel;
      } else {
        toolElement = origineel.cloneNode(true);
        toolElement.id = id + '-clone-' + Date.now();
        toolElement.classList.add('tool');
        toolElement.setAttribute('draggable', 'true');
        maakSleepbaar(toolElement);
      }

      toolElement.style.position = 'absolute';
      toolElement.style.visibility = 'hidden';
      toolElement.style.left = '0px';
      toolElement.style.top = '0px';
      zone.appendChild(toolElement);

      // Disable the corresponding button for the selected tool
      if (toolElement.classList.contains('geel-blok') || toolElement.classList.contains('staaf-groen')) {
        if (toolElement.classList.contains('geel-blok') || toolElement.classList.contains('staaf-groen')) {
          if (blokjesBtn) blokjesBtn.disabled = true;
        }
      }
      if (toolElement.classList.contains('schijf') && (toolElement.classList.contains('geel') || toolElement.classList.contains('groen'))) {
        if (schijfjesBtn) schijfjesBtn.disabled = true;
      }

      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const cirkel = dropTarget && dropTarget.classList.contains('cirkel') ? dropTarget : dropTarget.closest('.cirkel');

      if (cirkel) {
        cirkel.innerHTML = '';
        cirkel.appendChild(toolElement);
        toolElement.style.position = 'absolute';
        toolElement.style.top = '50%';
        toolElement.style.left = '50%';
        toolElement.style.transform = 'translate(-50%, -50%)';
        toolElement.style.visibility = 'visible';

        setTimeout(controleerCirkels, 0);
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = zone.getBoundingClientRect();
          const offsetX = e.clientX - rect.left - dragOffset.x;
          const offsetY = e.clientY - rect.top - dragOffset.y;
          toolElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          toolElement.style.visibility = 'visible';
        });
      });

      if (zone.classList.contains('wissel-vak')) {
        voegWisselKnopToe(zone, toolElement);
      }
    });
  });

  function voegWisselKnopToe(zone, toolElement) {
    if (zone.querySelector('.wissel-knop')) return;

    const knop = document.createElement('button');
    knop.classList.add('wissel-knop');
    knop.textContent = 'Wissel om';
    knop.style.position = 'absolute';
    knop.style.bottom = '10px';
    knop.style.left = '50%';
    knop.style.transform = 'translateX(-50%)';
    knop.style.zIndex = '1000';
    zone.appendChild(knop);

    knop.addEventListener('click', function() {
      if (!toolElement) return;

      knop.remove();

      if (toolElement.classList.contains('staaf-groen')) {
        wisselTool(toolElement, 'staaf');
      } else if (toolElement.classList.contains('schijf') && toolElement.classList.contains('groen')) {
        wisselTool(toolElement, 'schijf');
      }
    });
  }

  function wisselTool(origineel, toolType) {
    if (toolType === 'staaf') {
      const cirkels = document.querySelectorAll('#schema-min .cirkel');
      let count = 0;
      for (let cirkel of cirkels) {
        if (count >= 10) break;
        const geleKubus = document.createElement('div');
        geleKubus.classList.add('tool', 'geel-blok');
        geleKubus.setAttribute('draggable', 'true');
        geleKubus.id = 'kubus-' + Date.now() + '-' + count;
        maakSleepbaar(geleKubus);
        geleKubus.style.position = 'absolute';
        geleKubus.style.top = '50%';
        geleKubus.style.left = '50%';
        geleKubus.style.transform = 'translate(-50%, -50%)';
        cirkel.innerHTML = '';
        cirkel.appendChild(geleKubus);
        count++;
      }
    } else if (toolType === 'schijf') {
      const cirkels = document.querySelectorAll('#schema-min .cirkel');
      let count = 0;
      for (let cirkel of cirkels) {
        if (count >= 10) break;
        const geleSchijf = document.createElement('div');
        geleSchijf.classList.add('tool', 'schijf', 'geel');
        geleSchijf.textContent = '1';
        geleSchijf.setAttribute('draggable', 'true');
        geleSchijf.id = 'gele-schijf-' + Date.now() + '-' + count;
        maakSleepbaar(geleSchijf);
        geleSchijf.style.position = 'absolute';
        geleSchijf.style.top = '50%';
        geleSchijf.style.left = '50%';
        geleSchijf.style.transform = 'translate(-50%, -50%)';
        cirkel.innerHTML = '';
        cirkel.appendChild(geleSchijf);
        count++;
      }
    }

    origineel.remove();
  }

  // Reset functionality
  document.getElementById('reset').addEventListener('click', () => {
    // Verwijder alle tools
    document.querySelectorAll('body > .tool').forEach(el => el.remove());
    document.querySelectorAll('.cirkel .tool').forEach(el => el.remove());
    document.querySelectorAll('#schema .tool').forEach(el => el.remove());
    document.querySelectorAll('#schema .cirkel').forEach(c => c.innerHTML = '');
    const lightVak = document.querySelector('.light-t');
    if (lightVak) lightVak.innerHTML = '';
    document.querySelectorAll('#schema-min .tool').forEach(el => el.remove());
    document.querySelectorAll('#schema-min .cirkel').forEach(c => c.innerHTML = '');
    const wisselvak = document.querySelector('#schema-min .wissel-vak');
    if (wisselvak) while (wisselvak.firstChild) wisselvak.removeChild(wisselvak.firstChild);
    // Verberg alle toolweergave
    document.getElementById('kubus').style.display = 'none';
    const staafEl = document.getElementById('staaf');
if (staafEl) staafEl.style.display = 'none';
    document.getElementById('schijf-geel').style.display = 'none';
    document.getElementById('schijf-groen').style.display = 'none';
    // Zet knoppen opnieuw actief
    enableKnoppen();
});
});
