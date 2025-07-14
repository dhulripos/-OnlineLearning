package auth

import (
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func AuthRegisterRoutes(e *echo.Echo, db *gorm.DB, rdb *redis.Client) {
	authHandler := NewAuthHandler(db, rdb)

	// ログイン・ログアウト
	e.POST("/api/auth/login", authHandler.Login)
	e.POST("/api/auth/logout", authHandler.Logout)

	// JWT認証が必要なエンドポイント
	//protected := e.Group("/auth")
	//protected.Use(middleware.JWTMiddleware)
	//protected.GET("/me", authHandler.Me) // 認証済みユーザー情報取得
}
