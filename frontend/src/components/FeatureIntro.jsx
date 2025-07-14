import { useState } from "react";
import "../css/FeatureIntro.css";
import descriptionImage from "../common/images/マイ学習リスト説明.png";
import descriptionImage2 from "../common/images/問題集検索説明.png";
import descriptionImage3 from "../common/images/問題集作成説明.png";
import descriptionImage4 from "../common/images/ユーザー情報編集説明.png";
import descriptionImage5 from "../common/images/ユーザー情報変更画面.png";
import descriptionImage6 from "../common/images/問題集作成初期表示.png";
import descriptionImage7 from "../common/images/問題集検索後表示.png";
import descriptionImage8 from "../common/images/問題集詳細初期表示.png";
import descriptionImage9 from "../common/images/問題集回答初期表示.png";
import descriptionImage10 from "../common/images/回答ボタン.png";
import descriptionImage11 from "../common/images/問題集回答結果.png";
import descriptionImage12 from "../common/images/問題集作成中.png";
import descriptionImage13 from "../common/images/マイ学習リスト一覧.png";

export default function FeatureIntro() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleContent = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="feature-board">
      <h1 className="feature-title">ようこそ エコラン へ！</h1>
      <p>
        エコランは、Echo-Learningの略称で
        <span className="highlight">「反響」</span>がテーマです。
      </p>
      <p>
        繰り返し問題集を解いたり、他ユーザーの作成した問題集を通して新しい発見をすることで
        <span className="highlight">「反響」</span>を広げることができます。
      </p>
      <p className="feature-description">
        以下に、エコランの <span className="highlight">使い方</span>
        を紹介します！
      </p>
      <div className="feature-item" onClick={() => toggleContent(0)}>
        <button className="feature-toggle">
          {openIndex === 0 ? "▼" : "▶"}
        </button>
        <span>マイ学習リスト</span>
      </div>
      {openIndex === 0 && (
        <div className="feature-content">
          <img
            src={descriptionImage}
            alt="マイ学習リストの説明"
            style={{ width: "100%" }}
          />
          <p>
            ヘッダーより
            <span className="highlight">マイ学習リスト</span>
            をクリックし、マイ学習リスト画面に遷移します。
          </p>
          <img
            src={descriptionImage13}
            alt="マイ学習リストの説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">マイ学習リスト</span>
            は、問題集の中から、あなたが 興味のある / 達成したい目標
            に該当する問題集を追加することで、問題を解きながら進捗管理ができます。
          </p>
          <p>
            マイ学習リストへ追加する際、
            <span className="highlight">期限の設定が必須</span>
            となっており、時間を決めて学習に取り組むことができます。
          </p>
          <p>
            <span className="highlight">マイ学習リスト</span>
            から進捗を確認できたり、毎日17:00に送信される進捗確認メールで確認することもできます。
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(1)}>
        <button className="feature-toggle">
          {openIndex === 1 ? "▼" : "▶"}
        </button>
        <span>問題集検索</span>
      </div>
      {openIndex === 1 && (
        <div className="feature-content">
          <img
            src={descriptionImage2}
            alt="問題集検索の説明"
            style={{ width: "100%" }}
          />
          <p>
            ヘッダーより
            <span className="highlight">問題集検索</span>
            をクリックし、問題集検索画面に遷移します。
          </p>
          <img
            src={descriptionImage7}
            alt="問題集検索後の説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">問題集検索</span>では、
            あなたや他のユーザーが作成した問題集を
            <span className="highlight">問題集のタイトルやジャンルで探す</span>
            ことができます。
          </p>
          <p>
            検索時に<span className="highlight">公開範囲を設定</span>
            することもできます。
          </p>
          <p>
            あなたしか閲覧することができない問題集を探す場合は、
            <span className="highlight">公開範囲をプライベート</span>
            にすると探しやすいです。
          </p>
          <p>
            反対に、全ユーザーが閲覧可能な問題集を探す場合は、
            <span className="highlight">公開範囲をパブリック</span>
            にすると探せます。
          </p>
          <p>
            あなたが 興味がある/ 目標にしたい
            問題集を探して問題に挑戦しましょう！
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(2)}>
        <button className="feature-toggle">
          {openIndex === 2 ? "▼" : "▶"}
        </button>
        <span>問題集作成</span>
      </div>
      {openIndex === 2 && (
        <div className="feature-content">
          <img
            src={descriptionImage3}
            alt="問題集作成の説明"
            style={{ width: "100%" }}
          />
          <p>
            ヘッダーより<span className="highlight">問題集作成</span>
            をクリックし、問題作成画面に遷移します。
          </p>
          <img
            src={descriptionImage6}
            alt="問題集作成の説明"
            style={{ width: "100%" }}
          />
          <img
            src={descriptionImage12}
            alt="問題集作成の説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">問題集作成</span>では、
            あなたのオリジナルの問題集を作成することができます。
          </p>
          <p>
            問題集作成時には、
            <span className="highlight">
              問題集の公開範囲（プライベート / パブリック）やジャンルを設定
            </span>
            しましょう。
          </p>
          <p>
            <span className="highlight">
              問題を複数作成したい場合は、プラスボタンをクリックする
            </span>
            ことで、問題を追加できます。
          </p>
          <p>
            <span className="highlight">
              作成中に問題を取り消したい場合は、問題の右上にあるバツボタンをクリックする
            </span>
            ことで、該当の問題を取り消すことができます。
          </p>
          <p>
            あなたが達成したい目標を問題集にしたり、同じ目標を持つユーザーが利用できる問題集を作成しましょう！
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(3)}>
        <button className="feature-toggle">
          {openIndex === 3 ? "▼" : "▶"}
        </button>
        <span>問題集詳細</span>
      </div>
      {openIndex === 3 && (
        <div className="feature-content">
          <img
            src={descriptionImage7}
            alt="問題集詳細の説明"
            style={{ width: "100%" }}
          />
          <p>
            マイ学習リスト、または、問題集検索より
            <span className="highlight">問題集タイトルを選択</span>
            し、問題集詳細画面に遷移します。
          </p>
          <img
            src={descriptionImage8}
            alt="問題集詳細画面の説明"
            style={{ width: "100%" }}
          />
          <p>
            問題集詳細では、
            <span className="highlight">
              選択した問題集を閲覧したり、回答に進んだり、マイ学習リストに追加する
            </span>
            ことができます。
          </p>
          <p>
            マイ学習リストに追加する際は、
            <span className="highlight">目標期限を必ず設定</span>
            しなければなりません。
          </p>
          <p>
            <span className="highlight">
              問題集に評価をつけるのは、マイ学習リストに登録後
            </span>
            に一度だけ可能です。
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(4)}>
        <button className="feature-toggle">
          {openIndex === 4 ? "▼" : "▶"}
        </button>
        <span>問題集回答</span>
      </div>
      {openIndex === 4 && (
        <div className="feature-content">
          <img
            src={descriptionImage8}
            alt="問題集回答の説明"
            style={{ width: "100%" }}
          />
          <p>
            問題集詳細より
            <span className="highlight">この問題集を回答する</span>
            をクリックし、問題集回答画面に遷移します。
          </p>
          <img
            src={descriptionImage9}
            alt="問題集回答画面の説明"
            style={{ width: "100%" }}
          />
          <img
            src={descriptionImage10}
            alt="問題集回答画面の説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">問題集回答</span>では、
            選択した問題集に回答することができます。
          </p>
          <p style={{ textDecoration: "underline solid #000000" }}>
            <span className="highlight">
              回答中にページをリロードしたり、
              別タブに移動したりすると回答内容が失われるため、
              注意してください。
            </span>
          </p>
          <p>
            回答を提出するには、
            <span className="highlight">回答を提出</span>
            をクリックしてください。
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(5)}>
        <button className="feature-toggle">
          {openIndex === 5 ? "▼" : "▶"}
        </button>
        <span>問題集回答結果</span>
      </div>
      {openIndex === 5 && (
        <div className="feature-content">
          <img
            src={descriptionImage9}
            alt="問題集回答結果の説明"
            style={{ width: "100%" }}
          />
          <img
            src={descriptionImage10}
            alt="問題集回答結果の説明"
            style={{ width: "100%" }}
          />
          <p>
            問題集確認より回答を選択し、
            <span className="highlight">回答を提出</span>
            をクリックし、?????画面に遷移します。
          </p>
          <img
            src={descriptionImage11}
            alt="問題集回答結果画面の説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">問題集回答結果</span>では、
            あなたが回答した結果を確認することができます。
          </p>
          <p>
            <span className="highlight">
              回答内容は24時間しか閲覧できないため、注意してください。
            </span>
          </p>
          <p>
            <span className="highlight">
              また、回答結果の閲覧は、回答直後のみ可能であるため、
              正誤確認をしたい場合は、すぐに振り返りをしましょう。
            </span>
          </p>
        </div>
      )}

      <div className="feature-item" onClick={() => toggleContent(6)}>
        <button className="feature-toggle">
          {openIndex === 6 ? "▼" : "▶"}
        </button>
        <span>ユーザー情報変更</span>
      </div>
      {openIndex === 6 && (
        <div className="feature-content">
          <img
            src={descriptionImage4}
            alt="ユーザー情報変更の説明"
            style={{ width: "100%" }}
          />
          <p>
            ヘッダーより
            <span className="highlight">ユーザー名→ユーザー情報変更</span>
            をクリックし、ユーザー情報変更画面に遷移します。
          </p>
          <img
            src={descriptionImage5}
            alt="ユーザー情報変更画面の説明"
            style={{ width: "100%" }}
          />
          <p>
            <span className="highlight">ユーザー情報変更</span>では、
            あなたのアプリ内で使用する名前、年代、職業を設定することができます。
          </p>
          <p>
            <span className="highlight">
              アプリ内で使用する名前は、必須項目であり、
            </span>
            年代、職業は任意で設定してください。
          </p>
          <p style={{ textDecoration: "underline solid #000000" }}>
            他ユーザーに公開される情報は、
            <span className="highlight">名前のみ</span>です。
          </p>
        </div>
      )}
    </div>
  );
}
