export default function Toast({ msg, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? 'show' : ''}`}>
      {msg}
    </div>
  )
}