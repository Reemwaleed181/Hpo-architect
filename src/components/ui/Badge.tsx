import type { ReactNode } from 'react'

export default function Badge({ children, className='' }:{ children: ReactNode, className?:string }){
  return <span className={`inline-block px-2 py-0.5 text-xs rounded-full bg-slate-800 border border-slate-700 ${className}`}>{children}</span>
}
