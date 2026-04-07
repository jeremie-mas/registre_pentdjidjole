import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)


// ─── NORMALISATION ────────────────────────────────────────────────────────────
function normalizeFidele(f) {
  const moisData = Array(11).fill(null).map(() => ({ date: '', montant: 0 }))
  if (f.versements) {
    f.versements.forEach(v => {
      if (v.mois_index >= 0 && v.mois_index < 11) {
        moisData[v.mois_index] = {
          date:    v.date_versement || '',
          montant: Number(v.montant) || 0,
        }
      }
    })
  }
  return {
    id:             f.id,
    nom:            f.nom            || '',
    prenom:         f.prenom         || '',
    tel:            f.tel            || '',
    quartier:       f.quartier       || '',
    profession:     f.profession     || '',
    categorie:      f.categorie      || 'Adulte',
    engagement:     Number(f.engagement)      || 0,
    engagementFige: Number(f.engagement_fige) || 0,
    versInit:       Number(f.vers_init)       || 0,
    isNew:          f.is_new         || false,
    mois:           moisData,
  }
}

// ─── LECTURE ──────────────────────────────────────────────────────────────────
export async function getFideles() {
  const { data, error } = await supabase
    .from('fideles')
    .select(`
      id, nom, prenom, tel, quartier, profession, categorie,
      engagement, engagement_fige, vers_init, is_new,
      versements ( mois_index, montant, date_versement )
    `)
    .order('nom')
  if (error) throw error
  return data.map(normalizeFidele)
}

// ─── CRÉATION ─────────────────────────────────────────────────────────────────
export async function createFidele({ nom, prenom, tel, quartier, profession, categorie }) {
  const { data, error } = await supabase
    .from('fideles')
    .insert([{
      nom:        nom.toUpperCase(),
      prenom:     prenom || '',
      tel:        tel || '',
      quartier:   quartier || '',
      profession: profession || '',
      categorie:  categorie || 'Adulte',
      is_new:     true,
    }])
    .select()
    .single()
  if (error) throw error
  return normalizeFidele(data)
}

// ─── MISE À JOUR ENGAGEMENT ───────────────────────────────────────────────────
export async function updatePromesse(fideleId, montant) {
  const { error } = await supabase
    .from('fideles')
    .update({ engagement: montant })
    .eq('id', fideleId)
  if (error) throw error
}

// ─── VERSEMENT (UPSERT) ───────────────────────────────────────────────────────
// moisIndex = -1 pour corriger le versement initial (vers_init)
export async function upsertVersement(fideleId, moisIndex, montant, dateVersement) {
  // Cas spécial : correction du versement initial
  if (moisIndex === -1) {
    const { error } = await supabase
      .from('fideles')
      .update({ vers_init: montant })
      .eq('id', fideleId)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('versements')
    .upsert(
      {
        fidele_id:      fideleId,
        mois_index:     moisIndex,
        montant:        montant,
        date_versement: dateVersement || null,
      },
      { onConflict: 'fidele_id,mois_index' }
    )
  if (error) throw error
}

// ─── SUPPRESSION ─────────────────────────────────────────────────────────────
export async function deleteFidele(fideleId) {
  const { error } = await supabase
    .from('fideles')
    .delete()
    .eq('id', fideleId)
  if (error) throw error
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}