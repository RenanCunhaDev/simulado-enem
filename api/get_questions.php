<?php
header('Content-Type: application/json');

// Pega parâmetros
$year = isset($_GET['year']) ? intval($_GET['year']) : 2023;
$area = isset($_GET['area']) ? $_GET['area'] : null;
$language = isset($_GET['language']) ? $_GET['language'] : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

// Monta URL da API ENEM
$url = "https://api.enem.dev/v1/exams/$year/questions?limit=$limit";
if ($language) $url .= "&language=$language";

// Chama a API
$response = @file_get_contents($url);

if ($response === false) {
    echo json_encode(["error" => "Falha ao acessar API via file_get_contents"]);
    exit;
}

$data = json_decode($response, true);

if (!isset($data['questions'])) {
    echo json_encode(["error" => "Resposta inválida da API"]);
    exit;
}

// Filtra por área (se fornecida)
if ($area) {
    $data['questions'] = array_filter($data['questions'], function($q) use ($area) {
        if (isset($q['area'])) return $q['area'] === $area;
        return true; // se não existir área, mantém
    });
    $data['questions'] = array_values($data['questions']); // reorganiza índices
}

// Garante que cada questão tenha os campos esperados
foreach ($data['questions'] as &$q) {
    $q['text'] = $q['text'] ?? $q['statement'] ?? $q['content'] ?? '';
    $q['imageUrl'] = $q['imageUrl'] ?? ($q['image'] ?? null);
}

echo json_encode($data);
