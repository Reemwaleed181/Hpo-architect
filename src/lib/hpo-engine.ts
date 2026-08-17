export type TaskType = 'classification' | 'regression'
export type ModelFamily = 'neural' | 'xgboost' | 'random_forest' | 'svm' | 'linear' | 'other'

export type ParamType =
  | { kind: 'continuous'; min: number; max: number; scale: 'linear' | 'log' }
  | { kind: 'integer'; min: number; max: number; step?: number; scale?: 'linear' | 'log' }
  | { kind: 'discrete'; values: string[] }
  | { kind: 'categorical'; values: string[] }

export type Hyperparam = {
  name: string
  type: ParamType
  conditionalOn?: { name: string; value: string }
  gridPoints?: number | null
}

export type Experiment = {
  id?: string
  name?: string
  task: TaskType
  model: ModelFamily
  samples: number
  features: number
  imbalanced?: boolean
  timeSeries?: boolean
  metric: string
  trialTimeMinutes: number
  budgetMinutes: number
  workers: number
  earlyStopping: boolean
  iterative: boolean
  reproducibility: 'fixed' | 'multiple' | 'none'
  params: Hyperparam[]
}

export function classifyDatasetSize(samples: number) {
  if (samples < 10000) return 'Small'
  if (samples < 1000000) return 'Medium'
  return 'Large'
}

export function calculateGridSize(params: Hyperparam[]) {
  let finite = true
  let total = 1n
  let hasConditional = false
  for (const p of params) {
    if (p.conditionalOn) {
      hasConditional = true
      // mark conditional but continue evaluation to detect other issues
      continue
    }
    if (p.type.kind === 'continuous') {
      if (!p.gridPoints) {
        finite = false
      } else {
        total *= BigInt(Math.max(0, Math.floor(p.gridPoints)))
      }
    } else if (p.type.kind === 'integer') {
      const step = p.type.step || 1
      const count = Math.max(0, Math.floor((p.type.max - p.type.min) / step) + 1)
      total *= BigInt(count)
    } else if (p.type.kind === 'discrete' || p.type.kind === 'categorical') {
      total *= BigInt(p.type.values.length)
    }
    if (total > 10000000000n) return { finite: true, huge: true, size: total, conditional: hasConditional }
  }
  return { finite, huge: false, size: total, conditional: hasConditional }
}

export function humanReadableCount(n: bigint) {
  const num = Number(n)
  if (!isFinite(num) || n > 10000000n) {
    if (n >= 1000000000n) return `${(Number(n) / 1e9).toFixed(1)}B+`
    if (n >= 1000000n) return `${(Number(n) / 1e6).toFixed(1)}M+`
    return `${(Number(n) / 1000000).toFixed(1)}M+`
  }
  return num.toLocaleString()
}

export function calculateGridCost(gridSize: bigint, trialMinutes: number, workers: number) {
  const trials = Number(gridSize)
  const serial = trials * trialMinutes
  const idealParallel = Math.max( trialMinutes * trials / Math.max(1, workers), 0)
  return { trials, serialMinutes: serial, idealParallelMinutes: Math.ceil(idealParallel) }
}

export function estimateAffordableTrials(budgetMinutes: number, trialMinutes: number) {
  if (trialMinutes <= 0) return 0
  return Math.floor(budgetMinutes / trialMinutes)
}

export type Suitability = 'Strong Match' | 'Reasonable Match' | 'Weak Match'

export type MethodAnalysis = {
  name: string
  suitability: Suitability
  whyFits: string[]
  whyNot: string[]
}

export type MethodDetailed = MethodAnalysis & { score: number }

export type DecisionTrace = {
  rule: string
  observation: string
  implication: string
  favors: string[]
}

export type AnalysisResult = {
  recommendedMethod: MethodDetailed | null
  rankedMethods: MethodDetailed[]
  gridInfo: { finite: boolean; huge: boolean; size: bigint; conditional?: boolean; exactGridSizeAvailable?: boolean }
  budgetSummary: ReturnType<typeof budgetSummary>
  validation: ReturnType<typeof recommendValidation>
  diagnostics: string[]
  decisionTrace: DecisionTrace[]
  affordableFullTrials: number
}

function suitabilityFromScore(s:number):Suitability{
  if (s >= 20) return 'Strong Match'
  if (s >= 6) return 'Reasonable Match'
  return 'Weak Match'
}

export function recommendStrategy(exp: Experiment): MethodAnalysis[] {
  // Backwards-compatible wrapper around analyzeExperiment
  const analysis = analyzeExperiment(exp)
  return analysis.rankedMethods.map(m=>({ name:m.name, suitability:m.suitability, whyFits:m.whyFits, whyNot:m.whyNot }))
}

