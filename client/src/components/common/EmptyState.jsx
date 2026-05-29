import { Link } from 'react-router-dom'

export default function EmptyState({ icon = '🔍', title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <span className="text-6xl mb-5">{icon}</span>
      <h3 className="font-display text-2xl font-semibold text-gray-800 mb-2">{title}</h3>
      {message && <p className="text-gray-500 max-w-sm mb-8">{message}</p>}
      {(actionLabel && actionTo) && (
        <Link to={actionTo} className="btn-primary">{actionLabel}</Link>
      )}
      {(actionLabel && onAction) && (
        <button onClick={onAction} className="btn-primary">{actionLabel}</button>
      )}
    </div>
  )
}
