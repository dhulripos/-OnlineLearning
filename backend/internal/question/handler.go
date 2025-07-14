package question

import (
	"OnlineLearningWebApp/internal/cache"
	"OnlineLearningWebApp/pkg/utils"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// QuestionHandler は認証関連の処理を提供する構造体
type QuestionHandler struct {
	Service QuestionServiceInterface
	Cache   cache.RedisCacheInterface
}

// NewQuestionHandler は QuestionHandler を生成
func NewQuestionHandler(db *gorm.DB, rdb *redis.Client) *QuestionHandler {
	// repositoryの生成: GormRepositoryはQuestionRepositoryを実装している前提
	repo := &GormRepository{DB: db}

	// serviceの生成: QuestionServiceはQuestionServiceInterfaceを実装している前提
	service := &QuestionService{Repo: repo}

	// キャッシュの生成: cache.NewRedisCache を使って RedisCacheInterface の実装を取得
	redisCache := cache.NewRedisCache(rdb)

	return &QuestionHandler{
		Service: service,
		Cache:   redisCache,
	}
}

// GetAllGenres ジャンルテーブルからすべてのジャンルを取得する（認証必須）
func (q *QuestionHandler) GetAllGenres(c echo.Context) error {
	// JWTミドルウェアでセットされた user_id を取得
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// 全ジャンルを取得する
	genres, err := q.Service.GetAllGenres()
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": err.Error()})
	}

	// 取得したジャンル情報と user_id を一緒に返す
	return c.JSON(http.StatusOK, echo.Map{
		"user_id": userID,
		"genres":  genres,
	})
}

