import { useState } from 'react'
import { Experiment, humanReadableCount, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'
import { refs } from '../lib/references'
import { downloadAsFile, toYAML } from '../utils/export'
import Card from './ui/Card'
import { Button } from './ui/Button'
import ScientificEvidence from './ScientificEvidence'

function uniqueReferenceIds(analysis: AnalysisResult){
  return Array.from(new Set([
    ...(analysis.recommendedMethod?.referenceIds || []),
    ...analysis.validation.referenceIds,
    ...analysis.decisionTrace.flatMap(t=>t.referenceIds),
    'cawley2010'
  ]))
}

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
  else exp.params.forEach(p=> lines.push(`  - ${p.name}: ${p.type.kind} ${p.gridPoints? `(explicit grid points: ${p.gridPoints})`:''}`))
  lines.push('')
  lines.push('Compute:')
  lines.push(`  Full-trial time (min): ${exp.trialTimeMinutes}`)
  lines.push(`  Workers: ${exp.workers}`)
  lines.push(`  Total compute budget (min): ${exp.budgetMinutes}`)
  if (grid.exactGridSizeAvailable) lines.push(`  Exact finite-grid trials: ${humanReadableCount(grid.size)}`)
  else lines.push('  Exact finite-grid trials: unavailable until the space is explicitly enumerable/discretized')
  lines.push('')
  if (analysis.recommendedMethod) {
    lines.push('Primary literature-informed recommendation:')
    lines.push(`  ${analysis.recommendedMethod.name} — ${analysis.recommendedMethod.suitability}`)
    lines.push('  Reasons:')
    analysis.recommendedMethod.whyFits.forEach(r=> lines.push(`    - ${r}`))
  }
  lines.push('')
  lines.push(`Validation: ${analysis.validation.method}`)
  lines.push(`  ${analysis.validation.reason}`)
  lines.push('')
  lines.push('Scientific disclosure:')
  lines.push(`  ${analysis.scientificDisclosure}`)
  lines.push('')
  lines.push('Scientific references used by this blueprint:')
  refs(uniqueReferenceIds(analysis)).forEach(r=>{
    lines.push(`  - ${r.citation}`)
    lines.push(`    ${r.url}`)
  })
  return lines.join('\n')
}

export default function Blueprint({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || analyzeExperiment(exp)
  const blueprintText = renderBlueprintText(exp, analysisLocal)
  const [showRaw, setShowRaw] = useState(false)
  const referenceIds = uniqueReferenceIds(analysisLocal)

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-semibold">HPO Experiment Blueprint</h3>
      <div className="mt-1 text-xs text-slate-500">Author-developed experiment-plan format populated with literature-informed HPO and validation guidance.</div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-semibold">01 Experiment</div>
          <div className="text-sm text-slate-300 mt-1">{exp.name}</div>
          <div className="mt-3 font-semibold">02 Search Space</div>
          <div className="text-sm text-slate-300 mt-1">{exp.params.length} search dimensions</div>
          <div className="mt-3 font-semibold">03 Compute</div>
          <div className="text-sm text-slate-300 mt-1">Trial: {exp.trialTimeMinutes} min • Total compute budget: {exp.budgetMinutes} min • Workers: {exp.workers}</div>
        </div>
        <div>
          <div className="font-semibold">04 Recommended Strategy</div>
          {analysisLocal.recommendedMethod ? (
            <div className="text-sm text-slate-300 mt-1">{analysisLocal.recommendedMethod.name} — {analysisLocal.recommendedMethod.suitability}</div>
          ) : <div className="text-sm text-slate-400">—</div>}
          <div className="mt-3 font-semibold">05 Validation</div>
          <div className="text-sm text-slate-300 mt-1">{analysisLocal.validation.method}</div>
          <div className="mt-3 font-semibold">06 Resource Strategy</div>
          <div className="text-sm text-slate-300 mt-1">{exp.iterative && exp.earlyStopping ? 'Multi-fidelity / early-stopping methods are applicable' : 'No multi-fidelity recommendation without iterative intermediate results + early stopping'} • Workers: {exp.workers}</div>
          <div className="mt-3 font-semibold">07 Reproducibility</div>
          <div className="text-sm text-slate-300 mt-1">{exp.reproducibility || 'Not specified'}</div>
          <div className="mt-3 font-semibold">08 Execution Plan</div>
          <div className="text-sm text-slate-300 mt-1">1. Define the validation / resampling procedure
            <br/>2. Instantiate the selected HPO strategy
            <br/>3. Search within the declared parameter space and compute budget
            <br/>4. Compare configurations using the validation metric
            <br/>5. Use the untouched final test set only after model / hyperparameter selection
          </div>
          <div className="mt-3 font-semibold">09 Warnings</div>
          <div className="text-sm text-amber-300 mt-1">{analysisLocal.diagnostics.join('; ') || 'None'}</div>
        </div>
      </div>

      <ScientificEvidence referenceIds={referenceIds} />

      <div className="mt-4 border-l-2 border-cyan-400 bg-slate-900 px-4 py-3 text-xs text-slate-400">
        {analysisLocal.scientificDisclosure}
      </div>

      <div className="mt-6">
        <div className="font-semibold">EXPORT PLAN</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" onClick={()=>navigator.clipboard.writeText(blueprintText)}>Copy Blueprint</Button>
          <Button onClick={()=>downloadAsFile(blueprintText, 'hpo_blueprint.txt')}>Download TXT</Button>
          <Button onClick={()=>downloadAsFile(JSON.stringify(exp, null, 2), 'hpo_experiment.json')}>Download JSON</Button>
          <Button onClick={()=>downloadAsFile(toYAML(exp), 'hpo_experiment.yaml')}>Download YAML</Button>
          <Button onClick={()=>window.print()}>Print / Save as PDF</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="font-semibold">IMPLEMENTATION STARTER</div>
        <div className="mt-3 text-sm text-slate-400">Starter code templates and copy actions are available below. Run-count, validation-split and resource-reduction values are intentionally left as user-defined placeholders rather than arbitrary defaults.</div>
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
