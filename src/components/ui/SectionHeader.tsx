import React from 'react'

export default function SectionHeader({ title, subtitle }:{ title:string, subtitle?:string }){
  return (
    <div className="mb-2">
      <div className="text-sm text-slate-400">{subtitle}</div>
      <div className="text-lg font-semibold">{title}</div>
    </div>
  )
}
