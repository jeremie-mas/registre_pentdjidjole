// src/utils/exports.js
import { MONTHS, totalVerse, solde, pct, getStatut } from './helpers'

export function exportCSV(data) {
  const BOM = '\uFEFF', sep = ';'
  let h = ['N°','NOM','PRENOM','CATEGORIE','TELEPHONE','ENGAGEMENT (F)','VERS_INITIAL (F)']
  MONTHS.forEach(m => { h.push(`VERSEMENT_${m} (F)`); h.push(`DATE_${m}`) })
  h = h.concat(['TOTAL_VERSE (F)', 'SOLDE (F)', '% ACCOMPLI', 'STATUT'])

  const rows = [h.join(sep)]
  data.forEach(f => {
    const tv = totalVerse(f)
    let row = [f.id, f.nom, f.prenom, f.categorie, f.tel || '', f.engagement || 0, f.versInit || 0]
    f.mois.forEach(m => { row.push(m.montant || 0); row.push(m.date || '') })
    row = row.concat([tv, Math.max(0, solde(f)), (pct(f) * 100).toFixed(1) + '%', getStatut(f).label])
    rows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep))
  })

  const blob = new Blob([BOM + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Export_Djidjole_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function exportXLSX(data, onToast) {
  if (typeof window.XLSX === 'undefined') {
    onToast('⏳ Chargement librairie Excel…', 'info')
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.onload = () => runXLSX(data, onToast)
    document.head.appendChild(s)
  } else {
    runXLSX(data, onToast)
  }
}

function runXLSX(data, onToast) {
  const XLSX = window.XLSX
  const wb   = XLSX.utils.book_new()

  const makeSheet = (fideles, titre) => {
    const h = ['N°','NOM','PRÉNOM','CATÉGORIE','TÉLÉPHONE','ENGAGEMENT (F)','VERS. INITIAL (F)']
    MONTHS.forEach(m => { h.push(`Date ${m}`); h.push(`Versement ${m} (F)`) })
    h.push('TOTAL VERSÉ (F)', 'SOLDE (F)', '% ACCOMPLI', 'STATUT')

    const aoa = [
      ['EGLISE DE PENTECOTE DU TOGO — ASSEMBLÉE DE DJIDJOLÉ'],
      [titre],
      [`Exporté le ${new Date().toLocaleDateString('fr-FR')} · Période : Février → Décembre 2026`],
      [],
      h,
    ]
    fideles.forEach(f => {
      const tv  = totalVerse(f)
      const s   = Math.max(0, solde(f))
      const p   = pct(f)
      const row = [f.id, f.nom, f.prenom, f.categorie, f.tel || '', f.engagement || 0, f.versInit || 0]
      f.mois.forEach(m => { row.push(m.date || ''); row.push(m.montant || 0) })
      row.push(tv, s, parseFloat((p * 100).toFixed(1)), getStatut(f).label)
      aoa.push(row)
    })
    return XLSX.utils.aoa_to_sheet(aoa)
  }

  XLSX.utils.book_append_sheet(wb, makeSheet(data.filter(f => f.categorie === 'Adulte'), 'FIDÈLES ADULTES'), 'ADULTES')
  XLSX.utils.book_append_sheet(wb, makeSheet(data.filter(f => f.categorie === 'Enfant'), 'ENFANTS'),        'ENFANTS')
  XLSX.writeFile(wb, `Export_Djidjole_${new Date().toISOString().split('T')[0]}.xlsx`)
  onToast('📊 Fichier Excel téléchargé !', 'success')
}