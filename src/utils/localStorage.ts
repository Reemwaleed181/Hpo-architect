import { Experiment } from '../lib/hpo-engine'
import { uid } from './uid'

const KEY = 'hpo_architect_projects_v1'

export function loadProjects(): Experiment[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export function saveProjects(projects: Experiment[]) {
  localStorage.setItem(KEY, JSON.stringify(projects))
}

export function newProjectBase(): Experiment {
  return {
    id: uid(),
    name: 'New experiment',
    task: 'classification',
    model: 'random_forest',
    samples: 1000,
    features: 10,
    imbalanced: false,
    timeSeries: false,
    metric: 'Accuracy',
    trialTimeMinutes: 2,
    budgetMinutes: 60,
    workers: 4,
    earlyStopping: false,
    iterative: false,
    reproducibility: 'fixed',
    params: []
  }
}
