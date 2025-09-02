/* ENEM Simulado App - vanilla JS */
const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>document.querySelectorAll(sel);

let state = {
  questions: [],
  answers: {}, // qid -> option key
  index: 0,
  timerSec: 0,
  meta: {year:null, area:null, language:null, random:false}
};

const AREAS = {
  linguagens: "Linguagens",
  humanas: "Ciências Humanas",
  natureza: "Ciências da Natureza",
  matematica: "Matemática"
};

// --------- init ---------
document.addEventListener("DOMContentLoaded", async () => {
  hydrateYears();
  bindUI();
  refreshKPIs();
});

function bindUI(){
  $("#btn-how").addEventListener("click", showHow);
  $("#btn-history").addEventListener("click", showHistory);
  $("#btn-start").addEventListener("click", startExam);
  $("#btn-random").addEventListener("click", startRandom);
  $("#btn-prev").addEventListener("click", prevQ);
  $("#btn-next").addEventListener("click", nextQ);
  $("#btn-clear").addEventListener("click", clearAnswer);
  $("#btn-finish").addEventListener("click", finishExam);
  $("#btn-reset").addEventListener("click", resetExam);
  $("#btn-retry").addEventListener("click", retryExam);
  $("#btn-new").addEventListener("click", newExam);
  $("#btn-export").addEventListener("click", exportHistory);
}

function hydrateYears(){
  const years = [2025,2024,2023,2022,2021];
  const sel = $("#year");
  sel.innerHTML = years.map(y=>`<option value="${y}">${y}</option>`).join("");
}

function showHow(){
  alert("Selecione ano, área e língua. Responda. Finalize. Veja gabarito e estatísticas. O histórico fica salvo no navegador.");
}
function showHistory(){
  const hist = JSON.parse(localStorage.getItem("enem_history")||"[]");
  if(!hist.length){ alert("Sem histórico."); return; }
  const lines = hist.slice(-10).reverse().map(h=>`${h.date} • ${h.meta.year}/${AREAS[h.meta.area]} • ${h.score.correct}/${h.score.total} (${h.score.pct}%)`);
  alert(lines.join("\n"));
}

async function startExam(){
  const year = $("#year").value;
  const area = $("#area").value;
  const language = $("#language").value;
  await loadQuestions({year, area, language, random:false});
}

async function startRandom(){
  const year = $("#year").value;
  const area = $("#area").value;
  const language = $("#language").value;
  await loadQuestions({year, area, language, random:true, pick:10});
}

async function loadQuestions({year, area, language, random=false, pick=null}){
  resetState();
  state.meta = {year, area, language, random};

  // Decide data path
  const file = `data/${year}_${area}_${language}.json`;

  try{
    const res = await fetch(file, {cache:"no-store"});
    if(!res.ok) throw new Error("Arquivo não encontrado");
    let data = await res.json();
    if(random){
      data = shuffle(data).slice(0, pick || 10);
    }
    state.questions = data;
    $("#kpi-total").textContent = data.length;
    showExamUI();
    startTimer();
    renderQuestion();
  }catch(e){
    console.error(e);
    alert("Falha ao carregar questões. Arquivo ausente. Use seus próprios JSONs em /data.");
  }
}

function resetState(){
  state.questions = [];
  state.answers = {};
  state.index = 0;
  state.timerSec = 0;
  state.meta = {year:null,area:null,language:null,random:false};
}

