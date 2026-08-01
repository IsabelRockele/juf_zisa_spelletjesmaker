
// drop_min100.js – pointer events + ondersteuning voor kindelementen

document.addEventListener('DOMContentLoaded', () => {
  let actiefElement = null;
  let offsetX = 0;
  let offsetY = 0;

  function startDragPointer(e, tool, clone = false) {
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (clone) {
      const rect = tool.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

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
      const rect = tool.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

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

    const targetZone = dropTarget && dropTarget.closest('.cirkel, .vak, .doel-vak, .wissel-vak');

    if (targetZone) {
      targetZone.appendChild(actiefElement);
      const rect = targetZone.getBoundingClientRect();
      actiefElement.style.left = (e.clientX - rect.left - offsetX) + 'px';
      actiefElement.style.top = (e.clientY - rect.top - offsetY) + 'px';
    } else {
      actiefElement.remove();
    }

    actiefElement = null;
  }

  // Initieel slepen uit toolbar (kopie maken)
  document.querySelectorAll('#toolbar .tool').forEach(tool => {
    tool.style.touchAction = 'none';
    tool.addEventListener('pointerdown', e => startDragPointer(e, tool, true));
  });

  // Tools in schema oppakken via closest('.tool')
  document.addEventListener('pointerdown', e => {
    const tool = e.target.closest('.tool');
    if (tool && !tool.closest('#toolbar')) {
      startDragPointer(e, tool, false);
    }
  });

  document.addEventListener('pointermove', movePointer);
  document.addEventListener('pointerup', endPointer);
});
