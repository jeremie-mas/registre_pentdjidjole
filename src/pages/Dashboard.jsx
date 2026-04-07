// src/pages/Dashboard.jsx
import { MONTHS, NB_MOIS, fmtF, totalVerse, solde, pct, hasProm, getStatut } from '../utils/helpers'
import Badge from '../components/Badge'
import ProgressBar from '../components/ProgressBar'

export default function Dashboard({ data, onOpenModal }) {
  const avecProm  = data.filter(f => hasProm(f))
  const totalEng  = avecProm.reduce((s, f) => s + (f.engagement || 0), 0)
  const totalV    = data.reduce((s, f) => s + totalVerse(f), 0)
  const nbSoldes  = data.filter(f => getStatut(f).cls === 'solde').length
  const nbUrgents = data.filter(f => getStatut(f).cls === 'urgent').length
  const nbSans    = data.filter(f => !hasProm(f)).length

  const mT = Array(NB_MOIS).fill(0)
  data.forEach(f => {
    if (f.versInit > 0) mT[0] += f.versInit
    f.mois.forEach((m, i) => (mT[i] += m.montant || 0))
  })
  const maxM   = Math.max(...mT, 1)
  const alerts = data.filter(f => ['urgent', 'attente'].includes(getStatut(f).cls) && hasProm(f)).slice(0, 12)

  const kpis = [
    { cls: 'gold',   label: 'Total Engagé',   val: `${fmtF(totalEng)} F`,                        sub: `${avecProm.length} fidèles avec promesse`,    valCls: 'gold'   },
    { cls: 'green',  label: 'Total Versé',     val: `${fmtF(totalV)} F`,                          sub: `${totalEng > 0 ? (totalV/totalEng*100).toFixed(1) : 0}% de l'objectif`, valCls: 'green' },
    { cls: 'orange', label: 'Solde Restant',   val: `${fmtF(Math.max(0, totalEng - totalV))} F`,  sub: 'À collecter',                                valCls: 'orange' },
    { cls: 'green',  label: 'Soldés',          val: nbSoldes,                                     sub: 'intégralement soldés',                       valCls: 'green'  },
    { cls: 'red',    label: 'Urgents',         val: nbUrgents,                                    sub: 'nécessitent attention',                      valCls: 'red'    },
    { cls: 'blue',   label: 'Sans Promesse',   val: nbSans,                                       sub: `à contacter / ${data.length} total`,         valCls: 'blue'   },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.15rem' }}>
          Vue d'Ensemble
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
          Assemblée de Djidjolé — Budget 2026 — Période Février → Décembre
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card ${k.cls}`}>
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value ${k.valCls}`}>{k.val}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Mois */}
      <div className="section-title">📅 Versements par Mois — Février → Décembre</div>
      <div className="month-grid">
        {MONTHS.map((m, i) => (
          <div key={i} className="month-card">
            <div className="month-card-label">{m.substring(0, 4)}</div>
            <div className="month-card-val">{mT[i] > 0 ? fmtF(mT[i]) : '—'}</div>
            <div className="month-bar-wrap">
              <div className="month-bar-fill" style={{ width: `${(mT[i] / maxM * 100).toFixed(0)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Alertes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
        <div className="section-title" style={{ margin: 0 }}>⚠️ Alertes Prioritaires</div>
        <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>
          {data.filter(f => ['urgent', 'attente'].includes(getStatut(f).cls) && hasProm(f)).length} fidèles
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Fidèle</th><th>Cat.</th><th>Engagement</th><th>Versé</th><th>Solde</th><th>Progression</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {alerts.map(f => {
              const tv = totalVerse(f); const st = getStatut(f)
              return (
                <tr key={f.id}>
                  <td><div className="td-name"><strong>{f.nom}</strong><br /><small>{f.prenom}</small></div></td>
                  <td><Badge cls={f.categorie.toLowerCase()} label={f.categorie} /></td>
                  <td style={{ color: 'var(--gold-light)' }}>
                    {fmtF(f.engagement)} F {f.engagementFige > 0 && <span className="prom-fige">🔒</span>}
                  </td>
                  <td style={{ color: 'var(--green)' }}>{fmtF(tv)} F</td>
                  <td style={{ color: 'var(--red)', fontWeight: 600 }}>{fmtF(solde(f))} F</td>
                  <td><ProgressBar value={pct(f)} /></td>
                  <td><Badge cls={st.cls} label={st.label} /></td>
                  <td><button className="btn-action" onClick={() => onOpenModal(f)}>+</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}