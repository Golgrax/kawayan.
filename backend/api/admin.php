<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class AdminController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getDashboardStats() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload || $payload['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                return;
            }
            
            // Get statistics
            $totalUsers = $this->db->count('users');
            $activeUsers = $this->db->count('users', "role = 'user'");
            $totalPosts = $this->db->count('generated_posts');
            
            // Calculate revenue
            $revenue = $totalUsers * 500;
            
            echo json_encode([
                'success' => true,
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'activeUsers' => $activeUsers,
                    'totalPostsGenerated' => $totalPosts,
                    'revenue' => $revenue
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Admin stats error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getAnalytics() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload || $payload['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                return;
            }
            
            // Get user growth data
            $usersByMonth = $this->db->getConnection()->query("
                SELECT 
                    CASE 
                        WHEN strftime('%m', created_at) = '01' THEN 'Jan'
                        WHEN strftime('%m', created_at) = '02' THEN 'Feb'
                        WHEN strftime('%m', created_at) = '03' THEN 'Mar'
                        WHEN strftime('%m', created_at) = '04' THEN 'Apr'
                        WHEN strftime('%m', created_at) = '05' THEN 'May'
                        WHEN strftime('%m', created_at) = '06' THEN 'Jun'
                        ELSE 'Other'
                    END as month,
                    COUNT(*) as count
                FROM users 
                WHERE created_at >= date('now', '-6 months')
                GROUP BY strftime('%m', created_at)
                ORDER BY strftime('%m', created_at)
            ")->fetchAll(PDO::FETCH_ASSOC);
            
            // Get posts by month
            $postsByMonth = $this->db->getConnection()->query("
                SELECT 
                    CASE 
                        WHEN strftime('%m', created_at) = '01' THEN 'Jan'
                        WHEN strftime('%m', created_at) = '02' THEN 'Feb'
                        WHEN strftime('%m', created_at) = '03' THEN 'Mar'
                        WHEN strftime('%m', created_at) = '04' THEN 'Apr'
                        WHEN strftime('%m', created_at) = '05' THEN 'May'
                        WHEN strftime('%m', created_at) = '06' THEN 'Jun'
                        ELSE 'Other'
                    END as month,
                    COUNT(*) as count
                FROM generated_posts 
                WHERE created_at >= date('now', '-6 months')
                GROUP BY strftime('%m', created_at)
                ORDER BY strftime('%m', created_at)
            ")->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'usersByMonth' => $usersByMonth,
                    'postsByMonth' => $postsByMonth
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Analytics error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getUserManagement() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload || $payload['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                return;
            }
            
            $users = $this->db->select('users', 'id, email, role, business_name, created_at', '', [], 'created_at DESC');
            
            echo json_encode([
                'success' => true,
                'users' => $users
            ]);
            
        } catch (Exception $e) {
            error_log("User management error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$adminController = new AdminController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'stats':
        if ($method === 'GET') $adminController->getDashboardStats();
        break;
    case 'analytics':
        if ($method === 'GET') $adminController->getAnalytics();
        break;
    case 'users':
        if ($method === 'GET') $adminController->getUserManagement();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}