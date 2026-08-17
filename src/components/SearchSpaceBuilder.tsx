import React from 'react'
import { Hyperparam } from '../lib/hpo-engine'

export default function SearchSpaceBuilder({ params, onChange }:{ params: Hyperparam[], onChange:(p:Hyperparam[])=>void }){
  function addParam(){
    onChange([...params, { name: `param_${params.length+1}`, type: { kind: 'categorical', values: ['option1','option2'] }, gridPoints: null }])
  }
  function update(i:number, p:Hyperparam){
    const copy = params.slice(); copy[i]=p; onChange(copy)
  }
  function remove(i:number){ const copy = params.slice(); copy.splice(i,1); onChange(copy) }

  function duplicate(i:number){ const copy = params.slice(); copy.splice(i+1,0,{...params[i], name: params[i].name+'_copy'}); onChange(copy) }

  const nameCounts = params.reduce((acc, p)=>{ acc[p.name]=(acc[p.name]||0)+1; return acc }, {} as Record<string,number>)

  function continuousInvalid(p: Hyperparam){
    return p.type.kind === 'continuous' && ((p.type as any).min >= (p.type as any).max)
  }
  function integerInvalid(p: Hyperparam){
    return p.type.kind === 'integer' && ((p.type as any).min >= (p.type as any).max)
  }

  return (
    <div className="card mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Search Space Builder</h3>
        <div className="text-sm text-slate-400">Dimensions: {params.length}</div>
      </div>
      <div className="mt-3 space-y-3">
        {params.map((p, i)=> (
          <div key={i} className="p-3 border border-slate-800 rounded">
            <div className="flex justify-between">
              <input className="w-1/2 bg-transparent border-b border-slate-700 mb-2 p-1" value={p.name} onChange={e=>update(i,{...p,name:e.target.value})} />
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-slate-700 rounded text-sm" onClick={()=>duplicate(i)}>Duplicate</button>
                <button className="px-2 py-1 bg-slate-700 rounded text-sm" onClick={()=>remove(i)}>Remove</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col">
                Type
                <select value={p.type.kind} onChange={e=>{
                  const kind = e.target.value as any
                  if (kind==='continuous') update(i,{...p, type:{kind:'continuous', min:0.001, max:0.1, scale:'log'}, gridPoints: null})
                  else if (kind==='integer') update(i,{...p, type:{kind:'integer', min:1, max:10, step:1}, gridPoints: null})
                  else if (kind==='discrete') update(i,{...p, type:{kind:'discrete', values:['a','b']}, gridPoints: null})
                  else update(i,{...p, type:{kind:'categorical', values:['a','b']}, gridPoints: null})
                }} className="mt-1 bg-transparent border border-slate-700 p-1 rounded">
                  <option value="continuous">Continuous</option>
                  <option value="integer">Integer</option>
                  <option value="discrete">Discrete</option>
                  <option value="categorical">Categorical</option>
                </select>
              </label>

              <label className="flex flex-col">
                Sampling scale
                <select value={(p.type as any).scale || 'linear'} onChange={e=>{
                  const t = { ...(p.type as any), scale: e.target.value }
                  update(i,{...p, type: t})
                }} className="mt-1 bg-transparent border border-slate-700 p-1 rounded">
                  <option value="linear">Linear</option>
                  <option value="log">Logarithmic</option>
                </select>
              </label>

              <label className="flex flex-col">
                Grid points (optional)
                <input type="number" className="mt-1 bg-transparent border border-slate-700 p-1 rounded" value={p.gridPoints ?? ''} onChange={e=>{ const v = e.target.value? Number(e.target.value): null; update(i,{...p, gridPoints:v}) }} />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              {p.type.kind === 'continuous' && (
                <>
                  <label className="flex flex-col">Min<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" type="number" value={(p.type as any).min} onChange={e=>{ const t = {...(p.type as any), min: Number(e.target.value)}; update(i,{...p, type:t}) }} /></label>
                  <label className="flex flex-col">Max<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" type="number" value={(p.type as any).max} onChange={e=>{ const t = {...(p.type as any), max: Number(e.target.value)}; update(i,{...p, type:t}) }} /></label>
                  <label className="flex flex-col">Conditional (name=value)<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" value={p.conditionalOn? `${p.conditionalOn.name}=${p.conditionalOn.value}`:''} onChange={e=>{ const v = e.target.value; const c = v.includes('=')? {name:v.split('=')[0], value:v.split('=')[1]}: undefined; update(i,{...p, conditionalOn: c as any}) }} /></label>
                </>
              )}

              {p.type.kind === 'integer' && (
                <>
                  <label className="flex flex-col">Min<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" type="number" value={(p.type as any).min} onChange={e=>{ const t = {...(p.type as any), min: Number(e.target.value)}; update(i,{...p, type:t}) }} /></label>
                  <label className="flex flex-col">Max<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" type="number" value={(p.type as any).max} onChange={e=>{ const t = {...(p.type as any), max: Number(e.target.value)}; update(i,{...p, type:t}) }} /></label>
                  <label className="flex flex-col">Step<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" type="number" value={(p.type as any).step ?? 1} onChange={e=>{ const t = {...(p.type as any), step: Number(e.target.value)}; update(i,{...p, type:t}) }} /></label>
                </>
              )}

              {(p.type.kind === 'categorical' || p.type.kind === 'discrete') && (
                <>
                  <label className="flex flex-col col-span-3">Values (comma-separated)<input className="mt-1 bg-transparent border border-slate-700 p-1 rounded" value={(p.type as any).values.join(',')} onChange={e=>{ const vals = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); const t = {...(p.type as any), values: vals}; update(i,{...p, type:t}) }} /></label>
                </>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-400">
              {(nameCounts[p.name] > 1) && (<div className="text-amber-400">Duplicate parameter name detected.</div>)}
              {continuousInvalid(p) && (<div className="text-red-400">Invalid range: min ≥ max</div>)}
              {integerInvalid(p) && (<div className="text-red-400">Invalid range: min ≥ max</div>)}
            </div>
          </div>
        ))}
        <div>
          <button className="px-3 py-2 bg-cyan text-navy rounded" onClick={addParam}>Add Hyperparameter</button>
        </div>
      </div>
    </div>
  )
}
