
document.addEventListener('DOMContentLoaded', () => {
  const wisselVak = document.querySelector('.wissel-vak');

  function verwijderWisselKnop() {
    const oude = wisselVak.querySelector('.wissel-knop');
    if (oude) oude.remove();
  }

  function toonWisselKnop(tool) {
    verwijderWisselKnop();

    const knop = document.createElement('button');
knop.style.position = 'absolute';
knop.style.top = '-50px';
knop.style.bottom = '';
knop.style.left = '50%';
knop.style.transform = 'translateX(-50%)';
knop.style.zIndex = 2000;

knop.style.fontSize = '1.2rem';
knop.style.padding = '0.5rem 1.2rem';
knop.style.minWidth = '150px';
knop.style.borderRadius = '0.8rem';

knop.style.backgroundColor = '#007bff';   // mooie blauwe knop
knop.style.color = 'white';               // witte tekst
knop.textContent = 'Wissel om';           // zorg dat dit niet per ongeluk weg is

    knop.addEventListener('click', () => {
      console.log("Klik op wisselknop");
      console.log("tool.id =", tool.id);

      const soort = tool.id;
      const cirkels = document.querySelectorAll('.cirkel');

      for (let i = 0; i < 10 && i < cirkels.length; i++) {
        const nieuwe = document.createElement("div");
        nieuwe.classList.add("tool");

        if (soort === "staaf") {
          nieuwe.classList.add("geel-blok");
          nieuwe.id = "";
        } else if (soort === "schijf-groen") {
          nieuwe.classList.add("schijf", "geel");
          nieuwe.innerHTML = "<span>1</span>";
          nieuwe.id = "";
        }

        nieuwe.style.position = "absolute";
        nieuwe.style.left = "50%";
        nieuwe.style.top = "50%";
        nieuwe.style.transform = "translate(-50%, -50%)";
        nieuwe.style.userSelect = "none";
        nieuwe.style.touchAction = "none";

        cirkels[i].appendChild(nieuwe);

        nieuwe.addEventListener('pointerdown', e => {
          const el = e.target.closest('.tool');

          const rect = el.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;
          const absLeft = window.scrollX + rect.left;
          const absTop = window.scrollY + rect.top;

          el.style.position = 'absolute';
          el.style.left = absLeft + 'px';
          el.style.top = absTop + 'px';
          el.style.transform = 'none';
          document.body.appendChild(el);

          el.setPointerCapture(e.pointerId);

          function move(ev) {
            el.style.left = (ev.clientX - offsetX) + 'px';
            el.style.top = (ev.clientY - offsetY) + 'px';
          }

          function up(ev) {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
          }

          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', up);
        });
      }

      tool.remove();
      knop.remove();
    });

    wisselVak.appendChild(knop);
  }

  document.addEventListener('pointerup', e => {
    const tool = e.target.closest('.tool');
    if (tool && tool.parentElement === wisselVak &&
        (tool.id === 'staaf' || tool.id === 'schijf-groen')) {

      tool.style.position = 'absolute';
      tool.style.left = '50%';
      tool.style.top = '50%';
      tool.style.transform = 'translate(-50%, -50%)';

      toonWisselKnop(tool);
    }
  });

  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      verwijderWisselKnop();
    });
  }
});
