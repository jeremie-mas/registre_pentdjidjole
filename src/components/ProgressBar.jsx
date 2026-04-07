export default function ProgressBar({ value }) {
  const color = value >= 1 ? 'var(--green)' : value > 0.5 ? 'var(--orange)' : 'var(--red)'
  return (
    <div className="prog-wrap">
      <div className="prog-bar">
        <div className="prog-fill" style={{ width: `${Math.min(value * 100, 100).toFixed(0)}%`, background: color }} />
      </div>
      <span className="prog-pct">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}