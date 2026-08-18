import type { ReactNode } from 'react'

export function Button({ children, onClick, variant='neutral', className='' }:{ children: ReactNode, onClick?: ()=>void, variant?: 'neutral'|'primary'|'danger', className?:string }){
  const base = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2'
  const styles = variant==='primary' ? 'bg-cyan text-navy hover:bg-cyan-400 focus:ring-cyan/50' : variant==='danger' ? 'bg-red-700 hover:bg-red-600 text-white focus:ring-red-500' : 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500'
  return <button onClick={onClick} className={`${base} ${styles} ${className}`}>{children}</button>
}

export default Button
