<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class SocialMediaController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function connectFacebook() {
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
            
            $appId = $data['appId'] ?? '';
            $appSecret = $data['appSecret'] ?? '';
            $pageToken = $data['pageToken'] ?? '';
            
            if (empty($appId) || empty($appSecret)) {
                http_response_code(400);
                echo json_encode(['error' => 'Facebook App ID and Secret are required']);
                return;
            }
            
            // Store connection (in production, use secure storage)
            $connection = [
                'platform' => 'facebook',
                'app_id' => $appId,
                'user_id' => $payload['userId'],
                'page_token' => $pageToken,
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ];
            
            $this->db->insert('social_connections', $connection);
            
            echo json_encode([
                'success' => true,
                'message' => 'Facebook connection established',
                'connectionId' => uniqid()
            ]);
            
        } catch (Exception $e) {
            error_log("Facebook connect error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function connectInstagram() {
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
            
            $accessToken = $data['accessToken'] ?? '';
            $businessId = $data['businessId'] ?? '';
            
            if (empty($accessToken)) {
                http_response_code(400);
                echo json_encode(['error' => 'Instagram Access Token is required']);
                return;
            }
            
            // Store connection
            $connection = [
                'platform' => 'instagram',
                'access_token' => $accessToken,
                'business_id' => $businessId,
                'user_id' => $payload['userId'],
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ];
            
            $this->db->insert('social_connections', $connection);
            
            echo json_encode([
                'success' => true,
                'message' => 'Instagram connection established',
                'connectionId' => uniqid()
            ]);
            
        } catch (Exception $e) {
            error_log("Instagram connect error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function connectTwitter() {
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
            
            $apiKey = $data['apiKey'] ?? '';
            $apiSecret = $data['apiSecret'] ?? '';
            $accessToken = $data['accessToken'] ?? '';
            $refreshToken = $data['refreshToken'] ?? '';
            
            if (empty($apiKey) || empty($apiSecret) || empty($accessToken)) {
                http_response_code(400);
                echo json_encode(['error' => 'Twitter API Key, Secret, and Access Token are required']);
                return;
            }
            
            // Store connection
            $connection = [
                'platform' => 'twitter',
                'api_key' => $apiKey,
                'api_secret' => $apiSecret,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'user_id' => $payload['userId'],
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ];
            
            $this->db->insert('social_connections', $connection);
            
            echo json_encode([
                'success' => true,
                'message' => 'Twitter connection established',
                'connectionId' => uniqid()
            ]);
            
        } catch (Exception $e) {
            error_log("Twitter connect error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getConnections() {
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
            $connections = $this->db->select(
                'social_connections',
                'platform, status, created_at',
                'user_id = ?',
                [$userId],
                'created_at DESC'
            );
            
            echo json_encode([
                'success' => true,
                'connections' => $connections
            ]);
            
        } catch (Exception $e) {
            error_log("Get connections error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function publishToPlatforms() {
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
            
            $postId = $data['postId'] ?? '';
            $platforms = $data['platforms'] ?? [];
            
            if (empty($postId) || empty($platforms)) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID and platforms are required']);
                return;
            }
            
            // Get post details
            $post = $this->db->selectOne('generated_posts', 'topic, caption, image_url', 'id = ?', [$postId]);
            if (!$post) {
                http_response_code(404);
                echo json_encode(['error' => 'Post not found']);
                return;
            }
            
            $publishedPlatforms = [];
            $publishErrors = [];
            
            foreach ($platforms as $platform) {
                // Get platform connection
                $connection = $this->db->selectOne(
                    'social_connections',
                    '*',
                    'user_id = ? AND platform = ? AND status = ?',
                    [$payload['userId'], $platform, 'active']
                );
                
                if ($connection) {
                    $result = $this->publishToSpecificPlatform($platform, $post, $connection);
                    
                    if ($result['success']) {
                        $publishedPlatforms[] = $platform;
                    } else {
                        $publishErrors[] = $platform . ': ' . $result['error'];
                    }
                } else {
                    $publishErrors[] = $platform . ': No active connection';
                }
            }
            
            // Update post status
            if (!empty($publishedPlatforms)) {
                $this->db->update(
                    'generated_posts',
                    [
                        'status' => 'Published',
                        'published_at' => date('Y-m-d H:i:s'),
                        'published_platforms' => json_encode($publishedPlatforms)
                    ],
                    'id = ?',
                    [$postId]
                );
            }
            
            echo json_encode([
                'success' => true,
                'publishedPlatforms' => $publishedPlatforms,
                'errors' => $publishErrors,
                'message' => 'Post published to ' . count($publishedPlatforms) . ' platforms'
            ]);
            
        } catch (Exception $e) {
            error_log("Publish to platforms error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    private function publishToSpecificPlatform($platform, $post, $connection) {
        try {
            switch ($platform) {
                case 'facebook':
                    return $this->publishToFacebook($post, $connection);
                    
                case 'instagram':
                    return $this->publishToInstagram($post, $connection);
                    
                case 'twitter':
                    return $this->publishToTwitter($post, $connection);
                    
                default:
                    return ['success' => false, 'error' => 'Unsupported platform'];
            }
        } catch (Exception $e) {
            error_log("Publish to $platform error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function publishToFacebook($post, $connection) {
        try {
            // Simulate Facebook API call
            $pageToken = $connection['page_token'];
            $message = $post['caption'];
            $imageUrl = $post['image_url'];
            
            // In production, you would use Facebook Graph API
            $postId = 'fb_' . uniqid(); // Simulated
            
            // Store publish record
            $publishRecord = [
                'post_id' => $post['id'],
                'platform' => 'facebook',
                'platform_post_id' => $postId,
                'user_id' => $connection['user_id'],
                'published_at' => date('Y-m-d H:i:s'),
                'status' => 'published'
            ];
            
            $this->db->insert('social_publishes', $publishRecord);
            
            return ['success' => true, 'postId' => $postId];
            
        } catch (Exception $e) {
            error_log("Facebook publish error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function publishToInstagram($post, $connection) {
        try {
            $accessToken = $connection['access_token'];
            $message = $post['caption'];
            $imageUrl = $post['image_url'];
            
            // In production, you would use Instagram Basic Display API
            $postId = 'ig_' . uniqid(); // Simulated
            
            // Store publish record
            $publishRecord = [
                'post_id' => $post['id'],
                'platform' => 'instagram',
                'platform_post_id' => $postId,
                'user_id' => $connection['user_id'],
                'published_at' => date('Y-m-d H:i:s'),
                'status' => 'published'
            ];
            
            $this->db->insert('social_publishes', $publishRecord);
            
            return ['success' => true, 'postId' => $postId];
            
        } catch (Exception $e) {
            error_log("Instagram publish error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function publishToTwitter($post, $connection) {
        try {
            $accessToken = $connection['access_token'];
            $message = $post['caption'];
            $imageUrl = $post['image_url'];
            
            // In production, you would use Twitter API v2
            $postId = 'tw_' . uniqid(); // Simulated
            
            // Store publish record
            $publishRecord = [
                'post_id' => $post['id'],
                'platform' => 'twitter',
                'platform_post_id' => $postId,
                'user_id' => $connection['user_id'],
                'published_at' => date('Y-m-d H:i:s'),
                'status' => 'published'
            ];
            
            $this->db->insert('social_publishes', $publishRecord);
            
            return ['success' => true, 'postId' => $postId];
            
        } catch (Exception $e) {
            error_log("Twitter publish error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function getPublishHistory() {
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
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            
            $history = $this->db->select(
                'social_publishes',
                '*',
                'user_id = ?',
                [$userId],
                'published_at DESC',
                "$limit OFFSET $offset"
            );
            
            echo json_encode([
                'success' => true,
                'history' => $history
            ]);
            
        } catch (Exception $e) {
            error_log("Get publish history error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$socialController = new SocialMediaController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'connect-facebook':
        if ($method === 'POST') $socialController->connectFacebook();
        break;
    case 'connect-instagram':
        if ($method === 'POST') $socialController->connectInstagram();
        break;
    case 'connect-twitter':
        if ($method === 'POST') $socialController->connectTwitter();
        break;
    case 'get-connections':
        if ($method === 'GET') $socialController->getConnections();
        break;
    case 'publish':
        if ($method === 'POST') $socialController->publishToPlatforms();
        break;
    case 'publish-history':
        if ($method === 'GET') $socialController->getPublishHistory();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}