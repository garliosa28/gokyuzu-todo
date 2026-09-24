import { useState } from 'react'
import { supabase } from './supabase'
import { requestSync, signOut, useSyncState } from './syncController'

const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

export function AccountScreen({ onBack }: { onBack: () => void }) {
  const sync = useSyncState()

  return (
    <>
      <header className="header">
        <button className="back" onClick={onBack} aria-label="Geri">
          ‹
        </button>
        <h1>Senkronizasyon</h1>
      </header>
      <main className="content account">
        {!supabase && (
          <p>
            Senkron kapalı: Supabase ayarları (<code>.env</code>) girilmemiş. Görevler yalnızca bu cihazda saklanıyor.
            Kurulum için <code>SETUP.md</code> dosyasına bak.
          </p>
        )}
        {supabase && !sync.email && <SignIn />}
        {supabase && sync.email && (
          <>
            <p>
              <strong>{sync.email}</strong> olarak giriş yapıldı.
            </p>
            <p className="muted">
              {sync.status === 'offline' && 'Çevrimdışı. Değişiklikler bağlantı gelince gönderilecek.'}
              {sync.status === 'syncing' && 'Senkronize ediliyor…'}
              {sync.status === 'synced' && sync.lastSyncedAt && `Son senkron: ${time.format(sync.lastSyncedAt)}`}
              {sync.status === 'error' && `Senkron hatası: ${sync.error}`}
            </p>
            <div className="button-row">
              <button className="primary" onClick={() => requestSync()} disabled={sync.status === 'syncing'}>
                Şimdi senkronize et
              </button>
              <button className="secondary" onClick={() => signOut()}>
                Bu cihazdan çıkış yap
              </button>
            </div>
          </>
        )}
      </main>
    </>
  )
}

/**
 * E-postaya gelen kodla giriş. Link yerine kod kullanılıyor çünkü iPhone'da ana ekrana eklenen
 * uygulama Safari'den ayrı bir depolama kullanır; e-postadaki link Safari'de açılır ve oturum
 * uygulamaya geçmez.
 */
function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<{ error: Error | null }>, onOk?: () => void) {
    setBusy(true)
    setError(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setError(error.message)
    else onOk?.()
  }

  if (!sent) {
    return (
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => supabase!.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }), () => setSent(true))
        }}
      >
        <p>Cihazlar arasında senkronize etmek için giriş yap. E-postana bir kod gelecek.</p>
        <input type="email" required autoComplete="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="primary" disabled={busy}>
          Kod gönder
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    )
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => supabase!.auth.verifyOtp({ email, token: code.trim(), type: 'email' }))
      }}
    >
      <p>
        <strong>{email}</strong> adresine gelen kodu gir.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Kod"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="primary" disabled={busy || !code.trim()}>
        Giriş yap
      </button>
      <button type="button" className="link" onClick={() => setSent(false)}>
        Farklı e-posta
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
