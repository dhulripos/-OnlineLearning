package notification

import (
	"OnlineLearningWebApp/pkg/middleware"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// NotificationRegisterRoutes は認証関連のルーティングを設定する
func NotificationRegisterRoutes(e *echo.Echo, db *gorm.DB, rdb *redis.Client) {

	// 認証が必要なルート
	protected := e.Group("/api")
	protected.Use(middleware.JWTMiddleware) // JWT認証ミドルウェアを適用（この処理を抜けないと下にはいけない）

	//notificationHandler := NewNotificationHandler(db, rdb)

	// 通知を取得するAPI
	//protected.GET("/AllGenres", notificationHandler.GetAllGenres)

}
