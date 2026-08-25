import { Experiment, analyzeExperiment } from '../lib/hpo-engine'

function pyList(values: string[]){
  return `[${values.map(v=>JSON.stringify(v)).join(', ')}]`
}

export default function CodeGenerator({ exp }:{ exp: Experiment }){
  function gridLines(){
    const lines:string[] = []
    for (const p of exp.params){
      if (p.type.kind === 'categorical' || p.type.kind === 'discrete') {
        lines.push(`    '${p.name}': ${pyList(p.type.values)},`)
      } else if (p.type.kind === 'integer') {
        const step = p.type.step || 1
        lines.push(`    '${p.name}': list(range(${p.type.min}, ${p.type.max + step}, ${step})),`)
      } else {
        if (p.gridPoints && p.gridPoints > 0) {
          const fn = p.type.scale === 'log' ? 'np.geomspace' : 'np.linspace'
          lines.push(`    '${p.name}': ${fn}(${p.type.min}, ${p.type.max}, ${Math.floor(p.gridPoints)}).tolist(),`)
        } else {
          lines.push(`    '${p.name}': [...],  # REQUIRED: provide explicit finite candidate values for Grid Search`)
        }
      }
    }
    return lines.join('\n')
  }

  function randomLines(){
    const lines:string[] = []
    for (const p of exp.params){
      if (p.type.kind === 'categorical' || p.type.kind === 'discrete') {
        lines.push(`    '${p.name}': ${pyList(p.type.values)},`)
      } else if (p.type.kind === 'integer') {
        lines.push(`    '${p.name}': randint(${p.type.min}, ${p.type.max + 1}),`)
      } else if (p.type.scale === 'log') {
        lines.push(`    '${p.name}': loguniform(${p.type.min}, ${p.type.max}),`)
      } else {
        lines.push(`    '${p.name}': uniform(loc=${p.type.min}, scale=${p.type.max - p.type.min}),`)
      }
    }
    return lines.join('\n')
  }

  function optunaLines(){
    return exp.params.map(p=>{
      if (p.type.kind==='continuous') return `    ${p.name} = trial.suggest_float('${p.name}', ${p.type.min}, ${p.type.max}, log=${p.type.scale==='log' ? 'True' : 'False'})`
      if (p.type.kind==='integer') return `    ${p.name} = trial.suggest_int('${p.name}', ${p.type.min}, ${p.type.max}, step=${p.type.step || 1})`
      return `    ${p.name} = trial.suggest_categorical('${p.name}', ${pyList(p.type.values)})`
    }).join('\n')
  }

  function metricDirection(){
    const m = String(exp.metric || '').toLowerCase()
    if (m.includes('rmse') || m.includes('mae') || m.includes('log loss') || m.includes('logloss')) return 'minimize'
    return 'maximize'
  }

  function generateTemplate(kind:'grid'|'random'|'optuna'|'halving'|'optuna_prune'){
    if (kind === 'grid'){
      return `# GridSearchCV starter\n# Scientific basis: Feurer & Hutter (2019); Bischl et al. (2023)\nimport numpy as np\nfrom sklearn.model_selection import GridSearchCV\n\nparam_grid = {\n${gridLines()}\n}\n\n# estimator = ...\n# cv_splitter = ...  # choose a validation scheme appropriate to the data\n# search = GridSearchCV(estimator, param_grid, scoring='${exp.metric}', cv=cv_splitter)\n# search.fit(X_train, y_train)\n`
    }
    if (kind === 'random'){
      return `# RandomizedSearchCV starter\n# Scientific basis: Bergstra & Bengio (2012)\nfrom scipy.stats import uniform, loguniform, randint\nfrom sklearn.model_selection import RandomizedSearchCV\n\nparam_dist = {\n${randomLines()}\n}\n\n# estimator = ...\n# cv_splitter = ...\n# n_iter = ...  # derive from your declared compute budget; no arbitrary default is imposed\n# search = RandomizedSearchCV(estimator, param_distributions=param_dist, n_iter=n_iter, scoring='${exp.metric}', cv=cv_splitter)\n# search.fit(X_train, y_train)\n`
    }
    if (kind === 'optuna'){
      return `# Optuna model-based HPO starter\n# Scientific basis for Bayesian/model-based HPO: Snoek et al. (2012); Shahriari et al. (2016)\nimport optuna\n\ndef objective(trial):\n${optunaLines()}\n    # Build/train your model and return the VALIDATION metric here.\n    raise NotImplementedError('Return the validation metric for this experiment')\n\nstudy = optuna.create_study(direction='${metricDirection()}')\n# n_trials = ...  # derive from your experiment budget / stopping policy\n# study.optimize(objective, n_trials=n_trials)\n`
    }
    if (kind === 'halving'){
      return `# Successive Halving starter\n# Scientific basis: Jamieson & Talwalkar (2016)\nfrom sklearn.experimental import enable_halving_search_cv  # noqa: F401\nfrom sklearn.model_selection import HalvingGridSearchCV\n\nparam_grid = {\n${gridLines()}\n}\n\n# estimator = ...\n# cv_splitter = ...\n# reduction_factor = ...  # choose explicitly for the experiment; no arbitrary default is imposed\n# search = HalvingGridSearchCV(estimator, param_grid, cv=cv_splitter, factor=reduction_factor)\n# search.fit(X_train, y_train)\n`
    }
    if (kind === 'optuna_prune'){
      return `# Multi-fidelity / pruning starter\n# Scientific basis: Jamieson & Talwalkar (2016); Li et al. (2018)\nimport optuna\nfrom optuna.pruners import SuccessiveHalvingPruner\n\npruner = SuccessiveHalvingPruner()\nstudy = optuna.create_study(pruner=pruner, direction='${metricDirection()}')\n\ndef objective(trial):\n${optunaLines()}\n    # During iterative training:\n    # trial.report(validation_value, step)\n    # if trial.should_prune():\n    #     raise optuna.TrialPruned()\n    raise NotImplementedError('Return the validation metric after iterative training')\n\n# n_trials = ...  # derive from your experiment budget / stopping policy\n# study.optimize(objective, n_trials=n_trials)\n`
    }
    return ''
  }

  const analysis = analyzeExperiment(exp)
  const recommended = (analysis.recommendedMethod?.name || '').toLowerCase()
  const primaryTemplate: 'optuna'|'grid' = recommended.includes('bayesian') || recommended.includes('bohb') ? 'optuna' : recommended.includes('grid') ? 'grid' : 'optuna'

  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">Generate Starter Code</h3>
      <div className="mt-1 text-xs text-slate-500">Implementation aid only. The generated templates do not choose scientific thresholds or claim performance.</div>
      <div className="mt-3">
        <div className="text-sm text-slate-400">Templates are generated from the declared search space. User-specific run count, CV splitter, and resource settings remain explicit placeholders.</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className={`${primaryTemplate==='grid' ? 'px-3 py-2 bg-cyan text-navy rounded' : 'px-3 py-2 bg-slate-800 text-slate-300 rounded'}`} onClick={()=>navigator.clipboard.writeText(generateTemplate('grid'))}>Copy GridSearchCV</button>
          <button className="px-3 py-2 bg-slate-800 text-slate-300 rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('random'))}>Copy RandomizedSearchCV</button>
          <button className={`${primaryTemplate==='optuna' ? 'px-3 py-2 bg-cyan text-navy rounded' : 'px-3 py-2 bg-slate-800 text-slate-300 rounded'}`} onClick={()=>navigator.clipboard.writeText(generateTemplate('optuna'))}>Copy Optuna Template</button>
          <button className="px-3 py-2 bg-slate-800 text-slate-300 rounded" onClick={()=>navigator.clipboard.writeText(generateTemplate('optuna_prune'))}>Copy Optuna Multi-Fidelity</button>
          <button className="px-3 py-2 bg-slate-800 text-slate-300 rounded col-span-2" onClick={()=>navigator.clipboard.writeText(generateTemplate('halving'))}>Copy Successive Halving Starter</button>
        </div>
      </div>
    </div>
  )
}