// GetQuestionSet
// 問題集詳細を取得
func (q *QuestionHandler) GetQuestionSet(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// リクエストパラメータから問題セットIDを取得
	QuestionSetIDStr := c.QueryParam("question_set_id")
	QuestionSetID, err := strconv.Atoi(QuestionSetIDStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	// 画面に表示するデータを返す構造体
	resData, err := q.Service.GetQuestionsByQuestionSetId(QuestionSetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	count, err := q.Service.CountMyQuestions(userID, QuestionSetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	if count > 0 {
		resData[0].IsRegistered = true
	} else {
		resData[0].IsRegistered = false
	}

	myStar, err := q.Service.CountAndEvaluateByUser(userID, QuestionSetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	if myStar.Count > 0 {
		resData[0].IsEvaluated = true
	} else {
		resData[0].IsEvaluated = false
	}
	resData[0].Evaluate = myStar.Evaluate

	return c.JSON(http.StatusOK, resData)
}

// RegisterMyQuestions
// マイ学習リストに追加
func (q *QuestionHandler) RegisterMyQuestions(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	QuestionSetIDStr := c.QueryParam("question_set_id")
	QuestionSetID, err := strconv.Atoi(QuestionSetIDStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	// 期限の日付への変換
	DeadlineStr := c.QueryParam("deadline")
	if DeadlineStr == "" {
		return c.String(http.StatusBadRequest, "deadline is required")
	}

	// YYYY-MM-DD のフォーマットでパース
	layout := "2006-01-02"
	deadline, err := time.Parse(layout, DeadlineStr)
	if err != nil {
		log.Println("Error parsing deadline:", err)
		return c.String(http.StatusBadRequest, "Invalid deadline format. Expected format: YYYY-MM-DD")
	}

	// すでに登録済みであるか確認する
	count, err := q.Service.CountMyQuestions(userID, QuestionSetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	if count > 0 {
		return c.String(http.StatusConflict, "Question already exists")
	}

	// リクエストボディを取得する
	var reqBody MyQuestion
	reqBody.UserID = userID
	reqBody.QuestionSetID = QuestionSetID
	reqBody.Deadline = deadline

	// 登録処理
	if err := q.Service.InsertMyQuestion(reqBody); err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, nil)

}

// GetMyQuestionList
// マイ学習リストに表示するデータを取得する
func (q *QuestionHandler) GetMyQuestionList(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// pageとlimitをパラメータから受け取る
	pageStr := c.QueryParam("page")
	page, err := strconv.Atoi(pageStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	limitStr := c.QueryParam("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	// サービスからデータを取得
	questions, totalCount, err := q.Service.GetMyQuestionList(userID, page, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"totalCount": totalCount,
		"questions":  questions,
	})

}

// RatingQuestionSet
// マイ学習リストに追加している問題を対象に、問題集を評価する
func (q *QuestionHandler) RatingQuestionSet(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// パラメータの取得と変換
	questionSetIDStr := c.QueryParam("question_set_id")
	questionSetID, err := strconv.Atoi(questionSetIDStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	ratingStr := c.QueryParam("rating")
	rating, err := strconv.Atoi(ratingStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}
	if rating < 1 || rating > 5 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "rating must be between 1 and 5"})
	}

	// GORM のトランザクションで更新処理を実施
	avgStar, err := q.Service.InsertOrUpdateStarRating(questionSetID, rating)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	// online_learning_my_starsにquestionSetIDとuserIDとratingを元にレコードを作成する
	if err := q.Service.InsertMyStar(userID, questionSetID, rating); err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":     "rating submitted successfully",
		"avg_star":    avgStar,
		"isEvaluated": true,
		"evaluate":    rating,
	})
}

// SubmitQuestions
// 問題集回答で提出された回答を採点して正答率や進捗率を計算する
func (q *QuestionHandler) SubmitQuestions(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// クエリパラメータから question_set_id を取得
	QuestionSetIDStr := c.QueryParam("question_set_id")
	QuestionSetID, err := strconv.Atoi(QuestionSetIDStr)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	// リクエストボディを map[string]interface{} として受け取る
	var reqBody map[string]interface{}
	if err := c.Bind(&reqBody); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	// 受け取った回答データのキー（QuestionID）を int に変換してマップ作成
	userAnswers := make(map[int]string)
	var questionIDs []int
	for strID, answer := range reqBody {
		questionID, err := strconv.Atoi(strID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid question ID format"})
		}
		if userAnswer, ok := answer.(string); ok {
			userAnswers[questionID] = userAnswer
			questionIDs = append(questionIDs, questionID)
		} else {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid answer format"})
		}
	}

	// DBから該当する問題の正解を取得
	answers, err := q.Service.GetAnswersByIds(questionIDs)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	// 回答の正誤判定
	var results []Result
	var newCorrectAnswers []int
	for _, ans := range answers {
		userAns, exists := userAnswers[ans.ID]
		if !exists {
			continue
		}
		correct := ans.Answer == userAns
		results = append(results, Result{
			QuestionID: ans.ID,
			UserAnswer: userAns,
			Correct:    correct,
		})

		// 初めて正解した問題のチェック
		if correct {
			count, err := q.Service.CountCorrectAnswers(userID, ans.ID)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, err.Error())
			}
			if count == 0 {
				newCorrectAnswers = append(newCorrectAnswers, ans.ID)
			}
		}
	}

	// 追加（2025/02/25）
	// 問題集をマイ学習リストに追加している場合は、初めて正解した問題を online_learning_correct_answers に追加する
	// そうでない場合は、正誤判定した結果だけ返す
	countIsRegistered, err := q.Service.CountIsRegistered(userID, QuestionSetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	if countIsRegistered > 0 {
		// 初めて正解した問題を online_learning_correct_answers に追加
		if len(newCorrectAnswers) > 0 {
			var insertValues []map[string]interface{}
			for _, qID := range newCorrectAnswers {
				insertValues = append(insertValues, map[string]interface{}{
					"user_id":         userID,
					"question_id":     qID,
					"question_set_id": QuestionSetID,
				})
			}
			err := q.Service.InsertCorrectAnswers(insertValues)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, err.Error())
			}

		}
		// 進捗率の更新
		err := q.Service.UpdateProgress(userID, QuestionSetID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		// online_learning_my_questionsのstatusがnot_startedならin_progressに変更
		if err := q.Service.ChangeStatusToInProgress(userID, QuestionSetID); err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}
	}

	// 提出結果をまとめる
	submissionResult := SubmissionResult{
		Results:  results,
		Progress: "updated",
	}

	// ここから Redis に一時保存する処理
	submissionId := uuid.New().String()
	jsonData, err := json.Marshal(submissionResult)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to marshal submission data"})
	}

	if err := q.Cache.Set(context.Background(), submissionId, jsonData, 24*time.Hour); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to cache submission data"})
	}

	// フロント側には submissionId のみ返し、結果確認画面ではこのIDからデータを取得する
	return c.JSON(http.StatusOK, echo.Map{
		"submissionId": submissionId,
	})
}

// GetSubmissionResult
// 回答結果を見る
func (q *QuestionHandler) GetSubmissionResult(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if userID == "" || err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	submissionId := c.QueryParam("submitted_id")

	jsonData, err := q.Cache.Get(context.Background(), submissionId)
	if errors.Is(err, redis.Nil) {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "submissionId not found or expired"})
	} else if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve submission data"})
	}

	// jsonDataのデータ型がinterface{}なので、[]byte(jsonData)では対応しないので、以下に修正
	var dataBytes []byte
	switch v := jsonData.(type) {
	case []byte:
		dataBytes = v
	case string:
		dataBytes = []byte(v)
	default:
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "unexpected type for submission data"})
	}

	var submissionResult SubmissionResult
	if err := json.Unmarshal(dataBytes, &submissionResult); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to unmarshal submission data"})
	}

	return c.JSON(http.StatusOK, submissionResult)
}

