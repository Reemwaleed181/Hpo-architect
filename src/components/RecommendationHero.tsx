import { MethodAnalysis } from '../lib/hpo-engine'
import ScientificEvidence from './ScientificEvidence'

export default function RecommendationHero({ main }: { main: MethodAnalysis }){
  return (
    <div className="card mt-4 p-6">
      <div className="text-sm text-slate-400">HPO ARCHITECT RECOMMENDS</div>
      <div className="mt-2 text-4xl font-bold">{main.name}</div>
      <div className="mt-2 text-cyan-200 font-semibold text-lg">{main.suitability}</div>
      <div className="mt-1 text-xs text-slate-500">Strong / Reasonable / Weak are author-developed qualitative applicability labels based on literature-supported conditions; they are not probabilities, accuracy estimates, or performance scores.</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-medium">Why this fits</div>
          <ul className="list-disc pl-6 mt-2 text-sm text-slate-300">
            {main.whyFits.map((w,i)=>(<li key={i}>{w}</li>))}
          </ul>
        </div>
        {main.whyNot && main.whyNot.length>0 && (
          <div>
            <div className="font-medium">Main trade-offs</div>
            <ul className="list-disc pl-6 mt-2 text-sm text-slate-300">
              {main.whyNot.map((w,i)=>(<li key={i}>{w}</li>))}
            </ul>
          </div>
        )}
      </div>
      <ScientificEvidence referenceIds={main.referenceIds} />
    </div>
  )
}
