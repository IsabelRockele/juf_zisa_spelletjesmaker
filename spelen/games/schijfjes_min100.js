
// schijfjes_min100.js – functionaliteit voor schijfjes (geel en groen)

document.getElementById('schijfjes').addEventListener('click', () => {
  const schijfGeel = document.getElementById('schijf-geel');
  const schijfGroen = document.getElementById('schijf-groen');
  schijfGeel.style.display = 'inline-block';
  schijfGroen.style.display = 'inline-block';

  // Andere knop uitschakelen
  document.getElementById('blokjes').disabled = true;

  // Sleepbaar maken
  [schijfGeel, schijfGroen].forEach(tool => {
    tool.addEventListener('dragstart', e => {
      const clone = tool.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.zIndex = 1000;
      clone.classList.add('tool');
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 25, 25);
      e.dataTransfer.setData('text/plain', tool.id);
    });
  });
});
