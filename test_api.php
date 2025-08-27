<?php
header('Content-Type: text/plain; charset=utf-8');

$url = "https://api.enem.dev/v1/exams";

echo "🔎 Testando conexão com a API do ENEM...\n\n";

// tenta buscar
$response = @file_get_contents($url);

if ($response === false) {
    echo "❌ Erro: não consegui acessar a API usando file_get_contents.\n";
    echo "Verifique se no php.ini está habilitado: allow_url_fopen = On\n";
    exit;
}

// se deu certo, mostra os primeiros caracteres da resposta
echo "✅ Consegui acessar a API!\n\n";
echo "Resposta parcial:\n";
echo substr($response, 0, 500); // só pra não poluir muito
