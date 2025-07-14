package security

import (
	"golang.org/x/crypto/bcrypt"
	"log"
)

// HashPassword 与えられたパスワードをハッシュ化する
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword 与えられたパスワードとハッシュが一致するかを確認する
func CheckPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
