<?php
// Database Configuration
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dbPath = __DIR__ . '/../../kawayan.db';
            $this->connection = new PDO('sqlite:' . $dbPath);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Enable foreign keys
            $this->connection->exec("PRAGMA foreign_keys = ON");
            // Enable WAL mode for better performance
            $this->connection->exec("PRAGMA journal_mode = WAL");
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage());
            throw new Exception("Database query failed");
        }
    }
    
    public function initializeTables() {
        try {
            // Notifications table
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT DEFAULT 'info',
                    data TEXT,
                    read BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            // Social connections table
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS social_connections (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    app_id TEXT,
                    app_secret TEXT,
                    access_token TEXT,
                    api_key TEXT,
                    api_secret TEXT,
                    page_token TEXT,
                    business_id TEXT,
                    refresh_token TEXT,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ");
            
            // Social publishes table
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS social_publishes (
                    id TEXT PRIMARY KEY,
                    post_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    platform_post_id TEXT,
                    user_id TEXT NOT NULL,
                    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'published',
                    metadata TEXT
                )
            ");
            
            // Update generated_posts table for scheduling
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS scheduled_posts (
                    post_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    schedule_date DATETIME NOT NULL,
                    schedule_time TEXT DEFAULT '09:00',
                    timezone TEXT DEFAULT 'Asia/Manila',
                    auto_publish BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES generated_posts(id) ON DELETE CASCADE
                )
            ");
            
            error_log("Database tables initialized successfully");
            return true;
            
        } catch (Exception $e) {
            error_log("Table initialization error: " . $e->getMessage());
            return false;
        }
    }
    
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        return $this->query($sql, array_values($data));
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        $params = [];
        
        foreach ($data as $column => $value) {
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        
        $setClause = implode(', ', $setParts);
        $sql = "UPDATE $table SET $setClause WHERE $where";
        $params = array_merge($params, $whereParams);
        
        return $this->query($sql, $params);
    }
    
    public function select($table, $columns = '*', $where = '1', $params = [], $orderBy = '', $limit = '') {
        $sql = "SELECT $columns FROM $table WHERE $where";
        
        if ($orderBy) $sql .= " ORDER BY $orderBy";
        if ($limit) $sql .= " LIMIT $limit";
        
        return $this->query($sql, $params);
    }
    
    public function selectOne($table, $columns = '*', $where = '1', $params = []) {
        $result = $this->select($table, $columns, $where, $params, '', '1');
        return $result->fetch();
    }
    
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM $table WHERE $where";
        return $this->query($sql, $params);
    }
    
    public function count($table, $where = '1', $params = []) {
        $result = $this->select($table, 'COUNT(*) as count', $where, $params);
        return (int)$result->fetch()['count'];
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}