<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class AnalyticsController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getDashboardStats() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token || !JWT::verify($token)) {
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
            
            // Get basic statistics
            $totalUsers = $this->db->count('users');
            $activeUsers = $this->db->count('users', "role = 'user'");
            $totalPosts = $this->db->count('generated_posts');
            $publishedPosts = $this->db->count('generated_posts', "status = 'Published'");
            
            // Revenue calculation
            $revenue = $totalUsers * 500;
            
            // User growth (last 7 days vs previous 7 days)
            $recentUsers = $this->db->count('users', "created_at >= date('now', '-7 days')");
            $previousUsers = $this->db->count('users', "created_at < date('now', '-7 days')");
            
            // Content metrics
            $postsThisWeek = $this->db->count('generated_posts', "created_at >= date('now', '-7 days')");
            $avgVirality = $this->db->getConnection()->query("
                SELECT AVG(virality_score) as avg_score
                FROM generated_posts
                WHERE virality_score IS NOT NULL
            ")->fetch(PDO::FETCH_ASSOC)['avg_score'];
            
            echo json_encode([
                'success' => true,
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'activeUsers' => $activeUsers,
                    'totalPostsGenerated' => $totalPosts,
                    'publishedPosts' => $publishedPosts,
                    'revenue' => $revenue,
                    'userGrowth' => [
                        'recent' => $recentUsers,
                        'previous' => $previousUsers,
                        'growthRate' => $previousUsers > 0 ? round((($recentUsers - $previousUsers) / $previousUsers) * 100, 2) : 0
                    ],
                    'contentMetrics' => [
                        'postsThisWeek' => $postsThisWeek,
                        'averageViralityScore' => round($avgVirality, 1)
                    ]
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Analytics error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getAnalyticsData() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token || !JWT::verify($token)) {
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
            
            // Get time series data (last 30 days)
            $timeSeriesData = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                
                $usersCount = $this->db->count('users', "DATE(created_at) = '$date'");
                $postsCount = $this->db->count('generated_posts', "DATE(created_at) = '$date'");
                
                $timeSeriesData[] = [
                    'date' => $date,
                    'users' => $usersCount,
                    'posts' => $postsCount,
                    'revenue' => $usersCount * 500
                ];
            }
            
            // Performance metrics
            $totalPosts = $this->db->count('generated_posts');
            $recentPosts = $this->db->count('generated_posts', "created_at >= date('now', '-24 hours')");
            
            // User activity by hour
            $userActivity = $this->db->getConnection()->query("
                SELECT HOUR(created_at) as hour, COUNT(*) as count
                FROM generated_posts
                WHERE created_at >= date('now', '-24 hours')
                GROUP BY HOUR(created_at)
                ORDER BY count DESC
                LIMIT 6
            ")->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'timeSeries' => $timeSeriesData,
                    'performance' => [
                        'totalPosts' => $totalPosts,
                        'recentActivity' => $recentPosts,
                        'userActivity' => $userActivity,
                        'systemHealth' => [
                            'status' => 'healthy',
                            'lastCheck' => date('Y-m-d H:i:s')
                        ]
                    ]
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Analytics data error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function exportData($type = 'csv') {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token || !JWT::verify($token)) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $data = $this->getAnalyticsData();
            
            if ($type === 'csv') {
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="analytics_export.csv"');
                
                $output = fopen('php://output', 'w');
                fputcsv($output, ['Date', 'Users', 'Posts', 'Revenue']);
                
                foreach ($data['data']['timeSeries'] as $row) {
                    fputcsv($output, [$row['date'], $row['users'], $row['posts'], $row['revenue']]);
                }
                
                fclose($output);
            } else {
                echo json_encode($data);
            }
            
        } catch (Exception $e) {
            error_log("Export data error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$analyticsController = new AnalyticsController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'dashboard':
        if ($method === 'GET') $analyticsController->getDashboardStats();
        break;
    case 'data':
        if ($method === 'GET') $analyticsController->getAnalyticsData();
        break;
    case 'export':
        if ($method === 'GET') $analyticsController->exportData($_GET['type'] ?? 'csv');
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}