package question

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type QuestionRepository interface {
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
	InsertMyStar(userID string, questionSetID, rating int) error

	GetStarForUpdate(questionSetID int) (*Star, error)
	SaveStar(star *Star) error

	InsertFavoriteQuestion(userID string, questionSetID int) error
	DeleteFavoriteQuestion(userID string, questionSetID int) error

	GetMyQuestionList(userId string, offset, limit int) ([]MyQuestionForShow, int64, error)
	SearchQuestions(title string, visibility string, genreID int, userID string, offset int, limit int) ([]SearchQuestionResponse, int64, error)
	SearchFavoriteQuestions(title string, visibility string, genreID int, userID string, offset int, limit int) ([]FavoriteQuestionResponse, int64, error)

	// ここでトランザクションを実行するためのメソッドを追加
	Transaction(fn func(tx *gorm.DB) error) error
}

type GormRepository struct {
	DB *gorm.DB
}

func (r *GormRepository) GetAnswersByIds(ids []int) ([]IDAnswer, error) {
	// DBから該当する問題の正解を取得
	var answers []IDAnswer
	if err := r.DB.Table("online_learning_questions").
		Select("id, answer").
		Where("id IN (?)", ids).
		Find(&answers).Error; err != nil {
		return nil, err
	}
	return answers, nil
}

func (r *GormRepository) CountCorrectAnswers(userId string, questionId int) (int64, error) {
	var count int64
	if err := r.DB.Table("online_learning_correct_answers").
		Where("user_id = ? AND question_id = ?", userId, questionId).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *GormRepository) CountIsRegistered(userId string, questionSetId int) (int64, error) {
	var count int64
	err := r.DB.Table("online_learning_my_questions").Where("user_id = ? and question_set_id = ?", userId, questionSetId).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *GormRepository) InsertCorrectAnswers(answers []map[string]interface{}) error {
	err := r.DB.Table("online_learning_correct_answers").Create(answers).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) UpdateProgress(userId string, questionSetId int) error {
	err := r.DB.Exec(`
			UPDATE online_learning_my_questions mq
			SET progress = (
				(SELECT COUNT(*) FROM online_learning_correct_answers ca 
				 WHERE ca.user_id = mq.user_id AND ca.question_set_id = mq.question_set_id
				)::float /
				(SELECT COUNT(*) FROM online_learning_question_set qs 
				 WHERE qs.set_id = mq.question_set_id
				) * 100
			),
				attempts = attempts + 1,
				last_updated_at = now(),
				status = CASE
					WHEN (
						(SELECT COUNT(*) FROM online_learning_correct_answers ca 
						 WHERE ca.user_id = mq.user_id AND ca.question_set_id = mq.question_set_id
						)::float /
						(SELECT COUNT(*) FROM online_learning_question_set qs 
						 WHERE qs.set_id = mq.question_set_id
						) * 100
					) = 100 THEN 'completed'
					ELSE status
				END
			WHERE  mq.user_id = ? AND mq.question_set_id = ?
			`, userId, questionSetId).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) ChangeStatusToInProgress(userId string, questionSetId int) error {
	err := r.DB.Table("online_learning_my_questions").
		Where("user_id = ? AND question_set_id = ? AND status = ?", userId, questionSetId, "not_started").
		Update("status", "in_progress").Error
	if err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) GetAllGenres() ([]Genre, error) {
	var genres []Genre
	if err := r.DB.Table("online_learning_genres").Find(&genres).Error; err != nil {
		return nil, err
	}
	return genres, nil
}

func (r *GormRepository) GetQuestionsByQuestionSetId(questionSetId int) ([]QuestionSetResponse, error) {
	var questionSetResponse []QuestionSetResponse
	err := r.DB.Table("online_learning_questions as q").
		Select("q.id, q.title, q.question, q.answer, q.choices1, q.choices2, g.name as genre_name").
		Joins("JOIN online_learning_question_set qs on qs.question_id = q.id").
		Joins("JOIN online_learning_genres g on g.id = q.genre_id").
		Where("qs.set_id = ?", questionSetId).
		Find(&questionSetResponse).Error
	if err != nil {
		return nil, err
	}
	return questionSetResponse, nil
}

