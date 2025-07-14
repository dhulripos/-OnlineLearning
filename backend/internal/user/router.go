package user

import (
	"OnlineLearningWebApp/pkg/middleware"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// UserRegisterRoutes は認証関連のルーティングを設定する
func UserRegisterRoutes(e *echo.Echo, db *gorm.DB, rdb *redis.Client) {

	// 認証が必要なルート
	protected := e.Group("/api")
	protected.Use(middleware.JWTMiddleware) // JWT認証ミドルウェアを適用（この処理を抜けないと下にはいけない）

	userHandler := NewUserHandler(db, rdb)

	// ユーザー情報編集に対応した情報の取得
	protected.GET("/GetUserInfo", userHandler.GetUserInfo)

	// ユーザー情報編集の更新処理
	protected.POST("/EditUserInfo", userHandler.EditUserInfo)
}
