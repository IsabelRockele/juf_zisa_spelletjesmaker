
const tool = document.getElementById('tool1');
const dropZone = document.getElementById('zone1');

tool.addEventListener('dragstart', () => {
  tool.classList.add('dragging');
});

tool.addEventListener('dragend', (e) => {
  tool.classList.remove('dragging');
  const rect = dropZone.getBoundingClientRect();
  const x = e.pageX;
  const y = e.pageY;

  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    tool.style.left = dropZone.style.left || '200px';
    tool.style.top = dropZone.style.top || '20px';
  } else {
    tool.style.left = '20px';
    tool.style.top = '20px';
  }
});