func (r *GormRepository) CountMyQuestions(userId string, questionSetId int) (int64, error) {
	var count int64
	err := r.DB.Table("online_learning_my_questions").Where("user_id = ? and question_set_id = ?", userId, questionSetId).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *GormRepository) CountAndEvaluateByUser(userId string, questionSetId int) (MyStar, error) {
	var myStar MyStar
	err := r.DB.Table("online_learning_my_stars").
		Select("evaluate, count(*) over(order by question_set_id)").
		Where("user_id = ? AND question_set_id = ?", userId, questionSetId).
		Find(&myStar).Error
	if err != nil {
		return MyStar{}, err
	}
	return myStar, nil
}

func (r *GormRepository) InsertMyQuestion(myQuestion MyQuestion) error {
	if err := r.DB.Table("online_learning_my_questions").Create(&myQuestion).Error; err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) GetQuestionsByIds(ids []int) ([]Question, error) {
	var questions []Question
	err := r.DB.Table("online_learning_questions as q").
		Select("q.id, q.title, q.question,g.name as genre_name, q.answer, q.choices1, q.choices2").
		Joins("join online_learning_genres g on q.genre_id = g.id").
		Where("q.id IN ?", ids).Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *GormRepository) InsertQuestions(questions []InsertQuestion) error {
	if err := r.DB.Table("online_learning_questions").Create(&questions).Error; err != nil {
		return err
	}
	return nil
}

// `set_id` の取得（同時リクエストでも競合しないようにトランザクション内で管理）
func (r *GormRepository) GetNextSetID() (int, error) {
	var lastSetID int
	err := r.DB.Raw("SELECT COALESCE(MAX(set_id), 0) + 1 FROM online_learning_question_set").Scan(&lastSetID).Error
	if err != nil {
		return 0, err
	}

	return lastSetID, nil
}

func (r *GormRepository) InsertQuestionSet(questionSet []QuestionSet) error {
	if err := r.DB.Table("online_learning_question_set").Create(&questionSet).Error; err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) InsertStar(star Star) error {
	if err := r.DB.Table("online_learning_stars").Create(&star).Error; err != nil {
		return err
	}
	return nil
}

// InsertMyStar ユーザー個人がどの問題集に対してどんな評価をしたかを記録する
func (r *GormRepository) InsertMyStar(userID string, questionSetID, rating int) error {
	if err := r.DB.Exec(
		"INSERT INTO online_learning_my_stars (question_set_id, user_id, evaluate) VALUES (?, ?, ?)",
		questionSetID, userID, rating,
	).Error; err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) Transaction(fn func(tx *gorm.DB) error) error {
	return r.DB.Transaction(fn)
}

// GetStarForUpdate は、指定の questionSetID のスター評価レコードをロック付きで取得します
func (r *GormRepository) GetStarForUpdate(questionSetID int) (*Star, error) {
	var starRecord Star
	err := r.DB.Table("online_learning_stars").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("question_set_id = ?", questionSetID).
		First(&starRecord).Error
	if err != nil {
		return nil, err
	}
	return &starRecord, nil
}

// SaveStar は、スター評価レコードの更新を行います
func (r *GormRepository) SaveStar(star *Star) error {
	return r.DB.Table("online_learning_stars").Save(star).Error
}

func (r *GormRepository) InsertFavoriteQuestion(userID string, questionSetID int) error {
	if err := r.DB.Exec(`
			INSERT INTO online_learning_favorite_questions (user_id, question_set_id)
			VALUES (?, ?) ON CONFLICT (user_id, question_set_id) DO NOTHING;
		`, userID, questionSetID).Error; err != nil {
		return err
	}
	return nil
}

func (r *GormRepository) DeleteFavoriteQuestion(userID string, questionSetID int) error {
	if err := r.DB.Exec(`
			DELETE FROM online_learning_favorite_questions 
			WHERE user_id = ? AND question_set_id = ?;
		`, userID, questionSetID).Error; err != nil {
		return err
	}
	return nil
}

