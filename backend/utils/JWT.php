<?php
class JWT {
    private static $secret = 'your-secret-key-change-in-production';
    private static $algorithm = 'HS256';
    private static $blacklist = [];
    
    public static function generate($payload, $expiresIn = '24h') {
        $header = json_encode(['alg' => self::$algorithm, 'typ' => 'JWT']);
        $payload['iat'] = time();
        $payload['exp'] = strtotime('+' . $expiresIn);
        
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, self::$secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }
    
    public static function verify($token) {
        if (self::isBlacklisted($token)) {
            return null;
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        $header = json_decode(self::base64UrlDecode($parts[0]), true);
        $payload = json_decode(self::base64UrlDecode($parts[1]), true);
        $signature = self::base64UrlDecode($parts[2]);
        
        if (!$header || !$payload) {
            return null;
        }
        
        // Verify signature
        $expectedSignature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], self::$secret, true);
        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    public static function extractTokenFromHeader() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }
        
        return null;
    }
    
    public static function blacklistToken($token) {
        self::$blacklist[] = $token;
        // In production, store in database with expiration
    }
    
    public static function isBlacklisted($token) {
        return in_array($token, self::$blacklist);
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        $base64 = strtr($data, '-_', '+/');
        return base64_decode($base64 . str_repeat('=', 4 - strlen($base64) % 4));
    }
}