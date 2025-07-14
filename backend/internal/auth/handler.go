package auth

import (
	"OnlineLearningWebApp/pkg/utils"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

// AuthHandler は認証関連の処理を提供する構造体
type AuthHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
}

// NewAuthHandler は AuthHandler を生成
func NewAuthHandler(db *gorm.DB, rdb *redis.Client) *AuthHandler {
	return &AuthHandler{DB: db, RDB: rdb}
}

// OAuth2の設定
var googleOAuthConfig = &oauth2.Config{
	// なぜか環境変数を読み込むようにするでは、うまく動かない...
	// exportして手動で設定してもダメだったので、とりあえずハードコードする
	//ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	//ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	//RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	ClientID:     "",
	ClientSecret: "",
	RedirectURL:  "",
	Scopes:       []string{"openid", "profile", "email"},
	Endpoint:     google.Endpoint,
}

// Login はOAuth2.0でログインし、セッションを作成する
func (h *AuthHandler) Login(c echo.Context) error {

	code := c.QueryParam("code")
	if code == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Authorization code is required"})
	}

	// Google OAuth2.0 でアクセストークンを取得
	// ここでは、googleOAuthConfigに設定したリダイレクトURLは使用されない。
	// リダイレクトURLは、認証コードを送信する際に使用されるため、認証コード→アクセストークンへの返還の際には使用されない。
	// ダイレクトにtokenに入ってくるはず。
	// なぜ認証コード→アクセストークンの処理ではリダイレクトURLを使用しないのに、リダイレクトURLを設定しておく必要があるのかというと、
	// GoogleのOAuthの仕様では、アクセストークンに交換するときに、Google Cloud Consoleに登録されたリダイレクトURLとリクエスト時に指定した
	// リダイレクトURLが一致していることを確認するチェックが行われるため。
	// つまり、リダイレクトは発生しないが、Googleは「このリダイレクトURLを使って認証を開始したんだな？」と確認するために必要ということ。
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to exchange token"})
	}

	// Googleのユーザー情報を取得
	userInfo, err := getGoogleUserInfo(token.AccessToken)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to get user info"})
	}

	userID := userInfo.Sub // Googleの一意なユーザーID

	// ユーザーがDBに存在するか確認（なければ登録）
	if err2 := ensureUserExists(h.DB, userID, userInfo.Email, userInfo.Name, userInfo.Picture); err2 != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to create user"})
	}

	// ユーザーがDBに存在する場合、その情報をクライアントに返す
	var user User
	var count int64
	if err := h.DB.Table("online_learning_users").Where("id = ?", userID).Count(&count).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to get user count"})
	}
	if count > 0 {
		if err := h.DB.Table("online_learning_users").Where("id = ?", userID).Find(&user).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to bind request"})
		}
	}

	// セッションIDをUUIDで生成
	sessionID := uuid.New().String()

	// Redisにセッション情報を保存（1日有効）
	err = h.RDB.Set(context.Background(), sessionID, userID, 24*time.Hour).Err()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to create session"})
	}

	// JWTを発行
	jwtToken, err := utils.GenerateToken(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to generate token"})
	}

	// セッションIDを `HttpOnly` クッキーに保存
	c.SetCookie(&http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: false,                   // JavaScript からアクセス不可→アクセス許可に変える。そうでないとJWTでセッション管理することになり。セッションIDがある意味がなくなるので。
		Secure:   false,                   // 本番環境では true にする（HTTPS 必須）
		SameSite: http.SameSiteStrictMode, // CSRF 対策
		MaxAge:   86400,                   // 1日
	})

	data := map[string]interface{}{}
	if count > 0 {
		// ユーザーがDBに登録済みの場合
		data = map[string]interface{}{
			"name":   user.Name,
			"email":  userInfo.Email,
			"picUrl": userInfo.Picture,
		}
	} else {
		// ユーザーがDBに未登録の場合（新しくログインする場合）
		data = map[string]interface{}{
			"name":   userInfo.Name,
			"email":  userInfo.Email,
			"picUrl": userInfo.Picture,
		}
	}

	// JWT は JSON レスポンスで返す
	return c.JSON(http.StatusOK, echo.Map{
		"message": "Login successful",
		"token":   jwtToken,
		"user":    data,
	})

}

// Logout はセッションを削除する
func (h *AuthHandler) Logout(c echo.Context) error {
	sessionID := c.QueryParam("session_id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Session ID is required"})
	}

	// Redisからセッション削除
	err := h.RDB.Del(context.Background(), sessionID).Err()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to delete session"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "Logged out"})
}

// Me はログイン中のユーザー情報を返す（JWT認証）
func (h *AuthHandler) Me(c echo.Context) error {
	userID, ok := c.Get("user_id").(string)
	if !ok {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "Invalid token"})
	}

	return c.JSON(http.StatusOK, echo.Map{"user_id": userID})
}

// Googleのユーザー情報を取得
func getGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// Googleユーザー情報の構造体
type GoogleUserInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"` // 追加: Googleのプロフィール画像URL
}

// ユーザーがDBに存在するか確認し、なければ作成
func ensureUserExists(db *gorm.DB, userID, email, name, avatar string) error {
	var count int64
	db.Table("online_learning_users").Where("id = ?", userID).Count(&count)
	if count > 0 {
		return nil // 既に登録済みの場合
	}

	// 新規ユーザー作成
	user := User{ID: userID, Email: email, Name: name, Avatar: avatar, Era: 0, OccupationId: 0}
	return db.Create(&user).Error
}

// Userモデル
type User struct {
	ID           string    `gorm:"primaryKey;size:255"`
	Name         string    `gorm:"type:text"` // 文字数制限なしの文字列
	Email        string    `gorm:"unique;type:text"`
	Avatar       string    `gorm:"type:text"`
	CreatedAt    time.Time `gorm:"type:date"`
	UpdatedAt    time.Time `gorm:"type:date"`
	Era          int       `gorm:"type:int"`
	OccupationId int       `gorm:"type:int"`
}

// テーブル名を指定
func (User) TableName() string {
	return "online_learning_users"
}
