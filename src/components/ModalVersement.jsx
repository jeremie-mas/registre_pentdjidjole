// src/components/ModalVersement.jsx — V4 (onglets Ajouter / Corriger)
import { useState, useEffect } from 'react'
import { updatePromesse, upsertVersement } from '../lib/supabase'
import { MONTHS, today, fmtF, totalVerse, solde } from '../utils/helpers'
import Badge from './Badge'

export default function ModalVersement({ fidele, onClose, onSaved, onToast }) {
  const [tab,     setTab]     = useState('ajouter')
  const [eng,     setEng]     = useState('')
  const [montant, setMontant] = useState('')
  const [moisIdx, setMoisIdx] = useState(0)
  const [date,    setDate]    = useState(today())
  const [loading, setLoading] = useState(false)

  // Onglet Corriger
  const [cMois,    setCMois]    = useState('')
  const [cNouveau, setCNouveau] = useState('')
  const [cDate,    setCDate]    = useState('')

  const isFige = (fidele?.engagementFige || 0) > 0

  useEffect(() => {
    if (fidele) {
      setEng(fidele.engagement || '')
      setMontant('')
      setDate(today())
      setTab('ajouter')
      setCMois(''); setCNouveau(''); setCDate('')
    }
  }, [fidele])

  if (!fidele) return null
  const tv = totalVerse(fidele)

  // ── Calcul ancien montant pour l'onglet Corriger
  const ancienMontant = (() => {
    if (cMois === '') return 0
    if (cMois === '-1') return fidele.versInit || 0
    return fidele.mois[parseInt(cMois)]?.montant || 0
  })()
  const nouveauMontant = parseFloat(cNouveau) || 0
  const diff = nouveauMontant - ancienMontant
  const showPreviewCorr = cMois !== '' && cNouveau !== ''

  // ── Sauvegarder versement (Ajouter)
  const save = async () => {
    setLoading(true)
    try {
      const engVal = parseInt(eng) || 0
      if (engVal > 0 && !isFige && engVal !== fidele.engagement)
        await updatePromesse(fidele.id, engVal)
      if (parseInt(montant) > 0)
        await upsertVersement(fidele.id, moisIdx, parseInt(montant), date)
      onSaved()
      onToast(`✅ Enregistré — ${fidele.nom} ${fidele.prenom}`, 'success')
      onClose()
    } catch (e) {
      onToast('❌ Erreur : ' + e.message, 'error')
    }
    setLoading(false)
  }

  // ── Appliquer correction
  const appliquerCorrection = async () => {
    if (cMois === '') { onToast('⚠️ Sélectionnez un mois', 'error'); return }
    if (isNaN(nouveauMontant) || nouveauMontant < 0) { onToast('⚠️ Montant invalide', 'error'); return }
    setLoading(true)
    try {
      if (cMois === '-1') {
        // Correction versInit → on met à jour via updatePromesse workaround
        // On utilise upsertVersement avec index spécial ou direct update
        await upsertVersement(fidele.id, -1, nouveauMontant, cDate || null)
      } else {
        await upsertVersement(fidele.id, parseInt(cMois), nouveauMontant, cDate || fidele.mois[parseInt(cMois)]?.date || null)
      }
      onSaved()
      const nomMois = cMois === '-1' ? 'Versement initial' : MONTHS[parseInt(cMois)]
      onToast(`✏️ ${fidele.nom} ${fidele.prenom} — ${nomMois} corrigé : ${diff >= 0 ? '+' : ''}${fmtF(diff)} F`, 'success')
      onClose()
    } catch (e) {
      onToast('❌ Erreur : ' + e.message, 'error')
    }
    setLoading(false)
  }

  const tabBtn = (id, label, active) => ({
    style: {
      flex: 1, padding: '.5rem', borderRadius: 7, border: 'none',
      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '.82rem', fontWeight: 600,
      transition: 'all .2s',
      background: active
        ? (id === 'ajouter' ? 'linear-gradient(135deg,var(--gold),var(--gold-light))' : 'linear-gradient(135deg,var(--orange),#f5a623)')
        : 'transparent',
      color: active ? (id === 'ajouter' ? 'var(--dark)' : '#fff') : 'var(--muted)',
    },
    onClick: () => setTab(id),
    children: label,
  })

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-title">
          💰 Versement — <span style={{ color: 'var(--text)', fontSize: '.95rem' }}>{fidele.nom} {fidele.prenom}</span>
        </div>

        {/* Info fidèle */}
        <div style={{ background: 'var(--dark3)', borderRadius: 8, padding: '.8rem', marginBottom: '.85rem', fontSize: '.81rem' }}>
          <strong style={{ color: 'var(--gold)' }}>{fidele.nom} {fidele.prenom}</strong>
          {' '}<Badge cls={fidele.categorie.toLowerCase()} label={fidele.categorie} />
          {isFige && <span className="prom-fige" style={{ marginLeft: 6 }}>🔒 Figé</span>}
          <br />
          <span style={{ color: 'var(--muted)', fontSize: '.76rem', marginTop: 4, display: 'block' }}>
            Engagement: <strong style={{ color: 'var(--gold-light)' }}>{fidele.engagement ? fmtF(fidele.engagement) + ' F' : 'Non saisi'}</strong>
            {' · '}Versé: <strong style={{ color: 'var(--green)' }}>{fmtF(tv)} F</strong>
            {' · '}Solde: <strong style={{ color: 'var(--orange)' }}>{fidele.engagement ? fmtF(solde(fidele)) + ' F' : '—'}</strong>
          </span>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', background: 'var(--dark3)', borderRadius: 10, padding: 4 }}>
          <button {...tabBtn('ajouter', '➕ Ajouter un versement',  tab === 'ajouter')} />
          <button {...tabBtn('corriger', '✏️ Corriger un versement', tab === 'corriger')} />
        </div>

        {/* ── PANNEAU AJOUTER ── */}
        {tab === 'ajouter' && (
          <div>
            <div className="form-group">
              <label className="form-label">
                Engagement Total (F CFA) {isFige && <span className="prom-fige">🔒</span>}
              </label>
              <input className="form-input" type="number" value={eng}
                onChange={e => setEng(e.target.value)} placeholder="Si pas encore saisi" min="0" disabled={isFige} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Montant versé (F CFA)</label>
                <input className="form-input" type="number" value={montant}
                  onChange={e => setMontant(e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Mois</label>
                <select className="form-input" value={moisIdx} onChange={e => setMoisIdx(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={onClose}>Annuler</button>
              <button className="btn-primary" onClick={save} disabled={loading}>
                {loading ? '⏳…' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* ── PANNEAU CORRIGER ── */}
        {tab === 'corriger' && (
          <div>
            <div style={{ background: 'rgba(240,136,62,.08)', border: '1px solid rgba(240,136,62,.25)', borderRadius: 9, padding: '.8rem', marginBottom: '1rem', fontSize: '.8rem', color: 'var(--orange)' }}>
              ✏️ Sélectionnez le mois à corriger, puis entrez le <strong>nouveau montant exact</strong> (remplace l'ancien).
            </div>

            {/* Récap versements */}
            <div style={{ background: 'var(--dark3)', borderRadius: 10, padding: '.85rem', marginBottom: '1rem', maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Versements enregistrés</div>
              {(() => {
                const items = []
                if ((fidele.versInit || 0) > 0) {
                  items.push(
                    <div key="init" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.3rem 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <span style={{ fontSize: '.8rem' }}>Versement initial</span>
                      <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>{fmtF(fidele.versInit)} F</span>
                    </div>
                  )
                }
                fidele.mois.forEach((m, i) => {
                  if (m.montant > 0) items.push(
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.3rem 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <span style={{ fontSize: '.8rem' }}>{MONTHS[i]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        {m.date && <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{m.date}</span>}
                        <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>{fmtF(m.montant)} F</span>
                      </div>
                    </div>
                  )
                })
                return items.length > 0 ? items : <div style={{ color: 'var(--muted)', fontSize: '.8rem', textAlign: 'center', padding: '.5rem' }}>Aucun versement enregistré</div>
              })()}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mois à corriger</label>
                <select className="form-input" value={cMois} onChange={e => { setCMois(e.target.value); setCNouveau('') }}>
                  <option value="">— Sélectionner —</option>
                  <option value="-1">Versement initial</option>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ancien montant {cMois === '-1' && <span style={{ color: 'var(--muted)', fontSize: '.7rem' }}>(Versement initial)</span>}</label>
                <input className="form-input" type="number" value={cMois !== '' ? ancienMontant : ''} disabled style={{ opacity: .6 }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nouveau montant correct (F CFA)</label>
                <input className="form-input" type="number" value={cNouveau}
                  onChange={e => setCNouveau(e.target.value)} placeholder="Montant corrigé" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Date (optionnel)</label>
                <input className="form-input" type="date" value={cDate} onChange={e => setCDate(e.target.value)} />
              </div>
            </div>

            {/* Aperçu correction */}
            {showPreviewCorr && (
              <div style={{ background: 'var(--dark3)', borderRadius: 9, padding: '.8rem', marginBottom: '.8rem', fontSize: '.8rem' }}>
                <div style={{ color: 'var(--muted)', fontSize: '.68rem', textTransform: 'uppercase', marginBottom: '.5rem' }}>Impact de la correction</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.6rem' }}>
                  <div><div style={{ color: 'var(--muted)', fontSize: '.68rem' }}>Avant</div><div style={{ fontWeight: 700, color: 'var(--red)' }}>{fmtF(ancienMontant)} F</div></div>
                  <div><div style={{ color: 'var(--muted)', fontSize: '.68rem' }}>Après</div><div style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtF(nouveauMontant)} F</div></div>
                  <div><div style={{ color: 'var(--muted)', fontSize: '.68rem' }}>Différence</div>
                    <div style={{ fontWeight: 700, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {diff >= 0 ? '+' : ''}{fmtF(diff)} F
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-cancel" onClick={onClose}>Annuler</button>
              <button className="btn-primary"
                style={{ background: 'linear-gradient(135deg,var(--orange),#f5a623)' }}
                onClick={appliquerCorrection} disabled={loading}>
                {loading ? '⏳…' : '✏️ Appliquer la correction'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}