import React from 'react';

export function AiFeedback({ comment, loading, isVisible }) {
    // 表示条件を満たさない場合は何も描画しない
    if (!isVisible && !loading) return null;

    return (
        <div style={{
            marginTop: "24px",
            padding: "20px",
            backgroundColor: "#f0fdf4",  /* 背景色: 薄いミントグリーン */
            borderRadius: "12px",        /* 角丸を大きく */
            border: "1px solid #bbf7d0", /* 枠線: 薄い緑 */
            borderLeft: "6px solid #10b981", /* 左側のアクセント線: 濃い緑 */
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", /* 影をつけて浮き上がらせる */
            color: "#1f2937" /* ★重要: 文字色を濃いグレーに強制指定 */
        }}>
            {/* ヘッダー部分 */}
            <h3 style={{
                margin: "0 0 12px 0",
                fontSize: "1.1rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#065f46" /* タイトル文字色: 深い緑 */
            }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <span>AIカウンセラー</span>

                {loading && (
                    <span style={{
                        fontSize: "0.85rem",
                        fontWeight: "normal",
                        color: "#6b7280",
                        marginLeft: "auto"
                    }}>
                        メッセージ生成中...
                    </span>
                )}
            </h3>

            {/* メッセージ本文 */}
            {!loading && comment && (
                <div style={{
                    fontSize: "1rem",
                    lineHeight: "1.8",       /* 行間を広げて読みやすく */
                    whiteSpace: "pre-wrap",  /* 改行を反映 */
                    color: "#374151",        /* 本文文字色: 読みやすいグレー */
                    backgroundColor: "rgba(255, 255, 255, 0.6)", /* 文字背景にうっすら白を敷く */
                    padding: "12px",
                    borderRadius: "8px"
                }}>
                    {comment}
                </div>
            )}

            {/* コメントがない場合 */}
            {!loading && !comment && isVisible && (
                <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                    （コメントはありません）
                </p>
            )}
        </div>
    );
}