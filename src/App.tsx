import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import ExperimentDesigner from './components/ExperimentDesigner'
import SearchSpaceBuilder from './components/SearchSpaceBuilder'
import AnalysisPanel from './components/AnalysisPanel'
import Blueprint from './components/Blueprint'
import DecisionTree from './components/DecisionTree'
import Stepper from './components/Stepper'
import HPOReasoningPath from './components/HPOReasoningPath'
import RecommendationHero from './components/RecommendationHero'
import CompareStrategies from './components/CompareStrategies'
import { Experiment, analyzeExperiment } from './lib/hpo-engine'
import { loadProjects, saveProjects, newProjectBase } from './utils/localStorage'

const PRESETS: Experiment[] = [
  { ...newProjectBase(), name: 'Small Random Forest', model: 'random_forest', trialTimeMinutes: 2, budgetMinutes: 60, workers: 4, params: [{ name: 'max_depth', type: { kind: 'categorical', values: ['3', '5', '7'] }, gridPoints: null }, { name: 'criterion', type: { kind: 'categorical', values: ['gini', 'entropy'] }, gridPoints: null }] },
  { ...newProjectBase(), name: 'Expensive XGBoost', model: 'xgboost', trialTimeMinutes: 20, budgetMinutes: 180, workers: 1, params: [{ name: 'learning_rate', type: { kind: 'continuous', min: 0.0001, max: 0.1, scale: 'log' }, gridPoints: null }, { name: 'subsample', type: { kind: 'continuous', min: 0.5, max: 1.0, scale: 'linear' }, gridPoints: null }, { name: 'max_depth', type: { kind: 'categorical', values: ['3', '5', '7', '9'] }, gridPoints: null }] },
  { ...newProjectBase(), name: 'Deep Neural Network', model: 'neural', trialTimeMinutes: 30, budgetMinutes: 300, workers: 4, earlyStopping: true, iterative: true, params: [{ name: 'learning_rate', type: { kind: 'continuous', min: 1e-5, max: 1e-1, scale: 'log' }, gridPoints: null }, { name: 'dropout', type: { kind: 'continuous', min: 0, max: 0.6, scale: 'linear' }, gridPoints: null }, { name: 'batch_size', type: { kind: 'categorical', values: ['16', '32', '64', '128'] }, gridPoints: null }] },
]

export default function App() {
  const [projects, setProjects] = useState<Experiment[]>(() => loadProjects())
  useEffect(() => saveProjects(projects), [projects])

  const [exp, setExp] = useState<Experiment>(() => projects[0] || newProjectBase())
  useEffect(() => { if (!exp.id) setExp(prev => ({ ...prev, id: (new Date()).getTime().toString() })) }, [])

  const [activeStep, setActiveStep] = useState<number>(0)
  const [presentationMode, setPresentationMode] = useState(false)

  function saveProject() {
    const idx = projects.findIndex(p => p.id === exp.id)
    if (idx === -1) setProjects([exp, ...projects].slice(0, 20))
    else { const copy = projects.slice(); copy[idx] = exp; setProjects(copy) }
  }

  function saveAs() { setProjects([{ ...exp, id: (new Date()).getTime().toString(), name: exp.name + ' (copy)' }, ...projects].slice(0, 20)) }

  function del(id?: string) { if (!id) return; if (!confirm('Delete?')) return; setProjects(projects.filter(p => p.id !== id)); if (exp.id === id) setExp(newProjectBase()) }

  function loadPreset(i: number) { setExp(PRESETS[i]); setActiveStep(2) }

  // Compute single analysis once per experiment state
  const analysis = useMemo(() => analyzeExperiment(exp), [exp])
  const methods = analysis.rankedMethods
  const main = analysis.recommendedMethod || { name: '—', suitability: 'Weak Match', whyFits: [], whyNot: [] }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNew={() => { setExp(newProjectBase()); setActiveStep(0) }} />
      <main className="container mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">HPO Architect</h1>
            <div className="text-sm text-slate-400">Rule-based hyperparameter guidance</div>
          </div>
          <div>
            <button className="px-3 py-2 bg-slate-700 rounded" onClick={() => setPresentationMode(p => !p)}>{presentationMode ? 'Exit' : 'Presentation'}</button>
          </div>
        </header>

        <Stepper steps={['Define', 'Search Space', 'Analysis', 'Recommendation', 'Blueprint']} active={activeStep} onSelect={setActiveStep} />

        <section className="mt-6">
          {activeStep === 0 && (
            <div className="max-w-4xl mx-auto">
              <ExperimentDesigner value={exp} onChange={setExp} />
              <div className="mt-4 flex justify-end"><button className="btn" onClick={() => setActiveStep(1)}>Next</button></div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="max-w-4xl mx-auto">
              <SearchSpaceBuilder params={exp.params} onChange={(p) => setExp({ ...exp, params: p })} />
              <div className="mt-4 flex justify-between"><button className="btn" onClick={() => setActiveStep(0)}>Back</button><button className="btn-primary" onClick={() => setActiveStep(2)}>Next</button></div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="max-w-4xl mx-auto">
              <AnalysisPanel exp={exp} analysis={analysis} />
              <div className="mt-4 flex justify-between"><button className="btn" onClick={() => setActiveStep(1)}>Back</button><button className="btn-primary" onClick={() => setActiveStep(3)}>Next</button></div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="max-w-4xl mx-auto">
              <RecommendationHero main={main} />
              <HPOReasoningPath exp={exp} analysis={analysis} />
              <div className="grid md:grid-cols-2 gap-4 mt-4"><CompareStrategies methods={methods} /><DecisionTree exp={exp} analysis={analysis} /></div>
              <div className="mt-4 flex justify-between"><button className="btn" onClick={() => setActiveStep(2)}>Back</button><button className="btn-primary" onClick={() => setActiveStep(4)}>Next</button></div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="max-w-4xl mx-auto">
              <Blueprint exp={exp} analysis={analysis} />
              <div className="mt-4 flex justify-between"><button className="btn" onClick={() => setActiveStep(3)}>Back</button>
                <div className="flex gap-2"><button className="btn-primary" onClick={saveProject}>Save</button><button className="btn" onClick={saveAs}>Save As</button><button className="btn-danger" onClick={() => del(exp.id)}>Delete</button></div>
              </div>
            </div>
          )}
        </section>

        <section className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((p, i) => (
            <div key={i} className="p-4 rounded border bg-slate-900">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-slate-400">{p.model} • {p.trialTimeMinutes}m • {p.workers} workers</div>
              <div className="mt-3"><button className="btn" onClick={() => loadPreset(i)}>Load Scenario</button></div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
