import { MethodAnalysis } from '../lib/hpo-engine'
import ScientificEvidence from './ScientificEvidence'

export default function CompareStrategies({ methods }:{ methods: MethodAnalysis[] }){
  return (
    <div className="card mt-4">
      <h4 className="font-semibold">Strategy Comparison</h4>
      <div className="mt-1 text-xs text-slate-500">Comparison is condition-based, not a universal ranking.</div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left p-2">Method</th>
              <th className="text-left p-2">Match</th>
              <th className="text-left p-2">Why it fits</th>
              <th className="text-left p-2">Limitation</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(m=> (
              <tr key={m.name} className="border-t border-slate-800 align-top">
                <td className="p-2 font-medium">
                  {m.name}
                  <ScientificEvidence referenceIds={m.referenceIds} compact />
                </td>
                <td className="p-2 text-slate-400">{m.suitability}</td>
                <td className="p-2 text-slate-300">{m.whyFits[0] || '—'}</td>
                <td className="p-2 text-slate-300">{m.whyNot[0] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
