import React from 'react'
import { Experiment, calculateGridSize, analyzeExperiment, AnalysisResult } from '../lib/hpo-engine'

export default function DecisionTree({ exp, analysis }:{ exp: Experiment, analysis?: AnalysisResult }){
  const analysisLocal = analysis || null

  return (
    <div className="card mt-4">
      <h4 className="font-semibold">Decision Tree</h4>
      <div className="mt-3 space-y-2 text-sm">
        {analysisLocal && analysisLocal.recommendedMethod ? (
          <div className="mt-2 p-2 border border-slate-800 rounded">Current selected path: <span className="font-medium">{analysisLocal.recommendedMethod.name}</span></div>
        ) : (
          <div className="mt-2 p-2 border border-slate-800 rounded">Analysis unavailable</div>
        )}
      </div>
    </div>
  )
}
