<?php
class RateLimiter {
    private static $limits = [
        'login' => ['requests' => 5, 'window' => 900], // 5 requests per 15 minutes
        'register' => ['requests' => 3, 'window' => 3600], // 3 requests per hour
        'content' => ['requests' => 100, 'window' => 3600], // 100 requests per hour
        'default' => ['requests' => 1000, 'window' => 3600] // 1000 requests per hour
    ];
    
    private static $attempts = [];
    
    public static function check($key, $ip = null) {
        $ip = $ip ?? $_SERVER['REMOTE_ADDR'];
        $limit = self::$limits[$key] ?? self::$limits['default'];
        
        $now = time();
        $windowStart = $now - $limit['window'];
        
        // Clean old attempts
        if (isset(self::$attempts[$ip])) {
            self::$attempts[$ip] = array_filter(self::$attempts[$ip], function($timestamp) use ($windowStart) {
                return $timestamp > $windowStart;
            });
        } else {
            self::$attempts[$ip] = [];
        }
        
        // Check current attempts
        $currentAttempts = count(self::$attempts[$ip]);
        
        if ($currentAttempts >= $limit['requests']) {
            http_response_code(429);
            echo json_encode([
                'error' => 'Too many requests',
                'message' => 'Rate limit exceeded. Please try again later.',
                'retryAfter' => $limit['window'] - ($now - (self::$attempts[$ip][0] ?? $now))
            ]);
            exit;
        }
        
        // Record this attempt
        self::$attempts[$ip][] = $now;
        return true;
    }
    
    public static function recordAttempt($key, $ip = null) {
        // This is automatically called in check()
    }
}

class SecurityMiddleware {
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        // Remove HTML tags
        $input = strip_tags($input);
        
        // Remove potential JavaScript
        $input = preg_replace('/javascript:/i', '', $input);
        $input = preg_replace('/on\w+=/i', '', $input);
        
        // Remove potential SQL injection
        $input = preg_replace('/[\'";]/', '', $input);
        
        return trim($input);
    }
    
    public static function validateCSRF($token) {
        // Simple CSRF validation - in production, use more secure method
        $sessionToken = $_SESSION['csrf_token'] ?? '';
        return hash_equals($sessionToken, $token);
    }
    
    public static function generateCSRFToken() {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        return $token;
    }
    
    public static function validateContentType($expectedType = 'application/json') {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        return strpos($contentType, $expectedType) !== false;
    }
    
    public static function logSecurity($event, $details = []) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'],
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'event' => $event,
            'details' => $details
        ];
        
        error_log("SECURITY: " . json_encode($logEntry));
        
        // In production, store in database
        file_put_contents(__DIR__ . '/../logs/security.log', json_encode($logEntry) . "\n", FILE_APPEND);
    }
    
    public static function detectSuspiciousActivity($data) {
        $suspicious = [];
        
        // Check for common injection patterns
        $patterns = [
            '/union.*select/i',
            '/script.*>/i',
            '/drop.*table/i',
            '/insert.*into/i',
            '/update.*set/i',
            '/delete.*from/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $data)) {
                $suspicious[] = 'Potential injection detected';
            }
        }
        
        // Check for excessive length
        if (strlen($data) > 10000) {
            $suspicious[] = 'Excessive input length';
        }
        
        if (!empty($suspicious)) {
            self::logSecurity('Suspicious activity detected', [
                'patterns' => $suspicious,
                'dataLength' => strlen($data)
            ]);
            return true;
        }
        
        return false;
    }
}

// CORS Handler
class CORSMiddleware {
    public static function handle() {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://yourdomain.com' // Add production domain
        ];
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: *");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 3600");
    }
}

// Input validation middleware
class InputValidationMiddleware {
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Missing required fields',
                'fields' => $missing
            ]);
            exit;
        }
        
        return true;
    }
    
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    public static function validatePassword($password) {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Password validation failed',
                'messages' => $errors
            ]);
            exit;
        }
        
        return true;
    }
}