export function analyzeExperiment(exp: Experiment): AnalysisResult {
  const gridInfo = calculateGridSize(exp.params)
  const affordable = estimateAffordableTrials(exp.budgetMinutes, exp.trialTimeMinutes)
  const diagnostics = analyzeSearchSpace(exp.params)
  const validation = recommendValidation(exp)

  const entries: Record<string,{score:number,fit:string[],not:string[]}> = {}
  function add(name:string, score:number, fit?:string, not?:string){
    if (!entries[name]) entries[name] = { score:0, fit:[], not:[] }
    entries[name].score += score
    if (fit) entries[name].fit.push(fit)
    if (not) entries[name].not.push(not)
  }

  const trace: DecisionTrace[] = []

  // Rule: conditional search spaces
  if (gridInfo.conditional) {
    trace.push({ rule:'conditional_search_space', observation:'Search space contains conditional parameters', implication:'Exact exhaustive Grid Search size is not calculated for conditional spaces because only valid conditional configurations should be counted', favors:[] })
    // mark grid as not exact
    add('Grid Search', -20, undefined, 'Conditional parameters prevent exact exhaustive grid calculation')
  }

  // Grid Search
  if (gridInfo.finite) {
    const trials = Number(gridInfo.size > 1_000_000_000n ? 1_000_000_000n : gridInfo.size)
    if (trials === 0) {
      add('Grid Search', -50, undefined, 'Empty finite grid (no candidates)')
      trace.push({ rule:'empty_grid', observation:'No grid candidates', implication:'Grid Search is not applicable', favors:[] })
    } else {
      const ratio = (trials * exp.trialTimeMinutes) / Math.max(1, exp.budgetMinutes)
      if (ratio <= 1) { add('Grid Search', 40, 'Full exhaustive evaluation fits within budget'); trace.push({ rule:'small_grid_fits', observation:`Estimated full grid: ${humanReadableCount(gridInfo.size)}`, implication:'Exhaustive evaluation fits budget', favors:['Grid Search'] }) }
      else if (ratio <= 10) { add('Grid Search', 10, 'Grid may be evaluated with moderate additional compute', 'Grid requires more compute than budget'); trace.push({ rule:'medium_grid', observation:`Estimated full grid: ${humanReadableCount(gridInfo.size)}`, implication:'Grid may be possible with extra compute', favors:['Grid Search'] }) }
      else { add('Grid Search', -30, undefined, `Grid size (${humanReadableCount(gridInfo.size)}) times trial cost likely far exceeds available budget`); trace.push({ rule:'large_grid', observation:`Estimated full grid: ${humanReadableCount(gridInfo.size)}`, implication:'Exhaustive evaluation likely infeasible', favors:[] }) }
    }
  } else {
    add('Grid Search', -20, undefined, 'Continuous dimensions without discretization prevent exact exhaustive grid calculation')
    trace.push({ rule:'continuous_dims', observation:'Continuous dimensions without discretization', implication:'Exact grid size unavailable', favors:[] })
  }

  // Random Search
  if (exp.workers >= 4) add('Random Search', 15, 'High parallelism available')
  if (exp.params.length >= 5) add('Random Search', 10, 'Many parameters; random search scales well')
  if (exp.trialTimeMinutes < 1) add('Random Search', 8, 'Cheap evaluations favor broad random exploration')

  // Bayesian Optimization
  if (exp.trialTimeMinutes >= 5) { add('Bayesian Optimization', 25, 'Individual evaluations are relatively expensive'); trace.push({ rule:'expensive_trials', observation:`One full trial takes ${exp.trialTimeMinutes} minutes`, implication:'Model-based search can be efficient', favors:['Bayesian Optimization'] }) }
  if (exp.params.some(p=> p.type.kind === 'continuous' || p.type.kind === 'integer')) add('Bayesian Optimization', 10, 'Continuous/integer parameters present')
  if (exp.params.length > 20) add('Bayesian Optimization', -15, undefined, 'Very high-dimensional spaces reduce BO effectiveness')
  if (exp.workers >= 16) add('Bayesian Optimization', -5, undefined, 'High parallelism reduces BO sequential advantage')

  // Successive Halving / Hyperband / ASHA
  if (exp.iterative && exp.earlyStopping) {
    add('Successive Halving', 18, 'Iterative training + early stopping available')
    add('Hyperband', 20, 'Early stopping enables multi-fidelity scheduling')
    if (exp.workers > 1) add('ASHA', 18, 'Asynchronous parallel workers fit ASHA')
    trace.push({ rule:'early_stopping_available', observation:'Intermediate metrics and early stopping are available', implication:'Poor trials can be stopped early to save compute', favors:['Hyperband','ASHA','Successive Halving'] })
  } else {
    add('Hyperband', -20, undefined, 'No iterative training or early stopping')
    add('ASHA', -15, undefined, 'ASHA requires early stopping and intermediate metrics')
  }

  // Bayesian + Multi-Fidelity preference
  if ((entries['Bayesian Optimization']?.score || 0) > 15 && exp.iterative && exp.earlyStopping) {
    add('Bayesian + Multi-Fidelity', 25, 'Model-based selection plus pruning available')
    trace.push({ rule:'bayes_multifidelity', observation:'BO score strong and early stopping available', implication:'Consider BO with multi-fidelity/pruning', favors:['Bayesian + Multi-Fidelity'] })
  }

  // BOHB
  if ((entries['Bayesian Optimization']?.score || 0) > 10 && (entries['Hyperband']?.score || 0) > 10) add('BOHB', 15, 'Model-based selection with Hyperband-style allocation is applicable')

  // Build ranked methods
  const ranked: MethodDetailed[] = Object.keys(entries).map(name=>{
    const e = entries[name]
    return { name, score: e.score, suitability: suitabilityFromScore(e.score), whyFits: e.fit, whyNot: e.not }
  }).sort((a,b)=> b.score - a.score || a.name.localeCompare(b.name))

  const recommended = ranked[0] || null

  // Attach exactGridSizeAvailable flag: only when finite and not conditional
  const gridWithExact = { ...gridInfo, exactGridSizeAvailable: !!(gridInfo.finite && !gridInfo.conditional) }

  return {
    recommendedMethod: recommended,
    rankedMethods: ranked,
    gridInfo: gridWithExact,
    budgetSummary: budgetSummary(exp, gridWithExact as any),
    validation,
    diagnostics,
    decisionTrace: trace,
    affordableFullTrials: affordable
  }
}

