import { shortRefs } from './references'

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

export function calculateGridSize(params: Hyperparam[]) {
  let finite = true
  let total = 1n
  let hasConditional = false

  for (const p of params) {
    if (p.conditionalOn) {
      hasConditional = true
      // Conservative handling: a conditional space must count only valid branches,
      // so this generic calculator does not claim an exact Cartesian-product size.
      continue
    }

    if (p.type.kind === 'continuous') {
      if (!p.gridPoints) finite = false
      else total *= BigInt(Math.max(0, Math.floor(p.gridPoints)))
    } else if (p.type.kind === 'integer') {
      const step = p.type.step || 1
      const count = Math.max(0, Math.floor((p.type.max - p.type.min) / step) + 1)
      total *= BigInt(count)
    } else if (p.type.kind === 'discrete' || p.type.kind === 'categorical') {
      total *= BigInt(p.type.values.length)
    }
  }

  return { finite, size: total, conditional: hasConditional }
}

export function humanReadableCount(n: bigint) {
  const num = Number(n)
  if (!isFinite(num) || n > 10_000_000n) {
    if (n >= 1_000_000_000n) return `${(Number(n) / 1e9).toFixed(1)}B+`
    if (n >= 1_000_000n) return `${(Number(n) / 1e6).toFixed(1)}M+`
    return `${(Number(n) / 1e6).toFixed(1)}M+`
  }
  return num.toLocaleString()
}

export function calculateGridCost(gridSize: bigint, trialMinutes: number, workers: number) {
  if (gridSize > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { trials: null as number | null, serialMinutes: null as number | null, idealParallelMinutes: null as number | null }
  }
  const trials = Number(gridSize)
  const serial = trials * trialMinutes
  const idealParallel = Math.max(serial / Math.max(1, workers), 0)
  return { trials, serialMinutes: serial, idealParallelMinutes: Math.ceil(idealParallel) }
}

export function estimateAffordableTrials(budgetMinutes: number, trialMinutes: number) {
  if (trialMinutes <= 0) return 0
  return Math.floor(Math.max(0, budgetMinutes) / trialMinutes)
}

/**
 * Match labels are author-developed qualitative summaries of how closely the
 * entered experiment satisfies literature-supported conditions/prerequisites.
 * They are not probabilities, accuracy estimates, performance scores, or
 * empirically calibrated rankings.
 */
export type Suitability = 'Strong Match' | 'Reasonable Match' | 'Weak Match'

export type MethodAnalysis = {
  name: string
  suitability: Suitability
  whyFits: string[]
  whyNot: string[]
  referenceIds: string[]
}

export type MethodDetailed = MethodAnalysis

export type DecisionTrace = {
  rule: string
  observation: string
  implication: string
  favors: string[]
  referenceIds: string[]
}

export type ValidationAdvice = {
  method: string
  reason: string
  referenceIds: string[]
}

export type AnalysisResult = {
  recommendedMethod: MethodDetailed | null
  rankedMethods: MethodDetailed[]
  gridInfo: { finite: boolean; size: bigint; conditional?: boolean; exactGridSizeAvailable?: boolean }
  budgetSummary: ReturnType<typeof budgetSummary>
  validation: ValidationAdvice
  diagnostics: string[]
  decisionTrace: DecisionTrace[]
  affordableFullTrials: number
  scientificDisclosure: string
}

const METHOD_ORDER = [
  'Grid Search',
  'Random Search',
  'Bayesian Optimization',
  'Successive Halving',
  'Hyperband',
  'ASHA',
  'Bayesian + Multi-Fidelity',
  'BOHB',
]

function createMethod(
  name: string,
  suitability: Suitability,
  whyFits: string[],
  whyNot: string[],
  referenceIds: string[]
): MethodDetailed {
  return { name, suitability, whyFits, whyNot, referenceIds }
}

