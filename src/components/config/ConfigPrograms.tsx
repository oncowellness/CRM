import { useState, useMemo } from 'react'
import { Plus, Pencil, Check, X, Layers } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { cn, inputCls as iCls } from '../../lib/utils'
import { TYPE_COLORS, type Program, type ProgramType } from '../../types'

const TYPE_LABELS: Record<ProgramType, string> = {
  FX: 'Fisioterapia',
  PS: 'Psico-oncología',
  NU: 'Nutrición',
  EO: 'Estética Oncológica',
  TS: 'Trabajo Social',
}

const PROGRAM_TYPES: ProgramType[] = ['FX', 'PS', 'NU', 'EO', 'TS']

const emptyProgram: Omit<Program, 'code'> & { code: string } = {
  code: '', type: 'FX', name: '', description: '', sessions: undefined, duration: undefined,
}

function nextCodeForType(programs: Program[], type: ProgramType): string {
  const nums = programs
    .filter(p => p.type === type)
    .map(p => parseInt(p.code.split('-')[1] ?? '0'))
    .filter(n => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${type}-${String(next).padStart(2, '0')}`
}

export function ConfigPrograms() {
  const { programs, addProgram, updateProgram } = useStore()
  const programsByType = useMemo(
    () => Object.fromEntries(PROGRAM_TYPES.map(t => [t, programs.filter(p => p.type === t)])) as Record<ProgramType, Program[]>,
    [programs]
  )
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [draft, setDraft] = useState<Program>({} as Program)
  const [showNew, setShowNew] = useState(false)
  const [newP, setNewP] = useState({ ...emptyProgram, code: nextCodeForType(programs, 'FX') })

  function startEdit(p: Program) {
    setDraft({ ...p })
    setEditingCode(p.code)
  }

  function saveEdit() {
    if (editingCode) {
      updateProgram(editingCode, draft)
      setEditingCode(null)
    }
  }

  function handleAdd() {
    if (!newP.code.trim() || !newP.name.trim()) return
    addProgram({
      code: newP.code.trim().toUpperCase(),
      type: newP.type,
      name: newP.name.trim(),
      description: newP.description.trim(),
      sessions: newP.sessions ? Number(newP.sessions) : undefined,
      duration: newP.duration?.trim() || undefined,
    })
    setNewP({ ...emptyProgram, code: '' })
    setShowNew(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-teal-600" />
          <h1 className="text-lg font-bold text-slate-800">Programas</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{programs.length} programas</span>
        </div>
        <button
          onClick={() => { setNewP({ ...emptyProgram, code: nextCodeForType(programs, 'FX') }); setShowNew(true) }}
          className="flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 shadow-sm"
        >
          <Plus size={15} /> Nuevo Programa
        </button>
      </div>

      {/* New program form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-teal-700 mb-4">Nuevo Programa</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Código *</label>
              <input className={iCls} placeholder="Ej. FX-10" value={newP.code}
                onChange={e => setNewP(n => ({ ...n, code: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Tipo *</label>
              <select className={iCls} value={newP.type}
                onChange={e => {
                  const type = e.target.value as ProgramType
                  setNewP(n => ({ ...n, type, code: nextCodeForType(programs, type) }))
                }}>
                {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t} – {TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-1">Nombre *</label>
              <input className={iCls} placeholder="Nombre del programa" value={newP.name}
                onChange={e => setNewP(n => ({ ...n, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-1">Descripción</label>
              <input className={iCls} placeholder="Descripción breve" value={newP.description}
                onChange={e => setNewP(n => ({ ...n, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Sesiones</label>
              <input type="number" className={iCls} placeholder="Nº sesiones" value={newP.sessions ?? ''}
                onChange={e => setNewP(n => ({ ...n, sessions: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Duración</label>
              <input className={iCls} placeholder="Ej. 8 semanas" value={newP.duration ?? ''}
                onChange={e => setNewP(n => ({ ...n, duration: e.target.value || undefined }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowNew(false)}
              className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <X size={14} /> Cancelar
            </button>
            <button onClick={handleAdd} disabled={!newP.code.trim() || !newP.name.trim()}
              className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check size={14} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Programs grouped by type */}
      {PROGRAM_TYPES.map(type => {
        const items = programsByType[type]
        if (items.length === 0) return null
        return (
          <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[type])}>{type}</span>
              <span className="text-sm font-semibold text-slate-700">{TYPE_LABELS[type]}</span>
              <span className="text-xs text-slate-400 ml-auto">{items.length} programas</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 px-5 py-2 w-24">Código</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2">Nombre</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 hidden lg:table-cell">Descripción</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-20">Sesiones</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-28">Duración</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  editingCode === p.code ? (
                    <tr key={p.code} className="bg-teal-50 border-b border-slate-100">
                      <td className="px-5 py-2">
                        <span className="text-xs font-bold text-slate-600">{p.code}</span>
                      </td>
                      <td className="px-4 py-2">
                        <input className={iCls} value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell">
                        <input className={iCls} value={draft.description}
                          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className={iCls} value={draft.sessions ?? ''}
                          onChange={e => setDraft(d => ({ ...d, sessions: e.target.value ? Number(e.target.value) : undefined }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input className={iCls} value={draft.duration ?? ''}
                          onChange={e => setDraft(d => ({ ...d, duration: e.target.value || undefined }))} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingCode(null)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400">
                            <X size={14} />
                          </button>
                          <button onClick={saveEdit}
                            className="p-1 rounded hover:bg-teal-100 text-teal-600">
                            <Check size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.code} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-slate-500">{p.code}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{p.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 text-center">{p.sessions ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.duration ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(p)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-white transition-opacity">
                          <Pencil size={11} /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
