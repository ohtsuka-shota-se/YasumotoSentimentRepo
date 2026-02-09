import { useMemo, useState } from "react";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function formatScore(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "-";
  return v.toFixed(3);
}

// ★修正箇所: Authenticatorに設定を追加
export default function App() {
  return (
    <Authenticator
      // これを追加すると、Create Account画面にEmail入力欄が表示されます
      signUpAttributes={['email']}
    >
    
      {({ signOut, user }) => (
        <MainApp signOut={signOut} user={user} />
      )}
    </Authenticator>
  );
}

// --- 以下、MainAppの中身は変更ありません ---

function MainApp({ signOut, user }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [apiStatus, setApiStatus] = useState("unchecked");

  const canSubmit = useMemo(() => {
    const len = text.trim().length;
    return !loading && len > 0 && len <= 1000;
  }, [text, loading]);

  const apiStatusLabel =
    !API_BASE
      ? "未設定"
      : apiStatus === "ok"
        ? "接続OK"
        : apiStatus === "ng"
          ? "接続NG"
          : "未確認";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!API_BASE) {
      setApiStatus("unset");
      setError("API の設定がありません（VITE_API_BASE_URL を確認してください）。");
      return;
    }

    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error("認証トークンの取得に失敗しました");
      }

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token 
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const bodyText = await safeReadText(res);
        throw new Error(bodyText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setApiStatus("ok");
    } catch (err) {
      setApiStatus("ng");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const sentiment = result?.sentiment ?? "UNKNOWN";
  const scores = result?.scores ?? result?.SentimentScore ?? null;

  const sentimentClass =
    sentiment === "POSITIVE"
      ? "sentiment-positive"
      : sentiment === "NEGATIVE"
        ? "sentiment-negative"
        : sentiment === "MIXED"
          ? "sentiment-mixed"
          : sentiment === "NEUTRAL"
            ? "sentiment-neutral"
            : "sentiment-unknown";

  return (
    <div className="page">
      <main className="card">
        <div className="header">
          <div>
            <h1 className="title">感情分析デモ</h1>
            <p className="subtitle">ユーザー: {user?.signInDetails?.loginId || user?.username}</p>
            <p className="subtitle" style={{marginTop: '4px'}}>API接続: {apiStatusLabel}</p>
          </div>
          <div>
             <button 
               onClick={signOut} 
               className="btn" 
               style={{ backgroundColor: '#4b5563', fontSize: '12px', padding: '8px 12px' }}
             >
               ログアウト
             </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="form">
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ここに文章を入力してください（最大1000文字）"
          />

          <div className="row">
            <small className="counter">{text.length} / 1000</small>

            <button type="submit" className="btn" disabled={!canSubmit}>
              {loading ? "分析中..." : "分析する"}
            </button>
          </div>

          <p className="hint">
            改行しやすいように Enter 送信ではなくボタン送信にしています。
          </p>
        </form>

        {error && <div className="alert alert--error">{error}</div>}

        {result && (
          <section className="resultCard">
            <h2 className="h2">結果</h2>

            <div className="badges">
              <span className={`badge ${sentimentClass}`}>
                sentiment: <strong>{sentiment}</strong>
              </span>

              {scores && (
                <>
                  <span className="badge badge--pos">
                    Positive: <strong>{formatScore(scores.Positive)}</strong>
                  </span>
                  <span className="badge badge--neg">
                    Negative: <strong>{formatScore(scores.Negative)}</strong>
                  </span>
                  <span className="badge badge--neu">
                    Neutral: <strong>{formatScore(scores.Neutral)}</strong>
                  </span>
                  <span className="badge badge--mix">
                    Mixed: <strong>{formatScore(scores.Mixed)}</strong>
                  </span>
                </>
              )}
            </div>

            <pre className="pre">{JSON.stringify(result, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}
