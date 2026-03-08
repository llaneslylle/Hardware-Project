<?php
// API endpoint for dashboard to retrieve sensor data
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

$conn = getConnection();

$action = isset($_GET['action']) ? $_GET['action'] : 'latest';

switch ($action) {
    
    // Get latest reading
    case 'latest':
        $stmt = $conn->prepare("SELECT * FROM sensor_data ORDER BY recorded_at DESC LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row) {
            echo json_encode([
                'status' => 'success',
                'data' => $row
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'data' => null,
                'message' => 'No data available'
            ]);
        }
        $stmt->close();
        break;
    
    // Get historical data for charts
    case 'history':
        $hours = isset($_GET['hours']) ? intval($_GET['hours']) : 24;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        
        // Cap the limit
        if ($limit > 1000) $limit = 1000;
        
        $stmt = $conn->prepare(
            "SELECT id, temperature, humidity, recorded_at 
             FROM sensor_data 
             WHERE recorded_at >= NOW() - INTERVAL ? HOUR 
             ORDER BY recorded_at ASC 
             LIMIT ?"
        );
        $stmt->bind_param("ii", $hours, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        echo json_encode([
            'status' => 'success',
            'count' => count($data),
            'data' => $data
        ]);
        $stmt->close();
        break;
    
    // Get statistics (min, max, avg)
    case 'stats':
        $hours = isset($_GET['hours']) ? intval($_GET['hours']) : 24;
        
        $stmt = $conn->prepare(
            "SELECT 
                COUNT(*) as total_readings,
                ROUND(MIN(temperature), 1) as min_temp,
                ROUND(MAX(temperature), 1) as max_temp,
                ROUND(AVG(temperature), 1) as avg_temp,
                ROUND(MIN(humidity), 1) as min_humidity,
                ROUND(MAX(humidity), 1) as max_humidity,
                ROUND(AVG(humidity), 1) as avg_humidity,
                MIN(recorded_at) as first_reading,
                MAX(recorded_at) as last_reading
             FROM sensor_data 
             WHERE recorded_at >= NOW() - INTERVAL ? HOUR"
        );
        $stmt->bind_param("i", $hours);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        echo json_encode([
            'status' => 'success',
            'period_hours' => $hours,
            'data' => $row
        ]);
        $stmt->close();
        break;
    
    // Get all records with pagination
    case 'all':
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $per_page = isset($_GET['per_page']) ? intval($_GET['per_page']) : 20;
        $offset = ($page - 1) * $per_page;
        
        // Get total count
        $count_result = $conn->query("SELECT COUNT(*) as total FROM sensor_data");
        $total = $count_result->fetch_assoc()['total'];
        
        $stmt = $conn->prepare(
            "SELECT * FROM sensor_data ORDER BY recorded_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->bind_param("ii", $per_page, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        echo json_encode([
            'status' => 'success',
            'page' => $page,
            'per_page' => $per_page,
            'total' => intval($total),
            'total_pages' => ceil($total / $per_page),
            'data' => $data
        ]);
        $stmt->close();
        break;
    
    default:
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action. Use: latest, history, stats, or all'
        ]);
}

$conn->close();
?>