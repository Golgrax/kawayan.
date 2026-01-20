<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class ContentController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function generateContentPlan() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Generate sample content plan
            $contentPlan = [
                [
                    'day' => 1,
                    'title' => 'New Month Kickoff',
                    'topic' => 'Start the month with our amazing products',
                    'format' => 'Image'
                ],
                [
                    'day' => 7,
                    'title' => 'Weekend Special',
                    'topic' => 'Weekend promotion and deals',
                    'format' => 'Carousel'
                ],
                [
                    'day' => 14,
                    'title' => 'Customer Spotlight',
                    'topic' => 'Feature customer success stories',
                    'format' => 'Image'
                ],
                [
                    'day' => 21,
                    'title' => 'Product Tips',
                    'topic' => 'How to get the most from our products',
                    'format' => 'Video'
                ],
                [
                    'day' => 28,
                    'title' => 'Month End Review',
                    'topic' => 'Thank customers and preview next month',
                    'format' => 'Carousel'
                ]
            ];
            
            echo json_encode([
                'success' => true,
                'content' => $contentPlan
            ]);
            
        } catch (Exception $e) {
            error_log("Content generation error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function savePost() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $postData = [
                'id' => uniqid(),
                'user_id' => $payload['userId'],
                'date' => $data['date'] ?? date('Y-m-d'),
                'topic' => $data['topic'] ?? '',
                'caption' => $data['caption'] ?? '',
                'image_prompt' => $data['imagePrompt'] ?? '',
                'image_url' => $data['imageUrl'] ?? null,
                'status' => $data['status'] ?? 'Draft',
                'virality_score' => $data['viralityScore'] ?? null,
                'virality_reason' => $data['viralityReason'] ?? null,
                'format' => $data['format'] ?? null
            ];
            
            $this->db->insert('generated_posts', $postData);
            
            echo json_encode([
                'success' => true,
                'message' => 'Post saved successfully',
                'postId' => $postData['id']
            ]);
            
        } catch (Exception $e) {
            error_log("Save post error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getUserPosts() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'Authentication required']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid token']);
                return;
            }
            
            $userId = $payload['userId'];
            $posts = $this->db->select('generated_posts', '*', 'user_id = ?', [$userId], 'date DESC');
            
            echo json_encode([
                'success' => true,
                'posts' => $posts
            ]);
            
        } catch (Exception $e) {
            error_log("Get posts error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getTrendingTopics() {
        try {
            $topics = [
                'Payday Sale',
                'Weekend',
                'Food Trip',
                'New Arrival',
                'Christmas Season',
                'Summer Sale',
                'Back to School'
            ];
            
            echo json_encode([
                'success' => true,
                'topics' => $topics
            ]);
            
        } catch (Exception $e) {
            error_log("Trending topics error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$contentController = new ContentController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'generate-plan':
        if ($method === 'POST') $contentController->generateContentPlan();
        break;
    case 'save-post':
        if ($method === 'POST') $contentController->savePost();
        break;
    case 'get-posts':
        if ($method === 'GET') $contentController->getUserPosts();
        break;
    case 'trending-topics':
        if ($method === 'GET') $contentController->getTrendingTopics();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}