export function budgetSummary(exp: Experiment, gridInfo:{finite:boolean, huge:boolean, size:bigint}){
  const affordable = estimateAffordableTrials(exp.budgetMinutes, exp.trialTimeMinutes)
  let gridCalc = null as null | {trials:number, serialMinutes:number, idealParallelMinutes:number, budgetRatio:number}
  // Do not compute gridCalc when exact grid size is not available (e.g., conditional search spaces)
  const conditional = (gridInfo as any).conditional === true
  const exactAvailable = (gridInfo as any).exactGridSizeAvailable !== false && !conditional
  if (exactAvailable && gridInfo.finite && gridInfo.size>0n) {
    const trials = Number(gridInfo.size>BigInt(2_000_000_000)? 2_000_000_000: gridInfo.size)
    const serial = trials * exp.trialTimeMinutes
    const idealParallel = Math.ceil(serial / Math.max(1, exp.workers))
    const budgetRatio = serial / Math.max(1, exp.budgetMinutes)
    gridCalc = { trials, serialMinutes: serial, idealParallelMinutes: idealParallel, budgetRatio }
  }
  return { affordableFullTrials: affordable, gridCalc }
}

export function recommendValidation(exp: Experiment) {
  if (exp.timeSeries) return { method: 'TimeSeriesSplit (forward-chaining)', reason: 'Time-series data requires forward-chaining validation' }
  if (exp.task === 'classification' && exp.imbalanced) return { method: 'Stratified K-Fold', reason: 'Imbalanced classification benefits from stratified folds' }
  if (exp.samples < 2000) return { method: 'K-Fold Cross-Validation', reason: 'Small dataset benefits from cross-validation' }
  return { method: 'Hold-out validation (train/validation/test)', reason: 'Large dataset and expensive training often use a hold-out validation set' }
}

export function analyzeSearchSpace(params: Hyperparam[]) {
  const diagnostics: string[] = []
  for (const p of params) {
    if (/learning[_-]?rate|^lr$/i.test(p.name)) {
      if (p.type.kind === 'continuous') {
        // Log-scale validation: log requires strictly positive bounds
        if ((p.type as any).scale === 'log') {
          if (p.type.min <= 0 || p.type.max <= 0) {
            diagnostics.push(`Logarithmic sampling requires strictly positive bounds for parameter ${p.name}`)
          }
        }
        // Suggest logarithmic sampling only when range spans orders of magnitude AND current scale is linear
        if ((p.type as any).scale !== 'log') {
          if (p.type.min > 0 && p.type.max / p.type.min >= 100) diagnostics.push(`Parameter ${p.name}: spans orders of magnitude; consider logarithmic sampling`)
          else diagnostics.push(`Parameter ${p.name}: continuous range; consider scale choice`)
        }
      }
    }
    if (p.type.kind === 'continuous' && !p.gridPoints) {
      diagnostics.push(`Parameter ${p.name}: continuous. Add grid points to estimate full grid size`) 
    }
    if (p.type.kind === 'integer' && p.type.min >= p.type.max) diagnostics.push(`Parameter ${p.name}: invalid integer range (min >= max)`) 
    if (p.type.kind === 'continuous' && p.type.min >= p.type.max) diagnostics.push(`Parameter ${p.name}: invalid continuous range (min >= max)`) 
  }
  return diagnostics
}
