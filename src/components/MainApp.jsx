import { useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useTranscribe } from "../hooks/useTranscribe";
import { ResultCard } from "./ResultCard";

// 環境設定
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export default function MainApp({ signOut, user }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [apiStatus, setApiStatus] = useState("unchecked");
  const { isRecording, startRecording, stopRecording } = useTranscribe(setText);

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

      if (!token) throw new Error("認証トークンの取得に失敗しました");

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
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

  return (
    <div className="page">
      <main className="card">
        <div className="header">
          <div>
            <h1 className="title">感情分析デモ</h1>
            <p className="subtitle">
              ユーザー: {user?.signInDetails?.loginId || user?.username}
            </p>
            <p className="subtitle" style={{ marginTop: "4px" }}>
              API接続: {apiStatusLabel}
            </p>
          </div>
          <div>
            <button
              onClick={signOut}
              className="btn"
              style={{
                backgroundColor: "#4b5563",
                fontSize: "12px",
                padding: "8px 12px",
              }}
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

          {/* 音声入力ボタンと送信ボタン */}
          <div className="row" style={{ alignItems: 'center' }}>
            <button 
                type="button" 
                className="btn"
                // ★変更: 録音中なら停止、そうでなければ開始
                onClick={isRecording ? stopRecording : startRecording}
                style={{ 
                    backgroundColor: isRecording ? '#dc2626' : '#2563eb',
                    marginRight: 'auto', // 左寄せ
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                }}
            >
                <span style={{ fontSize: '1.2em' }}>{isRecording ? "⏹" : "🎤"}</span> 
                {isRecording ? "停止する" : "音声入力"}
            </button>

            <small className="counter" style={{ marginRight: '10px' }}>{text.length} / 1000</small>

            <button type="submit" className="btn" disabled={!canSubmit}>
              {loading ? "分析中..." : "分析する"}
            </button>
          </div>

          <p className="hint">
            改行しやすいように Enter 送信ではなくボタン送信にしています。
          </p>
        </form>

        {error && <div className="alert alert--error">{error}</div>}

        {/* 結果表示コンポーネント */}
        <ResultCard result={result} />
        
      </main>
    </div>
  );
}
