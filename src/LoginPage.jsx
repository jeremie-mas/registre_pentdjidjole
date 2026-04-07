// src/LoginPage.jsx
import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true); setError('')
    try { await onLogin(email, password) }
    catch { setError('Email ou mot de passe incorrect.') }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '2rem', color: 'var(--gold)' }}>✦</div>
          <h1>Assemblée de Djidjolé</h1>
          <p>Eglise de Pentecôte du Togo — Budget 2026</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email administrateur</label>
          <input className="form-input" type="email" value={email} placeholder="admin@djidjole.org"
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input className="form-input" type="password" value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: '.5rem' }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Connexion…' : '🔐 Se connecter'}
        </button>
      </div>
    </div>
  )
}