document.addEventListener('DOMContentLoaded', () => {
  let actiefElement = null;
  let offsetX = 0;
  let offsetY = 0;

  function startDragPointer(e, tool, clone = false) {
    console.log('Start drag', clone ? 'clone' : 'origineel', tool);
    const clientX = e.clientX;
    const clientY = e.clientY;
    const rect = tool.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    if (clone) {
      // Clone maken alleen bij slepen uit toolbar
      actiefElement = tool.cloneNode(true);
      actiefElement.classList.add('tool');
      actiefElement.style.position = 'absolute';
      actiefElement.style.left = (clientX - offsetX) + 'px';
      actiefElement.style.top = (clientY - offsetY) + 'px';
      actiefElement.style.zIndex = 1000;
      actiefElement.setAttribute('draggable', 'false');
      actiefElement.style.touchAction = 'none';
      document.body.appendChild(actiefElement);
    } else {
      // Origineel verplaatsen, geen clone
      const absLeft = window.scrollX + rect.left;
      const absTop = window.scrollY + rect.top;
      tool.style.position = 'absolute';
      tool.style.left = absLeft + 'px';
      tool.style.top = absTop + 'px';
      tool.style.zIndex = 1000;
      tool.style.touchAction = 'none';
      document.body.appendChild(tool);
      actiefElement = tool;
    }

    e.target.setPointerCapture(e.pointerId);
  }

  function movePointer(e) {
    if (!actiefElement) return;
    actiefElement.style.left = (e.clientX - offsetX) + 'px';
    actiefElement.style.top = (e.clientY - offsetY) + 'px';
  }

  function endPointer(e) {
    if (!actiefElement) return;

    actiefElement.style.display = 'none';
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    actiefElement.style.display = '';

    const targetZone = dropTarget && dropTarget.closest('.cirkel, .vak, .doel-vak');
    console.log('Dropped in', targetZone);

    if (targetZone) {
      // Voeg het bestaande element toe, geen clone maken!
      targetZone.appendChild(actiefElement);

      if (targetZone.classList.contains('cirkel')) {
        actiefElement.style.left = '50%';
        actiefElement.style.top = '50%';
        actiefElement.style.transform = 'translate(-50%, -50%)';

        window.controleerCirkels();
      } else {
        const zoneRect = targetZone.getBoundingClientRect();
        actiefElement.style.left = (e.clientX - zoneRect.left - offsetX) + 'px';
        actiefElement.style.top = (e.clientY - zoneRect.top - offsetY) + 'px';
        actiefElement.style.transform = 'none';
      }
    } else {
      actiefElement.remove();
    }

    actiefElement = null;
  }

  // Alleen toolbar-tools krijgen pointerdown met clone=true
  document.querySelectorAll('#toolbar .tool').forEach(tool => {
    tool.style.touchAction = 'none';
    tool.addEventListener('pointerdown', e => startDragPointer(e, tool, true));
  });

  // Tools in het schema verplaatsen zonder clone
  document.addEventListener('pointerdown', e => {
    const tool = e.target.closest('.tool');
    if (tool && !tool.closest('#toolbar')) {
      startDragPointer(e, tool, false);
    }
  });

  document.addEventListener('pointermove', movePointer);
  document.addEventListener('pointerup', endPointer);

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

  window.enableKnoppen = enableKnoppen;

  document.getElementById('blokjes').addEventListener('click', () => {
    document.getElementById('kubus').style.display = 'block';
    document.getElementById('staaf').style.display = 'block';
    document.getElementById('schijf-geel').style.display = 'none';
    document.getElementById('schijf-groen').style.display = 'none';
    disableKnoppen('blokjes');
  });

  document.getElementById('schijfjes').addEventListener('click', () => {
    document.getElementById('kubus').style.display = 'none';
    document.getElementById('staaf').style.display = 'none';
    document.getElementById('schijf-geel').style.display = 'block';
    document.getElementById('schijf-groen').style.display = 'block';
    disableKnoppen('schijfjes');
  });
});

