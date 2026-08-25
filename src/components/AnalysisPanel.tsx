import { humanReadableCount, calculateGridCost, Experiment, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'
import { formatMinutes } from '../utils/time'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import ScientificEvidence from './ScientificEvidence'

export default function AnalysisPanel({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || analyzeExperiment(exp)
  const grid = analysisLocal.gridInfo
  const diags = analysisLocal.diagnostics
  const recs = analysisLocal.rankedMethods
  const validation = analysisLocal.validation
  const affordable = analysisLocal.affordableFullTrials
  const exactGridCost = analysisLocal.gridInfo.exactGridSizeAvailable && grid.size > 0n
    ? calculateGridCost(grid.size, exp.trialTimeMinutes, exp.workers)
    : null

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">Analysis</h3>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-400">Full trial</div>
          <div className="mt-1 text-2xl font-semibold">{exp.trialTimeMinutes} min</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-400">Total compute budget</div>
          <div className="mt-1 text-2xl font-semibold">{formatMinutes(exp.budgetMinutes)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-400">Affordable full trials</div>
          <div className="mt-1 text-2xl font-semibold">{affordable}</div>
          <div className="mt-1 text-xs text-slate-500">Total-compute equivalents: budget ÷ full-trial cost</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-400">Workers</div>
          <div className="mt-1 text-2xl font-semibold">{exp.workers}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 border-t border-slate-800 pt-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold uppercase">Grid feasibility</h4>
          {analysisLocal.gridInfo.exactGridSizeAvailable && grid.finite ? (
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm text-slate-400">Grid configurations</div>
                <div className="text-xl font-semibold">{humanReadableCount(grid.size)}</div>
                {exactGridCost?.serialMinutes !== null && exactGridCost?.serialMinutes !== undefined ? (
                  <div className="mt-2 text-sm text-slate-400">
                    Serial compute: {formatMinutes(exactGridCost.serialMinutes)} — Idealized parallel: {formatMinutes(exactGridCost.idealParallelMinutes || 0)}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-amber-300">Grid is too large for safe numeric wall-time conversion in the browser.</div>
                )}
              </div>
              <div>
                <div className="text-sm text-slate-400">Available budget</div>
                <div className="text-xl font-semibold">{formatMinutes(exp.budgetMinutes)}</div>
                {exactGridCost?.serialMinutes !== null && exactGridCost?.serialMinutes !== undefined && (
                  <div className="mt-2 text-sm text-slate-400">Grid / Budget: {(exactGridCost.serialMinutes / Math.max(1, exp.budgetMinutes)).toFixed(1)}×</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 border-l-2 border-amber-400 pl-3">
              <div className="font-medium text-amber-200">Exact grid cost unavailable</div>
              <div className="mt-1 text-sm text-slate-300">
                {grid.conditional
                  ? 'Conditional parameters require counting only valid configurations before an exhaustive Grid Search size can be calculated.'
                  : 'Continuous dimensions are not discretized, so an exact exhaustive Grid Search size cannot be calculated.'}
              </div>
            </div>
          )}
          <ScientificEvidence referenceIds={['feurer2019','bischl2023']} compact />
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase">Search space diagnostics</h4>
          {diags.length===0 ? <div className="mt-2 text-sm text-slate-400">No immediate structural issues detected.</div> : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {diags.map((d,i)=>(<li key={i}>{d}</li>))}
            </ul>
          )}
        </section>
      </div>

      {analysisLocal.gridInfo.exactGridSizeAvailable && exactGridCost?.serialMinutes !== null && exactGridCost?.serialMinutes !== undefined && (
        <div className="mt-4">
          <h4 className="font-semibold">Compute Comparison</h4>
          <div style={{ width: '100%', height: 160 }} className="mt-2">
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'Budget (min)', value: exp.budgetMinutes },
                { name: 'Grid serial (min)', value: exactGridCost.serialMinutes }
              ]}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <h4 className="text-sm font-semibold uppercase">HPO strategy recommendations</h4>
          <div className="text-xs text-slate-500">No numeric suitability scores are used.</div>
        </div>
        <div className="mt-2 grid gap-x-6 md:grid-cols-2">
          {recs.map((r, index)=> (
            <div key={r.name} className={`border-t border-slate-800 py-3 ${index===0 ? 'border-l-2 border-l-cyan-400 pl-3' : ''}`}>
              <div className="flex justify-between gap-3"><div className="font-medium">{r.name}</div><div className="text-sm text-slate-400">{r.suitability}</div></div>
              {r.whyFits.length>0 && (
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-300">
                  {r.whyFits.map((w,i)=>(<li key={i}>{w}</li>))}
                </ul>
              )}
              {r.whyNot.length>0 && (
                <details className="mt-2 text-sm"><summary className="text-amber-200">Limitations / prerequisites</summary><ul className="list-disc pl-6 mt-2 text-sm text-slate-300">{r.whyNot.map((n,i)=>(<li key={i}>{n}</li>))}</ul></details>
              )}
              <ScientificEvidence referenceIds={r.referenceIds} compact />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <h4 className="text-sm font-semibold uppercase">Validation advisor</h4>
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">{validation.method}</div>
            <div className="mt-1 text-sm text-slate-400">{validation.reason}</div>
            <ScientificEvidence referenceIds={validation.referenceIds} compact />
          </div>
          <div className="border-l-2 border-slate-700 pl-3">
            <div className="text-xs font-semibold uppercase text-slate-400">Final test set</div>
            <div className="mt-1 text-sm text-slate-300">Reserve it for final reporting after model / hyperparameter selection.</div>
            <ScientificEvidence referenceIds={['cawley2010']} compact />
          </div>
        </div>
      </div>

      <div className="mt-5 border-l-2 border-cyan-400 bg-slate-900 px-4 py-3 text-xs text-slate-400">
        {analysisLocal.scientificDisclosure}
      </div>
    </div>
  )
}
