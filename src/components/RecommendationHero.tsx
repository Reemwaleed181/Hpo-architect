import React from 'react'
import { MethodAnalysis } from '../lib/hpo-engine'

export default function RecommendationHero({ main }: { main: MethodAnalysis }){
  return (
    <div className="card mt-4 p-6">
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="text-sm text-slate-400">YOUR HPO STRATEGY</div>
          <div className="text-2xl font-bold mt-2">{main.name}</div>
          <div className="mt-2 text-cyan-200 font-semibold">{main.suitability}</div>
          <div className="mt-4">
            <div className="font-medium">Why this strategy?</div>
            <ul className="list-disc pl-6 mt-2 text-sm">
              {main.whyFits.map((w,i)=>(<li key={i}>{w}</li>))}
            </ul>
          </div>
        </div>
        <div className="w-64">
          <div className="font-medium">Major trade-offs</div>
          <ul className="list-disc pl-6 mt-2 text-sm text-slate-300">
            {main.whyNot.map((w,i)=>(<li key={i}>{w}</li>))}
          </ul>
        </div>
      </div>
    </div>
  )
}
