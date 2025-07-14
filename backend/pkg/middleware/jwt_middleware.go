package middleware

import (
	"OnlineLearningWebApp/pkg/utils"
	"fmt"
	"github.com/labstack/echo/v4"
	"net/http"
	"strings"
)

// JWTMiddleware
// JWT 認証ミドルウェア
// リクエストのAuthorizationヘッダーに含まれるJWTを検証し、ユーザーID（user_id）をcontextにセットする
func JWTMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// ① Authorization ヘッダーから JWT を取得
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "missing or invalid token"})
		}

		// ② "Bearer {token}" の形式をチェック
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token format"})
		}

		// ③ トークンの検証
		claims, err := utils.ValidateToken(tokenParts[1])
		if err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid or expired token"})
		}

		// ④ `user_id` を context にセット
		userID := fmt.Sprintf("%v", claims["user_id"])
		if userID == "" {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token claims"})
		}
		c.Set("user_id", userID)

		// ⑤ 次のハンドラー (`GetAllGenres`) に処理を渡す
		return next(c)
	}
}
