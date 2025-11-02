<?php
/**
 * Blingus Bardbook Cloud Sync API
 * 
 * This file handles saving and loading user data to/from the server.
 * Place this file in /api/blingus-sync.php on your web server.
 * 
 * SECURITY: For production use, add authentication!
 * Example: Check for a session token or API key before allowing access.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration
$dataDir = __DIR__ . '/../data/';
$dataFile = $dataDir . 'blingus-user-data.json';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Get action from query string or POST data
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'save':
            // Save data to server
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['data'])) {
                throw new Exception('Invalid data format');
            }
            
            // Add server timestamp
            $data['data']['serverTimestamp'] = date('c');
            
            // Save to file
            $result = file_put_contents($dataFile, json_encode($data['data'], JSON_PRETTY_PRINT));
            
            if ($result === false) {
                throw new Exception('Failed to save data');
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Data saved successfully',
                'timestamp' => $data['data']['serverTimestamp']
            ]);
            break;
            
        case 'load':
            // Load data from server
            if (!file_exists($dataFile)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'No saved data found'
                ]);
                break;
            }
            
            $fileContent = file_get_contents($dataFile);
            $data = json_decode($fileContent, true);
            
            if (!$data) {
                throw new Exception('Failed to parse saved data');
            }
            
            echo json_encode([
                'success' => true,
                'data' => $data,
                'timestamp' => $data['serverTimestamp'] ?? null
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