function rankMethods(methods: MethodDetailed[], primaryName: string | null) {
  const labelOrder: Record<Suitability, number> = { 'Strong Match': 0, 'Reasonable Match': 1, 'Weak Match': 2 }
  return [...methods].sort((a, b) => {
    if (a.name === primaryName && b.name !== primaryName) return -1
    if (b.name === primaryName && a.name !== primaryName) return 1
    return labelOrder[a.suitability] - labelOrder[b.suitability]
      || METHOD_ORDER.indexOf(a.name) - METHOD_ORDER.indexOf(b.name)
  })
}

export function recommendStrategy(exp: Experiment): MethodAnalysis[] {
  return analyzeExperiment(exp).rankedMethods
}

export function analyzeExperiment(exp: Experiment): AnalysisResult {
  const gridInfoBase = calculateGridSize(exp.params)
  const exactGridSizeAvailable = !!(gridInfoBase.finite && !gridInfoBase.conditional)
  const gridInfo = { ...gridInfoBase, exactGridSizeAvailable }
  const affordable = estimateAffordableTrials(exp.budgetMinutes, exp.trialTimeMinutes)
  const diagnostics = analyzeSearchSpace(exp.params)
  const validation = recommendValidation(exp)

  const hasContinuousOrInteger = exp.params.some(p => p.type.kind === 'continuous' || p.type.kind === 'integer')
  const hasParallelism = exp.workers > 1
  const multiFidelityReady = exp.iterative && exp.earlyStopping

  const gridCost = exactGridSizeAvailable && gridInfo.size > 0n
    ? calculateGridCost(gridInfo.size, exp.trialTimeMinutes, exp.workers)
    : null
  const gridFitsBudget = !!(
    gridCost
    && gridCost.serialMinutes !== null
    && gridCost.serialMinutes <= exp.budgetMinutes
  )
  const gridExceedsBudget = !!(
    gridCost
    && gridCost.serialMinutes !== null
    && gridCost.serialMinutes > exp.budgetMinutes
  )

  // Literature-informed primary candidate. The priority is intentionally conservative:
  // a finite grid that demonstrably fits the declared budget can be exhaustively evaluated;
  // otherwise, continuous/integer spaces make model-based sequential search applicable.
  // Early stopping makes resource-aware methods applicable alternatives, but this input model
  // does not establish that low-fidelity/intermediate rankings are reliable enough to claim
  // that a multi-fidelity method should replace Bayesian Optimization as the primary choice.
  // This is decision support, not an empirical claim of universal superiority.
  let primaryName: string
  if (gridFitsBudget) primaryName = 'Grid Search'
  else if (hasContinuousOrInteger) primaryName = 'Bayesian Optimization'
  else if (multiFidelityReady && hasParallelism) primaryName = 'ASHA'
  else if (multiFidelityReady) primaryName = 'Hyperband'
  else primaryName = 'Random Search'

  const methods: MethodDetailed[] = []

  // Grid Search
  if (gridFitsBudget) {
    methods.push(createMethod(
      'Grid Search', 'Strong Match',
      [
        'The search space is finite/discretized, so exhaustive enumeration is defined.',
        'The calculated full-grid compute fits within the declared total compute budget.'
      ],
      ['Exhaustiveness applies only to the user-defined finite grid, not to an underlying continuous domain.'],
      ['feurer2019', 'bischl2023']
    ))
  } else if (exactGridSizeAvailable && gridExceedsBudget) {
    methods.push(createMethod(
      'Grid Search', 'Weak Match',
      ['The search space is finite/discretized, so an exact grid can be calculated.'],
      ['The calculated exhaustive grid requires more total compute than the declared budget.'],
      ['feurer2019', 'bischl2023']
    ))
  } else {
    methods.push(createMethod(
      'Grid Search', 'Weak Match',
      [],
      [gridInfo.conditional
        ? 'Conditional parameters require counting only valid branches before an exact exhaustive grid size can be claimed.'
        : 'Continuous dimensions must be explicitly discretized before an exact exhaustive grid size can be calculated.'],
      ['feurer2019', 'bischl2023']
    ))
  }

  // Random Search — natural model-free baseline.
  methods.push(createMethod(
    'Random Search',
    primaryName === 'Random Search' ? 'Strong Match' : 'Reasonable Match',
    [
      'Random Search is a literature-established model-free baseline that samples configurations without constructing a surrogate model.',
      'It does not require an exhaustive Cartesian product to be feasible.'
    ],
    [
      'Random Search does not use previous trial outcomes to guide subsequent configurations.',
      ...(primaryName === 'Grid Search'
        ? ['A fully enumerated finite grid already fits the declared budget, so exhaustive evaluation is available.']
        : [])
    ],
    ['bergstra2012', 'feurer2019']
  ))

  // Bayesian Optimization
  if (hasContinuousOrInteger) {
    methods.push(createMethod(
      'Bayesian Optimization',
      primaryName === 'Bayesian Optimization' ? 'Strong Match' : 'Reasonable Match',
      [
        'The search space contains continuous and/or integer dimensions that can be handled by model-based sequential optimization.',
        'Bayesian optimization uses observations from previous trials to guide subsequent evaluations instead of exhaustively enumerating a grid.'
      ],
      multiFidelityReady
        ? ['Intermediate metrics and early stopping also make resource-aware multi-fidelity methods applicable.']
        : [],
      ['snoek2012', 'shahriari2016', 'bischl2023']
    ))
  } else {
    methods.push(createMethod(
      'Bayesian Optimization', 'Reasonable Match',
      ['Bayesian optimization can be extended to non-continuous spaces when an appropriate surrogate/representation is used.'],
      ['This tool does not infer or validate a categorical surrogate model for the current search space.'],
      ['bischl2023', 'shahriari2016']
    ))
  }

  // Successive Halving
  methods.push(createMethod(
    'Successive Halving',
    multiFidelityReady ? 'Reasonable Match' : 'Weak Match',
    multiFidelityReady
      ? ['Iterative training and intermediate results allow resources to be increased for promising configurations while weaker ones are stopped.']
      : [],
    multiFidelityReady
      ? []
      : ['Iterative training with informative intermediate results and early stopping is not available in the experiment definition.'],
    ['jamieson2016']
  ))

  // Hyperband
  methods.push(createMethod(
    'Hyperband',
    primaryName === 'Hyperband' ? 'Strong Match' : (multiFidelityReady ? 'Reasonable Match' : 'Weak Match'),
    multiFidelityReady
      ? ['Iterative training and early stopping allow Hyperband to allocate different resource levels across multiple Successive Halving brackets.']
      : [],
    multiFidelityReady
      ? []
      : ['Hyperband relies on meaningful partial-resource evaluations / early stopping, which are not enabled here.'],
    ['li2018', 'jamieson2016']
  ))

  // ASHA
  methods.push(createMethod(
    'ASHA',
    primaryName === 'ASHA' ? 'Strong Match' : (multiFidelityReady && hasParallelism ? 'Reasonable Match' : 'Weak Match'),
    multiFidelityReady && hasParallelism
      ? ['Iterative training and early stopping are available, and more than one worker allows asynchronous scheduling to exploit parallel resources.']
      : [],
    !multiFidelityReady
      ? ['ASHA requires intermediate results and early stopping.']
      : (!hasParallelism ? ['With a single worker, ASHA provides no asynchronous parallel scheduling advantage.'] : []),
    ['li2020', 'jamieson2016']
  ))

  // Generic model-based multi-fidelity category.
  methods.push(createMethod(
    'Bayesian + Multi-Fidelity',
    multiFidelityReady && hasContinuousOrInteger ? 'Reasonable Match' : 'Weak Match',
    multiFidelityReady && hasContinuousOrInteger
      ? ['Both model-based search conditions and multi-fidelity / early-stopping conditions are present.']
      : [],
    multiFidelityReady && hasContinuousOrInteger
      ? []
      : ['This combination requires both a model-based search setting and meaningful lower-fidelity/intermediate evaluations.'],
    ['bischl2023', 'falkner2018']
  ))

  // BOHB
  methods.push(createMethod(
    'BOHB',
    primaryName === 'BOHB' ? 'Strong Match' : (multiFidelityReady && hasContinuousOrInteger ? 'Reasonable Match' : 'Weak Match'),
    multiFidelityReady && hasContinuousOrInteger
      ? ['Model-based configuration selection is applicable and early-stopping/resource-allocation information is also available.']
      : [],
    multiFidelityReady && hasContinuousOrInteger
      ? []
      : ['BOHB combines model-based sampling with Hyperband-style resource allocation; the current experiment does not satisfy both sides of that combination.'],
    ['falkner2018', 'li2018']
  ))

  const ranked = rankMethods(methods, primaryName)
  const recommended = ranked.find(m => m.name === primaryName) || ranked[0] || null

  const trace: DecisionTrace[] = []

  if (gridInfo.conditional) {
    trace.push({
      rule: 'conditional_search_space',
      observation: 'The search space contains conditional parameters.',
      implication: 'Only valid conditional branches should be counted; a naive Cartesian product would not be an exact exhaustive grid.',
      favors: ['Non-exhaustive methods unless the conditional grid is explicitly enumerated'],
      referenceIds: ['feurer2019', 'bischl2023']
    })
  } else if (!gridInfo.finite) {
    trace.push({
      rule: 'continuous_without_discretization',
      observation: 'At least one continuous dimension has no explicit Grid Search discretization.',
      implication: 'An exact exhaustive Grid Search size is not defined until candidate grid points are supplied.',
      favors: ['Random Search', 'Bayesian Optimization'],
      referenceIds: ['feurer2019', 'bischl2023']
    })
  } else if (gridFitsBudget) {
    trace.push({
      rule: 'finite_grid_fits_budget',
      observation: `The finite grid contains ${humanReadableCount(gridInfo.size)} configurations and its calculated total compute fits the declared budget.`,
      implication: 'Exhaustive evaluation of the user-defined finite grid is feasible under the stated compute assumptions.',
      favors: ['Grid Search'],
      referenceIds: ['feurer2019', 'bischl2023']
    })
  } else if (gridExceedsBudget) {
    trace.push({
      rule: 'finite_grid_exceeds_budget',
      observation: `The finite grid contains ${humanReadableCount(gridInfo.size)} configurations, but its calculated total compute exceeds the declared budget.`,
      implication: 'Exhaustive Grid Search is not feasible under the current budget; non-exhaustive search is required unless the budget or grid changes.',
      favors: ['Random Search', ...(hasContinuousOrInteger ? ['Bayesian Optimization'] : [])],
      referenceIds: ['feurer2019', 'bergstra2012', 'bischl2023']
    })
  }

  if (hasContinuousOrInteger) {
    trace.push({
      rule: 'model_based_search_applicable',
      observation: 'The search space contains continuous and/or integer dimensions.',
      implication: 'Model-based sequential HPO can guide later evaluations using information from earlier trials without enumerating every possible value.',
      favors: ['Bayesian Optimization'],
      referenceIds: ['snoek2012', 'shahriari2016', 'bischl2023']
    })
  }

  if (multiFidelityReady) {
    trace.push({
      rule: 'multi_fidelity_ready',
      observation: 'Iterative training, intermediate metrics, and early stopping are available.',
      implication: 'Weak configurations can be stopped before full resource allocation, enabling Successive Halving / Hyperband-style methods.',
      favors: ['Successive Halving', 'Hyperband', ...(hasParallelism ? ['ASHA'] : [])],
      referenceIds: ['jamieson2016', 'li2018', ...(hasParallelism ? ['li2020'] : [])]
    })
  }

  if (multiFidelityReady && hasContinuousOrInteger) {
    trace.push({
      rule: 'model_based_plus_multi_fidelity',
      observation: 'Both model-based search conditions and multi-fidelity early-stopping conditions are present.',
      implication: 'A combined model-based + resource-allocation method such as BOHB is applicable.',
      favors: ['BOHB', 'Bayesian + Multi-Fidelity'],
      referenceIds: ['falkner2018', 'li2018']
    })
  }

  trace.push({
    rule: 'baseline',
    observation: 'Random Search remains available as a model-free baseline.',
    implication: 'The selected recommendation should be compared empirically against a baseline when performance evidence is required.',
    favors: ['Random Search'],
    referenceIds: ['bergstra2012']
  })

  return {
    recommendedMethod: recommended,
    rankedMethods: ranked,
    gridInfo,
    budgetSummary: budgetSummary(exp, gridInfo),
    validation,
    diagnostics,
    decisionTrace: trace,
    affordableFullTrials: affordable,
    scientificDisclosure: 'Literature-informed rule-based decision support. Strong / Reasonable / Weak are author-developed qualitative applicability labels describing how the entered conditions align with literature-supported method requirements; they are not probabilities, accuracy estimates, performance scores, or proof that one method will outperform all alternatives.'
  }
}

