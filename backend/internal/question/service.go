package question

import (
	"errors"
	"gorm.io/gorm"
	"time"
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
	GetQuestionsForFixByQuestionSetId(questionSetId int, userId string) ([]QuestionSetForFixResponse, error)
	CountMyQuestions(userId string, questionSetId int) (int64, error)
	CountAndEvaluateByUser(userId string, questionSetId int) (MyStar, error)
	InsertMyQuestion(MyQuestion) error
	GetQuestionsByIds(ids []int) ([]Question, error)
	InsertQuestions(questions []InsertQuestion) error
	GetNextSetID() (int, error)
	InsertQuestionSet(questionSet []QuestionSet) error
	InsertStar(star Star) error
	CreateQuestionSet(questions []InsertQuestion) error
	FixQuestionSet(questionSetID int, questions []FixQuestion, genreID int, title, userId string) error
	InsertMyStar(userID string, questionSetID, rating int) error
	InsertOrUpdateStarRating(questionSetID int, rating int) (float64, error)
	InsertFavoriteQuestion(userID string, questionSetID int) error
	DeleteFavoriteQuestion(userID string, questionSetID int) error
	GetMyQuestionList(userID, title, status string, genreId, page, limit int) ([]MyQuestionForShow, int64, error)
	GetMyCreatedQuestionList(userID, title, visibility string, genreId, page, limit int) ([]MyCreatedQuestionForShow, int64, error)
	SearchQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]SearchQuestionResponse, int64, error)
	SearchFavoriteQuestions(title string, visibility string, genreID int, userID string, page int, limit int) ([]FavoriteQuestionResponse, int64, error)
	DeleteQuestionSet(userID string, questionSetID int) error
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

