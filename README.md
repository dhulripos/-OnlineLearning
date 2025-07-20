# Echo-Learning（エコラン）

**Echo-Learning（通称：エコラン）** は、「反響」をテーマにした学習支援Webアプリケーションです。
繰り返し問題集に取り組んだり、他のユーザーが作成した問題集に挑戦することで、知識や発見の「反響」が広がっていきます。

🔗 アプリURL: [https://dhulripos-echo-learning.com](https://dhulripos-echo-learning.com)
※ 現在も継続的に開発・改善中です。

---

## 🛠 技術スタック

### 📱 フロントエンド

* **React** – UIの構築
* **Recoil** – グローバル状態管理

### 🚀 バックエンド

* **Go（Golang）** – 高パフォーマンスなAPI実装
* **Echo** – 軽量Webフレームワーク
* **OAuth 2.0（Google認証）** – Googleアカウントによるログイン機能
* **JWT（JSON Web Token）** – API認証／ユーザー認可

### ☁️ インフラ・クラウド（AWS）

* **RDS（PostgreSQL）** – 本番用リレーショナルデータベース
* **ElasticCache（Valkey）** – セッション管理とキャッシュ
* **ECR（Elastic Container Registry）** – Dockerイメージのホスティング
* **ECS（Fargate）** – コンテナオーケストレーション
* **ALB（Application Load Balancer）** – トラフィック制御
* **Route 53** – カスタムドメインのDNS設定
* **ACM（AWS Certificate Manager）** – SSL証明書の管理

---

## 💡 コンセプト

* **繰り返し学習を促進**する仕組み（期限を決めてそこまでの達成度などを表示）
* **ユーザー同士の学びの共有**（公開問題集、フォロー機能←搭載予定）
* **使いやすく、成長できるUI設計**

---

## 📌 補足

このアプリは、**個人で企画・設計・開発・デプロイ**まで行った成果物です。
学習プラットフォームとしての価値だけでなく、フルスタック開発・インフラ構築・運用知識を総合的に体現しています。

---

