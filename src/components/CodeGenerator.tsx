import React from 'react'
import { Experiment } from '../lib/hpo-engine'

export default function CodeGenerator({ exp }:{ exp: Experiment }){
  function genParamMapping(){
    // produce param dicts for sklearn/optuna
    const grid:any = {}
    const rand:any = {}
    for (const p of exp.params){
      if (p.type.kind === 'categorical' || p.type.kind === 'discrete'){
        grid[p.name] = (p.type as any).values
      } else if (p.type.kind === 'integer'){
        const t = p.type as any
        grid[p.name] = Array.from({length: Math.floor((t.max - t.min)/(t.step||1))+1}, (_,i)=>t.min + (t.step||1)*i)
      } else if (p.type.kind === 'continuous'){
        const t = p.type as any
        grid[p.name] = `continuous(${t.min}, ${t.max}, scale='${t.scale||'linear'}')`
      }
    }
    return { grid }
  }

  function generateTemplate(kind:'grid'|'random'|'optuna'|'halving'|'optuna_prune'){
    const { grid } = genParamMapping()
    if (kind === 'grid'){
      return `# GridSearchCV starter\nfrom sklearn.model_selection import GridSearchCV\n# Replace with your estimator and data\nparam_grid = ${JSON.stringify(grid, null, 2)}\n# estimator = ...\n# grid = GridSearchCV(estimator, param_grid, scoring='${exp.metric}', cv=3)\n# grid.fit(X_train, y_train)\n`}
    if (kind === 'random'){
      return `# RandomizedSearchCV starter\nfrom sklearn.model_selection import RandomizedSearchCV\nfrom scipy.stats import uniform\n# Replace with your estimator and data\nparam_dist = ${JSON.stringify(grid, null, 2)}\n# estimator = ...\n# rand = RandomizedSearchCV(estimator, param_distributions=param_dist, n_iter=50, scoring='${exp.metric}', cv=3)\n# rand.fit(X_train, y_train)\n`}
    if (kind === 'optuna'){
        const metric = String(exp.metric || '').toLowerCase()
        const direction = /rmse|mse|mae|error/.test(metric) ? 'minimize' : 'maximize'
        return `# Optuna starter\nimport optuna\n# Define objective that returns validation metric\ndef objective(trial):\n    # Replace with model creation and data\n    # Suggest hyperparameters:\n${exp.params.map(p=>{
        if (p.type.kind==='continuous') return `    ${p.name} = trial.suggest_float('${p.name}', ${(p.type as any).min}, ${(p.type as any).max}, log=${(p.type as any).scale==='log'})`
        if (p.type.kind==='integer') return `    ${p.name} = trial.suggest_int('${p.name}', ${(p.type as any).min}, ${(p.type as any).max})`
        return `    ${p.name} = trial.suggest_categorical('${p.name}', ${(p.type as any).values})`
      }).join('\n')}
    # Train and return validation metric\n    return 0.0  # Replace with actual metric
      study = optuna.create_study(direction='${direction}')\nstudy.optimize(objective, n_trials=50)\n`}
    if (kind === 'halving'){
      return `# Successive Halving example using sklearn\nfrom sklearn.experimental import enable_halving_search_cv\nfrom sklearn.model_selection import HalvingGridSearchCV\nparam_grid = ${JSON.stringify(grid, null, 2)}\n# estimator = ...\n# search = HalvingGridSearchCV(estimator, param_grid, cv=3, factor=3)\n# search.fit(X_train, y_train)\n`}
    if (kind === 'optuna_prune'){
        const metric = String(exp.metric || '').toLowerCase()
        const direction = /rmse|mse|mae|error/.test(metric) ? 'minimize' : 'maximize'
        return `# Optuna with pruning example\nimport optuna\nfrom optuna.pruners import SuccessiveHalvingPruner\npruner = SuccessiveHalvingPruner()\nstudy = optuna.create_study(pruner=pruner, direction='${direction}')\n# Define objective with intermediate reporting to enable pruning\ndef objective(trial):\n    # report intermediate values with trial.report(value, step) and raise TrialPruned when appropriate\    return 0.0\nstudy.optimize(objective, n_trials=50)\n`}
    return ''
  }

  const sampleGrid = JSON.stringify(genParamMapping().grid, null, 2)

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">Generate Starter Code</h3>
      <div className="mt-3">
        <div className="text-sm text-slate-400">Parameter skeleton generated from your search space:</div>
        <pre className="bg-transparent p-3 border border-slate-800 rounded text-sm mt-2">{sampleGrid}</pre>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('grid'))}>Copy GridSearchCV</button>
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('random'))}>Copy RandomizedSearchCV</button>
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('optuna'))}>Copy Optuna Template</button>
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('optuna_prune'))}>Copy Optuna Multi-Fidelity</button>
        </div>
        <div className="mt-2 text-sm text-slate-400">All templates include editable placeholders and comments.</div>
      </div>
    </div>
  )
}
