// src/pages/AjoutFidele.jsx
import { useState, useMemo } from 'react'
import { createFidele, updatePromesse, deleteFidele } from '../lib/supabase'
import { fmtF, hasProm } from '../utils/helpers'
import Badge from '../components/Badge'

export default function AjoutFidele({ data, onAdd, onToast }) {
  const emptyForm = { nom: '', prenom: '', tel: '', quartier: '', profession: '', categorie: 'Adulte', engagement: '' }
  const [form,     setForm]     = useState(emptyForm)
  const [loading,  setLoading]  = useState(false)
  const [nouveaux, setNouveaux] = useState([])

  const set = k => e => setForm(f => ({ ...f, [k]: k === 'nom' ? e.target.value.toUpperCase() : e.target.value }))

  const doublon = useMemo(() => {
    if (!form.nom || form.nom.length < 2) return null
    return (data || []).find(f =>
      f.nom === form.nom && (!form.prenom || f.prenom.toLowerCase() === form.prenom.toLowerCase())
    )
  }, [form.nom, form.prenom, data])

  const submit = async () => {
    if (!form.nom || !form.prenom) { onToast('⚠️ Nom et prénom obligatoires', 'error'); return }
    const exact = (data || []).find(f => f.nom === form.nom && f.prenom.toLowerCase() === form.prenom.toLowerCase())
    if (exact) { onToast(`❌ Ce fidèle existe déjà (N°${exact.id})`, 'error'); return }
    setLoading(true)
    try {
      const newFidele = await createFidele({
        nom: form.nom, prenom: form.prenom, tel: form.tel,
        quartier: form.quartier, profession: form.profession, categorie: form.categorie,
      })
      if (parseInt(form.engagement) > 0) {
        await updatePromesse(newFidele.id, parseInt(form.engagement))
        newFidele.engagement = parseInt(form.engagement)
      }
      newFidele.isNew = true
      onAdd(newFidele)
      setNouveaux(prev => [...prev, newFidele])
      onToast(`✅ ${form.nom} ${form.prenom} ajouté(e) — N°${newFidele.id}`, 'success')
      setForm(emptyForm)
    } catch (e) {
      onToast('❌ Erreur : ' + e.message, 'error')
    }
    setLoading(false)
  }

  const supprimerNouveau = async fidele => {
    if (!window.confirm(`Supprimer ${fidele.nom} ${fidele.prenom} ?`)) return
    try {
      await deleteFidele(fidele.id)
      setNouveaux(prev => prev.filter(f => f.id !== fidele.id))
      onToast(`🗑 ${fidele.nom} retiré`, 'info')
    } catch (e) {
      onToast('❌ ' + e.message, 'error')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.15rem' }}>
          ➕ Nouveau Fidèle
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          Ajoutez un nouveau membre qui souhaite faire un engagement de don
        </p>
      </div>

      {/* Compteurs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Fidèles actuels',  value: (data || []).length, color: 'var(--gold-light)' },
          { label: 'Nouveaux ajoutés', value: nouveaux.length,     color: 'var(--green)'      },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{c.label}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Formulaire */}
        <div className="form-card" style={{ maxWidth: '100%' }}>
          <h2 className="form-card-title" style={{ marginBottom: '.25rem' }}>📝 Informations</h2>
          <p className="form-card-sub">Tous les champs marqués * sont obligatoires</p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NOM *</label>
              <input className="form-input" value={form.nom} onChange={set('nom')} placeholder="Ex: MENSAH" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group">
              <label className="form-label">PRÉNOM *</label>
              <input className="form-input" value={form.prenom} onChange={set('prenom')} placeholder="Ex: Kofi Amédé" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CATÉGORIE *</label>
              <select className="form-input" value={form.categorie} onChange={set('categorie')}>
                <option value="Adulte">👤 Adulte</option>
                <option value="Enfant">👶 Enfant</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">TÉLÉPHONE</label>
              <input className="form-input" value={form.tel} onChange={set('tel')} placeholder="Ex: 90 12 34 56" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">QUARTIER</label>
              <input className="form-input" value={form.quartier} onChange={set('quartier')} placeholder="Ex: Djidjolé" />
            </div>
            <div className="form-group">
              <label className="form-label">PROFESSION</label>
              <input className="form-input" value={form.profession} onChange={set('profession')} placeholder="Ex: Commerçant" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ENGAGEMENT INITIAL (F CFA) — facultatif</label>
            <input className="form-input" type="number" value={form.engagement} onChange={set('engagement')}
              placeholder="Saisir maintenant ou plus tard" min="0" />
          </div>

          {doublon && (
            <div style={{ background: 'rgba(248,81,73,.1)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 9, padding: '.8rem 1rem', marginBottom: '.9rem', fontSize: '.82rem', color: 'var(--red)' }}>
              ⚠️ <strong>Attention :</strong> Un fidèle similaire existe : <strong>{doublon.nom} {doublon.prenom}</strong> (N°{doublon.id})
            </div>
          )}

          <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'flex-end' }}>
            <button className="btn-cancel" onClick={() => setForm(emptyForm)}>Réinitialiser</button>
            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? '⏳ Enregistrement…' : '✅ Ajouter ce fidèle'}
            </button>
          </div>
        </div>

        {/* Liste nouveaux */}
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '.95rem', color: 'var(--gold)', marginBottom: '.8rem' }}>
            📋 Nouveaux ajoutés dans cette session
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            {nouveaux.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '.83rem', textAlign: 'center', padding: '2rem', background: 'var(--dark2)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                Aucun nouveau fidèle pour l'instant
              </div>
            ) : nouveaux.map(f => (
              <div key={f.id} style={{ background: 'var(--dark2)', border: '1px solid rgba(63,185,80,.25)', borderRadius: 10, padding: '.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.7rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.86rem' }}>{f.nom} <span style={{ fontWeight: 400 }}>{f.prenom}</span></div>
                  <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: 2 }}>
                    N°{f.id} · <Badge cls={f.categorie.toLowerCase()} label={f.categorie} />
                    {f.tel ? ` · ${f.tel}` : ''}
                    {f.engagement ? <> · <strong style={{ color: 'var(--gold-light)' }}>{fmtF(f.engagement)} F</strong></> : ''}
                  </div>
                </div>
                <button className="btn-danger" onClick={() => supprimerNouveau(f)}>✕ Retirer</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}