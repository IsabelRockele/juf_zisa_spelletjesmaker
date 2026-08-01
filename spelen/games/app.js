
// Combined app.js and app_werkende_plustot100.js functionalities

// Function to disable buttons except the specified one
function disableKnoppen(except) {
  const blokjesBtn = document.getElementById('blokjes');
  const schijfjesBtn = document.getElementById('schijfjes');
  if (except === 'blokjes') {
    schijfjesBtn.disabled = true;
  } else if (except === 'schijfjes') {
    blokjesBtn.disabled = true;
  }
}

// Function to enable buttons
function enableKnoppen() {
  document.getElementById('blokjes').disabled = false;
  document.getElementById('schijfjes').disabled = false;
}

// Common drag and drop functionality for tools
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

// Handle the dropping logic of tools (for both +100 and -100)
document.querySelectorAll('.vak, .doel-vak, .wissel-vak, .cirkel').forEach(zone => {
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const origineel = document.getElementById(id);
    if (!origineel) return;

    // Handle +100 specific logic
    if (origineel.classList.contains('staaf-groen')) {
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const cirkel = dropTarget && dropTarget.classList.contains('cirkel') ? dropTarget : dropTarget.closest('.cirkel');
      if (cirkel) return;
    }

    // Handle -100 specific logic
    if (origineel.classList.contains('geel-blok') || origineel.classList.contains('staaf-groen')) {
      disableKnoppen('blokjes');
    }
    if (origineel.classList.contains('schijf') && (origineel.classList.contains('geel') || origineel.classList.contains('groen'))) {
      disableKnoppen('schijfjes');
    }

    // Dropped item logic for both systems
    let toolElement = origineel.cloneNode(true);
    toolElement.id = id + '-clone-' + Date.now();
    toolElement.classList.add('tool');
    toolElement.setAttribute('draggable', 'true');
    maakSleepbaar(toolElement);

    toolElement.style.position = 'absolute';
    zone.appendChild(toolElement);
    toolElement.style.visibility = 'hidden';
    toolElement.style.left = '0px';
    toolElement.style.top = '0px';
  });
});

// Knoppen functionaliteit for switching between +100 and -100
document.getElementById('plus100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'block';
  document.getElementById('schema-min').style.display = 'none';
});

document.getElementById('min100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'none';
  document.getElementById('schema-min').style.display = 'block';
});

// Reset the state of all tools and enable buttons
document.getElementById('reset').addEventListener('click', () => {
  document.querySelectorAll('body > .tool').forEach(el => el.remove());
  enableKnoppen();
});

// Additional event listeners and logic for the +100 and -100 functionality
document.querySelectorAll('.wissel-vak').forEach(zone => {
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const origineel = document.getElementById(id);
    if (!origineel) return;

    // Handle swapping logic for both +100 and -100
    let item = origineel.cloneNode(true);
    item.id = id + '-clone-' + Date.now();
    item.classList.add('tool');
    item.setAttribute('draggable', 'true');
    maakSleepbaar(item);

    item.style.position = 'absolute';
    zone.appendChild(item);

    // Add swap button
    const knop = document.createElement('button');
    knop.textContent = 'Wissel om';
    knop.classList.add('wissel-knop');
    knop.style.position = 'absolute';
    knop.style.bottom = '5px';
    knop.style.left = '50%';
    knop.style.transform = 'translateX(-50%)';
    zone.appendChild(knop);

    knop.addEventListener('click', () => {
      // Handle conversion of tools from +100 and -100
      if (item.classList.contains('staaf-groen')) {
        // Swap staaf-groen to kubusjes
        // (use the existing logic)
      } else if (item.classList.contains('groen-schijf')) {
        // Swap groen-schijf to schijfjes
        // (use the existing logic)
      }
      zone.innerHTML = ''; // Clear the zone after swapping
    });
  });
});

// Further event listeners for each specific functionality...

