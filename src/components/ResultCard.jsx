function formatScore(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "-";
  return v.toFixed(3);
}

export function ResultCard({ result }) {
  if (!result) return null;

  const sentiment = result?.sentiment ?? "UNKNOWN";
  const scores = result?.scores ?? result?.SentimentScore ?? null;

  const sentimentClass =
    sentiment === "POSITIVE" ? "sentiment-positive"
    : sentiment === "NEGATIVE" ? "sentiment-negative"
    : sentiment === "MIXED" ? "sentiment-mixed"
    : sentiment === "NEUTRAL" ? "sentiment-neutral"
    : "sentiment-unknown";

  return (
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
  );
}