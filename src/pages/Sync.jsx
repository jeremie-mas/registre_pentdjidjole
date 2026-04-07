// src/pages/Sync.jsx
import { fmtF, totalVerse, hasProm } from '../utils/helpers'

export default function Sync({ data, onExportCSV, onExportXLSX }) {
  const avecProm = data.filter(f => hasProm(f)).length
  const avecVers = data.filter(f => totalVerse(f) > 0).length
  const totalEng = data.filter(f => hasProm(f)).reduce((s, f) => s + (f.engagement || 0), 0)
  const totalV   = data.reduce((s, f) => s + totalVerse(f), 0)

  const stats = [
    { label: 'AVEC ENGAGEMENT', val: `${avecProm}/${data.length}`,              color: 'var(--blue)'       },
    { label: 'ONT VERSÉ',       val: `${avecVers}/${data.length}`,              color: 'var(--green)'      },
    { label: 'TOTAL VERSÉ',     val: `${fmtF(totalV)} F`,                        color: 'var(--gold-light)' },
    { label: 'SOLDE RESTANT',   val: `${fmtF(Math.max(0, totalEng - totalV))} F`, color: 'var(--orange)'    },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.15rem' }}>
          🔄 Export Excel
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          Exportez les données vers votre fichier Excel (Fév → Déc 2026)
        </p>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,rgba(63,185,80,.12),rgba(63,185,80,.04))', border: '1px solid rgba(63,185,80,.25)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--green)', marginBottom: '.5rem' }}>
          Exportez en 1 clic
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>
          Tous les engagements et versements (11 mois) prêts à importer dans Excel
        </p>
        <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center', marginTop: '1.2rem', flexWrap: 'wrap' }}>
          <button className="btn-export csv"  onClick={onExportCSV}>⬇️ Télécharger CSV</button>
          <button className="btn-export xlsx" onClick={onExportXLSX}>📊 Télécharger Excel (.xlsx)</button>
        </div>
      </div>

      {/* Stats */}
      <div className="section-title">📊 État actuel des données</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.8rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.9rem', textAlign: 'center' }}>
            <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: '.3rem', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}