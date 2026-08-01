
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tool').forEach(el => maakSleepbaarBlokje(el));
  const wisselVakken = document.querySelectorAll('#schema-min .wissel-vak');

  wisselVakken.forEach(zone => {
    // Inwisselen van groene staaf
    zone.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      let origineel = document.getElementById(id);
      if (!origineel && id.includes('clone')) {
        const clone = document.getElementById(id);
        const origineleId = clone?.dataset?.origineel;
        if (origineleId) {
          origineel = document.getElementById(origineleId);
        }
      }
      if (!origineel || !origineel.classList.contains('staaf-groen')) return;

      const isInToolbar = origineel.closest('#toolbar');

      let staaf;
      if (isInToolbar) {
        staaf = origineel.cloneNode(true);
        staaf.id = id + '-clone-' + Date.now();
        staaf.classList.add('tool');
        staaf.setAttribute('draggable', 'true');
        maakSleepbaarBlokje(staaf);
      } else {
        staaf = origineel;
      }

      const cirkels = Array.from(document.querySelectorAll('#schema-min .cirkel'))
        .filter(c => c.children.length === 0);

      if (cirkels.length < 10) return;

      for (let i = 0; i < 10; i++) {
        const kubus = document.createElement('div');
        kubus.className = 'tool geel-blok';
        kubus.id = 'kubus-' + Date.now() + '-' + i;
        kubus.setAttribute('draggable', 'true');
        kubus.style.position = 'absolute';
        kubus.style.top = '50%';
        kubus.style.left = '50%';
        kubus.style.transform = 'translate(-50%, -50%)';
        cirkels[i].appendChild(kubus);
        maakSleepbaarBlokje(kubus);
      }

      if (!isInToolbar) staaf.remove();
    });

    // Inwisselen van groene schijf
    zone.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      let origineel = document.getElementById(id);
      if (!origineel && id.includes('clone')) {
        const clone = document.getElementById(id);
        const origineleId = clone?.dataset?.origineel;
        if (origineleId) {
          origineel = document.getElementById(origineleId);
        }
      }
      if (!origineel || !origineel.classList.contains('groen-schijf')) return;

      const isInToolbar = origineel.closest('#toolbar');

      const cirkels = Array.from(document.querySelectorAll('#schema-min .cirkel'))
        .filter(c => c.children.length === 0);

      if (cirkels.length < 10) return;

      for (let i = 0; i < 10; i++) {
        const schijf = document.createElement('div');
        schijf.className = 'tool schijf geel geel-schijf';
        schijf.setAttribute('draggable', 'true');
        schijf.id = 'gele-' + Date.now() + '-' + i;
        schijf.textContent = '1';
        schijf.style.position = 'absolute';
        schijf.style.top = '50%';
        schijf.style.left = '50%';
        schijf.style.transform = 'translate(-50%, -50%)';
        cirkels[i].appendChild(schijf);
        maakSleepbaarBlokje(schijf);
      }

      if (!isInToolbar) origineel.remove();
    });
  });
});

function maakSleepbaarBlokje(element) {
  element.addEventListener('dragstart', function(e) {
    const rect = element.getBoundingClientRect();
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    e.dataTransfer.setData('text/plain', element.id);
    e.dataTransfer.effectAllowed = 'move';

    if (element.classList.contains('geel-blok')) {
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
    }

    const img = element.cloneNode(true);
    img.style.position = 'absolute';
    img.style.top = '-1000px';
    img.style.left = '-1000px';
    document.body.appendChild(img);
    e.dataTransfer.setDragImage(img, dragOffset.x, dragOffset.y);
    setTimeout(() => img.remove(), 0);
  });
}
