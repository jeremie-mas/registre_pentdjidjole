export default function Badge({ cls, label }) {
  return <span className={`badge ${cls}`}>{label}</span>
}