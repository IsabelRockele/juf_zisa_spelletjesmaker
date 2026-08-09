document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.page-title, body > header');
  const intro = document.createElement('section');
  intro.className = 'lettercode-intro';
  intro.innerHTML = `<div><span class="eyebrow">ZO WERKT LETTERCODE</span><h2>Laat leerlingen woorden ontwarren en daarmee een geheime boodschap ontcijferen.</h2><p>Zet eerst de gehusselde letters in de juiste volgorde. Schrijf daarna de letter uit elk genummerd vakje onderaan bij hetzelfde nummer. Zo verschijnt de geheime boodschap.</p><p><strong>Wat krijg je?</strong> Na het invullen verschijnt onder deze uitleg meteen een volledig werkblad met alle woorden, codevakjes en de geheime boodschap.</p><p class="canva-tip"><strong>Tip:</strong> download het werkblad als PNG en plaats het in Canva. Daar kun je ondersteunende afbeeldingen naast de woorden zetten.</p></div><div class="lettercode-example"><div><strong>1. Ontwar het woord</strong><div class="code-box"><i>A</i><i>K</i><i>L</i><i>S</i></div><small>AKLS wordt KLAS</small></div><span class="arrow">→</span><div><strong>2. Gebruik de codes</strong><div class="code-box"><i>1</i><i>2</i><i>3</i><i>4</i></div><small>Vul onderaan de boodschap aan</small></div><button type="button" id="lettercodeExampleBtn">Vul het voorbeeld in en bekijk het volledige werkblad</button></div>`;
  header.insertAdjacentElement('afterend', intro);

  const sentenceInput = document.getElementById('gecodeerdeZinInput');
  const wordsInput = document.getElementById('bronWoordenInput');
  const titleInput = document.getElementById('worksheetTitleInput');
  const sentenceGroup = sentenceInput?.closest('.control-group');
  const wordsGroup = wordsInput?.closest('.control-group');
  if (sentenceGroup) sentenceGroup.dataset.step = '1';
  if (wordsGroup) wordsGroup.dataset.step = '2';
  if (sentenceGroup?.querySelector('label')) sentenceGroup.querySelector('label').textContent = 'Welke geheime boodschap moeten de leerlingen vinden?';
  if (wordsGroup?.querySelector('label')) wordsGroup.querySelector('label').textContent = 'Welke woorden mogen ze eerst ontwarren? (één per regel)';
  if (sentenceInput) sentenceInput.placeholder = 'Bijvoorbeeld: WELKOM IN DE ZEBRAKLAS';
  if (wordsInput) wordsInput.placeholder = 'Minimaal 5 woorden, bijvoorbeeld:\nBROODDOOS\nDRINKBUS\nPOTLOOD\nSCHOOL\nKLAS';

  const feedback = document.getElementById('woordFeedbackContainer');
  if (feedback) {
    const list = feedback.querySelector('#woordFeedbackList');
    feedback.innerHTML = '<details><summary>Controle: welke woorden leveren codeletters?</summary></details>';
    feedback.querySelector('details').appendChild(list);
  }

  const actions = document.querySelector('.button-group');
  const actionPanel = document.getElementById('right-panel-buttons');
  if (actions && actionPanel) {
    actionPanel.style.display = '';
    actionPanel.innerHTML = '<h3>Maken en downloaden</h3>';
    actionPanel.appendChild(actions);
    const regenerate = document.getElementById('regenereerBtn');
    const tip = document.createElement('p');
    tip.className = 'regenerate-tip';
    tip.textContent = 'Denk je dat alle letters aanwezig zijn of wil je een andere husseling? Probeer dan eerst “Opnieuw genereren”. Je invoer blijft behouden.';
    regenerate?.insertAdjacentElement('afterend', tip);
  }

  const output = document.getElementById('puzzelOutput');
  const updateSheetTitle = () => {
    const heading = output?.querySelector('.lettercode-sheet-header h2');
    if (!heading) return;
    const theme = titleInput?.value.trim();
    heading.textContent = theme ? `LETTERCODE — ${theme.toLocaleUpperCase('nl')}` : 'LETTERCODE';
  };
  const decorate = () => {
    if (!output || output.children.length === 0) return;
    if (!output.querySelector('.lettercode-sheet-header')) {
      const sheetHeader = document.createElement('div');
      sheetHeader.className = 'lettercode-sheet-header';
      sheetHeader.innerHTML = '<div class="lettercode-identity"><span>Naam: <i></i></span><span>Datum: <i></i></span></div><h2>LETTERCODE</h2><p>Zet de letters van ieder gehusseld woord in de juiste volgorde. Schrijf daarna de genummerde letters onderaan bij hetzelfde nummer.</p>';
      output.prepend(sheetHeader);
    }
    updateSheetTitle();
  };
  decorate();
  if (output) new MutationObserver(() => requestAnimationFrame(decorate)).observe(output, { childList: true });
  titleInput?.addEventListener('input', updateSheetTitle);

  let solutionsVisible = false;
  const toggleSolutionsBtn = document.getElementById('toggleSolutionsBtn');
  const setSolutions = show => {
    solutionsVisible = show;
    output.querySelectorAll('.woord-rooster .vak').forEach(vak => {
      vak.querySelector('.solution-letter')?.remove();
      if (show && vak.dataset.answer) {
        const answer = document.createElement('span');
        answer.className = 'solution-letter';
        answer.textContent = vak.dataset.answer;
        vak.appendChild(answer);
      }
    });
    output.querySelectorAll('.gecodeerde-zin-rooster .letter').forEach(letter => {
      const isPrefilled = letter.classList.contains('prefilled-letter');
      letter.textContent = (show || isPrefilled) ? (letter.dataset.answer || '') : '';
      letter.classList.toggle('solution-letter', show && !isPrefilled);
    });
    output.classList.toggle('lettercode-solutions', show);
    if (toggleSolutionsBtn) toggleSolutionsBtn.textContent = show ? 'Terug naar werkblad' : 'Oplossingen tonen';
  };
  toggleSolutionsBtn?.addEventListener('click', () => setSolutions(!solutionsVisible));
  [sentenceInput, wordsInput].forEach(input => input?.addEventListener('input', () => {
    solutionsVisible = false;
    if (toggleSolutionsBtn) toggleSolutionsBtn.textContent = 'Oplossingen tonen';
  }));

  document.getElementById('downloadSolutionsPdfBtn')?.addEventListener('click', async () => {
    setSolutions(true);
    const canvas = await html2canvas(output, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const ratio = Math.min((pageWidth - 2 * margin) / canvas.width, (pageHeight - 2 * margin) / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, margin, width, height);
    doc.save('lettercode-oplossingen.pdf');
  });

  document.getElementById('lettercodeExampleBtn')?.addEventListener('click', () => {
    sentenceInput.value = 'WELKOM IN DE ZEBRAKLAS';
    wordsInput.value = ['BROODDOOS','DRINKBUS','POTLOOD','SCHOOL','KLAS','PENNENZAK','BANK','WELKOM'].join('\n');
    if (titleInput) titleInput.value = 'Terug naar school';
    sentenceInput.dispatchEvent(new Event('input', { bubbles: true }));
    wordsInput.dispatchEvent(new Event('input', { bubbles: true }));
    updateSheetTitle();
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
