export default function Navbar({ onNew, onPresent }:{onNew?:()=>void, onPresent?:()=>void}){
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-cyan flex items-center justify-center font-bold text-navy">HA</div>
        <div>
          <div className="text-lg font-semibold">HPO Architect</div>
          <div className="text-xs text-slate-400">Design the Search Before You Run the Search</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-1 bg-accent text-navy rounded-md text-sm" onClick={onNew}>Design My HPO Experiment</button>
        <button className="px-3 py-1 bg-slate-800 text-slate-200 rounded-md text-sm" onClick={onPresent}>Presentation</button>
      </div>
    </div>
  )
}
