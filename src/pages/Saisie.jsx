// src/pages/Saisie.jsx
import { useState, useEffect, useMemo } from 'react'
import { updatePromesse, upsertVersement } from '../lib/supabase'
import { MONTHS, today, fmtF, totalVerse, hasProm } from '../utils/helpers'

export default function Saisie({ data, onToast, onRefresh }) {
  const empty = { nom: '', prenom: '', engagement: '', mois: '', montant: '', date: today() }
  const [form,      setForm]      = useState(empty)
  const [loading,   setLoading]   = useState(false)
  const [engLocked, setEngLocked] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: k === 'nom' ? e.target.value.toUpperCase() : e.target.value }))

  const fideleMatch = useMemo(() => {
    if (!form.nom) return null
    const matches = data.filter(f => f.nom === form.nom)
    if (matches.length === 1) return matches[0]
    if (form.prenom) return data.find(f => f.nom === form.nom && f.prenom.toLowerCase() === form.prenom.toLowerCase())
    return null
  }, [form.nom, form.prenom, data])

  useEffect(() => {
    if (fideleMatch) {
      const locked = (fideleMatch.engagementFige || 0) > 0
      setEngLocked(locked)
      setForm(f => ({ ...f, prenom: fideleMatch.prenom, engagement: fideleMatch.engagement || '' }))
    } else {
      setEngLocked(false)
    }
  }, [fideleMatch])

  const fidele      = data.find(f => f.nom === form.nom && f.prenom.toLowerCase() === (form.prenom || '').toLowerCase())
  const amt         = parseFloat(form.montant) || 0
  const eng         = parseFloat(form.engagement) || 0
  const tv          = fidele ? totalVerse(fidele) : 0
  const showPreview = amt > 0 && (fidele || eng)
  const nomList     = [...new Set(data.map(f => f.nom))].sort()

  const submit = async () => {
    if (!form.nom || !form.prenom) { onToast('⚠️ Nom et prénom requis', 'error'); return }
    const idx = data.findIndex(f => f.nom === form.nom && f.prenom.toLowerCase() === form.prenom.toLowerCase())
    if (idx === -1) { onToast('❌ Fidèle introuvable. Utilisez ➕ Nouveau Fidèle.', 'error'); return }
    setLoading(true)
    try {
      const f = data[idx]
      if (eng > 0 && !f.engagementFige && eng !== f.engagement) await updatePromesse(f.id, eng)
      if (amt > 0 && form.mois !== '') await upsertVersement(f.id, parseInt(form.mois), amt, form.date)
      onToast(`✅ Enregistré — ${form.nom} ${form.prenom}`, 'success')
      onRefresh()
      setForm(empty)
      setEngLocked(false)
    } catch (e) {
      onToast('❌ Erreur : ' + e.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.15rem' }}>
          Enregistrer un Versement
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          Saisissez l'engagement et les versements mensuels d'un fidèle
        </p>
      </div>

      <div className="form-card">
        <h2 className="form-card-title">✏️ Nouveau Versement</h2>
        <p className="form-card-sub">Tapez le nom — les informations se rempliront automatiquement.</p>

        <div className="form-group">
          <label className="form-label">Nom</label>
          <input className="form-input" value={form.nom} onChange={set('nom')}
            placeholder="Ex: ABALO" list="nom-dl" style={{ textTransform: 'uppercase' }} />
          <datalist id="nom-dl">{nomList.map(n => <option key={n} value={n} />)}</datalist>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="form-input" value={form.prenom} onChange={set('prenom')} placeholder="Ex: Kodzo Cyril" />
          </div>
          <div className="form-group">
            <label className="form-label">
              Engagement (F CFA) {engLocked && <span className="prom-fige">🔒 Figé</span>}
            </label>
            <input className="form-input" type="number" value={form.engagement} onChange={set('engagement')}
              placeholder="Montant engagé" min="0" disabled={engLocked} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mois du versement</label>
            <select className="form-input" value={form.mois} onChange={set('mois')}>
              <option value="">— Sélectionner —</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m} (Mois {i + 1})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Montant Versé (F CFA)</label>
            <input className="form-input" type="number" value={form.montant} onChange={set('montant')} placeholder="0" min="0" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date du versement</label>
          <input className="form-input" type="date" value={form.date} onChange={set('date')} />
        </div>

        {showPreview && (
          <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.6rem' }}>
              Aperçu avant enregistrement
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
              <div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Engagement</div>
                <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>{fmtF(eng || (fidele?.engagement || 0))} F</div>
              </div>
              <div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Déjà versé</div>
                <div style={{ fontWeight: 700, color: 'var(--blue)' }}>{fmtF(tv)} F</div>
              </div>
              <div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Nouveau solde</div>
                <div style={{ fontWeight: 700, color: (eng || fidele?.engagement || 0) - tv - amt <= 0 ? 'var(--green)' : 'var(--orange)' }}>
                  {fmtF(Math.max(0, (eng || fidele?.engagement || 0) - tv - amt))} F
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={() => { setForm(empty); setEngLocked(false) }}>Réinitialiser</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? '⏳ Enregistrement…' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}