function disableKnoppen(except) {
  const blokjesBtn = document.getElementById('blokjes');
  const schijfjesBtn = document.getElementById('schijfjes');
  if (except === 'blokjes') {
    schijfjesBtn.disabled = true;
  } else if (except === 'schijfjes') {
    blokjesBtn.disabled = true;
  }
}

function enableKnoppen() {
  document.getElementById('blokjes').disabled = false;
  document.getElementById('schijfjes').disabled = false;
}


function maakSleepbaar(element) {
  element.addEventListener('dragstart', function(e) {
    const rect = element.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.dataTransfer.setData('text/plain', element.id);
    e.dataTransfer.effectAllowed = 'move';

    if ((element.classList.contains('schijf') || element.classList.contains('geel-blok'))) {
      const rect = element.getBoundingClientRect();
      const cirkel = element.closest('.cirkel');
      if (cirkel && cirkel.contains(element)) {
        cirkel.innerHTML = '';
        document.body.appendChild(element);
        element.style.position = 'absolute';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.transform = 'none';
        element.style.visibility = 'visible';
      }
      const img = element.cloneNode(true);
      img.style.position = 'absolute';
      img.style.top = '-1000px';
      img.style.left = '-1000px';
      document.body.appendChild(img);
      e.dataTransfer.setDragImage(img, dragOffset.x, dragOffset.y);
      setTimeout(() => img.remove(), 0);
    }

    const cirkel = element.closest('.cirkel');
    if (cirkel && cirkel.contains(element)) {
      cirkel.innerHTML = '';
      document.body.appendChild(element);
      element.style.position = 'absolute';
      element.style.left = rect.left + 'px';
      element.style.top = rect.top + 'px';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
    }
  });
}

document.querySelectorAll('.tool').forEach(tool => {
  maakSleepbaar(tool);
});

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
    if (origineel.classList.contains('staaf-groen')) {
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const cirkel = dropTarget && dropTarget.classList.contains('cirkel') ? dropTarget : dropTarget.closest('.cirkel');
      if (cirkel) return;
    }

    const isInSchema = !origineel.closest('#toolbar');

    let toolElement;
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

    if (toolElement.classList.contains('geel-blok') || toolElement.classList.contains('staaf-groen')) {
      disableKnoppen('blokjes');
    }
    if (toolElement.classList.contains('schijf') && (toolElement.classList.contains('geel') || toolElement.classList.contains('groen'))) {
      disableKnoppen('schijfjes');
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
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        toolElement.style.transform = 'none';
        toolElement.style.left = `${offsetX}px`;
        toolElement.style.top = `${offsetY}px`;
        toolElement.style.visibility = 'visible';
      });
    });
  });
});

