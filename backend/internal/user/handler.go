package user

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"net/http"
)

// UserHandler は認証関連の処理を提供する構造体
type UserHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
}

// NewUserHandler は QuestionHandler を生成
func NewUserHandler(db *gorm.DB, rdb *redis.Client) *UserHandler {
	return &UserHandler{DB: db, RDB: rdb}
}

// EditUserRequest ユーザー情報編集で表示する構造体
type EditUserRequest struct {
	UserName     string `json:"userName" gorm:"user_name"`
	Era          int    `json:"era" gorm:"era"`
	OccupationID int    `json:"occupationId" gorm:"occupation_id"`
}

// Occupation 職業テーブルに対応するmodel
type Occupation struct {
	ID   int    `json:"id" gorm:"primary_key"`
	Name string `json:"name" gorm:"name"`
}

// GetUserInfo ユーザー情報取得（ユーザー情報編集のため）
func (u *UserHandler) GetUserInfo(c echo.Context) error {
	// JWTミドルウェアでセットされた user_id を取得
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// ユーザーの情報を取得
	var userInfo EditUserRequest
	if err := u.DB.Table("online_learning_users as u").
		Select("u.name as user_name, u.era, o.id as occupation_id").
		Joins("JOIN online_learning_occupations o on o.id = u.occupation_id").
		Where("u.id = ?", userID).
		Find(&userInfo).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	// 職業テーブルからデータを取得
	var occupations []Occupation
	if err := u.DB.Table("online_learning_occupations").Find(&occupations).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, echo.Map{
		"userInfo":    userInfo,
		"occupations": occupations,
	})

}

// EditUserInfo ユーザー情報編集
func (u *UserHandler) EditUserInfo(c echo.Context) error {
	userID := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "user_id not found"})
	}

	// パラメータから値を取得
	// クエリパラメータから検索値を受け取る
	type updateParameter struct {
		Name         string `query:"name" validate:"required" gorm:"user_name"`
		Era          int    `query:"era" gorm:"era"`
		OccupationID int    `query:"occupation_id" gorm:"occupation_id"`
	}
	var userInfo updateParameter
	if err := c.Bind(&userInfo); err != nil {
		fmt.Println("Bind error:", err)
		return c.JSON(http.StatusBadRequest, err)
	}

	if err := u.DB.Table("online_learning_users").
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"name":          userInfo.Name,
			"era":           userInfo.Era,
			"occupation_id": userInfo.OccupationID,
		}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"userName": userInfo.Name,
	})
}
