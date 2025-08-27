<?php
// index.php
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Simulado ENEM</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="assets/css/styles.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-dark bg-dark">
  <div class="container"><span class="navbar-brand">Simulado ENEM</span></div>
</nav>

<main class="container py-4">
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Configurar simulado</h5>
      <form id="configForm" class="row g-3">
        <div class="col-12 col-md-3">
          <label class="form-label">Ano</label>
          <select id="year" class="form-select" required></select>
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Área</label>
          <select id="discipline" class="form-select" required>
            <option value="ciencias-humanas">Ciências Humanas</option>
            <option value="ciencias-natureza">Ciências da Natureza</option>
            <option value="linguagens">Linguagens</option>
            <option value="matematica">Matemática</option>
          </select>
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Idioma (opcional)</label>
          <select id="language" class="form-select">
            <option value="">Qualquer</option>
            <option value="ingles">Inglês</option>
            <option value="espanhol">Espanhol</option>
          </select>
        </div>
        <div class="col-12 col-md-2">
          <label class="form-label">Qtd. questões</label>
          <input id="limit" type="number" class="form-control" min="1" max="45" value="10" required>
        </div>
        <div class="col-12 d-flex gap-2">
          <button id="startBtn" type="submit" class="btn btn-primary">Começar</button>
          <button id="resetBtn" type="button" class="btn btn-outline-secondary d-none">Reiniciar</button>
        </div>
      </form>
    </div>
  </div>

  <div id="quizContainer" class="mt-4 d-none"></div>
  <div id="resultContainer" class="mt-4 d-none"></div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