function showExamUI(){
  $("#badge-meta").textContent = `${state.meta.year} • ${AREAS[state.meta.area]} • ${state.meta.language}`;
  $("#exam").classList.remove("d-none");
  $("#result").classList.add("d-none");
  $("#q-total").textContent = state.questions.length;
  $("#q-index").textContent = 1;
  $("#question-container").innerHTML = "";
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderQuestion(){
  const q = state.questions[state.index];
  $("#q-index").textContent = state.index+1;
  const selected = state.answers[q.id] || null;
  const opts = q.options.map(opt => {
    const checked = selected === opt.key ? "checked" : "";
    return `<div class="form-check mb-2">
      <input class="form-check-input" type="radio" name="q_${q.id}" id="q_${q.id}_${opt.key}" value="${opt.key}" ${checked}>
      <label class="form-check-label" for="q_${q.id}_${opt.key}"><strong>${opt.key})</strong> ${opt.text}</label>
    </div>`;
  }).join("");

  const html = `<div class="card mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div><span class="badge text-bg-secondary">${q.code || "Q" + (state.index+1)}</span></div>
        <div class="small text-muted">${AREAS[q.area]}</div>
      </div>
      <p class="mb-3">${q.text}</p>
      ${q.image ? `<img class="img-fluid rounded border mb-3" src="${q.image}" alt="figura">` : ""}
      ${opts}
    </div>
  </div>`;
  $("#question-container").innerHTML = html;

  // bind change
  $$(`input[name="q_${q.id}"]`).forEach(inp=>{
    inp.addEventListener("change", (e)=>{
      state.answers[q.id] = e.target.value;
    });
  });
}

function prevQ(){ if(state.index>0){ state.index--; renderQuestion(); } }
function nextQ(){ if(state.index < state.questions.length-1){ state.index++; renderQuestion(); } }
function clearAnswer(){
  const q = state.questions[state.index];
  delete state.answers[q.id];
  renderQuestion();
}

function startTimer(){
  clearInterval(window._timer);
  window._timer = setInterval(()=>{
    state.timerSec++;
    $("#timer").textContent = formatTime(state.timerSec);
  }, 1000);
}

function finishExam(){
  if(!state.questions.length) return;
  clearInterval(window._timer);
  const evalRes = evaluate();
  saveHistory(evalRes);
  showResult(evalRes);
}

function resetExam(){
  clearInterval(window._timer);
  $("#exam").classList.add("d-none");
  $("#result").classList.add("d-none");
  resetState();
}

function retryExam(){
  // mantém mesmas questões
  $("#exam").classList.remove("d-none");
  $("#result").classList.add("d-none");
  state.answers = {};
  state.index = 0;
  state.timerSec = 0;
  startTimer();
  renderQuestion();
}

function newExam(){
  resetExam();
  window.scrollTo({top:0, behavior:"smooth"});
}

function evaluate(){
  let correct = 0;
  const detail = state.questions.map(q=>{
    const chosen = state.answers[q.id] || null;
    const correctKey = q.options.find(o=>o.correct)?.key;
    const isCorrect = chosen === correctKey;
    if(isCorrect) correct++;
    return {id:q.id, code:q.code, chosen, correctKey, text:q.text, options:q.options, isCorrect};
  });
  const total = state.questions.length;
  const pct = total ? Math.round((correct/total)*100) : 0;
  return {correct, total, pct, time: state.timerSec, detail};
}

function showResult(res){
  $("#exam").classList.add("d-none");
  $("#result").classList.remove("d-none");
  $("#score").innerHTML = `<div class="h5 mb-1">${res.correct}/${res.total} corretas</div><div class="small text-muted">Tempo: ${formatTime(res.time)}</div>`;
  $("#score-bar").style.width = res.pct + "%";
  $("#score-bar").textContent = res.pct + "%";
  buildReview(res.detail);
  refreshKPIs(res);
  window.scrollTo({top:0, behavior:"smooth"});
}

function buildReview(detail){
  const acc = $("#accordionReview");
  acc.innerHTML = detail.map((d,i)=>{
    const optList = d.options.map(o=>{
      const isC = o.key === d.correctKey;
      const isSel = o.key === d.chosen;
      const badge = isC ? '<span class="badge text-bg-success ms-2">correta</span>' : '';
      const sel = isSel ? '<span class="badge text-bg-light text-dark ms-2">sua</span>' : '';
      return `<li class="list-group-item d-flex justify-content-between align-items-start${isC ? ' list-group-item-success' : ''}">
        <div><strong>${o.key})</strong> ${o.text} ${badge} ${sel}</div>
      </li>`;
    }).join("");
    return `<div class="accordion-item">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rev${i}">
          Q${i+1} • ${d.isCorrect ? "Acertou" : "Errou"} ${d.code ? "• "+d.code : ""}
        </button>
      </h2>
      <div id="rev${i}" class="accordion-collapse collapse">
        <div class="accordion-body">
          <p class="mb-3">${d.text}</p>
          <ul class="list-group">${optList}</ul>
        </div>
      </div>
    </div>`;
  }).join("");
}

function saveHistory(res){
  const hist = JSON.parse(localStorage.getItem("enem_history")||"[]");
  const item = {
    date: new Date().toLocaleString(),
    meta: state.meta,
    score: {correct:res.correct, total:res.total, pct:res.pct},
    time: res.time
  };
  hist.push(item);
  localStorage.setItem("enem_history", JSON.stringify(hist));
}

function exportHistory(){
  const hist = localStorage.getItem("enem_history") || "[]";
  const blob = new Blob([hist], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "historico_simulado_enem.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function refreshKPIs(last=null){
  const todayKey = new Date().toDateString();
  const hist = JSON.parse(localStorage.getItem("enem_history")||"[]");
  const today = hist.filter(h=> new Date(h.date).toDateString() === todayKey);
  const feitas = today.reduce((acc,h)=> acc + h.score.total, 0);
  const media = today.length ? Math.round(today.reduce((acc,h)=> acc + h.score.pct, 0)/today.length) : 0;
  $("#kpi-feitas").textContent = feitas;
  $("#kpi-media").textContent = media + "%";
}

function formatTime(sec){
  const m = String(Math.floor(sec/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${m}:${s}`;
}

function shuffle(a){
  const arr = a.slice();
  for(let i = arr.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
