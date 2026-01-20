<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../services/NotificationService.php';

class NotificationController {
    private $notificationService;
    
    public function __construct() {
        $this->notificationService = new NotificationService();
    }
    
    public function getNotifications() {
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
            $limit = $_GET['limit'] ?? 20;
            $offset = $_GET['offset'] ?? 0;
            
            $notifications = $this->notificationService->getUserNotifications($userId, $limit, $offset);
            $unreadCount = $this->notificationService->getUnreadCount($userId);
            
            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'unreadCount' => $unreadCount
            ]);
            
        } catch (Exception $e) {
            error_log("Get notifications error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function markAsRead() {
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
            $notificationId = $data['notificationId'] ?? '';
            $userId = $payload['userId'];
            
            if (empty($notificationId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Notification ID is required']);
                return;
            }
            
            $success = $this->notificationService->markAsRead($notificationId, $userId);
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Notification marked as read'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to mark notification as read']);
            }
            
        } catch (Exception $e) {
            error_log("Mark notification read error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function markAllAsRead() {
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
            $success = $this->notificationService->markAllAsRead($userId);
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'All notifications marked as read'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to mark notifications as read']);
            }
            
        } catch (Exception $e) {
            error_log("Mark all notifications read error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function deleteNotification() {
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
            $notificationId = $data['notificationId'] ?? '';
            $userId = $payload['userId'];
            
            if (empty($notificationId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Notification ID is required']);
                return;
            }
            
            $success = $this->notificationService->deleteNotification($notificationId, $userId);
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Notification deleted'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete notification']);
            }
            
        } catch (Exception $e) {
            error_log("Delete notification error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getUnreadCount() {
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
            $unreadCount = $this->notificationService->getUnreadCount($userId);
            
            echo json_encode([
                'success' => true,
                'unreadCount' => $unreadCount
            ]);
            
        } catch (Exception $e) {
            error_log("Get unread count error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$notificationController = new NotificationController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'get':
        if ($method === 'GET') $notificationController->getNotifications();
        break;
    case 'mark-read':
        if ($method === 'POST') $notificationController->markAsRead();
        break;
    case 'mark-all-read':
        if ($method === 'POST') $notificationController->markAllAsRead();
        break;
    case 'delete':
        if ($method === 'POST') $notificationController->deleteNotification();
        break;
    case 'unread-count':
        if ($method === 'GET') $notificationController->getUnreadCount();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}