<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class NotificationService {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function createNotification($userId, $title, $message, $type = 'info', $data = []) {
        try {
            $notification = [
                'id' => uniqid(),
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'data' => json_encode($data),
                'read' => false,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('notifications', $notification);
            
            // Send real-time notification if WebSocket is available
            $this->sendRealTimeNotification($userId, $notification);
            
            return $notification['id'];
        } catch (Exception $e) {
            error_log("Create notification error: " . $e->getMessage());
            throw new Exception("Failed to create notification");
        }
    }
    
    public function getUserNotifications($userId, $limit = 20, $offset = 0) {
        try {
            $notifications = $this->db->select(
                'notifications', 
                '*', 
                'user_id = ?', 
                [$userId], 
                'created_at DESC', 
                "$limit OFFSET $offset"
            );
            
            return $notifications;
        } catch (Exception $e) {
            error_log("Get notifications error: " . $e->getMessage());
            return [];
        }
    }
    
    public function markAsRead($notificationId, $userId) {
        try {
            $this->db->update(
                'notifications',
                ['read' => true, 'read_at' => date('Y-m-d H:i:s')],
                'id = ? AND user_id = ?',
                [$notificationId, $userId]
            );
            
            return true;
        } catch (Exception $e) {
            error_log("Mark notification read error: " . $e->getMessage());
            return false;
        }
    }
    
    public function markAllAsRead($userId) {
        try {
            $this->db->update(
                'notifications',
                ['read' => true, 'read_at' => date('Y-m-d H:i:s')],
                'user_id = ? AND read = 0',
                [$userId]
            );
            
            return true;
        } catch (Exception $e) {
            error_log("Mark all notifications read error: " . $e->getMessage());
            return false;
        }
    }
    
    public function getUnreadCount($userId) {
        try {
            $count = $this->db->count('notifications', 'user_id = ? AND read = 0', [$userId]);
            return $count;
        } catch (Exception $e) {
            error_log("Get unread count error: " . $e->getMessage());
            return 0;
        }
    }
    
    public function deleteNotification($notificationId, $userId) {
        try {
            $this->db->delete('notifications', 'id = ? AND user_id = ?', [$notificationId, $userId]);
            return true;
        } catch (Exception $e) {
            error_log("Delete notification error: " . $e->getMessage());
            return false;
        }
    }
    
    public function createBulkNotification($userIds, $title, $message, $type = 'info', $data = []) {
        try {
            $successCount = 0;
            
            foreach ($userIds as $userId) {
                $notificationId = $this->createNotification($userId, $title, $message, $type, $data);
                if ($notificationId) {
                    $successCount++;
                }
            }
            
            return $successCount;
        } catch (Exception $e) {
            error_log("Bulk notification error: " . $e->getMessage());
            return 0;
        }
    }
    
    // System notifications
    public function notifyContentGenerated($userId, $postTitle) {
        return $this->createNotification(
            $userId,
            'Content Generated',
            "Your post '$postTitle' has been generated successfully!",
            'success',
            ['postId' => $postTitle]
        );
    }
    
    public function notifyPostScheduled($userId, $postTitle, $scheduleDate) {
        return $this->createNotification(
            $userId,
            'Post Scheduled',
            "Your post '$postTitle' has been scheduled for $scheduleDate",
            'info',
            ['postId' => $postTitle, 'scheduleDate' => $scheduleDate]
        );
    }
    
    public function notifyPostPublished($userId, $postTitle, $platform = 'Social Media') {
        return $this->createNotification(
            $userId,
            'Post Published',
            "Your post '$postTitle' has been published to $platform!",
            'success',
            ['postId' => $postTitle, 'platform' => $platform]
        );
    }
    
    public function notifyLoginAttempt($email, $success, $ip = null) {
        $title = $success ? 'Login Successful' : 'Login Failed';
        $message = $success 
            ? "You successfully logged in from $ip"
            : "Failed login attempt from $ip";
        $type = $success ? 'info' : 'warning';
        
        // Get user ID for successful logins
        $userId = null;
        if ($success) {
            $user = $this->db->selectOne('users', 'id', 'email = ?', [$email]);
            $userId = $user['id'] ?? null;
        }
        
        if ($userId) {
            return $this->createNotification(
                $userId,
                $title,
                $message,
                $type,
                ['ip' => $ip, 'timestamp' => date('Y-m-d H:i:s')]
            );
        }
        
        return null;
    }
    
    public function notifySystemMaintenance($startTime, $duration) {
        // Get all users for system-wide notification
        $users = $this->db->select('users', 'id');
        $userIds = array_column($users, 'id');
        
        return $this->createBulkNotification(
            $userIds,
            'System Maintenance',
            "Scheduled maintenance starting at $startTime for approximately $duration hours",
            'warning',
            ['startTime' => $startTime, 'duration' => $duration]
        );
    }
    
    private function sendRealTimeNotification($userId, $notification) {
        // This would integrate with WebSocket server
        // For now, we'll just log it
        error_log("Real-time notification for user $userId: " . json_encode($notification));
        
        // In production, you would:
        // 1. Connect to WebSocket server
        // 2. Send notification to user's channel
        // 3. Handle connection errors gracefully
    }
    
    public function cleanupOldNotifications($daysOld = 30) {
        try {
            $cutoffDate = date('Y-m-d H:i:s', strtotime("-$daysOld days"));
            
            $this->db->delete('notifications', 'created_at < ?', [$cutoffDate]);
            
            error_log("Cleaned up notifications older than $daysOld days");
            return true;
        } catch (Exception $e) {
            error_log("Notification cleanup error: " . $e->getMessage());
            return false;
        }
    }
}

// Real-time WebSocket simulation (for demo)
class WebSocketNotifier {
    private static $clients = [];
    
    public static function addClient($userId, $connection) {
        self::$clients[$userId] = $connection;
        error_log("WebSocket client added: $userId");
    }
    
    public static function removeClient($userId) {
        unset(self::$clients[$userId]);
        error_log("WebSocket client removed: $userId");
    }
    
    public static function broadcastToUser($userId, $message) {
        if (isset(self::$clients[$userId])) {
            // Send message to specific user
            $data = json_encode([
                'type' => 'notification',
                'userId' => $userId,
                'message' => $message,
                'timestamp' => time()
            ]);
            
            // In real WebSocket implementation:
            // self::$clients[$userId]->send($data);
            
            error_log("WebSocket message sent to $userId: " . $data);
            return true;
        }
        
        return false;
    }
    
    public static function broadcastToAll($message) {
        $data = json_encode([
            'type' => 'broadcast',
            'message' => $message,
            'timestamp' => time()
        ]);
        
        foreach (self::$clients as $userId => $connection) {
            // In real WebSocket implementation:
            // $connection->send($data);
            error_log("WebSocket broadcast to $userId");
        }
    }
}