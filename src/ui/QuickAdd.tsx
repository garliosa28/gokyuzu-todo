import { useState } from 'react'

export function QuickAdd({ onAdd, placeholder = 'Görev ekle…' }: { onAdd: (title: string) => unknown; placeholder?: string }) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <form
        className="quick-add"
        onSubmit={async (e) => {
          e.preventDefault()
          const text = title
          if (!text.trim()) return
          // Hemen temizle (çift dokunuş aynı görevi iki kez eklemesin); eklenemezse metni geri getir.
          setTitle('')
          setError(null)
          try {
            await onAdd(text)
          } catch (err) {
            setTitle((current) => current || text)
            setError(err instanceof Error ? err.message : String(err))
          }
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="done"
          aria-label="Yeni görev"
        />
        <button type="submit" aria-label="Ekle" disabled={!title.trim()}>
          +
        </button>
      </form>
      {error && <p className="error">Eklenemedi: {error}</p>}
    </>
  )
}
