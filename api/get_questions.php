<?php
header('Content-Type: application/json; charset=utf-8');
$year = $_GET['year'] ?? '2023';
$area = $_GET['area'] ?? 'linguagens';
$lang = $_GET['language'] ?? 'ingles';
$path = __DIR__ . '/../data/' . $year . '_' . $area . '_' . $lang . '.json';
if(!file_exists($path)){
  http_response_code(404);
  echo json_encode(['error'=>'Arquivo não encontrado']); exit;
}
echo file_get_contents($path);
