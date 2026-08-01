
document.addEventListener('DOMContentLoaded', () => {
  const vuilbak = document.getElementById('vuilbak');
  const container = document.getElementById('vuilbak-container');
  const tCount = document.getElementById('t-count');
  const eCount = document.getElementById('e-count');

  let t = 0;
  let e = 0;
  let actiefTool = null;

  container.style.display = 'block';

  document.getElementById('reset').addEventListener('click', () => {
    t = 0;
    e = 0;
    tCount.textContent = '0';
    eCount.textContent = '0';
  });

  // Onthoud welke tool gesleept wordt
  document.addEventListener('pointerdown', (event) => {
    const el = event.target.closest('.tool');
    if (el) {
      actiefTool = el;
    }
  });

  document.addEventListener('pointerup', (event) => {
    if (!actiefTool) return;

    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
    const isBovenVuilbak = dropTarget && dropTarget.closest('#vuilbak');

    if (!isBovenVuilbak) {
      actiefTool = null;
      return;
    }

    const tSelector = ['groen', 'staaf-groen', 'schijf-groen', 'staaf'];
    const eSelector = ['geel', 'geel-blok', 'schijf-geel', 'kubus'];

    for (const klas of tSelector) {
      if (actiefTool.classList.contains(klas)) {
        t++;
        tCount.textContent = t.toString();
        if (actiefTool.closest('.cirkel')) {
          actiefTool.closest('.cirkel').innerHTML = '';
        }
        actiefTool.remove();
        actiefTool = null;
        return;
      }
    }

    for (const klas of eSelector) {
      if (actiefTool.classList.contains(klas)) {
        e++;
        eCount.textContent = e.toString();
        if (actiefTool.closest('.cirkel')) {
          actiefTool.closest('.cirkel').innerHTML = '';
        }
        actiefTool.remove();
        actiefTool = null;
        return;
      }
    }

    actiefTool.remove();
    actiefTool = null;
  });
});
