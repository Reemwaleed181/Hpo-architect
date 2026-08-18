import React, { useState } from 'react'
import { Experiment, TaskType, ModelFamily } from '../lib/hpo-engine'
import SectionHeader from './ui/SectionHeader'
import Card from './ui/Card'
import { Button } from './ui/Button'

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
    <Card>
      <h3 className="text-lg font-semibold">Experiment Designer</h3>
      <div className="mt-3 space-y-4">
        <div>
          <SectionHeader title="Problem" subtitle="Define the learning task and model family" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col">
              Task
              <select aria-label="Task" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.task} onChange={e=>update('task', e.target.value as TaskType)}>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
              </select>
              <div className="text-xs text-slate-400 mt-1">Type of supervised problem to optimize for.</div>
            </label>

            <label className="flex flex-col">
              Model Family
              <select aria-label="Model Family" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.model} onChange={e=>update('model', e.target.value as any)}>
                <option value="neural">Neural Network</option>
                <option value="xgboost">XGBoost / Gradient Boosting</option>
                <option value="random_forest">Random Forest</option>
                <option value="svm">Support Vector Machine</option>
                <option value="linear">Logistic / Linear Model</option>
                <option value="other">Other Black-Box Model</option>
              </select>
              <div className="text-xs text-slate-400 mt-1">Choose the model family you plan to tune.</div>
            </label>

            <label className="flex flex-col">
              Objective Metric
              <select aria-label="Objective Metric" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.metric} onChange={e=>update('metric', e.target.value)}>
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
              <div className="text-xs text-slate-400 mt-1">Metric used to evaluate and rank configurations.</div>
            </label>
          </div>
        </div>

        <div>
          <SectionHeader title="Dataset" subtitle="Provide dataset scale and characteristics" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex flex-col">
              Samples
              <input aria-label="Number of samples" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.samples} onChange={e=>update('samples', Number(e.target.value))} />
              <div className="text-xs text-slate-400 mt-1">Total rows in the dataset.</div>
            </label>
            <label className="flex flex-col">
              Features
              <input aria-label="Number of features" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.features} onChange={e=>update('features', Number(e.target.value))} />
              <div className="text-xs text-slate-400 mt-1">Number of input variables (approx.).</div>
            </label>
            <label className="flex items-center gap-2">
              <input aria-label="Imbalanced" type="checkbox" checked={local.imbalanced} onChange={e=>update('imbalanced', e.target.checked)} />
              <div>Imbalanced classification</div>
            </label>
            <label className="flex items-center gap-2">
              <input aria-label="Time-series" type="checkbox" checked={local.timeSeries} onChange={e=>update('timeSeries', e.target.checked)} />
              <div>Time-series data</div>
            </label>
          </div>
        </div>

        <div>
          <SectionHeader title="Compute" subtitle="Specify trial cost and available resources" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col">
              Average trial time
              <div className="flex gap-2 mt-1">
                <input aria-label="Average trial time" type="number" className="bg-transparent border border-slate-700 p-2 rounded flex-1" value={local.trialTimeMinutes} onChange={e=>update('trialTimeMinutes', Number(e.target.value))} />
                <div className="text-slate-400 self-center">minutes</div>
              </div>
              <div className="text-xs text-slate-400 mt-1">How long one full configuration evaluation takes.</div>
            </label>

            <label className="flex flex-col">
              Total compute budget
              <input aria-label="Compute budget" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" value={local.budgetMinutes} onChange={e=>update('budgetMinutes', Number(e.target.value))} />
              <div className="text-xs text-slate-400 mt-1">Total minutes you can allocate to the HPO experiment.</div>
            </label>

            <label className="flex flex-col">
              Parallel workers
              <input aria-label="Parallel workers" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" type="number" min={1} max={64} value={local.workers} onChange={e=>update('workers', Number(e.target.value))} />
              <div className="text-xs text-slate-400 mt-1">Number of concurrent trials you can run.</div>
            </label>
          </div>
        </div>

        <div>
          <SectionHeader title="Training Behavior" subtitle="Model training and reproducibility settings" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <label className="flex items-center gap-2">
              <input aria-label="Iterative training" type="checkbox" checked={local.iterative} onChange={e=>update('iterative', e.target.checked)} />
              <div>Iterative training (intermediate metrics)</div>
            </label>

            <label className="flex items-center gap-2">
              <input aria-label="Early stopping" type="checkbox" checked={local.earlyStopping} onChange={e=>update('earlyStopping', e.target.checked)} />
              <div>Early stopping available</div>
            </label>

            <label className="flex flex-col">
              Reproducibility
              <select aria-label="Reproducibility" className="mt-1 bg-transparent border border-slate-700 p-2 rounded" value={local.reproducibility} onChange={e=>update('reproducibility', e.target.value as any)}>
                <option value="fixed">Fixed seed</option>
                <option value="multiple">Multiple repeated seeds</option>
                <option value="none">Not specified</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}
