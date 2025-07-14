package cache

import (
	"context"
	"github.com/redis/go-redis/v9"
	"time"
)

type RedisCacheInterface interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string) (interface{}, error)
}

type RedisCache struct {
	client *redis.Client
}

// NewRedisCache は redis.Client を受け取り、RedisCacheInterface を実装するインスタンスを返すコンストラクタ関数です。
func NewRedisCache(client *redis.Client) RedisCacheInterface {
	return &RedisCache{client: client}
}

func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.client.Set(ctx, key, value, expiration).Err()
}

func (c *RedisCache) Get(ctx context.Context, key string) (interface{}, error) {
	return c.client.Get(context.Background(), key).Result()
}
