import React, { useState } from 'react'
import { Experiment, TaskType, ModelFamily } from '../lib/hpo-engine'

export default function ExperimentDesigner({ value, onChange }:{ value: Experiment, onChange:(v:Experiment)=>void }){
  const [local, setLocal] = useState(value)

  React.useEffect(() => {
    setLocal(value)
  }, [value])

  function update<K extends keyof Experiment>(k:K, v:Experiment[K]){
    const next = { ...local, [k]: v }
    setLocal(next)
    onChange(next)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold">Experiment Designer</h3>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="flex flex-col">
          Task
          <select className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.task} onChange={e=>update('task', e.target.value as TaskType)}>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
        </label>
        <label className="flex flex-col">
          Model Family
          <select className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.model} onChange={e=>update('model', e.target.value as ModelFamily)}>
            <option value="neural">Neural Network</option>
            <option value="xgboost">XGBoost / Gradient Boosting</option>
            <option value="random_forest">Random Forest</option>
            <option value="svm">Support Vector Machine</option>
            <option value="linear">Logistic / Linear Model</option>
            <option value="other">Other Black-Box Model</option>
          </select>
        </label>

        <label className="flex flex-col">
          Number of samples
          <input className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.samples} onChange={e=>update('samples', Number(e.target.value))} />
        </label>
        <label className="flex flex-col">
          Number of features
          <input className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.features} onChange={e=>update('features', Number(e.target.value))} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={local.imbalanced} onChange={e=>update('imbalanced', e.target.checked)} />
          Imbalanced classification
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={local.timeSeries} onChange={e=>update('timeSeries', e.target.checked)} />
          Time-series data
        </label>

        <label className="flex flex-col">
          Objective Metric
          <select className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.metric} onChange={e=>update('metric', e.target.value)}>
            {local.task === 'classification' ? (
              <>
                <option>Accuracy</option>
                <option>Precision</option>
                <option>Recall</option>
                <option>F1-score</option>
                <option>ROC-AUC</option>
                <option>Log Loss</option>
              </>
            ) : (
              <>
                <option>RMSE</option>
                <option>MAE</option>
                <option>R²</option>
              </>
            )}
          </select>
        </label>

        <label className="flex flex-col">
          Average trial time
          <div className="flex gap-2 mt-1">
            <input type="number" className="bg-transparent border border-slate-700 p-2 rounded flex-1" value={local.trialTimeMinutes} onChange={e=>update('trialTimeMinutes', Number(e.target.value))} />
            <div className="text-slate-400 self-center">minutes</div>
          </div>
        </label>

        <label className="flex flex-col">
          Available compute budget (minutes)
          <input className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.budgetMinutes} onChange={e=>update('budgetMinutes', Number(e.target.value))} />
        </label>

        <label className="flex flex-col">
          Parallel workers
          <input className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" min={1} max={64} value={local.workers} onChange={e=>update('workers', Number(e.target.value))} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={local.earlyStopping} onChange={e=>update('earlyStopping', e.target.checked)} />
          Early stopping available
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={local.iterative} onChange={e=>update('iterative', e.target.checked)} />
          Iterative training (intermediate metrics)
        </label>

        <label className="flex flex-col">
          Reproducibility
          <select className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.reproducibility} onChange={e=>update('reproducibility', e.target.value as any)}>
            <option value="fixed">Fixed seed</option>
            <option value="multiple">Multiple repeated seeds</option>
            <option value="none">Not specified</option>
          </select>
        </label>
      </div>
    </div>
  )
}