export function budgetSummary(exp: Experiment, gridInfo:{finite:boolean, size:bigint, conditional?:boolean, exactGridSizeAvailable?:boolean}){
  const affordable = estimateAffordableTrials(exp.budgetMinutes, exp.trialTimeMinutes)
  let gridCalc = null as null | {trials:number | null, serialMinutes:number | null, idealParallelMinutes:number | null, budgetRatio:number | null}

  const exactAvailable = gridInfo.exactGridSizeAvailable === true && !gridInfo.conditional
  if (exactAvailable && gridInfo.size > 0n) {
    const cost = calculateGridCost(gridInfo.size, exp.trialTimeMinutes, exp.workers)
    const budgetRatio = cost.serialMinutes === null ? null : cost.serialMinutes / Math.max(1, exp.budgetMinutes)
    gridCalc = { ...cost, budgetRatio }
  }
  return { affordableFullTrials: affordable, gridCalc }
}

export function recommendValidation(exp: Experiment): ValidationAdvice {
  if (exp.timeSeries) {
    return {
      method: 'Time-aware ordered validation (e.g., forward-chaining)',
      reason: 'Time-series evaluation must respect temporal dependence/order; ordinary random folds can be inappropriate depending on the data-generating process.',
      referenceIds: ['bergmeir2018', 'cawley2010']
    }
  }

  if (exp.task === 'classification' && exp.imbalanced) {
    return {
      method: 'Stratified validation (cross-validation or hold-out, as appropriate)',
      reason: 'Stratification preserves class proportions across evaluation splits; the number of folds/splits should be chosen for the dataset and compute context rather than by a fixed threshold.',
      referenceIds: ['kohavi1995', 'cawley2010']
    }
  }

  return {
    method: 'Cross-validation or hold-out validation, chosen for the data/compute context',
    reason: 'No fixed sample-count threshold is imposed. Use a validation procedure appropriate to the data and computational budget, and keep final performance estimation separate from HPO selection.',
    referenceIds: ['cawley2010', 'bischl2023']
  }
}

