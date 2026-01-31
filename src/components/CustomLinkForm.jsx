import { useState } from 'react'

export default function CustomLinkForm({ onSubmit, onCancel }) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    
    // Basic URL validation
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    
    onSubmit({ label: label.trim(), url: finalUrl })
    setLabel('')
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-dark-800 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-dark-200">Add Custom Link</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-dark-400 mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., My Download"
            className="input-field w-full text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="input-field w-full text-sm py-1.5"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!label.trim() || !url.trim()}
          className="btn-primary text-sm py-1.5"
        >
          Add Link
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost text-sm py-1.5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
