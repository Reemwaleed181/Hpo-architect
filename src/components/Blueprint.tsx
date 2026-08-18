import React, { useState } from 'react'
import { Experiment, calculateGridSize, humanReadableCount, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'
import { downloadAsFile, toYAML } from '../utils/export'
import Card from './ui/Card'
import { Button } from './ui/Button'

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
  const [showRaw, setShowRaw] = useState(false)

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-semibold">HPO Experiment Blueprint</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-semibold">01 Experiment</div>
          <div className="text-sm text-slate-300 mt-1">{exp.name}</div>
          <div className="mt-3 font-semibold">02 Search Space</div>
          <div className="text-sm text-slate-300 mt-1">{exp.params.length} search dimensions</div>
          <div className="mt-3 font-semibold">03 Compute</div>
          <div className="text-sm text-slate-300 mt-1">Trial: {exp.trialTimeMinutes} min • Budget: {exp.budgetMinutes} min • Workers: {exp.workers}</div>
        </div>
        <div>
          <div className="font-semibold">04 Recommended Strategy</div>
          {analysisLocal.recommendedMethod ? (
            <div className="text-sm text-slate-300 mt-1">{analysisLocal.recommendedMethod.name} — {analysisLocal.recommendedMethod.suitability}</div>
          ) : <div className="text-sm text-slate-400">—</div>}
          <div className="mt-3 font-semibold">05 Validation</div>
          <div className="text-sm text-slate-300 mt-1">{analysisLocal.validation.method}</div>
          <div className="mt-3 font-semibold">06 Resource Strategy</div>
          <div className="text-sm text-slate-300 mt-1">{exp.iterative ? 'Multi-fidelity / iterative training applicable' : 'Full-budget evaluation (no iterative training)'} • Workers: {exp.workers}</div>
          <div className="mt-3 font-semibold">07 Reproducibility</div>
          <div className="text-sm text-slate-300 mt-1">{exp.reproducibility || 'Not specified'}</div>
          <div className="mt-3 font-semibold">08 Execution Plan</div>
          <div className="text-sm text-slate-300 mt-1">1. Prepare validation split / CV
            <br/>2. Instantiate selected HPO strategy
            <br/>3. Search within defined parameter space
            <br/>4. Evaluate configurations using validation metric
            <br/>5. Reserve final test set for reporting
          </div>
          <div className="mt-3 font-semibold">09 Warnings</div>
          <div className="text-sm text-amber-300 mt-1">{analysisLocal.diagnostics.join('; ') || 'None'}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="font-semibold">EXPORT PLAN</div>
        <div className="mt-3 flex gap-2">
          <Button variant="primary" onClick={()=>navigator.clipboard.writeText(blueprintText)}>Copy Blueprint</Button>
          <Button onClick={()=>downloadAsFile(blueprintText, 'hpo_blueprint.txt')}>Download TXT</Button>
          <Button onClick={()=>downloadAsFile(JSON.stringify(exp, null, 2), 'hpo_experiment.json')}>Download JSON</Button>
          <Button onClick={()=>downloadAsFile(toYAML(exp), 'hpo_experiment.yaml')}>Download YAML</Button>
          <Button onClick={()=>window.print()}>Print / Save as PDF</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="font-semibold">IMPLEMENTATION STARTER</div>
        <div className="mt-3 text-sm text-slate-400">Starter code templates and copy actions are available below.</div>
      </div>

      <div className="mt-4">
        <div className="font-semibold">View Raw Blueprint</div>
        <div className="mt-2">
          <button className="text-sm text-cyan-300" onClick={()=>setShowRaw(s=>!s)}>{showRaw? 'Hide Raw Blueprint' : 'View Raw Blueprint'}</button>
        </div>
        {showRaw && <pre className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{blueprintText}</pre>}
      </div>
    </Card>
  )
}