func (q QuestionService) GetQuestionsForFixByQuestionSetId(questionSetId int, userId string) ([]QuestionSetForFixResponse, error) {
	questionSetForFixResponse, err := q.Repo.GetQuestionsForFixByQuestionSetId(questionSetId, userId)
	if err != nil {
		return nil, err
	}
	// 修正しようとしているユーザーと問題集を作成したユーザーが違ったらnilを返す
	if len(questionSetForFixResponse) == 0 {
		return nil, nil
	}
	return questionSetForFixResponse, nil
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

func (q QuestionService) FixQuestionSet(questionSetID int, questions []FixQuestion, genreID int, title, userId string) error {
	if len(questions) == 0 {
		return errors.New("no questions")
	}

	return q.Repo.Transaction(func(tx *gorm.DB) error {
		// 1. question_setテーブルから、既存のquestions_idを取得（削除されるデータと突き合わせるため）
		existingQuestionIDs, err := q.Repo.GetQuestionIdsByQuestionSetId(questionSetID)
		if err != nil {
			return err
		}
		// 削除対象のidが問題集の中で一番若い場合、修正もしくは作成のレコードに含める
		// 既存の問題が全部削除されてガッツリ作り直される場合は、新規作成のレコードに過去の作成日を入れる
		minExistingCreatedAt, err := q.Repo.GetDateByQuestionIds(existingQuestionIDs)
		if err != nil {
			return err
		}

		// 2.更新前のquestion_idと更新対象のquestion_idを突き合わせ
		// まず既存のIDをマップに入れて0で初期化
		existingQuestionIDsMap := make(map[int]int)
		for i := 0; i < len(existingQuestionIDs); i++ {
			existingQuestionIDsMap[existingQuestionIDs[i]]++
		}
		// 更新対象のquestion_idでマップをインクリメント
		var createQuestions []InsertQuestion
		var fixQuestions []FixQuestion
		var deleteQuestionIds []int
		for _, question := range questions {
			if question.ID == nil {
				// 作成対象のquestions（idは自動連番）
				createQuestions = append(createQuestions, InsertQuestion{
					UserID:     userId,
					Title:      title,
					GenreID:    genreID,
					Visibility: question.Visibility,
					Question:   question.Question,
					Answer:     question.Answer,
					Choices1:   question.Choices1,
					Choices2:   question.Choices2,
					CreatedAt:  *minExistingCreatedAt,
					UpdatedAt:  time.Now(),
				})
				continue // ここで以降の処理をスキップする
			}

			// 修正対象
			if existingQuestionIDsMap[*question.ID] > 0 {
				// 修正対象のquestions
				fixQuestions = append(fixQuestions, question)
				existingQuestionIDsMap[*question.ID]-- // 削除対象の洗い出しに1以上のやつを使うため、デクリメント
			}

		}

		// 削除対象のquestion_idたち
		for questionId, count := range existingQuestionIDsMap {
			if count > 0 {
				deleteQuestionIds = append(deleteQuestionIds, questionId)
			}
		}

		// 3-1.追加対象の問題をquestionsテーブルに追加
		if len(createQuestions) > 0 {
			if err := q.Repo.InsertQuestions(createQuestions); err != nil {
				return err
			}
			// 3-2.追加対象の問題を構造体に追加したい（question_set_idは修正対象のものと同じにする必要あり）。
			var questionSets []QuestionSet
			for _, question := range createQuestions {
				questionSets = append(questionSets, QuestionSet{
					SetID:      questionSetID,
					QuestionID: question.ID,
					GenreID:    genreID,
				})
			}
			// questionsテーブルに追加したidをもとに、question_setテーブルにレコードを紐付け
			if err := q.Repo.InsertQuestionSet(questionSets); err != nil {
				return err
			}
		}

		// 4.リクエストに含まれていなかった問題を削除
		// questionsテーブルからidを指定して削除
		if len(deleteQuestionIds) > 0 {
			if err := q.Repo.DeleteQuestionsByIds(deleteQuestionIds); err != nil {
				return err
			}
			// question_setテーブルからquestion_idを指定して削除
			if err := q.Repo.DeleteQuestionSetByIds(deleteQuestionIds); err != nil {
				return err
			}
		}

		// 5.修正対象のレコードをquestionsテーブルに更新
		// ジャンルが変わってる可能性があるので、questionsテーブルとquestion_setテーブルを更新しておく
		// 5-1.questionsテーブルを更新
		if len(fixQuestions) > 0 {
			if err := q.Repo.FixQuestions(fixQuestions); err != nil {
				return err
			}
			// 5-2.question_setテーブルを更新
			var fixQuestionSets []QuestionSet
			for _, question := range fixQuestions {
				fixQuestionSets = append(fixQuestionSets, QuestionSet{
					SetID:      questionSetID,
					QuestionID: *question.ID,
					GenreID:    genreID,
				})
			}
			if err := q.Repo.FixQuestionSet(fixQuestionSets); err != nil {
				return err
			}
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
func (q *QuestionService) GetMyQuestionList(userID, title, status string, genreId, page, limit int) ([]MyQuestionForShow, int64, error) {
	// ページ番号・取得件数のバリデーション
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit
	return q.Repo.GetMyQuestionList(userID, title, status, genreId, offset, limit)
}

// GetMyCreatedQuestionList はページネーション処理を含めてリポジトリからデータを取得する
func (q *QuestionService) GetMyCreatedQuestionList(userID, title, visibility string, genreId, page, limit int) ([]MyCreatedQuestionForShow, int64, error) {
	// ページ番号・取得件数のバリデーション
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	offset := (page - 1) * limit
	return q.Repo.GetMyCreatedQuestionList(userID, title, visibility, genreId, offset, limit)
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

func (q QuestionService) DeleteQuestionSet(userID string, questionSetID int) error {
	// questionSetIDから削除しようとしている問題集の作成者を取得して、そいつとuserIDが一致したら削除を実行する
	judge, err := q.Repo.IsQuestionWriter(userID, questionSetID)
	if err != nil {
		return err
	}
	if !judge {
		return errors.New("作成者ではないユーザーが問題を削除しようとしています。")
	}

	// 問題の削除を実行
	deleteQuestionIds, err := q.Repo.GetQuestionIdsByQuestionSetId(questionSetID)
	if err != nil {
		return err
	}
	if len(deleteQuestionIds) > 0 {
		// questionsテーブルから問題を物理削除
		err := q.Repo.DeleteQuestionsByIds(deleteQuestionIds)
		if err != nil {
			return err
		}
		// question_setテーブルから問題を物理削除
		err2 := q.Repo.DeleteQuestionSetByIds(deleteQuestionIds)
		if err2 != nil {
			return err2
		}
		// stars（みんながつけた評価テーブル）からquestionSetIDをもとにレコードを削除
		err3 := q.Repo.DeleteStarsByQuestionSetID(questionSetID)
		if err3 != nil {
			return err3
		}
		// my_stars（自分がつけた評価テーブル）からquestionSetIDをもとにレコードを削除
		err4 := q.Repo.DeleteMyStarsByQuestionSetID(questionSetID)
		if err4 != nil {
			return err4
		}
		// my_questions（マイ学習リストに追加した問題集）からquestionSetIDをもとにレコードを削除
		err5 := q.Repo.DeleteMyQuestionsByQuestionSetID(questionSetID)
		if err5 != nil {
			return err5
		}
	}
	return nil
}
