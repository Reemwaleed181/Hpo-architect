export function downloadAsFile(content: string, filename: string){
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function toYAML(obj: any, indent = 0): string {
  // Simple YAML serializer for basic structures
  if (obj === null) return 'null'
  if (typeof obj === 'string') return obj.includes('\n') ? `|\n${obj.split('\n').map(l=>' '.repeat(indent+2)+l).join('\n')}` : obj
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
  if (Array.isArray(obj)) return obj.map(v=>`${' '.repeat(indent)}- ${toYAML(v, indent+2)}`).join('\n')
  if (typeof obj === 'object') {
    return Object.entries(obj).map(([k,v])=> `${' '.repeat(indent)}${k}: ${typeof v === 'object' ? '\n'+toYAML(v, indent+2) : toYAML(v,0)}`).join('\n')
  }
  return String(obj)
}
