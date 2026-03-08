<?php
// API endpoint for ESP32 to send sensor data
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

// Accept both GET and POST
$temperature = null;
$humidity = null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $temperature = isset($_GET['temperature']) ? floatval($_GET['temperature']) : null;
    $humidity = isset($_GET['humidity']) ? floatval($_GET['humidity']) : null;
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check for JSON body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if ($data) {
        $temperature = isset($data['temperature']) ? floatval($data['temperature']) : null;
        $humidity = isset($data['humidity']) ? floatval($data['humidity']) : null;
    } else {
        $temperature = isset($_POST['temperature']) ? floatval($_POST['temperature']) : null;
        $humidity = isset($_POST['humidity']) ? floatval($_POST['humidity']) : null;
    }
}

// Validate data
if ($temperature === null || $humidity === null) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Temperature and humidity values are required. Use ?temperature=XX&humidity=XX'
    ]);
    exit;
}

// Validate ranges
if ($temperature < -40 || $temperature > 80) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Temperature out of valid range (-40 to 80°C)'
    ]);
    exit;
}

if ($humidity < 0 || $humidity > 100) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Humidity out of valid range (0 to 100%)'
    ]);
    exit;
}

// Save to database
$conn = getConnection();
$stmt = $conn->prepare("INSERT INTO sensor_data (temperature, humidity) VALUES (?, ?)");
$stmt->bind_param("dd", $temperature, $humidity);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Data saved successfully',
        'data' => [
            'id' => $stmt->insert_id,
            'temperature' => $temperature,
            'humidity' => $humidity,
            'recorded_at' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save data: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>