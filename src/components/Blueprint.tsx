import React from 'react'
import { Experiment, calculateGridSize, humanReadableCount, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'
import { downloadAsFile, toYAML } from '../utils/export'

function renderBlueprintText(exp: Experiment, analysis: AnalysisResult){
  const grid = analysis.gridInfo
  const lines:string[] = []
  lines.push(`Project: ${exp.name || 'Untitled'}`)
  lines.push(`Task: ${exp.task}`)
  lines.push(`Model: ${exp.model}`)
  lines.push(`Samples: ${exp.samples}`)
  lines.push(`Objective: ${exp.metric}`)
  lines.push('')
  lines.push('Search Space:')
  if (exp.params.length===0) lines.push('  (no hyperparameters)')
  else exp.params.forEach(p=> lines.push(`  - ${p.name}: ${p.type.kind} ${p.gridPoints? `(grid ${p.gridPoints})`:''}`))
  lines.push('')
  lines.push('Compute:')
  lines.push(`  Trial time (min): ${exp.trialTimeMinutes}`)
  lines.push(`  Workers: ${exp.workers}`)
  lines.push(`  Budget (min): ${exp.budgetMinutes}`)
  if (grid.finite) lines.push(`Estimated grid trials: ${humanReadableCount(grid.size)}`)
  else lines.push('Estimated grid trials: requires discretization')
  lines.push('')
  if (analysis.recommendedMethod) {
    lines.push('Recommendation:')
    lines.push(`  ${analysis.recommendedMethod.name} — ${analysis.recommendedMethod.suitability}`)
    lines.push('  Reasons:')
    analysis.recommendedMethod.whyFits.forEach(r=> lines.push(`    - ${r}`))
  }
  return lines.join('\n')
}

export default function Blueprint({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || analyzeExperiment(exp)
  const blueprintText = renderBlueprintText(exp, analysisLocal)

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">HPO Experiment Blueprint</h3>
      <div className="mt-3">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{blueprintText}</pre>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>navigator.clipboard.writeText(blueprintText)}>Copy Blueprint</button>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>downloadAsFile(blueprintText, 'hpo_blueprint.txt')}>Download TXT</button>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>downloadAsFile(JSON.stringify(exp, null, 2), 'hpo_experiment.json')}>Download JSON</button>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>downloadAsFile(toYAML(exp), 'hpo_experiment.yaml')}>Download YAML</button>
          <button className="px-3 py-2 bg-slate-700 rounded" onClick={()=>window.print()}>Print / Save as PDF</button>
        </div>
      </div>
    </div>
  )
}
