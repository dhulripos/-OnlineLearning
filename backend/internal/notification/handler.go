package notification

import (
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// NotificationHandler は認証関連の処理を提供する構造体
type NotificationHandler struct {
	DB  *gorm.DB
	RDB *redis.Client
}

// NewNotificationHandler はNotificationHandlerを生成
func NewNotificationHandler(db *gorm.DB, rdb *redis.Client) *NotificationHandler {
	return &NotificationHandler{DB: db, RDB: rdb}
}

// GetNotifications **通知一覧を取得**
func (h *NotificationHandler) GetNotifications(c echo.Context) error {
	return nil
}
