import { useState, useMemo } from 'react'
import { fmtF, totalVerse, solde, pct, hasProm, getStatut } from '../utils/helpers'
import Badge from '../components/Badge'
import ProgressBar from '../components/ProgressBar'

const FILTERS = ['tous','avec_prom','sans_prom','adulte','enfant','solde','urgent','nouveau']
const LABELS  = ['Tous','✅ Avec promesse','⏸ Sans promesse','👤 Adultes','👶 Enfants','💯 Soldés','🔴 Urgents','🆕 Nouveaux']
const PER_PAGE = 30

export default function Liste({ data, onOpenModal, onDelete, onExportCSV, onExportXLSX }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(f => {
      if (q && !f.nom.toLowerCase().includes(q) && !f.prenom.toLowerCase().includes(q)) return false
      if (filter === 'tous')      return true
      if (filter === 'avec_prom') return hasProm(f)
      if (filter === 'sans_prom') return !hasProm(f)
      if (filter === 'adulte')    return f.categorie === 'Adulte'
      if (filter === 'enfant')    return f.categorie === 'Enfant'
      if (filter === 'nouveau')   return f.isNew
      return getStatut(f).cls === filter
    })
  }, [data, search, filter])

  const pages    = Math.ceil(filtered.length / PER_PAGE)
  const safePage = Math.min(page, Math.max(1, pages))
  const slice    = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const goPage = p => {
    if (p < 1 || p > pages) return
    setPage(p)
    window.scrollTo(0, 0)
  }

  // Pagination intelligente (max 7 autour de la page courante)
  const paginationPages = () => {
    const start = Math.max(1, safePage - 3)
    const end   = Math.min(pages, safePage + 3)
    const btns  = []
    if (start > 1) {
      btns.push(<button key="1" className="page-btn" onClick={() => goPage(1)}>1</button>)
      btns.push(<span key="s1" style={{ color: 'var(--muted)', padding: '0 4px', alignSelf: 'center' }}>…</span>)
    }
    for (let p2 = start; p2 <= end; p2++) {
      btns.push(<button key={p2} className={`page-btn ${p2 === safePage ? 'active' : ''}`} onClick={() => goPage(p2)}>{p2}</button>)
    }
    if (end < pages) {
      btns.push(<span key="s2" style={{ color: 'var(--muted)', padding: '0 4px', alignSelf: 'center' }}>…</span>)
      btns.push(<button key={pages} className="page-btn" onClick={() => goPage(pages)}>{pages}</button>)
    }
    return btns
  }

  // Lignes avec séparateurs avec / sans promesse
  let lastSection = ''
  const rows = []
  slice.forEach((f, idx) => {
    const section = hasProm(f) ? 'avec' : 'sans'
    if (section !== lastSection) {
      const count = section === 'avec'
        ? data.filter(x => hasProm(x)).length
        : data.filter(x => !hasProm(x)).length
      const label = section === 'avec'
        ? `✅ Avec promesse (${count} personnes)`
        : `⏸ Sans promesse encore (${count} personnes)`
      rows.push(<tr key={`sep-${section}-${idx}`} className={`section-row ${section}`}><td colSpan={10}>{label}</td></tr>)
      lastSection = section
    }
    const tv = totalVerse(f); const st = getStatut(f)
    rows.push(
      <tr key={f.id}>
        <td style={{ color: 'var(--muted)', fontSize: '.74rem' }}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
        <td>
          <div className="td-name">
            <strong>{f.nom}</strong>
            {f.isNew && <span className="badge nouveau" style={{ fontSize: '.62rem', marginLeft: 4 }}>NEW</span>}
            <br /><small>{f.prenom}</small>
          </div>
        </td>
        <td><Badge cls={f.categorie.toLowerCase()} label={f.categorie} /></td>
        <td style={{ color: 'var(--muted)', fontSize: '.76rem' }}>{f.tel || '—'}</td>
        <td>
          {hasProm(f)
            ? <><span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{fmtF(f.engagement)} F</span>{f.engagementFige > 0 && <span className="prom-fige">🔒</span>}</>
            : <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>Non saisi</span>
          }
        </td>
        <td style={{ color: 'var(--green)' }}>{fmtF(tv)} F</td>
        <td style={{ color: hasProm(f) ? (solde(f) > 0 ? 'var(--orange)' : 'var(--green)') : 'var(--muted)' }}>
          {hasProm(f) ? fmtF(solde(f)) + ' F' : '—'}
        </td>
        <td><ProgressBar value={pct(f)} /></td>
        <td><Badge cls={st.cls} label={st.label} /></td>
        <td style={{ display: 'flex', gap: 4 }}>
          <button className="btn-action" onClick={() => onOpenModal(f)}>✏️</button>
          <button className="btn-danger"  onClick={() => onDelete(f)}>🗑</button>
        </td>
      </tr>
    )
  })

  return (
    <div>
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.15rem' }}>
          Liste des Fidèles
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          {filtered.length} fidèle(s) · {data.filter(f => hasProm(f)).length} avec promesse · {data.filter(f => !hasProm(f)).length} sans promesse
        </p>
      </div>

      <div className="export-bar">
        <div className="export-bar-text">
          <h3>📥 Exporter les données</h3>
          <p>Téléchargez toutes les données pour Excel (Fév → Déc)</p>
        </div>
        <div className="export-btns">
          <button className="btn-export csv"  onClick={onExportCSV}>⬇️ CSV</button>
          <button className="btn-export xlsx" onClick={onExportXLSX}>📊 Excel (.xlsx)</button>
        </div>
      </div>

      <div className="toolbar">
        <input className="search-box" type="text" placeholder="🔍 Rechercher par nom ou prénom…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        {FILTERS.map((f, i) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setPage(1) }}>{LABELS[i]}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Nom & Prénom</th><th>Cat.</th><th>Tél.</th><th>Engagement</th><th>Versé</th><th>Solde</th><th>Progression</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>

        {/* ── Pagination V4 : prev / numéros / next + menu déroulant ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.7rem', padding: '.85rem', flexWrap: 'wrap' }}>
          <button className="page-btn" onClick={() => goPage(safePage - 1)} disabled={safePage <= 1}>‹</button>
          <div className="pagination">{paginationPages()}</div>
          <button className="page-btn" onClick={() => goPage(safePage + 1)} disabled={safePage >= pages}>›</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginLeft: '.5rem' }}>
            <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Aller à :</span>
            <select
              value={safePage}
              onChange={e => goPage(parseInt(e.target.value))}
              style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 7, padding: '.35rem .65rem', color: 'var(--text)', fontFamily: "'DM Sans',sans-serif", fontSize: '.8rem', cursor: 'pointer', outline: 'none' }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p2 => (
                <option key={p2} value={p2}>Page {p2}</option>
              ))}
            </select>
            <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>/ {pages} pages ({filtered.length} fidèles)</span>
          </div>
        </div>
      </div>
    </div>
  )
}