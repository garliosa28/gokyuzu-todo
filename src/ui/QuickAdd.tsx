import { useState } from 'react'

export function QuickAdd({ onAdd, placeholder = 'Görev ekle…' }: { onAdd: (title: string) => unknown; placeholder?: string }) {
  const [title, setTitle] = useState('')
  return (
    <form
      className="quick-add"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onAdd(title)
        setTitle('')
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="done"
        aria-label="Yeni görev"
      />
      <button type="submit" aria-label="Ekle" disabled={!title.trim()}>+</button>
    </form>
  )
}
