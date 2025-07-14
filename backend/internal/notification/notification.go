package notification

import (
	"bytes"
	"fmt"
	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
	"html/template"
	"log"
	"net/smtp"
	"path/filepath"
	"sync"
	"time"
)

type NotificationService struct {
	DB *gorm.DB
}

type Notification struct {
	UserID          string    `db:"user_id"`
	UserName        string    `db:"user_name"`
	Email           string    `db:"email"`
	QuestionSetID   int       `db:"question_set_id"`
	Deadline        time.Time `db:"deadline"`
	Status          string    `db:"status"`
	Progress        float64   `db:"progress"`
	Attempts        int       `db:"attempts"`
	CreatedAt       time.Time `db:"created_at"`
	LastUpdatedAt   time.Time `db:"last_updated_at"`
	Period          int       `db:"period"`
	PassedDays      int       `db:"passed_days"`
	PlannedProgress float64   `db:"planned_progress"`
	TotalCorrect    int       `db:"total_correct"`
	TotalQuestions  int       `db:"total_questions"`
}

func (s *NotificationService) ScheduleNotifications() {
	c := cron.New()

	_, err := c.AddFunc("29 14 * * *", func() { // 5フィールド形式（分, 時, 日, 月, 曜日）
		err := s.SendDailyNotifications()
		if err != nil {
			log.Println("Failed to send notifications:", err)
		}
	})

	if err != nil {
		log.Fatal("Failed to schedule notifications:", err)
	}

	c.Start()
}

const workerCount = 5 // 並列で処理するワーカー数

// SendDailyNotifications
// ユーザーの進捗を取得して通知を送信
func (s *NotificationService) SendDailyNotifications() error {
	var notifications []Notification

	// GORMの最適化クエリ（関連データを一度に取得）
	err := s.DB.Raw(`
			SELECT 
				u.id AS user_id, 
				u.email, 
				u.name AS user_name, 
				mq.question_set_id, 
				mq.deadline, 
				mq.status, 
				mq.progress, 
				mq.attempts, 
				mq.created_at, 
				mq.last_updated_at, 
				(mq.deadline::date - mq.created_at::date) AS period,  -- 全期間（日数）
				(CURRENT_DATE - mq.created_at::date) AS passed_days,    -- 経過日数
				-- 予定進捗：経過日数÷全期間×100
				((CURRENT_DATE - mq.created_at::date) * 100.0 / (mq.deadline::date - mq.created_at::date)) AS planned_progress,
				(SELECT COUNT(*) FROM online_learning_correct_answers 
				   WHERE question_set_id = mq.question_set_id) AS total_correct,
				(SELECT COUNT(*) FROM online_learning_question_set 
				   WHERE set_id = mq.question_set_id) AS total_questions
			FROM online_learning_my_questions mq
			JOIN online_learning_users u ON u.id = mq.user_id
			WHERE mq.status IN ('not_started', 'in_progress') 
			  AND mq.deadline >= NOW()
			ORDER BY mq.user_id ASC, mq.deadline ASC, mq.progress ASC
		`).Scan(&notifications).Error

	if err != nil {
		return err
	}

	if len(notifications) == 0 {
		log.Println("No notifications to send.")
		return nil
	}

	// Worker Pool の実装
	var wg sync.WaitGroup
	jobChan := make(chan Notification, len(notifications))

	// Worker を起動
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for notification := range jobChan {
				s.processNotification(notification)
			}
		}()
	}

	// Job キューに通知を投入
	for _, n := range notifications {
		jobChan <- n
	}

	close(jobChan) // すべてのジョブを追加したらチャンネルを閉じる
	wg.Wait()      // 全てのWorkerが処理完了するまで待機

	return nil
}

// **通知処理（メール送信 & Web通知）**
func (s *NotificationService) processNotification(n Notification) {
	isProgressOnSchedule := false
	message := ""
	if n.Progress < n.PlannedProgress {
		message = fmt.Sprintf("あなたの進捗は遅れています。今日の目標まであと %s ％です！", fmt.Sprintf("%.1f", n.PlannedProgress-n.Progress))
	} else {
		isProgressOnSchedule = true
		message = "順調です！今日の目標を超えています。引き続き頑張りましょう！"
	}

	// **メール送信（リトライ対応）**
	for i := 0; i < 3; i++ { // 最大3回リトライ
		err := s.SendEmail(n.Email, n.UserName, message, isProgressOnSchedule, n.Progress, n.QuestionSetID)
		if err == nil {
			break // 成功したらループ終了
		}
		log.Printf("Failed to send email to %s (attempt %d): %v", n.Email, i+1, err)
		time.Sleep(2 * time.Second) // 2秒待機して再試行
	}

	// **Web通知**
	if err := s.SendWebNotification(n.UserID, message); err != nil {
		log.Println("Failed to send web notification:", err)
	}
}

// SendWebNotification
// ** Web通知 **
func (s *NotificationService) SendWebNotification(userID string, message string) error {
	// ここではWebSocketまたはAPI経由でReactに通知を送る
	log.Printf("Sending Web notification to %s: %s\n", userID, message)
	return nil
}

// EmailData
// メール通知をする際に送るデータ
type EmailData struct {
	UserName             string
	Message              string
	IsProgressOnSchedule bool
	Progress             float64
	QuestionSetURL       string
}

// SendEmail
// ** メール通知 **
func (s *NotificationService) SendEmail(to string, userName string, message string, isProgressOnSchedule bool, progress float64, questionSetID int) error {
	from := ""     // 通知を送信する用のアカウントのメールアドレスを設定する
	password := "" // 通知を送信する用のアカウントのアプリパスワードを設定する
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	auth := smtp.PlainAuth("", from, password, smtpHost)

	// **テンプレートファイルの読み込み**
	templatePath := filepath.Join("templates", "email_template.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		log.Println("Failed to load email template:", err)
		return err
	}

	// **データをテンプレートに適用**
	data := EmailData{
		UserName:             userName,
		Message:              message,
		IsProgressOnSchedule: isProgressOnSchedule,
		Progress:             progress, // 小数点を整数のパーセントに変換
		QuestionSetURL:       fmt.Sprintf("http://localhost:3000/question/set/%d", questionSetID),
	}

	var body bytes.Buffer
	err = tmpl.Execute(&body, data)
	if err != nil {
		log.Println("Failed to render email template:", err)
		return err
	}

	// **メール送信**
	currentDate := time.Now().Format("2006-01-02") // "2025-02-19" のような形式
	subject := fmt.Sprintf("Subject: [%s] 学習進捗通知\r\n", currentDate)
	headers := "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n"
	msg := subject + headers + "\r\n" + body.String()

	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, []byte(msg))
	if err != nil {
		log.Println("Failed to send email:", err)
		return err
	}

	log.Println("Email sent successfully to", to)
	return nil
}
