// AETR Deník v1.3 – localStorage (bez přihlášení) + tachograph SVG icons
import { useState, useEffect, useRef } from 'react'

// ─── TACHOGRAPH SVG ICONS (EU Reg. 561/2006) ─────────────────────────────────
function IconDrive({ size=20, color='currentColor' }) {
  // Steering wheel: outer ring + center hub + three spokes
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" fill={color} stroke="none" />
      <line x1="9.5" y1="12" x2="3" y2="12" />
      <line x1="14.5" y1="12" x2="21" y2="12" />
      <line x1="12" y1="14.5" x2="12" y2="21" />
    </svg>
  )
}

function IconWork({ size=20, color='currentColor' }) {
  // Two crossed hammers: diagonal handles with perpendicular heads
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <line x1="4" y1="20" x2="15.5" y2="8.5" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="20" x2="8.5" y2="8.5" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="13" y1="4" x2="20" y2="11" strokeWidth="4" strokeLinecap="butt" />
      <line x1="4" y1="11" x2="11" y2="4" strokeWidth="4" strokeLinecap="butt" />
    </svg>
  )
}

function IconRest({ size=20, color='currentColor' }) {
  // Bed: headboard, mattress, foot leg, pillow
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="3" y2="19" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="21" y1="15" x2="21" y2="19" />
      <path d="M10 15 V11 H19 A2 2 0 0 1 21 13 V15" />
      <rect x="5" y="11" width="3.5" height="2.5" rx="1" fill={color} stroke="none" />
    </svg>
  )
}

function IconPOA({ size=20, color='currentColor' }) {
  // Square with diagonal line (like the image)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="21" x2="21" y2="3" />
    </svg>
  )
}

function IconFuel({ size=20, color='currentColor' }) {
  // Fuel pump: body with display window, hose and nozzle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21 V5 A2 2 0 0 1 6 3 H12 A2 2 0 0 1 14 5 V21" />
      <line x1="2.5" y1="21" x2="15.5" y2="21" />
      <rect x="6.5" y="6" width="5" height="4" rx="0.5" fill={color} stroke="none" />
      <path d="M14 12 H16 A1.5 1.5 0 0 1 17.5 13.5 V17 A1.75 1.75 0 0 0 21 17 V9 L18 6" />
    </svg>
  )
}