// GetQuestionsByQuestionIds
// questionIdを元に問題集を取得する
func (q *QuestionHandler) GetQuestionsByQuestionIds(c echo.Context) error {
	// ユーザー認証チェック
	userID, err := utils.GetUserIDFromContext(c)
	if userID == "" || err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// クエリパラメータ "ids" を取得（例："66,67,68,69,70,71,72"）
	idsParam := c.QueryParam("ids")
	if idsParam == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "ids parameter is required"})
	}

	// カンマで分割して文字列スライスを得る
	idStrs := strings.Split(idsParam, ",")
	var ids []int
	for _, s := range idStrs {
		id, err := strconv.Atoi(strings.TrimSpace(s))
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id format"})
		}
		ids = append(ids, id)
	}

	// 表示するための問題をquestionIdを元に検索する
	questions, err := q.Service.GetQuestionsByIds(ids)

	fmt.Println(questions)

	return c.JSON(http.StatusOK, echo.Map{
		"questions": questions,
	})
}

// InsertQuestions 問題作成（Questionsテーブルへの登録、認証必須）
func (q *QuestionHandler) InsertQuestions(c echo.Context) error {
	// ユーザー認証チェック
	userID, contextErr := utils.GetUserIDFromContext(c)
	if contextErr != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// リクエストデータを取得
	var req InsertQuestionsRequest
	if err := c.Bind(&req); err != nil {
		fmt.Println("Bind error:", err)
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	var questions []InsertQuestion
	for _, item := range req.Questions {
		question := InsertQuestion{
			UserID:     userID,
			Title:      req.Title,
			GenreID:    item.GenreID,
			Visibility: item.Visibility,
			Question:   item.Question,
			Answer:     item.Answer,
			Choices1:   item.Choices1,
			Choices2:   item.Choices2,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		questions = append(questions, question)
	}

	// トランザクション開始
	if err := q.Service.CreateQuestionSet(questions); err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "questions created successfully",
		"count":   len(questions),
	})
}

// SearchQuestions 問題集の検索で使用する
// 検索SQL引数: 問題集タイトル（任意）、公開範囲（必須）、ジャンル（必須）
func (q *QuestionHandler) SearchQuestions(c echo.Context) error {
	// ユーザー認証チェック
	userID, contextErr := utils.GetUserIDFromContext(c)
	if contextErr != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// クエリパラメータから検索値を受け取る
	type searchQuestionsRequest struct {
		Title      string `query:"title"`
		Visibility string `query:"visibility"`
		GenreID    int    `query:"genreId"`
		Page       int    `query:"page"`
		Limit      int    `query:"limit"`
	}
	var req searchQuestionsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	// Serviceの呼び出し
	questions, totalCount, err := q.Service.SearchQuestions(req.Title, req.Visibility, req.GenreID, userID, req.Page, req.Limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message":    "questions searched successfully",
		"count":      len(questions),
		"totalCount": totalCount,
		"questions":  questions,
	})
}

// SearchFavoriteQuestions 問題集の検索で使用する
// お気に入り問題集の検索
// 検索SQL引数: 問題集タイトル（任意）、公開範囲（必須）、ジャンル（必須）
func (q *QuestionHandler) SearchFavoriteQuestions(c echo.Context) error {
	// ユーザー認証チェック
	userID, contextErr := utils.GetUserIDFromContext(c)
	if contextErr != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// クエリパラメータから検索値を受け取る
	type searchQuestionsRequest struct {
		Title      string `query:"title"`
		Visibility string `query:"visibility"`
		GenreID    int    `query:"genreId"`
		Page       int    `query:"page"`
		Limit      int    `query:"limit"`
	}
	var req searchQuestionsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	// Serviceの呼び出し
	questions, totalCount, err := q.Service.SearchFavoriteQuestions(req.Title, req.Visibility, req.GenreID, userID, req.Page, req.Limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message":    "favorite-questions searched successfully",
		"count":      len(questions),
		"totalCount": totalCount,
		"questions":  questions,
	})
}

func (q *QuestionHandler) AddToFavorite(c echo.Context) error {
	// ユーザー認証チェック
	userID, contextErr := utils.GetUserIDFromContext(c)
	if contextErr != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}
	questionSetIDStr := c.QueryParam("question_set_id")
	isFavoriteStr := c.QueryParam("is_favorite")
	if questionSetIDStr == "" || isFavoriteStr == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}
	questionSetID, err := strconv.Atoi(questionSetIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}
	// isFavorite を bool に変換
	isFavorite, err := strconv.ParseBool(isFavoriteStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "is_favorite must be a boolean"})
	}

	// お気に入りテーブルを更新
	// isFavoriteがtrueならonline_learning_favorite_questionsにuserIDとquestionIdをインサート
	// isFavoriteがfalseならonline_learning_favorite_questionsにuserIDとquestionIdを元にレコードを削除
	if isFavorite {
		// お気に入り登録
		if err := q.Service.InsertFavoriteQuestion(userID, questionSetID); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	} else {
		// お気に入り解除
		if err := q.Service.DeleteFavoriteQuestion(userID, questionSetID); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "updating favorite question successfully",
	})
}
