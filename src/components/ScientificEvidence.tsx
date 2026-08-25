import { refs } from '../lib/references'

export default function ScientificEvidence({ referenceIds, compact = false }:{ referenceIds:string[], compact?:boolean }){
  const items = refs(referenceIds)
  if (!items.length) return null

  if (compact) {
    return (
      <div className="mt-2 text-xs text-slate-400">
        Scientific basis:{' '}
        {items.map((r, i)=>(
          <span key={r.id}>
            {i > 0 ? '; ' : ''}
            <a className="text-cyan-300 hover:underline" href={r.url} target="_blank" rel="noreferrer">{r.short}</a>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 border-t border-slate-800 pt-3">
      <div className="text-xs font-semibold uppercase text-slate-400">Scientific basis</div>
      <ul className="mt-2 space-y-1 text-sm text-slate-300">
        {items.map(r=>(
          <li key={r.id}>
            <a className="text-cyan-300 hover:underline" href={r.url} target="_blank" rel="noreferrer">{r.short}</a>
            <span className="text-slate-500"> — {r.supports}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
