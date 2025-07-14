package question

import (
	"errors"
	"gorm.io/gorm"
)

type QuestionServiceInterface interface {
	GetAnswersByIds(ids []int) ([]IDAnswer, error)
	CountCorrectAnswers(userId string, questionId int) (int64, error)
	CountIsRegistered(userId string, questionSetId int) (int64, error)
	InsertCorrectAnswers([]map[string]interface{}) error
	UpdateProgress(userId string, questionSetId int) error
	ChangeStatusToInProgress(userId string, questionSetId int) error
	GetAllGenres() ([]Genre, error)
	GetQuestionsByQuestionSetId(questionSetId int) ([]QuestionSetResponse, error)
	CountMyQuestions(userId string, questionSetId int) (int64, error)
	CountAndEvaluateByUser(userId string, questionSetId int) (MyStar, error)
	InsertMyQuestion(MyQuestion) error
	GetQuestionsByIds(ids []int) ([]Question, error)
	InsertQuestions(questions []InsertQuestion) error
	GetNextSetID() (int, error)
	InsertQuestionSet(questionSet []QuestionSet) error
	InsertStar(star Star) error
	CreateQuestionSet(questions []InsertQuestion) error
	InsertMyStar(userID string, questionSetID, rating int) error
	InsertOrUpdateStarRating(questionSetID int, rating int) (float64, error)
	InsertFavoriteQuestion(userID string, questionSetID int) error
	DeleteFavoriteQuestion(userID string, questionSetID int) error
	GetMyQuestionList(userID string, page, limit int) ([]MyQuestionForShow, int64, error)
	SearchQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]SearchQuestionResponse, int64, error)
	SearchFavoriteQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]FavoriteQuestionResponse, int64, error)
}

type QuestionService struct {
	Repo QuestionRepository
}

func (q QuestionService) GetAnswersByIds(ids []int) ([]IDAnswer, error) {
	answers, err := q.Repo.GetAnswersByIds(ids)
	if err != nil {
		return nil, err
	}
	return answers, nil
}

