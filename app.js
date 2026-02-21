// Static quiz app (no backend). Data is loaded from questions.json
let ALL = [];
let active = [];
let idx = 0;
let score = 0;
let answered = false;
let reveal = false;
let shuffled = false;

const el = (id) => document.getElementById(id);
const sectionSelect = el('sectionSelect');
const modeSelect = el('modeSelect');
const startBtn = el('startBtn');
const shuffleBtn = el('shuffleBtn');
const statusPill = el('statusPill');
const scorePill = el('scorePill');
const sectionPill = el('sectionPill');
const qnumPill = el('qnumPill');
const stemEl = el('stem');
const choicesEl = el('choices');
const rationaleEl = el('rationale');
const revealBtn = el('revealBtn');
const nextBtn = el('nextBtn');

function uniq(arr){ return [...new Set(arr)]; }

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function setStatus(msg){ statusPill.textContent = msg; }
function setScore(){ scorePill.textContent = `Score: ${score} / ${Math.max(idx,0)}`; }

function buildSections(){
  const secs = uniq(ALL.map(q=>q.section)).sort((a,b)=>a.localeCompare(b));
  sectionSelect.innerHTML = secs.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function escapeHtml(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function currentMode(){ return modeSelect.value; }

function start(){
  const sec = sectionSelect.value;
  active = ALL.filter(q=>q.section===sec);
  if(shuffled) active = shuffle(active);
  idx = 0;
  score = 0;
  answered = false;
  reveal = false;
  setScore();
  render();
  setStatus(`Loaded ${active.length} questions`);
}

function render(){
  if(active.length===0){
    stemEl.textContent = 'No questions in this section.';
    choicesEl.innerHTML = '';
    rationaleEl.classList.add('hidden');
    return;
  }
  const q = active[idx];
  sectionPill.textContent = q.section;
  qnumPill.textContent = `Q${q.id} (item ${idx+1}/${active.length})`;
  stemEl.textContent = q.stem;
  rationaleEl.textContent = q.rationale || '';
  rationaleEl.classList.add('hidden');
  choicesEl.innerHTML = '';
  answered = false;
  reveal = false;

  (['A','B','C','D']).forEach(letter=>{
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.dataset.letter = letter;
    btn.textContent = `${letter}. ${q.choices[letter]}`;
    btn.onclick = ()=>choose(letter);
    choicesEl.appendChild(btn);
  });
}

function choose(letter){
  if(answered) return;
  answered = true;
  const q = active[idx];
  const correct = q.correct;
  if(letter === correct) score += 1;
  // mark buttons
  [...choicesEl.querySelectorAll('button.choice')].forEach(b=>{
    const L = b.dataset.letter;
    if(L === correct) b.classList.add('correct');
    if(L === letter && L !== correct) b.classList.add('wrong');
  });
  idx += 1;
  setScore();

  if(currentMode()==='practice'){
    rationaleEl.classList.remove('hidden');
  }
}

function doReveal(){
  if(active.length===0) return;
  const q = active[Math.max(0, idx-1)];
  // If user hasn't answered current question yet, reveal current correct choice.
  const qShown = answered ? q : active[idx];
  const correct = qShown.correct;
  [...choicesEl.querySelectorAll('button.choice')].forEach(b=>{
    if(b.dataset.letter === correct) b.classList.add('correct');
  });
  rationaleEl.classList.remove('hidden');
}

function next(){
  if(active.length===0) return;
  // If user hasn't answered, move on without scoring.
  if(!answered){ idx += 1; setScore(); }
  if(idx >= active.length){
    stemEl.textContent = `Done. Final score: ${score} / ${active.length}`;
    choicesEl.innerHTML = '';
    rationaleEl.classList.add('hidden');
    setStatus('Finished');
    return;
  }
  render();
}

async function init(){
  try{
    const res = await fetch('./questions.json', {cache:'no-store'});
    ALL = await res.json();
    buildSections();
    setStatus(`Loaded ${ALL.length} total questions`);
    start();
  }catch(e){
    setStatus('Failed to load questions.json');
    stemEl.textContent = 'Error: could not load questions.json. Check Cloudflare Pages build output.';
  }
}

startBtn.onclick = ()=>start();
shuffleBtn.onclick = ()=>{ shuffled = !shuffled; shuffleBtn.textContent = shuffled ? 'Shuffle: ON' : 'Shuffle'; start(); };
revealBtn.onclick = ()=>doReveal();
nextBtn.onclick = ()=>next();

init();
