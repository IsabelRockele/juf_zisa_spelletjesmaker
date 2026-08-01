
// blokjes_min100.js – functionaliteit voor blokjes (kubus en staaf)

document.getElementById('blokjes').addEventListener('click', () => {
  const staaf = document.getElementById('staaf');
  const kubus = document.getElementById('kubus');
  staaf.style.display = 'inline-block';
  kubus.style.display = 'inline-block';

  // Andere knop uitschakelen
  document.getElementById('schijfjes').disabled = true;

  // Sleepbaar maken
  [staaf, kubus].forEach(tool => {
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
