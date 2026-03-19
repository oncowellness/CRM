import { useState, useMemo } from 'react'
import { Plus, Pencil, Check, X, Package } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { cn, inputCls as iCls } from '../../lib/utils'
import { PHASE_LABELS, TYPE_COLORS, type Phase, type Bundle, type ProgramType } from '../../types'

const PHASES = Object.keys(PHASE_LABELS) as Phase[]

const PHASE_COLORS: Record<Phase, string> = {
  F1: 'bg-blue-100 text-blue-700',
  F2: 'bg-cyan-100 text-cyan-700',
  F3: 'bg-orange-100 text-orange-700',
  F4: 'bg-red-100 text-red-700',
  F5: 'bg-purple-100 text-purple-700',
  F6: 'bg-green-100 text-green-700',
  F7: 'bg-teal-100 text-teal-700',
  F8: 'bg-slate-100 text-slate-600',
}

const emptyBundle: Bundle = { code: '', name: '', phase: 'F1', description: '', programs: [] }

function ProgramCheckboxList({
  allPrograms, selected, onChange,
}: {
  allPrograms: { code: string; type: ProgramType; name: string }[]
  selected: string[]
  onChange: (codes: string[]) => void
}) {
  function toggle(code: string) {
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code])
  }
  return (
    <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
      {allPrograms.map(p => (
        <label key={p.code}
          className={cn(
            'flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg cursor-pointer border transition-colors',
            selected.includes(p.code) ? 'bg-teal-50 border-teal-300 text-teal-800' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
          )}>
          <input type="checkbox" className="accent-teal-600"
            checked={selected.includes(p.code)} onChange={() => toggle(p.code)} />
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', TYPE_COLORS[p.type])}>{p.code}</span>
          <span className="truncate">{p.name}</span>
        </label>
      ))}
    </div>
  )
}

export function ConfigBundles() {
  const { bundles, programs, addBundle, updateBundle } = useStore()
  const programByCode = useMemo(
    () => Object.fromEntries(programs.map(p => [p.code, p])),
    [programs]
  )
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [draft, setDraft] = useState<Bundle>({ ...emptyBundle })
  const [showNew, setShowNew] = useState(false)
  const [newB, setNewB] = useState<Bundle>({ ...emptyBundle })

  function startEdit(b: Bundle) {
    setDraft({ ...b })
    setEditingCode(b.code)
  }

  function saveEdit() {
    if (editingCode) {
      updateBundle(editingCode, draft)
      setEditingCode(null)
    }
  }

  function handleAdd() {
    if (!newB.code.trim() || !newB.name.trim()) return
    addBundle({
      code: newB.code.trim().toUpperCase(),
      name: newB.name.trim(),
      phase: newB.phase,
      description: newB.description.trim(),
      programs: newB.programs,
    })
    setNewB({ ...emptyBundle })
    setShowNew(false)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-teal-600" />
          <h1 className="text-lg font-bold text-slate-800">Packs</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{bundles.length} packs</span>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 shadow-sm"
        >
          <Plus size={15} /> Nuevo Pack
        </button>
      </div>

      {/* New bundle form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-teal-700 mb-4">Nuevo Pack</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Código *</label>
              <input className={iCls} placeholder="Ej. PC-06" value={newB.code}
                onChange={e => setNewB(b => ({ ...b, code: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Fase *</label>
              <select className={iCls} value={newB.phase}
                onChange={e => setNewB(b => ({ ...b, phase: e.target.value as Phase }))}>
                {PHASES.map(f => <option key={f} value={f}>{f} – {PHASE_LABELS[f]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-1">Nombre *</label>
              <input className={iCls} placeholder="Nombre del pack" value={newB.name}
                onChange={e => setNewB(b => ({ ...b, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-1">Descripción</label>
              <input className={iCls} placeholder="Descripción del pack" value={newB.description}
                onChange={e => setNewB(b => ({ ...b, description: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-2">Programas incluidos</label>
              <ProgramCheckboxList allPrograms={programs} selected={newB.programs}
                onChange={codes => setNewB(b => ({ ...b, programs: codes }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowNew(false)}
              className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <X size={14} /> Cancelar
            </button>
            <button onClick={handleAdd} disabled={!newB.code.trim() || !newB.name.trim()}
              className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check size={14} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Bundle cards */}
      <div className="space-y-4">
        {bundles.map(b => (
          editingCode === b.code ? (
            <div key={b.code} className="bg-teal-50 rounded-xl border border-teal-200 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 col-span-2">
                  <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{b.code}</span>
                  <span className="text-xs text-slate-400">editando</span>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Nombre</label>
                  <input className={iCls} value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Fase</label>
                  <select className={iCls} value={draft.phase}
                    onChange={e => setDraft(d => ({ ...d, phase: e.target.value as Phase }))}>
                    {PHASES.map(f => <option key={f} value={f}>{f} – {PHASE_LABELS[f]}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-medium block mb-1">Descripción</label>
                  <input className={iCls} value={draft.description}
                    onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-medium block mb-2">Programas incluidos</label>
                  <ProgramCheckboxList allPrograms={programs} selected={draft.programs}
                    onChange={codes => setDraft(d => ({ ...d, programs: codes }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingCode(null)}
                  className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white">
                  <X size={14} /> Cancelar
                </button>
                <button onClick={saveEdit}
                  className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700">
                  <Check size={14} /> Guardar
                </button>
              </div>
            </div>
          ) : (
            <div key={b.code} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{b.code}</span>
                    <span className="text-sm font-semibold text-slate-800">{b.name}</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', PHASE_COLORS[b.phase])}>
                      {b.phase} · {PHASE_LABELS[b.phase]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{b.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.programs.map(code => {
                      const prog = programByCode[code]
                      return (
                        <span key={code}
                          className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                            prog ? TYPE_COLORS[prog.type] : 'bg-slate-100 text-slate-500'
                          )}>
                          {code}
                        </span>
                      )
                    })}
                    {b.programs.length === 0 && (
                      <span className="text-xs text-slate-300 italic">Sin programas asignados</span>
                    )}
                  </div>
                </div>
                <button onClick={() => startEdit(b)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 shrink-0 transition-opacity">
                  <Pencil size={12} /> Editar
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
