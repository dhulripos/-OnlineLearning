package question

import (
	"OnlineLearningWebApp/pkg/middleware"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// QuestionRegisterRoutes は認証関連のルーティングを設定する
func QuestionRegisterRoutes(e *echo.Echo, db *gorm.DB, rdb *redis.Client) {

	// 認証が必要なルート
	protected := e.Group("/api")
	protected.Use(middleware.JWTMiddleware) // JWT認証ミドルウェアを適用（この処理を抜けないと下にはいけない）

	questionHandler := NewQuestionHandler(db, rdb)

	// ジャンル取得API
	protected.GET("/AllGenres", questionHandler.GetAllGenres)

	// 問題作成API
	protected.POST("/InsertQuestion", questionHandler.InsertQuestions)

	// 問題集検索
	protected.GET("/SearchQuestions", questionHandler.SearchQuestions)

	// QuestionIdsを元に問題集を取得
	protected.GET("/GetQuestionsByQuestionIds", questionHandler.GetQuestionsByQuestionIds)

	// 問題集詳細を取得
	protected.GET("/GetQuestionSet", questionHandler.GetQuestionSet)

	// 問題集回答の提出
	protected.POST("/SubmitQuestions", questionHandler.SubmitQuestions)

	// 回答結果の取得（24時間だけ保持）
	protected.GET("/GetSubmittedQuestions", questionHandler.GetSubmissionResult)

	// マイ学習リストに追加
	protected.POST("/RegisterMyQuestions", questionHandler.RegisterMyQuestions)

	// マイ学習リスト表示
	protected.GET("/GetMyQuestionList", questionHandler.GetMyQuestionList)

	// マイ学習リストに追加している問題を対象に、問題集を評価する
	protected.POST("/RatingQuestionSet", questionHandler.RatingQuestionSet)

	// お気に入り登録
	protected.POST("/AddToFavorite", questionHandler.AddToFavorite)

	// お気に入り問題集検索
	protected.GET("/SearchFavoriteQuestions", questionHandler.SearchFavoriteQuestions)
}
