const yearSelect = document.getElementById('year');
const disciplineSelect = document.getElementById('discipline');
const languageSelect = document.getElementById('language');
const limitInput = document.getElementById('limit');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');

let currentQuiz = null;
let history = []; // histórico em memória

document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  startBtn.disabled = true;
  quizContainer.classList.add('d-none');
  resultContainer.classList.add('d-none');
  resultContainer.innerHTML = '';

  const params = new URLSearchParams({
    year: yearSelect.value,
    area: disciplineSelect.value,
    limit: limitInput.value,
  });
  if (languageSelect.value) params.append('language', languageSelect.value);

  try {
    const res = await fetch(`api/get_questions.php?${params.toString()}`);
    const payload = await res.json();
    if (!res.ok || payload.error) {
      alert(payload.error || 'Erro ao consultar API');
      startBtn.disabled = false;
      return;
    }

    currentQuiz = payload;
    renderQuiz(payload.questions);
    startBtn.disabled = false;
    resetBtn.classList.remove('d-none');
  } catch (err) {
    alert('Erro na requisição: ' + err);
    startBtn.disabled = false;
  }
});

resetBtn.addEventListener('click', () => {
  quizContainer.innerHTML = '';
  resultContainer.innerHTML = '';
  quizContainer.classList.add('d-none');
  resultContainer.classList.add('d-none');
  resetBtn.classList.add('d-none');
});

function renderQuiz(questions) {
  if (!questions.length) {
    quizContainer.innerHTML = '<div class="alert alert-warning">Nenhuma questão.</div>';
    quizContainer.classList.remove('d-none');
    return;
  }

  const html = questions.map((q, idx) => {
    const statement = q.text || q.statement || q.content || 'Enunciado não disponível';
    const imageHtml = q.imageUrl ? `<div class="mb-2 text-center"><img src="${q.imageUrl}" class="img-fluid" alt="Imagem da questão"></div>` : '';

    const alts = (q.alternatives || []).map(alt => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="q_${idx}" id="q_${idx}_${alt.letter}" value="${alt.letter}" required>
        <label class="form-check-label" for="q_${idx}_${alt.letter}">
          <strong>${alt.letter})</strong> ${alt.text || ''}
        </label>
      </div>
    `).join('');

    return `
      <div class="card mb-3 shadow-sm" id="question-${idx}">
        <div class="card-body">
          <h6>${statement}</h6>
          ${imageHtml}
          ${alts}
        </div>
      </div>
    `;
  }).join('');

  quizContainer.innerHTML = html + `
    <div class="d-grid">
      <button id="finishBtn" class="btn btn-success btn-lg">Finalizar e Corrigir</button>
    </div>`;
  quizContainer.classList.remove('d-none');

  document.getElementById('finishBtn').addEventListener('click', gradeQuiz);
}

function gradeQuiz() {
  let correct = 0;
  const answers = [];

  currentQuiz.questions.forEach((q, idx) => {
    const chosen = document.querySelector(`input[name="q_${idx}"]:checked`);
    const user = chosen ? chosen.value : null;
    const right = q.correctAlternative;
    const isRight = user === right;

    if (isRight) correct++;

    // destaca questão
    const qDiv = document.getElementById(`question-${idx}`);
    if (isRight) {
      qDiv.classList.add('border-success', 'border-3');
    } else {
      qDiv.classList.add('border-danger', 'border-3');
    }

    answers.push({ index: q.index || idx, user, right, isRight });
  });

  const score = {
    total: currentQuiz.questions.length,
    correct,
    percent: Math.round((correct / currentQuiz.questions.length) * 100)
  };

  renderResults(score, answers);
  addToHistory({
    year: currentQuiz.year,
    area: currentQuiz.discipline,
    correct: score.correct,
    total: score.total,
    percent: score.percent
  });
}

function renderResults(score, answers) {
  const rows = answers.map((a, i) => `
    <tr class="${a.isRight ? 'table-success' : 'table-danger'}">
      <td>${i+1}</td>
      <td>${a.index}</td>
      <td>${a.user ?? '—'}</td>
      <td>${a.right}</td>
    </tr>`).join('');

  resultContainer.innerHTML = `
    <div class="card shadow-sm">
      <div class="card-body">
        <h5>Resultado</h5>
        <p><strong>Acertos:</strong> ${score.correct}/${score.total} (${score.percent}%)</p>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead><tr><th>#</th><th>Q.</th><th>Marcada</th><th>Gabarito</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  resultContainer.classList.remove('d-none');
}

// Histórico em memória
function addToHistory(simulado) {
  history.push(simulado);
  renderHistory();
}

function renderHistory() {
  if (!history.length) {
    historyContainer.classList.add('d-none');
    historyList.innerHTML = '';
    return;
  }
  historyContainer.classList.remove('d-none');
  historyList.innerHTML = history.map((h) =>
    `<li class="list-group-item">
       <strong>${h.year}</strong> - ${h.area} - Acertos: ${h.correct}/${h.total} (${h.percent}%)
     </li>`).join("");
}
