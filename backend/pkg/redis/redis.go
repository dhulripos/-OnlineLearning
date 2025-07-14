package redis

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis は Redis クライアントを初期化して返す
func ConnectRedis() *redis.Client {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379" // デフォルトのRedisアドレス
	}

	password := os.Getenv("REDIS_PASSWORD") // Redisのパスワード（設定されていない場合は空）
	db := 0                                 // デフォルトのDB（環境変数で設定したければ変更）

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	// 接続テスト
	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to Redis: %v", err))
	}

	fmt.Println("Redis connected")
	return client
}

// Set関数でセッションを保存
func Set(client *redis.Client, sessionID, userID string, expiration time.Duration) error {
	ctx := context.Background()
	err := client.Set(ctx, sessionID, userID, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set session: %v", err)
	}
	return nil
}

// Get関数でセッションを取得
func Get(client *redis.Client, sessionID string) (string, error) {
	ctx := context.Background()
	userID, err := client.Get(ctx, sessionID).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("session not found")
	}
	if err != nil {
		return "", fmt.Errorf("failed to get session: %v", err)
	}
	return userID, nil
}
