import React from 'react'

export default function LearnSection(){
  const cards = [
    {t:'What is a Parameter?', d:'Learned by the model during training.'},
    {t:'What is a Hyperparameter?', d:'Specified outside training; controls model/training behavior.'},
    {t:'What is a Trial?', d:'One evaluation of a specific hyperparameter configuration.'},
    {t:'What is a Search Space?', d:'The set of candidate values/configurations explored during HPO.'},
  ]
  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold">Learn</h3>
      <div className="grid grid-cols-2 gap-3 mt-3">
        {cards.map(c=>(<div key={c.t} className="p-3 border border-slate-800 rounded"><div className="font-medium">{c.t}</div><div className="text-sm text-slate-300 mt-1">{c.d}</div></div>))}
      </div>
    </div>
  )
}
