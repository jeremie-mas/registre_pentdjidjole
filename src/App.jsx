// src/App.jsx — Navigation + state global uniquement
import { useState, useEffect, useCallback } from 'react'
import { supabase, getFideles, signIn, signOut, getSession, deleteFidele } from './lib/supabase'
import { exportCSV, exportXLSX } from './utils/exports'

import './App.css'

import LoginPage      from './LoginPage'
import Toast          from './components/Toast'
import ModalVersement from './components/ModalVersement'
import Dashboard      from './pages/Dashboard'
import Liste          from './pages/Liste'
import Saisie         from './pages/Saisie'
import AjoutFidele    from './pages/AjoutFidele'
import Sync           from './pages/Sync'

const TABS = [
  { id: 'dashboard', label: '📊 Tableau de Bord' },
  { id: 'liste',     label: '📋 Fidèles'          },
  { id: 'saisie',    label: '✏️ Versement'        },
  { id: 'ajout',     label: '➕ Nouveau Fidèle'   },
  { id: 'sync',      label: '🔄 Export Excel'     },
]

export default function App() {
  const [session,     setSession]     = useState(null)
  const [data,        setData]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState('dashboard')
  const [modalFidele, setModalFidele] = useState(null)
  const [toast,       setToast]       = useState({ msg: '', type: 'success', visible: false })
  const [rtStatus,    setRtStatus]    = useState('connecting')

  // ── Toast ──
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }, [])

  // ── Auth ──
  useEffect(() => {
    getSession().then(s => { setSession(s); if (!s) setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // ── Chargement données ──
  const loadData = useCallback(async () => {
    if (!session) return
    try { setData(await getFideles()) }
    catch (e) { showToast('❌ Erreur chargement : ' + e.message, 'error') }
    setLoading(false)
  }, [session, showToast])

  useEffect(() => { loadData() }, [loadData])

  // ── Realtime ──
  useEffect(() => {
    if (!session) return
    const ch = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fideles' },    () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'versements' }, () => loadData())
      .subscribe(s => setRtStatus(s === 'SUBSCRIBED' ? 'ok' : 'connecting'))
    return () => supabase.removeChannel(ch)
  }, [session, loadData])

  // ── Suppression ──
  const handleDelete = useCallback(async fidele => {
    if (!confirm(`Supprimer ${fidele.nom} ${fidele.prenom} ? Cette action est irréversible.`)) return
    try {
      await deleteFidele(fidele.id)
      setData(d => d.filter(f => f.id !== fidele.id))
      showToast(`🗑 ${fidele.nom} supprimé`, 'info')
    } catch (e) {
      showToast('❌ ' + e.message, 'error')
    }
  }, [showToast])

  // ── Écrans spéciaux ──
  if (!session) return <LoginPage onLogin={(e, p) => signIn(e, p)} />

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Chargement depuis Supabase…</p>
    </div>
  )

  // ── Rendu principal ──
  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span style={{ fontSize: '1.3rem' }}>✦</span>
            <div>
              <div>Assemblée de Djidjolé</div>
              <div className="logo-sub">Eglise de Pentecôte du Togo — Budget 2026</div>
            </div>
          </div>

          <div className="nav-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`nav-tab ${page === t.id ? 'active' : ''}`}
                onClick={() => setPage(t.id)}>{t.label}
              </button>
            ))}
          </div>

          <div className="header-right">
            <span className="cloud-status">
              <span className="realtime-dot" style={{ background: rtStatus === 'ok' ? 'var(--green)' : 'var(--orange)' }} />
              <span style={{ color: 'var(--muted)' }}>{rtStatus === 'ok' ? 'Connecté' : 'Sync…'}</span>
            </span>
            <button className="btn-signout" onClick={() => signOut()}>Déconnexion</button>
          </div>
        </div>
      </header>

      <main>
        {page === 'dashboard' && (
          <Dashboard data={data} onOpenModal={setModalFidele} />
        )}
        {page === 'liste' && (
          <Liste
            data={data}
            onOpenModal={setModalFidele}
            onDelete={handleDelete}
            onExportCSV={() => { exportCSV(data); showToast('✅ CSV téléchargé', 'success') }}
            onExportXLSX={() => exportXLSX(data, showToast)}
          />
        )}
        {page === 'saisie' && (
          <Saisie data={data} onToast={showToast} onRefresh={loadData} />
        )}
        {page === 'ajout' && (
          <AjoutFidele
            data={data}
            onAdd={f => setData(d => [...d, f])}
            onToast={showToast}
          />
        )}
        {page === 'sync' && (
          <Sync
            data={data}
            onExportCSV={() => { exportCSV(data); showToast('✅ CSV téléchargé', 'success') }}
            onExportXLSX={() => exportXLSX(data, showToast)}
          />
        )}
      </main>

      {modalFidele && (
        <ModalVersement
          fidele={modalFidele}
          onClose={() => setModalFidele(null)}
          onSaved={loadData}
          onToast={showToast}
        />
      )}

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  )
}