// GetMyQuestionList はユーザーIDに基づきマイ学習リストを取得する
func (r *GormRepository) GetMyQuestionList(userID string, offset, limit int) ([]MyQuestionForShow, int64, error) {
	var resData []MyQuestionForShow

	// 基本クエリ：一覧データの取得
	baseQuery := r.DB.Table("online_learning_my_questions as mq").
		Select("distinct mq.question_set_id, q.title, g.name as genre_name, (select count(*) from online_learning_question_set where set_id = mq.question_set_id) AS total_questions, mq.progress, mq.deadline, mq.status").
		Joins("JOIN online_learning_question_set qs on qs.set_id = mq.question_set_id").
		Joins("JOIN online_learning_questions q on qs.question_id = q.id").
		Joins("JOIN online_learning_genres g on q.genre_id = g.id").
		Where("mq.user_id = ?", userID).
		Order("mq.status DESC, mq.deadline , mq.progress, mq.question_set_id")

	// totalCount を取得するためのサブクエリ
	var totalCount int64
	subQuery := r.DB.Table("online_learning_my_questions as mq").
		Select("distinct mq.question_set_id, q.title, g.name as genre_name, (select count(*) from online_learning_question_set where set_id = mq.question_set_id) AS total_questions, mq.progress, mq.deadline, mq.status").
		Joins("JOIN online_learning_question_set qs on qs.set_id = mq.question_set_id").
		Joins("JOIN online_learning_questions q on qs.question_id = q.id").
		Joins("JOIN online_learning_genres g on q.genre_id = g.id").
		Where("mq.user_id = ?", userID)

	countQuery := r.DB.Table("(?) as sub", subQuery).Select("COUNT(*)")
	if err := countQuery.Scan(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// ページネーションの適用
	query := baseQuery.Offset(offset).Limit(limit)
	if err := query.Find(&resData).Error; err != nil {
		return nil, 0, err
	}

	return resData, totalCount, nil
}

func (r *GormRepository) SearchQuestions(title string, visibility string, genreID int, userID string, offset int, limit int) ([]SearchQuestionResponse, int64, error) {
	var questions []SearchQuestionResponse

	// 基本となる検索クエリ（データ取得用）
	baseQuery := r.DB.Table("online_learning_stars as s").
		Select(`DISTINCT s.question_set_id, q.title, q.genre_id, g.name as genre_name, 
		         u.name as user_name, s.total_stars, s.avg_star`).
		//CASE WHEN s.question_set_id = fq.question_set_id THEN 1 ELSE 0 END as is_favorite
		Joins("JOIN online_learning_question_set qs ON s.question_set_id = qs.set_id").
		Joins("JOIN online_learning_genres g ON g.id = qs.genre_id").
		Joins("JOIN online_learning_questions q ON q.id = qs.question_id").
		Joins("JOIN online_learning_users u ON u.id = q.user_id").
		//Joins("LEFT OUTER JOIN online_learning_favorite_questions fq ON fq.question_set_id = s.question_set_id").
		Where("q.visibility = ? AND q.genre_id = ?", visibility, genreID).
		Order("s.total_stars DESC, s.avg_star DESC, q.title, s.question_set_id ASC")

	// Title が指定されている場合の部分一致検索
	if title != "" {
		baseQuery = baseQuery.Where("q.title LIKE ?", "%"+title+"%")
	}

	// Visibility が "private" の場合は、ユーザーIDでフィルタ
	if visibility == "private" {
		baseQuery = baseQuery.Where("q.user_id = ?", userID)
	}

	// totalCount を取得するためのサブクエリ
	var totalCount int64
	subQuery := r.DB.Table("online_learning_stars as s").
		Select(`DISTINCT s.question_set_id, q.title, q.genre_id, g.name as genre_name, 
		         u.name as user_name, s.total_stars, s.avg_star`).
		//CASE WHEN s.question_set_id = fq.question_set_id THEN 1 ELSE 0 END as is_favorite
		Joins("JOIN online_learning_question_set qs ON s.question_set_id = qs.set_id").
		Joins("JOIN online_learning_genres g ON g.id = qs.genre_id").
		Joins("JOIN online_learning_questions q ON q.id = qs.question_id").
		Joins("JOIN online_learning_users u ON u.id = q.user_id").
		//Joins("LEFT OUTER JOIN online_learning_favorite_questions fq ON fq.question_set_id = s.question_set_id").
		Where("q.visibility = ? AND q.genre_id = ?", visibility, genreID)

	if title != "" {
		subQuery = subQuery.Where("q.title LIKE ?", "%"+title+"%")
	}

	if visibility == "private" {
		subQuery = subQuery.Where("q.user_id = ?", userID)
	}

	countQuery := r.DB.Table("(?) as sub", subQuery).Select("COUNT(*)")
	if err := countQuery.Scan(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// ページネーションの適用
	query := baseQuery.Offset(offset).Limit(limit)
	if err := query.Find(&questions).Error; err != nil {
		return nil, 0, err
	}

	return questions, totalCount, nil
}

func (r *GormRepository) SearchFavoriteQuestions(title string, visibility string, genreID int, userID string, offset int, limit int) ([]FavoriteQuestionResponse, int64, error) {
	var questions []FavoriteQuestionResponse

	// 基本クエリ（データ取得用）
	baseQuery := r.DB.Table("online_learning_favorite_questions as fq").
		Select("DISTINCT s.question_set_id, q.title, q.genre_id, g.name as genre_name, u.name as user_name, s.total_stars, s.avg_star").
		Joins("JOIN online_learning_users u ON u.id = fq.user_id").
		Joins("JOIN online_learning_question_set qs ON qs.set_id = fq.question_set_id").
		Joins("JOIN online_learning_stars s ON s.question_set_id = fq.question_set_id").
		Joins("JOIN online_learning_questions q ON q.id = qs.question_id").
		Joins("JOIN online_learning_genres g ON g.id = qs.genre_id").
		Where("q.visibility = ? AND q.genre_id = ?", visibility, genreID).
		Order("s.total_stars DESC, s.avg_star DESC, fq.question_set_id ASC")

	// Title が指定されている場合は部分一致検索を適用
	if title != "" {
		baseQuery = baseQuery.Where("q.title LIKE ?", "%"+title+"%")
	}

	// Visibility が private の場合は、ユーザーIDによるフィルタを追加
	if visibility == "private" {
		baseQuery = baseQuery.Where("q.user_id = ?", userID)
	}

	// totalCount を取得するためのサブクエリ
	var totalCount int64
	subQuery := r.DB.Table("online_learning_favorite_questions as fq").
		Select("DISTINCT s.question_set_id, q.title, q.genre_id, g.name as genre_name, u.name as user_name, s.total_stars, s.avg_star").
		Joins("JOIN online_learning_users u ON u.id = fq.user_id").
		Joins("JOIN online_learning_question_set qs ON qs.set_id = fq.question_set_id").
		Joins("JOIN online_learning_stars s ON s.question_set_id = fq.question_set_id").
		Joins("JOIN online_learning_questions q ON q.id = qs.question_id").
		Joins("JOIN online_learning_genres g ON g.id = qs.genre_id").
		Where("q.visibility = ? AND q.genre_id = ?", visibility, genreID)

	if title != "" {
		subQuery = subQuery.Where("q.title LIKE ?", "%"+title+"%")
	}
	if visibility == "private" {
		subQuery = subQuery.Where("q.user_id = ?", userID)
	}

	countQuery := r.DB.Table("(?) as sub", subQuery).Select("COUNT(*)")
	if err := countQuery.Scan(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// ページネーションの適用
	query := baseQuery.Offset(offset).Limit(limit)
	if err := query.Find(&questions).Error; err != nil {
		return nil, 0, err
	}

	return questions, totalCount, nil
}