export function analyzeSearchSpace(params: Hyperparam[]) {
  const diagnostics: string[] = []

  for (const p of params) {
    if (p.type.kind === 'continuous') {
      if (p.type.min >= p.type.max) diagnostics.push(`Parameter ${p.name}: invalid continuous range (min >= max)`)
      if (p.type.scale === 'log' && (p.type.min <= 0 || p.type.max <= 0)) {
        diagnostics.push(`Parameter ${p.name}: logarithmic sampling requires strictly positive bounds`)
      }
      if (!p.gridPoints) diagnostics.push(`Parameter ${p.name}: continuous. Add explicit grid points only if you want an exact finite Grid Search calculation`)
    }

    if (p.type.kind === 'integer') {
      if (p.type.min >= p.type.max) diagnostics.push(`Parameter ${p.name}: invalid integer range (min >= max)`)
      if ((p.type.step || 1) <= 0) diagnostics.push(`Parameter ${p.name}: integer step must be positive`)
    }

    if ((p.type.kind === 'categorical' || p.type.kind === 'discrete') && p.type.values.length === 0) {
      diagnostics.push(`Parameter ${p.name}: no candidate values are defined`)
    }
  }

  return diagnostics
}

export function evidenceLabel(referenceIds: string[]) {
  return shortRefs(referenceIds)
}
