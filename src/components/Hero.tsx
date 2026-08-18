import React from 'react'
import { Button } from './ui/Button'
import Badge from './ui/Badge'

export default function Hero({ onDesign, onExplore }:{ onDesign:()=>void, onExplore:()=>void }){
  return (
    <section className="mb-8 py-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900 rounded-md">
      <div className="container mx-auto px-4">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2"><Badge>RULE-BASED HPO DECISION SUPPORT</Badge></div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3">Design the Search
              <br/>Before You Run the Search.</h1>
            <p className="text-slate-300 mt-4">Plan a hyperparameter optimization experiment using your search space, compute budget, validation requirements, and training constraints.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="primary" onClick={onDesign}>Design My Experiment</Button>
              <Button onClick={onExplore}>Explore Example</Button>
            </div>
            <div className="mt-6 text-sm text-slate-400">HPO Architect recommends search strategies. It does not predict model accuracy or guarantee the optimal configuration.</div>
          </div>
          <div className="hidden md:block w-80">
            <div className="grid gap-3">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-sm">SEARCH SPACE<br/><span className="font-semibold">Compute-aware design</span></div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-sm">BUDGET<br/><span className="font-semibold">Resource feasibility</span></div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md text-sm">STRATEGY<br/><span className="font-semibold">Transparent recommendation</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
