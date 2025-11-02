<?php
/**
 * Blingus Bardbook Cloud Sync API
 * 
 * This file handles saving and loading user data to/from SQLite database.
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
$dbFile = $dataDir . 'blingus-sync.db';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Initialize SQLite database
function getDB() {
    global $dbFile;
    try {
        $db = new PDO('sqlite:' . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create table if it doesn't exist
        $db->exec("CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            data_key TEXT NOT NULL,
            data_value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, data_key)
        )");
        
        // Create index for faster lookups
        $db->exec("CREATE INDEX IF NOT EXISTS idx_user_key ON user_data(user_id, data_key)");
        
        return $db;
    } catch (PDOException $e) {
        throw new Exception('Database error: ' . $e->getMessage());
    }
}

// Get user ID (for now, using 'default' - can be enhanced with authentication)
function getUserId() {
    // TODO: Get from session/token/authentication
    return 'default';
}

// Get action from query string or POST data
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    $db = getDB();
    $userId = getUserId();
    
    switch ($action) {
        case 'save':
            // Save data to database
            $input = file_get_contents('php://input');
            $request = json_decode($input, true);
            
            if (!$request || !isset($request['data'])) {
                throw new Exception('Invalid data format');
            }
            
            $data = $request['data'];
            $data['serverTimestamp'] = date('c');
            
            // Start transaction
            $db->beginTransaction();
            
            try {
                // Save each data key separately for better granularity
                $keys = [
                    'favorites', 'userItems', 'deletedDefaults', 'history',
                    'voicePresets', 'generators', 'editedGeneratorDefaults',
                    'deletedGeneratorDefaults', 'darkMode', 'version', 'timestamp', 'serverTimestamp'
                ];
                
                foreach ($keys as $key) {
                    if (isset($data[$key])) {
                        $value = is_array($data[$key]) || is_object($data[$key]) 
                            ? json_encode($data[$key]) 
                            : $data[$key];
                        
                        $stmt = $db->prepare("
                            INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, updated_at)
                            VALUES (:user_id, :data_key, :data_value, CURRENT_TIMESTAMP)
                        ");
                        $stmt->execute([
                            ':user_id' => $userId,
                            ':data_key' => $key,
                            ':data_value' => $value
                        ]);
                    }
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Data saved successfully',
                    'timestamp' => $data['serverTimestamp']
                ]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'load':
            // Load data from database
            $stmt = $db->prepare("SELECT data_key, data_value FROM user_data WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($rows)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'No saved data found'
                ]);
                break;
            }
            
            // Reconstruct data object
            $data = [];
            foreach ($rows as $row) {
                $key = $row['data_key'];
                $value = $row['data_value'];
                
                // Try to decode JSON, otherwise use as-is
                $decoded = json_decode($value, true);
                $data[$key] = ($decoded !== null && json_last_error() === JSON_ERROR_NONE) 
                    ? $decoded 
                    : $value;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $data,
                'timestamp' => $data['serverTimestamp'] ?? $data['timestamp'] ?? null
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