func (q QuestionService) CountCorrectAnswers(userId string, questionId int) (int64, error) {
	count, err := q.Repo.CountCorrectAnswers(userId, questionId)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (q QuestionService) CountIsRegistered(userId string, questionSetId int) (int64, error) {
	count, err := q.Repo.CountIsRegistered(userId, questionSetId)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (q QuestionService) InsertCorrectAnswers(answers []map[string]interface{}) error {
	err := q.Repo.InsertCorrectAnswers(answers)
	if err != nil {
		return err
	}
	return nil
}

func (q QuestionService) UpdateProgress(userId string, questionSetId int) error {
	err := q.Repo.UpdateProgress(userId, questionSetId)
	if err != nil {
		return err
	}
	return nil
}

func (q QuestionService) ChangeStatusToInProgress(userId string, questionSetId int) error {
	err := q.Repo.ChangeStatusToInProgress(userId, questionSetId)
	if err != nil {
		return err
	}
	return nil
}

func (q QuestionService) GetAllGenres() ([]Genre, error) {
	genres, err := q.Repo.GetAllGenres()
	if err != nil {
		return nil, err
	}
	return genres, nil
}

func (q QuestionService) GetQuestionsByQuestionSetId(questionSetId int) ([]QuestionSetResponse, error) {
	questionSetResponse, err := q.Repo.GetQuestionsByQuestionSetId(questionSetId)
	if err != nil {
		return nil, err
	}
	return questionSetResponse, nil
}

func (q QuestionService) CountMyQuestions(userId string, questionSetId int) (int64, error) {
	count, err := q.Repo.CountMyQuestions(userId, questionSetId)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (q QuestionService) CountAndEvaluateByUser(userId string, questionSetId int) (MyStar, error) {
	myStar, err := q.Repo.CountAndEvaluateByUser(userId, questionSetId)
	if err != nil {
		return MyStar{}, err
	}
	return myStar, nil
}

func (q QuestionService) InsertMyQuestion(myQuestion MyQuestion) error {
	err := q.Repo.InsertMyQuestion(myQuestion)
	if err != nil {
		return err
	}
	return nil
}

func (q QuestionService) GetQuestionsByIds(ids []int) ([]Question, error) {
	questions, err := q.Repo.GetQuestionsByIds(ids)
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (q QuestionService) InsertQuestions(questions []InsertQuestion) error {
	err := q.Repo.InsertQuestions(questions)
	if err != nil {
		return err
	}
	return nil
}

func (q QuestionService) GetNextSetID() (int, error) {
	lastSetID, err := q.Repo.GetNextSetID()
	if err != nil {
		return 0, err
	}
	return lastSetID, nil
}

func (q QuestionService) InsertQuestionSet(questionSet []QuestionSet) error {
	if err := q.Repo.InsertQuestionSet(questionSet); err != nil {
		return err
	}
	return nil
}

func (q QuestionService) InsertStar(star Star) error {
	if err := q.InsertStar(star); err != nil {
		return err
	}
	return nil
}

// ★ 新規追加：複数の操作を1トランザクション内で実行するメソッド ★
// 　　※質問群の登録、次の set_id の取得、問題集テーブルへの登録、評価テーブルへの登録を一括で行う
func (q QuestionService) CreateQuestionSet(questions []InsertQuestion) error {
	return q.Repo.Transaction(func(tx *gorm.DB) error {
		// 1. 問題テーブルへバルクインサート（トランザクション対応版）
		if err := q.Repo.InsertQuestions(questions); err != nil {
			return err
		}

		// 2. 次の set_id の取得
		setID, err := q.Repo.GetNextSetID()
		if err != nil {
			return err
		}

		// 3. 問題集テーブルに set_id を設定して登録
		var questionSets []QuestionSet
		for _, question := range questions {
			questionSets = append(questionSets, QuestionSet{
				SetID:      setID,
				QuestionID: question.ID,
				GenreID:    question.GenreID,
			})
		}
		if err := q.Repo.InsertQuestionSet(questionSets); err != nil {
			return err
		}

		// 4. 問題集評価テーブルに question_set_id を登録
		star := Star{
			QuestionSetID: setID,
			TotalStars:    0,
			Star1:         0,
			Star2:         0,
			Star3:         0,
			Star4:         0,
			Star5:         0,
			AvgStar:       0,
		}
		if err := q.Repo.InsertStar(star); err != nil {
			return err
		}

		return nil
	})
}

func (q QuestionService) InsertMyStar(userID string, questionSetID, rating int) error {
	if err := q.Repo.InsertMyStar(userID, questionSetID, rating); err != nil {
		return err
	}
	return nil
}

func (q QuestionService) InsertOrUpdateStarRating(questionSetID int, rating int) (float64, error) {
	var avgStar float64

	err := q.Repo.Transaction(func(tx *gorm.DB) error {
		// ロック付きでスター評価レコードの取得
		starRecord, err := q.Repo.GetStarForUpdate(questionSetID)
		if err != nil {
			// レコードが存在しない場合は新規作成
			if errors.Is(err, gorm.ErrRecordNotFound) {
				starRecord = &Star{
					QuestionSetID: questionSetID,
					TotalStars:    0,
					Star1:         0,
					Star2:         0,
					Star3:         0,
					Star4:         0,
					Star5:         0,
					AvgStar:       0,
				}
				// 新規レコードの作成（※ InsertStar でも良いですが、トランザクション内で直接作成しても問題ありません）
				if err := tx.Table("online_learning_stars").Create(starRecord).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		// 評価値に応じたカウンタの更新
		starRecord.TotalStars++
		switch rating {
		case 1:
			starRecord.Star1++
		case 2:
			starRecord.Star2++
		case 3:
			starRecord.Star3++
		case 4:
			starRecord.Star4++
		case 5:
			starRecord.Star5++
		}

		// 新しい平均評価値の計算
		sum := starRecord.Star1*1 + starRecord.Star2*2 + starRecord.Star3*3 + starRecord.Star4*4 + starRecord.Star5*5
		starRecord.AvgStar = float64(sum) / float64(starRecord.TotalStars)

		// レコードの更新保存
		if err := q.Repo.SaveStar(starRecord); err != nil {
			return err
		}

		avgStar = starRecord.AvgStar
		return nil
	})

	return avgStar, err
}

func (q QuestionService) InsertFavoriteQuestion(userID string, questionSetID int) error {
	if err := q.Repo.InsertFavoriteQuestion(userID, questionSetID); err != nil {
		return err
	}
	return nil
}

func (q QuestionService) DeleteFavoriteQuestion(userID string, questionSetID int) error {
	if err := q.Repo.DeleteFavoriteQuestion(userID, questionSetID); err != nil {
		return err
	}
	return nil
}

// GetMyQuestionList はページネーション処理を含めてリポジトリからデータを取得する
func (q *QuestionService) GetMyQuestionList(userID string, page int, limit int) ([]MyQuestionForShow, int64, error) {
	// ページ番号・取得件数のバリデーション
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit
	return q.Repo.GetMyQuestionList(userID, offset, limit)
}

func (q QuestionService) SearchQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]SearchQuestionResponse, int64, error) {
	// ページと取得件数のデフォルト処理
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	// リポジトリ層のメソッドを呼び出す
	return q.Repo.SearchQuestions(title, visibility, genreID, userID, offset, limit)
}

func (q QuestionService) SearchFavoriteQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]FavoriteQuestionResponse, int64, error) {
	// ページ番号と取得件数のデフォルト値設定
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Repository 層の SearchFavoriteQuestions を呼び出す
	return q.Repo.SearchFavoriteQuestions(title, visibility, genreID, userID, offset, limit)
}
