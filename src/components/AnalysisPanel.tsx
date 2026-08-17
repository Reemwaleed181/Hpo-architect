import React from 'react'
import { calculateGridSize, humanReadableCount, calculateGridCost, estimateAffordableTrials, analyzeSearchSpace, recommendValidation, budgetSummary, Experiment, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'
import { formatMinutes } from '../utils/time'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export default function AnalysisPanel({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || analyzeExperiment(exp)
  const grid = analysisLocal.gridInfo
  const diags = analysisLocal.diagnostics
  const recs = analysisLocal.rankedMethods
  const validation = analysisLocal.validation
  const affordable = analysisLocal.affordableFullTrials
  const budget = analysisLocal.budgetSummary

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">Analysis</h3>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="p-3 border border-slate-800 rounded">
          <div className="text-sm text-slate-400">Dataset</div>
          <div className="mt-2">Size: {exp.samples} ({/* compute label */})</div>
          <div className="mt-1 text-sm text-slate-400">Objective: {exp.metric}</div>
        </div>

        <div className="p-3 border border-slate-800 rounded">
          <div className="text-sm text-slate-400">Compute</div>
          <div className="mt-2">Trial time: {exp.trialTimeMinutes} minutes</div>
          <div>Available budget: {exp.budgetMinutes} minutes</div>
          <div>Workers: {exp.workers}</div>
          <div className="mt-2 text-sm text-slate-400">Affordable full trials: {affordable}</div>
          {budget.gridCalc && (
            <div className="mt-2 text-sm text-amber-300">Grid serial estimate: {formatMinutes(budget.gridCalc.serialMinutes)} — Budget ratio: {(budget.gridCalc.budgetRatio).toFixed(1)}×</div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Grid Search Estimation</h4>
          {analysisLocal.gridInfo.exactGridSizeAvailable ? (
            <div>
              {grid.finite ? (
                <div>
                  <div>Trials: {humanReadableCount(grid.size)}</div>
                  {grid.size > 0n && (
                    (()=>{ const cost = calculateGridCost(grid.size, exp.trialTimeMinutes, exp.workers); return (
                      <div className="mt-2 text-sm text-slate-400">
                          Estimated serial compute: {formatMinutes(cost.serialMinutes)} ({cost.serialMinutes.toLocaleString()} minutes)
                          <br/>Idealized parallel wall time (assuming perfect parallel utilization): {formatMinutes(cost.idealParallelMinutes)}
                          <br/>Budget ratio: {(cost.serialMinutes/Math.max(1, exp.budgetMinutes)).toFixed(1)}×
                        </div>
                    ) })()
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Continuous dimensions require discretization before an exhaustive grid size can be calculated.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-amber-300">Exact exhaustive Grid Search size is not calculated for conditional search spaces because only valid conditional configurations should be counted.</div>
          )}
      </div>

      {grid.finite && grid.size > 0n && (
        <div className="mt-4">
          <h4 className="font-semibold">Visual Comparison</h4>
          <div style={{ width: '100%', height: 160 }} className="mt-2">
            {(() => {
              const budget = exp.budgetMinutes
              const trials = Number(grid.size > 1_000_000 ? 1_000_000 : grid.size)
              const serial = trials * exp.trialTimeMinutes
              const data = [
                { name: 'Budget (min)', value: budget },
                { name: 'Grid serial (min)', value: Math.min(serial, budget*100) }
              ]
              return (
                <ResponsiveContainer>
                  <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h4 className="font-semibold">Search Space Diagnostics</h4>
        {diags.length===0 ? <div className="text-sm text-slate-400">No immediate issues detected.</div> : (
          <ul className="list-disc pl-6 mt-2 text-sm text-slate-300">
            {diags.map((d,i)=>(<li key={i}>{d}</li>))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">HPO Strategy Recommendations</h4>
        <div className="mt-2 grid gap-2">
          {recs.map(r=> (
            <div key={r.name} className="p-3 border border-slate-800 rounded">
              <div className="flex justify-between"><div className="font-medium">{r.name}</div><div className="text-sm text-slate-400">{r.suitability}</div></div>
              <div className="mt-1 text-sm text-slate-400">Why it fits:</div>
              <ul className="list-disc pl-6 text-sm">
                {r.whyFits.map((w,i)=>(<li key={i}>{w}</li>))}
              </ul>
              {r.whyNot && r.whyNot.length>0 && (
                <details className="mt-2 text-sm"><summary className="text-amber-200">Why not this method?</summary><ul className="list-disc pl-6 mt-2 text-sm text-slate-300">{r.whyNot.map((n,i)=>(<li key={i}>{n}</li>))}</ul></details>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Validation Recommendation</h4>
        <div className="mt-2 p-3 border border-slate-800 rounded">
          <div className="font-medium">{validation.method}</div>
          <div className="text-sm text-slate-400">{validation.reason}</div>
        </div>
      </div>
    </div>
  )
}