document.querySelectorAll('.wissel-vak').forEach(zone => {
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();

    if (document.getElementById('schema-min').style.display === 'block') {
      const id = e.dataTransfer.getData('text/plain');
      const origineel = document.getElementById(id);
      if (!origineel) return;

      const isFromToolbar = origineel.closest('#toolbar');
      let item;

      if (isFromToolbar) {
        item = origineel.cloneNode(true);
        item.id = id + '-clone-' + Date.now();
        item.classList.add('tool');
        item.setAttribute('draggable', 'true');
        maakSleepbaar(item);
      } else {
        item = origineel;
        if (item.parentNode && item.parentNode !== zone) {
          item.parentNode.removeChild(item);
        }
      }

      item.style.position = 'absolute';

      const zoneRect = zone.getBoundingClientRect();
      const offsetX = e.clientX - zoneRect.left;
      const offsetY = e.clientY - zoneRect.top;

      item.style.left = `${offsetX}px`;
      item.style.top = `${offsetY}px`;
      item.style.transform = 'none';

      zone.appendChild(item);

      zone.querySelectorAll('.wissel-knop').forEach(k => k.remove());

      const knop = document.createElement('button');
      knop.textContent = 'Wissel om';
      knop.classList.add('wissel-knop');
      knop.style.position = 'absolute';
      knop.style.bottom = '5px';
      knop.style.left = '50%';
      knop.style.transform = 'translateX(-50%)';
      zone.appendChild(knop);

      knop.addEventListener('click', () => {
        const cirkels = document.querySelectorAll('#schema-min .cirkel');
        let count = 0;
        if (item.classList.contains('staaf-groen')) {
          for (let cirkel of cirkels) {
            if (count >= 10) break;
            const blok = document.createElement('div');
            blok.classList.add('tool', 'geel-blok');
            blok.setAttribute('draggable', 'true');
            blok.id = 'kubus-' + Date.now() + '-' + count;
            maakSleepbaar(blok);
            blok.style.position = 'absolute';
            blok.style.top = '50%';
            blok.style.left = '50%';
            blok.style.transform = 'translate(-50%, -50%)';
            cirkel.innerHTML = '';
            cirkel.appendChild(blok);
            count++;
          }
        } else if (item.classList.contains('groen') || item.classList.contains('groen-schijf')) {
          for (let cirkel of cirkels) {
            if (count >= 10) break;
            const schijf = document.createElement('div');
            schijf.classList.add('tool', 'schijf', 'geel');
            schijf.innerHTML = '<span>1</span>';
            schijf.setAttribute('draggable', 'true');
            schijf.id = 'gele-schijf-' + Date.now() + '-' + count;
            maakSleepbaar(schijf);
            schijf.style.position = 'absolute';
            schijf.style.top = '50%';
            schijf.style.left = '50%';
            schijf.style.transform = 'translate(-50%, -50%)';
            cirkel.innerHTML = '';
            cirkel.appendChild(schijf);
            count++;
          }
        }
        zone.innerHTML = '';
      });
    }
  });
});

function controleerCirkels() {
  const cirkels = document.querySelectorAll('#schema .cirkel');
  let alleGevuld = true;

  for (let cirkel of cirkels) {
    if (
      cirkel.children.length !== 1 ||
      !cirkel.firstElementChild.classList.contains('schijf') ||
      !cirkel.firstElementChild.classList.contains('geel')
    ) {
      alleGevuld = false;
      break;
    }
  }

  let kubusCirkels = Array.from(cirkels).filter(cirkel =>
    cirkel.children.length === 1 &&
    cirkel.firstElementChild.classList.contains('geel-blok')
  );
  const heeft10Kubussen = kubusCirkels.length === 10;

  if (heeft10Kubussen) {
    kubusCirkels.forEach(cirkel => (cirkel.innerHTML = ''));

    const lightVak = document.querySelector('.light-t');
    if (lightVak) {
      const groeneStaaf = document.createElement('div');
      groeneStaaf.classList.add('staaf-groen');
      groeneStaaf.style.position = 'absolute';
      groeneStaaf.style.top = '50%';
      groeneStaaf.style.left = '50%';
      groeneStaaf.style.transform = 'translate(-50%, -50%)';

      lightVak.innerHTML = '';
      groeneStaaf.innerHTML = `
  <div class="verdeling">
    <div class="lijn" style="left: 20px;"></div>
    <div class="lijn" style="left: 40px;"></div>
    <div class="lijn" style="left: 60px;"></div>
    <div class="lijn" style="left: 80px;"></div>
    <div class="lijn" style="left: 100px;"></div>
    <div class="lijn" style="left: 120px;"></div>
    <div class="lijn" style="left: 140px;"></div>
    <div class="lijn" style="left: 160px;"></div>
    <div class="lijn" style="left: 180px;"></div>
  </div>
`;
      lightVak.appendChild(groeneStaaf);
    }
  }

  if (alleGevuld) {
    cirkels.forEach(cirkel => (cirkel.innerHTML = ''));

    const lightVak = document.querySelector('.light-t');
    if (!lightVak) return;

    const groeneSchijf = document.createElement('div');
    groeneSchijf.classList.add('tool', 'schijf', 'groen', 'groen-schijf');
    groeneSchijf.setAttribute('draggable', 'true');
    groeneSchijf.style.position = 'absolute';
    groeneSchijf.style.top = '50%';
    groeneSchijf.style.left = '50%';
    groeneSchijf.style.transform = 'translate(-50%, -50%)';

    const span = document.createElement('span');
    span.textContent = '10';
    groeneSchijf.appendChild(span);

    lightVak.innerHTML = '';
    lightVak.appendChild(groeneSchijf);

    const audio = new Audio('ringtone.mp3');
    audio.play();
  }
} //

