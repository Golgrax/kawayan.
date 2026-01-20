<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required']);
                return;
            }
            
            // Get user from database
            $result = $this->db->selectOne('users', '*', 'email = ?', [$email]);
            
            if (!$result) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }
            
            // Verify password (simple for demo - use password_hash in production)
            if ($result['password_hash'] !== $password && $result['password_hash'] !== 'client_' . $password) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }
            
            // Generate JWT token
            $token = JWT::generate([
                'userId' => $result['id'],
                'email' => $result['email'],
                'role' => $result['role']
            ]);
            
            // Remove password from response
            unset($result['password_hash']);
            
            echo json_encode([
                'success' => true,
                'user' => $result,
                'token' => $token
            ]);
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function register() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $role = $data['role'] ?? 'user';
            $businessName = $data['businessName'] ?? '';
            
            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required']);
                return;
            }
            
            // Check if user already exists
            $existing = $this->db->selectOne('users', 'id', 'email = ?', [$email]);
            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'User already exists']);
                return;
            }
            
            // Create user
            $userData = [
                'id' => uniqid(),
                'email' => $email,
                'password_hash' => 'client_' . $password, // Simple for demo
                'role' => $role,
                'business_name' => $businessName
            ];
            
            $this->db->insert('users', $userData);
            
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log("Register error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function logout() {
        try {
            $token = JWT::extractTokenFromHeader();
            if ($token) {
                // Add token to blacklist if needed
                JWT::blacklistToken($token);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
            
        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
    
    public function verifyToken() {
        try {
            $token = JWT::extractTokenFromHeader();
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'No token provided']);
                return;
            }
            
            $payload = JWT::verify($token);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired token']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'user' => $payload
            ]);
            
        } catch (Exception $e) {
            error_log("Token verification error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$authController = new AuthController();

if ($method === 'OPTIONS') {
    // Handle CORS preflight
    exit;
}

switch ($action) {
    case 'login':
        if ($method === 'POST') $authController->login();
        break;
    case 'register':
        if ($method === 'POST') $authController->register();
        break;
    case 'logout':
        if ($method === 'POST') $authController->logout();
        break;
    case 'verify':
        if ($method === 'GET') $authController->verifyToken();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}