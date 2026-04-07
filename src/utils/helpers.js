// src/utils/helpers.js

export const MONTHS  = ['Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
export const NB_MOIS = 11

export const fmtF       = n  => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
export const today      = () => new Date().toISOString().split('T')[0]
export const totalVerse = f  => (f.versInit || 0) + f.mois.reduce((s, m) => s + (m.montant || 0), 0)
export const solde      = f  => (f.engagement || 0) - totalVerse(f)
export const pct        = f  => f.engagement > 0 ? totalVerse(f) / f.engagement : 0
export const hasProm    = f  => (f.engagement || 0) > 0

export const getStatut = f => {
  if (!hasProm(f))             return { label: '⏸ Sans promesse', cls: 'nonsaisie' }
  const p = pct(f)
  if (p >= 1)                  return { label: '✅ Soldé',         cls: 'solde'    }
  if (totalVerse(f) === 0)     return { label: '📢 En attente',    cls: 'attente'  }
  if (solde(f) / f.engagement > 0.5) return { label: '⚠️ Urgent', cls: 'urgent'  }
  return                              { label: '🔄 Partiel',        cls: 'partiel'  }
}
