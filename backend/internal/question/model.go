package question

import "time"

// DBに対応したデータ構造

type SubmissionResult struct {
	Results  []Result `json:"results"`
	Progress string   `json:"progress"`
}

type Result struct {
	QuestionID int    `json:"questionId"`
	UserAnswer string `json:"userAnswer"`
	Correct    bool   `json:"correct"`
}

// InsertQuestionsRequest はフロントエンドからのリクエスト構造
type InsertQuestionsRequest struct {
	Title     string                `json:"title"`
	Questions []QuestionRequestBody `json:"questions"`
}

// QuestionRequestBody は問題データの構造
type QuestionRequestBody struct {
	GenreID    int    `json:"genreId"`
	Visibility string `json:"visibility"`
	Question   string `json:"question"`
	Answer     string `json:"answer"`
	Choices1   string `json:"choices1"`
	Choices2   string `json:"choices2"`
}

// Question は SELECT用の構造体
type Question struct {
	ID         int       `json:"id" gorm:"AUTO_INCREMENT"`
	UserID     string    `json:"userId" gorm:"column:user_id"`
	Title      string    `json:"title" gorm:"column:title"`
	GenreID    int       `json:"genreId" gorm:"column:genre_id"`
	GenreName  string    `json:"genreName" gorm:"column:genre_name"`
	Visibility string    `json:"visibility" gorm:"column:visibility"`
	Question   string    `json:"question" gorm:"column:question"`
	Answer     string    `json:"answer" gorm:"column:answer"`
	Choices1   string    `json:"choices1" gorm:"column:choices1"`
	Choices2   string    `json:"choices2" gorm:"column:choices2"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt  time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

// InsertQuestion データベースに挿入する用の構造体
type InsertQuestion struct {
	ID         int       `json:"id" gorm:"AUTO_INCREMENT"`
	UserID     string    `json:"userId" gorm:"column:user_id"`
	Title      string    `json:"title" gorm:"column:title"`
	GenreID    int       `json:"genreId" gorm:"column:genre_id"`
	Visibility string    `json:"visibility" gorm:"column:visibility"`
	Question   string    `json:"question" gorm:"column:question"`
	Answer     string    `json:"answer" gorm:"column:answer"`
	Choices1   string    `json:"choices1" gorm:"column:choices1"`
	Choices2   string    `json:"choices2" gorm:"column:choices2"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt  time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

// QuestionSetResponse GetQuestionSetで返すための構造体
type QuestionSetResponse struct {
	ID           int    `json:"id" gorm:"column:id"`
	Title        string `json:"title" gorm:"column:title"`
	Question     string `json:"question" gorm:"column:question"`
	Answer       string `json:"answer" gorm:"column:answer"`
	Choices1     string `json:"choices1" gorm:"column:choices1"`
	Choices2     string `json:"choices2" gorm:"column:choices2"`
	GenreName    string `json:"genreName" gorm:"column:genre_name"`
	IsRegistered bool   `json:"isRegistered" gorm:"column:is_registered"`
	IsEvaluated  bool   `json:"isEvaluated" gorm:"column:is_evaluated"`
	Evaluate     int    `json:"evaluate"`
}

// QuestionSet は問題集テーブルにレコードを挿入する構造体
type QuestionSet struct {
	SetID      int `gorm:"column:set_id"`
	QuestionID int `gorm:"column:question_id"`
	GenreID    int `gorm:"column:genre_id"`
}

// Star は問題集評価テーブルにレコードを挿入する構造
type Star struct {
	QuestionSetID int     `gorm:"column:question_set_id;primaryKey"`
	TotalStars    int     `gorm:"column:total_stars"`
	Star1         int     `gorm:"column:star1"`
	Star2         int     `gorm:"column:star2"`
	Star3         int     `gorm:"column:star3"`
	Star4         int     `gorm:"column:star4"`
	Star5         int     `gorm:"column:star5"`
	AvgStar       float64 `gorm:"column:avg_star"`
}

func (Star) TableName() string {
	return "online_learning_stars"
}

type IDAnswer struct {
	ID     int    `json:"id" gorm:"column:id"`
	Answer string `json:"answer" gorm:"column:answer"`
}

// Genre ジャンルを取得して画面に返す時に使用する構造体
type Genre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// テーブル名を指定
func (Genre) TableName() string {
	return "online_learning_genres"
}

// ユーザーが問題集を評価済みか
type MyStar struct {
	Evaluate int `json:"evaluate"`
	Count    int `json:"count"`
}

type MyQuestion struct {
	UserID        string    `json:"user_id" gorm:"column:user_id"`
	QuestionSetID int       `json:"question_set_id" gorm:"column:question_set_id"`
	Deadline      time.Time `json:"deadline" gorm:"column:deadline;type:date"`
	Status        string    `gorm:"column:status;default:not_started"`
	Progress      float64   `gorm:"column:progress;default:0"`
	Attempts      int       `gorm:"column:attempts;default:0"`
	LastUpdatedAt time.Time `gorm:"column:last_updated_at;type:timestamp;default:CURRENT_TIMESTAMP"`
	CreatedAt     time.Time `gorm:"column:created_at;type:timestamp;default:CURRENT_TIMESTAMP"`
}

func (MyQuestion) TableName() string {
	return "online_learning_my_questions"
}

type MyQuestionForShow struct {
	QuestionSetID  int       `json:"questionSetId" gorm:"column:question_set_id"`
	Title          string    `json:"title" gorm:"column:title"`
	GenreName      string    `json:"genreName" gorm:"column:genre_name"`
	TotalQuestions int       `json:"totalQuestions" gorm:"column:total_questions"`
	Progress       float64   `json:"progress" gorm:"column:progress"`
	Deadline       time.Time `json:"deadline" gorm:"column:deadline;type:timestamp"`
	Status         string    `json:"status" gorm:"column:status"`
}

type SearchQuestionResponse struct {
	QuestionSetID int     `json:"questionSetId" gorm:"column:question_set_id"`
	Title         string  `json:"title" gorm:"column:title"`
	GenreID       int     `json:"genreId" gorm:"column:genre_id"`
	GenreName     string  `json:"genreName" gorm:"column:genre_name"`
	UserName      string  `json:"userName" gorm:"column:user_name"`
	TotalStars    int     `json:"totalStars" gorm:"column:total_stars"`
	AvgStar       float64 `json:"avgStar" gorm:"column:avg_star"`
	IsFavorite    bool    `json:"isFavorite" gorm:"column:is_favorite"`
}

type FavoriteQuestionResponse struct {
	QuestionSetID int     `json:"questionSetId" gorm:"column:question_set_id"`
	Title         string  `json:"title" gorm:"column:title"`
	GenreID       int     `json:"genreId" gorm:"column:genre_id"`
	GenreName     string  `json:"genreName" gorm:"column:genre_name"`
	UserName      string  `json:"userName" gorm:"column:user_name"`
	TotalStars    int     `json:"totalStars" gorm:"column:total_stars"`
	AvgStar       float64 `json:"avgStar" gorm:"column:avg_star"`
}