// Knoppenwerking
document.getElementById('plus100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'block';
  document.getElementById('schema-min').style.display = 'none';
});

document.getElementById('min100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'none';
  document.getElementById('schema-min').style.display = 'block';
});

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

document.getElementById('terug').addEventListener('click', () => {
  window.location.href = 'start.html';
});

function disableKnoppen(except) {
  const blokjesBtn = document.getElementById('blokjes');
  const schijfjesBtn = document.getElementById('schijfjes');
  if (except === 'blokjes') {
    schijfjesBtn.disabled = true;
  } else if (except === 'schijfjes') {
    blokjesBtn.disabled = true;
  }
}

function enableKnoppen() {
  document.getElementById('blokjes').disabled = false;
  document.getElementById('schijfjes').disabled = false;
}


function maakSleepbaar(element) {
    element.addEventListener('dragstart', function(e) {
    const rect = element.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.dataTransfer.setData('text/plain', element.id);
    e.dataTransfer.effectAllowed = 'move';
    if ((element.classList.contains('schijf') || element.classList.contains('geel-blok'))) {
  const rect = element.getBoundingClientRect();
  const cirkel = element.closest('.cirkel');
  if (cirkel && cirkel.contains(element)) {
    cirkel.innerHTML = '';
    document.body.appendChild(element);
    element.style.position = 'absolute';
    element.style.left = rect.left + 'px';
    element.style.top = rect.top + 'px';
    element.style.transform = 'none';
    element.style.visibility = 'visible';
  }
      const img = element.cloneNode(true);
      img.style.position = 'absolute';
      img.style.top = '-1000px';
      img.style.left = '-1000px';
      document.body.appendChild(img);
      e.dataTransfer.setDragImage(img, dragOffset.x, dragOffset.y);
      setTimeout(() => img.remove(), 0);
    }

    const cirkel = element.closest('.cirkel');
    if (cirkel && cirkel.contains(element)) {
      cirkel.innerHTML = '';
      document.body.appendChild(element);
      element.style.position = 'absolute';
      element.style.left = rect.left + 'px';
      element.style.top = rect.top + 'px';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
    }
  });
}

document.querySelectorAll('.tool').forEach(tool => {
  maakSleepbaar(tool);
});

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
    if (origineel.classList.contains('staaf-groen')) {
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const cirkel = dropTarget && dropTarget.classList.contains('cirkel') ? dropTarget : dropTarget.closest('.cirkel');
      if (cirkel) return;
    }

    const isInSchema = !origineel.closest('#toolbar');

    let toolElement;
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

    // Detecteer of eerste tool blokje of schijfje is en vergrendel keuze
    if (toolElement.classList.contains('geel-blok') || toolElement.classList.contains('staaf-groen')) {
      disableKnoppen('blokjes');
    }
    if (toolElement.classList.contains('schijf') && (toolElement.classList.contains('geel') || toolElement.classList.contains('groen'))) {
      disableKnoppen('schijfjes');
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
  });
});

