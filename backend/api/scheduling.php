<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../services/NotificationService.php';

class SchedulingController {
    private $db;
    private $notificationService;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->notificationService = new NotificationService();
    }
    
    public function schedulePost() {
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
            $scheduleDate = $data['scheduleDate'] ?? '';
            $scheduleTime = $data['scheduleTime'] ?? '09:00';
            $timezone = $data['timezone'] ?? 'Asia/Manila';
            $platforms = $data['platforms'] ?? [];
            $autoPublish = $data['autoPublish'] ?? false;
            
            if (empty($postId) || empty($scheduleDate)) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID and schedule date are required']);
                return;
            }
            
            // Validate schedule date
            $scheduledDateTime = $this->validateScheduleDate($scheduleDate, $scheduleTime, $timezone);
            if (!$scheduledDateTime) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid schedule date or time']);
                return;
            }
            
            // Update post with scheduling info
            $updateData = [
                'status' => 'Scheduled',
                'scheduled_at' => $scheduledDateTime,
                'timezone' => $timezone,
                'auto_publish' => $autoPublish ? 1 : 0
            ];
            
            if (!empty($platforms)) {
                $updateData['platforms'] = json_encode($platforms);
            }
            
            $this->db->update(
                'generated_posts',
                $updateData,
                'id = ?',
                [$postId]
            );
            
            // Create notification
            $post = $this->db->selectOne('generated_posts', 'topic, caption', 'id = ?', [$postId]);
            if ($post) {
                $this->notificationService->notifyPostScheduled(
                    $payload['userId'],
                    $post['topic'],
                    $scheduledDateTime
                );
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Post scheduled successfully',
                'scheduledAt' => $scheduledDateTime
            ]);
            
        } catch (Exception $e) {
            error_log("Schedule post error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function getScheduledPosts() {
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
            
            $scheduledPosts = $this->db->select(
                'generated_posts',
                '*',
                'user_id = ? AND status = ?',
                [$userId, 'Scheduled'],
                'scheduled_at ASC',
                "$limit OFFSET $offset"
            );
            
            echo json_encode([
                'success' => true,
                'posts' => $scheduledPosts
            ]);
            
        } catch (Exception $e) {
            error_log("Get scheduled posts error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function updateSchedule() {
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
            $scheduleDate = $data['scheduleDate'] ?? '';
            $scheduleTime = $data['scheduleTime'] ?? '';
            $timezone = $data['timezone'] ?? 'Asia/Manila';
            $autoPublish = $data['autoPublish'] ?? false;
            
            if (empty($postId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID is required']);
                return;
            }
            
            // Validate new schedule date
            $newScheduledDateTime = $this->validateScheduleDate($scheduleDate, $scheduleTime, $timezone);
            if (!$newScheduledDateTime) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid schedule date or time']);
                return;
            }
            
            // Update scheduling
            $updateData = [
                'scheduled_at' => $newScheduledDateTime,
                'timezone' => $timezone,
                'auto_publish' => $autoPublish ? 1 : 0
            ];
            
            $this->db->update(
                'generated_posts',
                $updateData,
                'id = ?',
                [$postId]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Schedule updated successfully',
                'scheduledAt' => $newScheduledDateTime
            ]);
            
        } catch (Exception $e) {
            error_log("Update schedule error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function cancelSchedule() {
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
            
            if (empty($postId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID is required']);
                return;
            }
            
            // Update status back to Draft
            $this->db->update(
                'generated_posts',
                [
                    'status' => 'Draft',
                    'scheduled_at' => null,
                    'timezone' => null,
                    'auto_publish' => 0
                ],
                'id = ?',
                [$postId]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Schedule cancelled successfully'
            ]);
            
        } catch (Exception $e) {
            error_log("Cancel schedule error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function publishScheduledPosts() {
        try {
            // This would typically be called by a cron job
            $scheduledPosts = $this->db->select(
                'generated_posts',
                '*',
                "status = 'Scheduled' AND scheduled_at <= '" . date('Y-m-d H:i:s') . "'",
                'scheduled_at ASC'
            );
            
            $publishedCount = 0;
            
            foreach ($scheduledPosts as $post) {
                // Get platforms
                $platforms = !empty($post['platforms']) ? json_decode($post['platforms'], true) : [];
                
                // Update status to Published
                $this->db->update(
                    'generated_posts',
                    [
                        'status' => 'Published',
                        'published_at' => date('Y-m-d H:i:s')
                    ],
                    'id = ?',
                    [$post['id']]
                );
                
                // Send notification
                $this->notificationService->notifyPostPublished(
                    $post['user_id'],
                    $post['topic'],
                    implode(', ', $platforms)
                );
                
                $publishedCount++;
            }
            
            echo json_encode([
                'success' => true,
                'message' => "Published $publishedCount scheduled posts"
            ]);
            
        } catch (Exception $e) {
            error_log("Publish scheduled posts error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    private function validateScheduleDate($date, $time, $timezone) {
        try {
            // Create DateTime object with timezone
            $scheduledDate = new DateTime("$date $time", new DateTimeZone($timezone));
            $now = new DateTime('now', new DateTimeZone($timezone));
            
            // Check if date is in the future
            if ($scheduledDate <= $now) {
                return false;
            }
            
            // Check if date is not too far in the future (max 1 year)
            $maxFuture = new DateTime('+1 year', new DateTimeZone($timezone));
            if ($scheduledDate > $maxFuture) {
                return false;
            }
            
            return $scheduledDate->format('Y-m-d H:i:s');
            
        } catch (Exception $e) {
            error_log("Date validation error: " . $e->getMessage());
            return false;
        }
    }
    
    public function getSchedulingAnalytics() {
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
            
            // Get scheduling statistics
            $totalScheduled = $this->db->count('generated_posts', "status = 'Scheduled'");
            $scheduledThisWeek = $this->db->count('generated_posts', "status = 'Scheduled' AND scheduled_at >= date('now', '-7 days') AND scheduled_at <= '" . date('Y-m-d H:i:s') . "'");
            $publishedFromSchedule = $this->db->count('generated_posts', "status = 'Published' AND scheduled_at IS NOT NULL");
            $autoPublishRate = $this->db->count('generated_posts', "auto_publish = 1") / max($this->db->count('generated_posts', "scheduled_at IS NOT NULL"), 1) * 100;
            
            // Average lead time
            $avgLeadTime = $this->db->getConnection()->query("
                SELECT AVG(
                    (julianday(scheduled_at) - julianday(created_at)) / 7
                ) as avg_days
                FROM generated_posts 
                WHERE scheduled_at IS NOT NULL 
                  AND created_at IS NOT NULL
                  AND scheduled_at > created_at
            ")->fetch(PDO::FETCH_ASSOC)['avg_days'];
            
            echo json_encode([
                'success' => true,
                'analytics' => [
                    'totalScheduled' => $totalScheduled,
                    'scheduledThisWeek' => $scheduledThisWeek,
                    'publishedFromSchedule' => $publishedFromSchedule,
                    'autoPublishRate' => round($autoPublishRate, 1),
                    'averageLeadTime' => round($avgLeadTime, 1)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Scheduling analytics error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$schedulingController = new SchedulingController();

if ($method === 'OPTIONS') {
    exit;
}

switch ($action) {
    case 'schedule':
        if ($method === 'POST') $schedulingController->schedulePost();
        break;
    case 'get-scheduled':
        if ($method === 'GET') $schedulingController->getScheduledPosts();
        break;
    case 'update-schedule':
        if ($method === 'PUT') $schedulingController->updateSchedule();
        break;
    case 'cancel-schedule':
        if ($method === 'DELETE') $schedulingController->cancelSchedule();
        break;
    case 'publish-scheduled':
        if ($method === 'POST') $schedulingController->publishScheduledPosts();
        break;
    case 'scheduling-analytics':
        if ($method === 'GET') $schedulingController->getSchedulingAnalytics();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}