
document.addEventListener('DOMContentLoaded', () => {
  let currentDraggedTool = null;

  document.addEventListener('dragstart', (event) => {
    if (event.target.classList.contains('tool')) {
      currentDraggedTool = event.target;
      currentDraggedTool.style.opacity = '0.7';
    }
  });

  document.addEventListener('dragend', () => {
    if (currentDraggedTool) {
      currentDraggedTool.style.opacity = '';
    }
    currentDraggedTool = null;
  });

  // Logica voor droppen van tools in het rekenschema
  document.querySelectorAll('.vak, .doel-vak, .wissel-vak, .cirkel').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const origineel = document.getElementById(id);
      if (!origineel) return;

      // Correcte positionering van de tool in het rekenschema zonder verschuiving
      const rect = zone.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      origineel.style.position = 'absolute';
      origineel.style.left = `${offsetX - (origineel.offsetWidth / 2)}px`;
      origineel.style.top = `${offsetY - (origineel.offsetHeight / 2)}px`;

      zone.appendChild(origineel);
    });
  });
});