// SVG icon component lookup
const TACHO_ICON = {
  drive:     (s,c) => <IconDrive size={s} color={c} />,
  break:     (s,c) => <IconRest size={s} color={c} />,
  rest:      (s,c) => <IconRest size={s} color={c} />,
  available: (s,c) => <IconPOA size={s} color={c} />,
  load:      (s,c) => <IconWork size={s} color={c} />,
  unload:    (s,c) => <IconWork size={s} color={c} />,
  fuel:      (s,c) => <IconFuel size={s} color={c} />,
  other:     (s,c) => <IconWork size={s} color={c} />,
  vehicle:   (s,c) => <IconPOA size={s} color={c} />,
  sick:      (s,c) => <span style={{fontSize:s*0.8, color:c, width:s, textAlign:'center', display:'inline-block', lineHeight:1}}>✕</span>,
  vacation:  (s,c) => <span style={{fontSize:s*0.8, color:c, width:s, textAlign:'center', display:'inline-block', lineHeight:1}}>○</span>,
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACT = {
  drive:    { label: 'Řízení',            color: '#3B82F6', tacho: true  },
  break:    { label: 'Přestávka',         color: '#F59E0B', tacho: true  },
  rest:     { label: 'Odpočinek',         color: '#10B981', tacho: true  },
  available:{ label: 'Dostupnost (POA)',  color: '#64748B', tacho: true  },
  load:     { label: 'Nakládka',          color: '#8B5CF6', tacho: true  },
  unload:   { label: 'Vykládka',          color: '#EC4899', tacho: true  },
  fuel:     { label: 'Tankování',         color: '#F97316', tacho: true  },
  other:    { label: 'Jiná práce',        color: '#6B7280', tacho: true  },
  vehicle:  { label: 'Přepřah',           color: '#A78BFA', tacho: true  },
  sick:     { label: 'Nemoc/NV',          color: '#EF4444', tacho: false },
  vacation: { label: 'Dovolená',          color: '#06B6D4', tacho: false },
}

const DAYS_CS = ['Ne','Po','Út','St','Čt','Pá','So']
const MONTHS_CS = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince']
const LS_KEY = 'aetr_shifts'

function toMin(h, m) { return h * 60 + m }
function fmtDur(mins) {
  if (mins < 0) mins = 0
  return `${Math.floor(mins/60)}h ${mins%60}m`
}
function fmtTime(mins) {
  return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`
}
function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function parseDate(s) {
  const [y,m,d] = s.split('-').map(Number)
  return new Date(y, m-1, d)
}

function loadFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveToLS(shifts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(shifts)) } catch {}
}

function calcShiftMetrics(acts) {
  let drive=0, work=0, rest=0, pause=0, poa=0
  for (const a of acts) {
    const dur = a.end - a.start
    if (a.type === 'drive') { drive += dur; work += dur }
    else if (['load','unload','fuel','other'].includes(a.type)) work += dur
    else if (['available','vehicle'].includes(a.type)) poa += dur
    else if (a.type === 'break') pause += dur
    else if (a.type === 'rest') rest += dur
  }
  return { drive, work, rest, pause, poa }
}

// AETR calculation over last 7 days
function calcAETR(shifts7) {
  let weekDrive = 0, weekWork = 0
  let lastRestDur = 0
  let contDrive = 0, contDriveMax = 0
  let splitBreakParts = []

  for (const shift of shifts7) {
    const acts = (shift.activities || []).sort((a,b) => a.start - b.start)
    for (const a of acts) {
      const dur = a.end - a.start
      if (a.type === 'drive') {
        weekDrive += dur; weekWork += dur; contDrive += dur
        if (contDrive > contDriveMax) contDriveMax = contDrive
        splitBreakParts = []
      } else if (['load','unload','fuel','other','vehicle'].includes(a.type)) {
        weekWork += dur; contDrive = 0
      } else if (a.type === 'break') {
        splitBreakParts.push(dur)
        const total = splitBreakParts.reduce((s,x)=>s+x,0)
        if (dur >= 45 || total >= 45 || (splitBreakParts.length === 2 && splitBreakParts[0] >= 15 && splitBreakParts[1] >= 30)) {
          contDrive = 0; splitBreakParts = []
        }
      } else if (a.type === 'rest') {
        lastRestDur = dur
        contDrive = 0; splitBreakParts = []
      }
    }
  }

  const alerts = []
  if (weekDrive > 56*60) alerts.push({ lvl: 'err', type: 'drive', msg: `Týdenní řízení ${fmtDur(weekDrive)} > 56h` })
  else if (weekDrive > 50*60) alerts.push({ lvl: 'warn', type: 'drive', msg: `Týdenní řízení ${fmtDur(weekDrive)} blíží se 56h` })
  if (contDriveMax > 4.5*60) alerts.push({ lvl: 'err', type: 'drive', msg: `Nepřetržité řízení ${fmtDur(contDriveMax)} > 4,5h` })
  if (lastRestDur < 11*60 && lastRestDur > 0) alerts.push({ lvl: 'warn', type: 'rest', msg: `Denní odpočinek ${fmtDur(lastRestDur)} < 11h` })

  return {
    weekDrive, weekWork, contDriveMax,
    driveLeft: Math.max(0, 56*60 - weekDrive),
    contLeft: Math.max(0, 4.5*60 - contDrive),
    alerts
  }
}

// Styles
const S = {
  app: { minHeight: '100vh', background: '#0F172A', color: '#E2E8F0', fontFamily: 'system-ui,sans-serif' },
  header: { background: '#1E293B', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #334155' },
  logo: { fontSize: 22, fontWeight: 700, color: '#60A5FA' },
  btn: (v='primary') => ({
    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: v==='primary'?'#3B82F6':v==='danger'?'#EF4444':v==='green'?'#10B981':'#334155',
    color: '#fff'
  }),
  input: { background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#E2E8F0', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  card: { background: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  label: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  tag: (color) => ({ background: color+'33', color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }),
}

// ─── ACTIVITY PICKER (custom dropdown – <option> can't render SVG) ──────────
function ActivityPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const cur = ACT[value]
  return (
    <div ref={ref} style={{ position:'relative', minWidth:0 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ ...S.input, padding:'6px 8px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', textAlign:'left' }}>
        {TACHO_ICON[value](16, cur.color)}
        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cur.label}</span>
        <span style={{ color:'#64748B', fontSize:10 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, minWidth:200, zIndex:10,
          background:'#1E293B', border:'1px solid #334155', borderRadius:8, padding:4, boxShadow:'0 8px 24px #00000066' }}>
          {Object.entries(ACT).map(([k,v]) => (
            <button key={k} type="button" onClick={() => { onChange(k); setOpen(false) }}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 8px', border:'none', borderRadius:6,
                background: k===value ? '#3B82F6' : 'transparent', color:'#E2E8F0', fontSize:14, cursor:'pointer', textAlign:'left' }}>
              {TACHO_ICON[k](16, k===value ? '#fff' : v.color)}
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SHIFT MODAL ─────────────────────────────────────────────────────────────
function ShiftModal({ date, shift, onSave, onClose }) {
  const initial = shift?.activities || []
  const [acts, setActs] = useState(initial.map(a => ({...a})))
  const [veh, setVeh] = useState(shift?.vehicle_reg || '')
  const [cycle, setCycle] = useState(shift?.cycle_type || 'normal')
  const [notes, setNotes] = useState(shift?.notes || '')
  const [newType, setNewType] = useState('drive')
  const [newStart, setNewStart] = useState('06:00')
  const [newEnd, setNewEnd] = useState('14:00')

  function addAct() {
    const [sh,sm] = newStart.split(':').map(Number)
    const [eh,em] = newEnd.split(':').map(Number)
    const start = toMin(sh,sm), end = toMin(eh,em)
    if (end <= start) return
    const updated = [...acts, { type: newType, start, end, id: Date.now() }]
      .sort((a,b) => a.start - b.start)
    setActs(updated)
  }
  function removeAct(id) { setActs(acts.filter(a => a.id !== id)) }

  function save() {
    onSave({ date, activities: acts, vehicle_reg: veh, cycle_type: cycle, notes })
  }

  const m = calcShiftMetrics(acts)

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000088', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding: '20px 0' }}>
      <div style={{ background:'#1E293B', borderRadius:16, width:'95%', maxWidth:540, padding:20 }}>
        <div style={{ ...S.row, marginBottom:16, justifyContent:'space-between' }}>
          <div style={{ fontWeight:700, fontSize:16 }}>
            {DAYS_CS[parseDate(date).getDay()]} {parseDate(date).getDate()}. {MONTHS_CS[parseDate(date).getMonth()]}
          </div>
          <button onClick={onClose} style={{ ...S.btn('ghost'), padding:'4px 10px' }}>✕</button>
        </div>

        {/* Vehicle + Cycle */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          <div>
            <div style={S.label}>SPZ vozidla</div>
            <input style={S.input} value={veh} onChange={e=>setVeh(e.target.value)} placeholder="1AB2345" />
          </div>
          <div>
            <div style={S.label}>Cyklus</div>
            <select style={S.input} value={cycle} onChange={e=>setCycle(e.target.value)}>
              <option value="normal">Normální</option>
              <option value="out">OUT (mimo pravidelnost)</option>
              <option value="bus">Autobusový</option>
            </select>
          </div>
        </div>

        {cycle === 'out' && (
          <div style={{ background:'#F59E0B22', border:'1px solid #F59E0B44', borderRadius:8, padding:10, marginBottom:12, fontSize:13, color:'#FCD34D' }}>
            ⚠️ Režim OUT: nelze kombinovat s normálním cyklem. Platí Čl. 12 nařízení 561/2006.
          </div>
        )}

        {/* Metrics */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:16 }}>
          {[
            ['Řízení','drive',m.drive,'#3B82F6'],
            ['Práce','work',m.work,'#8B5CF6'],
            ['Odp.','rest',m.rest,'#10B981'],
            ['Přest.','pause',m.pause,'#F59E0B'],
            ['POA','poa',m.poa,'#64748B']
          ].map(([l,k,v,c])=>(
            <div key={l} style={{ background:'#0F172A', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:3 }}>
                {k==='work' ? <IconWork size={16} color={c}/> : k==='poa' ? <IconPOA size={16} color={c}/> : k==='rest'||k==='pause' ? <IconRest size={16} color={c}/> : <IconDrive size={16} color={c}/>}
              </div>
              <div style={{ fontSize:10, color:'#64748B' }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:700, color:c }}>{fmtDur(v)}</div>
            </div>
          ))}
        </div>

        {/* Activities list */}
        <div style={{ marginBottom:12 }}>
          {acts.map(a => (
            <div key={a.id} style={{ ...S.row, background:'#0F172A', borderRadius:8, padding:'8px 10px', marginBottom:6 }}>
              <span style={{ display:'flex', alignItems:'center' }}>{TACHO_ICON[a.type]?.(20, ACT[a.type]?.color||'#fff')}</span>
              <span style={{ flex:1, fontSize:13 }}>{ACT[a.type]?.label}</span>
              <span style={{ color:'#94A3B8', fontSize:13 }}>{fmtTime(a.start)}–{fmtTime(a.end)}</span>
              <span style={{ color:'#60A5FA', fontSize:12, marginLeft:8 }}>{fmtDur(a.end-a.start)}</span>
              <button onClick={()=>removeAct(a.id)} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:16, marginLeft:6 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Add activity */}
        <div style={{ background:'#0F172A', borderRadius:10, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#94A3B8' }}>Přidat aktivitu</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
            <div style={{ flex:'1 1 100%', minWidth:0 }}><ActivityPicker value={newType} onChange={setNewType} /></div>
            <input style={{ ...S.input, width:90, flex:'1 0 90px' }} type="time" value={newStart} onChange={e=>setNewStart(e.target.value)} />
            <input style={{ ...S.input, width:90, flex:'1 0 90px' }} type="time" value={newEnd} onChange={e=>setNewEnd(e.target.value)} />
            <button onClick={addAct} style={S.btn('primary')}>+</button>
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={S.label}>Poznámky</div>
          <textarea style={{ ...S.input, minHeight:60, resize:'vertical' }} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Trasa, místo odpočinku..." />
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} style={{ ...S.btn('primary'), flex:1 }}>💾 Uložit směnu</button>
          <button onClick={onClose} style={{ ...S.btn('ghost') }}>Zrušit</button>
        </div>
      </div>
    </div>
  )
}

// ─── WEEK VIEW ────────────────────────────────────────────────────────────────
function WeekView({ shifts, weekStart, onDayClick }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div>
      {days.map(d => {
        const ds = dateStr(d)
        const shift = shifts[ds]
        const m = shift ? calcShiftMetrics(shift.activities || []) : null
        const isToday = ds === dateStr(new Date())
        return (
          <div key={ds} onClick={() => onDayClick(ds, shift)}
            style={{ ...S.card, cursor:'pointer', border: isToday ? '1px solid #3B82F6' : '1px solid transparent',
              transition: 'border-color 0.15s' }}>
            <div style={{ ...S.row, marginBottom: m ? 8 : 0 }}>
              <div style={{ fontWeight: isToday?700:500, color: isToday?'#60A5FA':'#E2E8F0' }}>
                {DAYS_CS[d.getDay()]} {d.getDate()}. {MONTHS_CS[d.getMonth()]}
              </div>
              {shift?.vehicle_reg && <span style={S.tag('#8B5CF6')}>{shift.vehicle_reg}</span>}
              {shift?.cycle_type === 'out' && <span style={S.tag('#F59E0B')}>OUT</span>}
              {shift?.cycle_type === 'bus' && <span style={S.tag('#06B6D4')}>BUS</span>}
              <div style={{ marginLeft:'auto', color:'#64748B', fontSize:13, display:'flex', alignItems:'center', gap:4 }}>
                {m ? <><IconDrive size={14} color="#64748B"/> {fmtDur(m.drive)}</> : '—'}
              </div>
            </div>
            {m && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(shift.activities||[]).map((a,i) => (
                  <span key={i} style={{ ...S.tag(ACT[a.type]?.color||'#666'), fontSize:11, display:'flex', alignItems:'center', gap:3 }}>
                    {TACHO_ICON[a.type]?.(13, ACT[a.type]?.color||'#fff')} {fmtDur(a.end-a.start)}
                  </span>
                ))}
              </div>
            )}
            {m && m.drive > 9*60 && (
              <div style={{ color:'#EF4444', fontSize:12, marginTop:4, display:'flex', alignItems:'center', gap:4 }}>⚠️ <IconDrive size={13} color="#EF4444"/> Řízení překračuje 9h</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── AETR DASHBOARD ───────────────────────────────────────────────────────────
function AETRDash({ shifts }) {
  const sorted = Object.entries(shifts).sort((a,b) => a[0].localeCompare(b[0]))
  const last7 = sorted.slice(-7).map(([,s]) => s)
  const aetr = calcAETR(last7)
  const weekPct = Math.min(100, Math.round(aetr.weekDrive / (56*60) * 100))

  return (
    <div style={S.card}>
      <div style={{ fontWeight:700, marginBottom:12 }}>📊 Přehled AETR (posl. 7 dní)</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        {[
          ['Týdenní řízení', fmtDur(aetr.weekDrive), '/ 56h', aetr.weekDrive > 50*60 ? '#EF4444' : '#10B981', IconDrive],
          ['Max. nepřetržité', fmtDur(aetr.contDriveMax), '/ 4,5h', aetr.contDriveMax > 4*60 ? '#F59E0B' : '#10B981', IconDrive],
          ['Zbývá řídit', fmtDur(aetr.driveLeft), 'tento týden', '#60A5FA', IconDrive],
          ['Týdenní práce', fmtDur(aetr.weekWork), 'celkem', '#8B5CF6', IconWork],
        ].map(([l,v,s,c,Icon]) => (
          <div key={l} style={{ background:'#0F172A', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'#64748B', display:'flex', alignItems:'center', gap:4 }}><Icon size={13} color="#64748B"/> {l}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'#475569' }}>{s}</div>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ marginBottom: aetr.alerts.length?12:0 }}>
        <div style={{ ...S.row, justifyContent:'space-between', marginBottom:4 }}>
          <div style={{ fontSize:12, color:'#94A3B8', display:'flex', alignItems:'center', gap:4 }}><IconDrive size={13} color="#94A3B8"/> Týdenní řízení</div>
          <div style={{ fontSize:12, color:'#94A3B8' }}>{weekPct}%</div>
        </div>
        <div style={{ background:'#0F172A', borderRadius:4, height:8, overflow:'hidden' }}>
          <div style={{ width:`${weekPct}%`, height:'100%', background: weekPct>90?'#EF4444':weekPct>75?'#F59E0B':'#10B981', transition:'width 0.4s' }} />
        </div>
      </div>
      {aetr.alerts.map((a,i) => (
        <div key={i} style={{ background: a.lvl==='err'?'#EF444422':'#F59E0B22', border:`1px solid ${a.lvl==='err'?'#EF4444':'#F59E0B'}44`, borderRadius:8, padding:'8px 12px', marginBottom:6, fontSize:13, display:'flex', alignItems:'center', gap:6, color: a.lvl==='err'?'#FCA5A5':'#FCD34D' }}>
          {a.lvl==='err'?'🔴':'🟡'} {TACHO_ICON[a.type]?.(13, a.lvl==='err'?'#FCA5A5':'#FCD34D')} {a.msg}
        </div>
      ))}
    </div>
  )
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
function exportCSV(shifts) {
  const header = 'Datum,Den,SPZ,Cyklus,Řízení(min),Práce(min),Odpočinek(min),Přestávka(min),Aktivity'
  const rows = Object.entries(shifts).sort().map(([date, s]) => {
    const d = parseDate(date)
    const m = calcShiftMetrics(s.activities || [])
    const acts = (s.activities||[]).map(a => `${ACT[a.type]?.label} ${fmtTime(a.start)}-${fmtTime(a.end)}`).join('; ')
    return [date, DAYS_CS[d.getDay()], s.vehicle_reg||'', s.cycle_type||'normal', m.drive, m.work, m.rest, m.pause, `"${acts}"`].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'aetr-denik.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [shifts, setShifts] = useState(() => loadFromLS())
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d
  })
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('week')

  function saveShift(shiftData) {
    const updated = { ...shifts, [shiftData.date]: shiftData }
    setShifts(updated)
    saveToLS(updated)
    setModal(null)
  }

  function deleteShift(date) {
    const updated = { ...shifts }
    delete updated[date]
    setShifts(updated)
    saveToLS(updated)
    setModal(null)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return dateStr(d)
  })

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>🚛 AETR Deník</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={() => exportCSV(shifts)} style={S.btn('green')}>⬇ CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, background:'#1E293B', borderBottom:'1px solid #334155', padding:'0 16px' }}>
        {[['week','📅 Týden'],['aetr','📊 AETR']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'10px 16px', background:'none', border:'none', cursor:'pointer',
            color: tab===k?'#60A5FA':'#64748B', fontWeight:600, fontSize:14,
            borderBottom: tab===k?'2px solid #60A5FA':'2px solid transparent'
          }}>{l}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
        {tab === 'week' && (
          <>
            {/* Week navigation */}
            <div style={{ ...S.row, justifyContent:'space-between', marginBottom:12 }}>
              <button onClick={()=>{ const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }} style={S.btn('ghost')}>‹ Předchozí</button>
              <div style={{ fontWeight:600, fontSize:14 }}>
                {weekStart.getDate()}. {MONTHS_CS[weekStart.getMonth()]} — {weekDays[6] && (() => { const e=parseDate(weekDays[6]); return `${e.getDate()}. ${MONTHS_CS[e.getMonth()]} ${e.getFullYear()}` })()}
              </div>
              <button onClick={()=>{ const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }} style={S.btn('ghost')}>Následující ›</button>
            </div>
            <WeekView
              shifts={shifts}
              weekStart={weekStart}
              onDayClick={(date, shift) => setModal({ date, shift })}
            />
          </>
        )}
        {tab === 'aetr' && <AETRDash shifts={shifts} />}
      </div>

      {/* Modal */}
      {modal && (
        <ShiftModal
          date={modal.date}
          shift={modal.shift}
          onSave={saveShift}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
