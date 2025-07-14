package main

import (
	"OnlineLearningWebApp/internal/auth"
	"OnlineLearningWebApp/internal/notification"
	"OnlineLearningWebApp/internal/question"
	"OnlineLearningWebApp/internal/user"
	"OnlineLearningWebApp/pkg/database"
	"OnlineLearningWebApp/pkg/redis"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"log"
)

func main() {
	// Echoのインスタンス作成
	e := echo.New()

	// CORSの設定
	// AllowCredentials: true を設定することで、ブラウザが withCredentials: true のリクエストを許可できるようになる
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000"}, // フロントエンドのURLを指定
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true, // クッキーや認証情報を許可
	}))

	// ミドルウェア設定
	e.Use(middleware.Logger())
	//e.Use(middleware.Recover())

	// DBとRedisの接続
	db := database.InitDB()
	rdb := redis.ConnectRedis()

	// ルート設定
	auth.AuthRegisterRoutes(e, db, rdb)
	question.QuestionRegisterRoutes(e, db, rdb)
	user.UserRegisterRoutes(e, db, rdb)
	notification.NotificationRegisterRoutes(e, db, rdb)

	// 通知サービスのセットアップ
	notificationService := &notification.NotificationService{DB: db}
	// 通知スケジューラを起動
	notificationService.ScheduleNotifications()

	// サーバー起動
	log.Println("Server started on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}