document.querySelectorAll('.wissel-vak').forEach(zone => {
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const origineel = document.getElementById(id);
    if (!origineel) return;
    if (origineel.classList.contains('staaf-groen')) {
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const cirkel = dropTarget && dropTarget.classList.contains('cirkel') ? dropTarget : dropTarget.closest('.cirkel');
      if (cirkel) return;
    }

    const isInToolbar = origineel.closest('#toolbar');

    let groeneSchijf;
    if (isInToolbar) {
      groeneSchijf = origineel.cloneNode(true);
      groeneSchijf.id = id + '-clone-' + Date.now();
      groeneSchijf.classList.add('tool');
      groeneSchijf.setAttribute('draggable', 'true');
      maakSleepbaar(groeneSchijf);
    } else {
      groeneSchijf = origineel;
    }

    groeneSchijf.remove();

    const cirkels = document.querySelectorAll('#schema-min .cirkel');
    let count = 0;
    for (let cirkel of cirkels) {
      if (count >= 10) break;
      const geleSchijf = document.createElement('div');
      geleSchijf.classList.add('schijf', 'geel', 'geel-schijf');
      geleSchijf.textContent = '1';
      geleSchijf.setAttribute('draggable', 'true');
      geleSchijf.id = 'gele-' + Date.now() + '-' + count;
      geleSchijf.classList.add('tool');
      maakSleepbaar(geleSchijf);
      geleSchijf.style.position = 'absolute';
      geleSchijf.style.top = '50%';
      geleSchijf.style.left = '50%';
      geleSchijf.style.transform = 'translate(-50%, -50%)';
      cirkel.innerHTML = '';
      cirkel.appendChild(geleSchijf);
      count++;
    }
  });
});

function controleerCirkels() {
  const cirkels = document.querySelectorAll('#schema .cirkel');
  let alleGevuld = true;

  for (let cirkel of cirkels) {
    if (
      cirkel.children.length !== 1 ||
      !cirkel.firstElementChild.classList.contains('schijf') ||
      !cirkel.firstElementChild.classList.contains('geel')
    ) {
      alleGevuld = false;
      break;
    }
  }

  let kubusCirkels = Array.from(cirkels).filter(cirkel =>
    cirkel.children.length === 1 &&
    cirkel.firstElementChild.classList.contains('geel-blok')
  );
  const heeft10Kubussen = kubusCirkels.length === 10;

  if (heeft10Kubussen) {
    kubusCirkels.forEach(cirkel => (cirkel.innerHTML = ''));

    const lightVak = document.querySelector('.light-t');
    if (lightVak) {
      const groeneStaaf = document.createElement('div');
      groeneStaaf.classList.add('staaf-groen');
      groeneStaaf.style.position = 'absolute';
      groeneStaaf.style.top = '50%';
      groeneStaaf.style.left = '50%';
      groeneStaaf.style.transform = 'translate(-50%, -50%)';

      lightVak.innerHTML = '';
      groeneStaaf.innerHTML = `
        <div class="verdeling">
          <div class="lijn" style="left: 20px;"></div>
          <div class="lijn" style="left: 40px;"></div>
          <div class="lijn" style="left: 60px;"></div>
          <div class="lijn" style="left: 80px;"></div>
          <div class="lijn" style="left: 100px;"></div>
          <div class="lijn" style="left: 120px;"></div>
          <div class="lijn" style="left: 140px;"></div>
          <div class="lijn" style="left: 160px;"></div>
          <div class="lijn" style="left: 180px;"></div>
        </div>
      `;
      lightVak.appendChild(groeneStaaf);
    }
  }

  if (alleGevuld) {
    cirkels.forEach(cirkel => (cirkel.innerHTML = ''));

    const lightVak = document.querySelector('.light-t');
    if (!lightVak) return;

    const groeneSchijf = document.createElement('div');
    groeneSchijf.classList.add('tool', 'schijf', 'groen', 'groen-schijf');
    groeneSchijf.setAttribute('draggable', 'true');
    groeneSchijf.style.position = 'absolute';
    groeneSchijf.style.top = '50%';
    groeneSchijf.style.left = '50%';
    groeneSchijf.style.transform = 'translate(-50%, -50%)';

    const span = document.createElement('span');
    span.textContent = '10';
    groeneSchijf.appendChild(span);

    lightVak.innerHTML = '';
    lightVak.appendChild(groeneSchijf);

    const audio = new Audio('ringtone.mp3');
    audio.play();
  }
}

// Knoppenwerking
document.getElementById('plus100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'block';
  document.getElementById('schema-min').style.display = 'none';
});

document.getElementById('min100').addEventListener('click', () => {
  document.getElementById('schema').style.display = 'none';
  document.getElementById('schema-min').style.display = 'block';
});

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
document.getElementById('terug').addEventListener('click', () => {
  window.location.href = 'start.html';
});