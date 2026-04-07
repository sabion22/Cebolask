import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { 
  format, 
  addDays, 
  subDays, 
  differenceInDays, 
  isSameDay, 
  eachDayOfInterval, 
  subMonths,
  addMonths,
  eachMonthOfInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  endOfMonth,
  getDaysInMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { 
  Search, 
  Plus, 
  X,
  Lock,
  Trash,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import type { Objective } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TimelineProps {
  clientId: string;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const Timeline: React.FC<TimelineProps> = ({ clientId }) => {
  const { 
    objectives, 
    users, 
    createObjective, 
    updateObjective, 
    deleteObjective
  } = useStore();
  const { currentUser } = useAuth();
  
  // VIEW STATES
  const [pxPerUnit, setPxPerUnit] = useState(80); 
  const [viewDate] = useState(startOfDay(new Date()));
  const [isAdding, setIsAdding] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInternal, setShowInternal] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  // INTERACTION STATES
  const [isPanning, setIsPanning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, date?: Date, objective?: Objective } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // TIME WINDOW (1 MONTH BACK, 12 MONTHS FRONT)
  const timeRange = useMemo(() => {
    const start = startOfMonth(subMonths(viewDate, 1));
    const end = endOfMonth(addMonths(viewDate, 12)); 
    return { start, end };
  }, [viewDate]);

  const days = useMemo(() => eachDayOfInterval({ start: timeRange.start, end: timeRange.end }), [timeRange]);
  const months = useMemo(() => eachMonthOfInterval({ start: timeRange.start, end: timeRange.end }), [timeRange]);

  const getPos = useCallback((date: Date | string) => {
    const d = startOfDay(typeof date === 'string' ? parseISO(date) : date);
    const diff = differenceInDays(d, timeRange.start);
    return diff * pxPerUnit;
  }, [timeRange.start, pxPerUnit]);

  const getDateAtX = useCallback((x: number) => {
    const daysFromStart = Math.max(0, Math.round(x / pxPerUnit));
    return addDays(timeRange.start, daysFromStart);
  }, [timeRange.start, pxPerUnit]);

  // STABLE POSITION HASH (Fix flickering)
  const getStablePos = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'top' : 'bottom';
  };

  // DERIVED DATA
  const clientObjectives = useMemo(() => objectives.filter(o => o.clientId === clientId), [objectives, clientId]);
  const internalUser = useMemo(() => {
    const user = users.find(u => u.id === currentUser?.uid);
    return user?.role === 'admin' || user?.role === 'user';
  }, [users, currentUser]);

  const allTags = useMemo(() => {
    const tags = new Map<string, string>();
    clientObjectives.forEach(o => tags.set(o.category.name, o.category.color));
    return Array.from(tags.entries()).map(([name, color]) => ({ name, color }));
  }, [clientObjectives]);

  const filteredObjectives = useMemo(() => {
    return clientObjectives.filter(o => {
      const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVisibility = internalUser ? (showInternal ? true : o.visibility === 'public') : o.visibility === 'public';
      const matchesCategory = filterCategory === 'all' || o.category.name === filterCategory;
      return matchesSearch && matchesVisibility && matchesCategory;
    });
  }, [clientObjectives, searchTerm, showInternal, filterCategory, internalUser]);

  // INITIAL CENTER
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const todayX = getPos(new Date());
        containerRef.current.scrollLeft = todayX - containerRef.current.offsetWidth / 2;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // PANNING (GLOBAL POINTER)
  useEffect(() => {
    if (!isPanning) return;
    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft -= e.movementX;
    };
    const handlePointerUp = () => setIsPanning(false);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isPanning]);

  // SMART ZOOM (CURSOR FOCUSED)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left + container.scrollLeft;
        const dateAtCursor = getDateAtX(cursorX);

        setPxPerUnit(prev => {
          const delta = -e.deltaY;
          const next = prev + (delta * (prev / (e.deltaY > 0 ? 1000 : 400)));
          return Math.min(Math.max(next, 5), 500); 
        });

        // Refine scroll after state update (calculated manually since state is async)
        const nextPxPerUnit = Math.min(Math.max(pxPerUnit + (-e.deltaY * pxPerUnit / 400), 5), 500);
        const nextCursorX = differenceInDays(dateAtCursor, timeRange.start) * nextPxPerUnit;
        container.scrollLeft = nextCursorX - (e.clientX - rect.left);
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [pxPerUnit, getDateAtX, timeRange.start]);

  // FORM FIELDS
  const [formFields, setFormFields] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    category_name: 'Geral',
    category_color: '#3b82f6',
    visibility: 'public' as 'public' | 'internal'
  });

  const handleOpenAdd = (date?: Date) => {
    setFormFields({
      title: '',
      description: '',
      startDate: format(date || new Date(), 'yyyy-MM-dd'),
      endDate: format(date || new Date(), 'yyyy-MM-dd'),
      category_name: 'Geral',
      category_color: '#3b82f6',
      visibility: 'public'
    });
    setEditingObjective(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (obj: Objective) => {
    setFormFields({
      title: obj.title,
      description: obj.description || '',
      startDate: format(parseISO(obj.startDate), 'yyyy-MM-dd'),
      endDate: format(parseISO(obj.endDate), 'yyyy-MM-dd'),
      category_name: obj.category.name,
      category_color: obj.category.color,
      visibility: obj.visibility || 'public'
    });
    setEditingObjective(obj);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    const payload = {
      clientId,
      title: formFields.title || 'Novo Objetivo',
      description: formFields.description,
      startDate: startOfDay(parseISO(formFields.startDate)).toISOString(),
      endDate: startOfDay(parseISO(formFields.endDate)).toISOString(),
      status: editingObjective?.status || 'pending',
      category: { name: formFields.category_name, color: formFields.category_color },
      visibility: formFields.visibility,
      createdBy: currentUser.uid,
      creatorRole: internalUser ? 'user' : 'client'
    };

    if (editingObjective) {
      await updateObjective(editingObjective.id, payload);
    } else {
      await createObjective(payload);
    }
    setIsAdding(false);
    setEditingObjective(null);
  };

  const handleDuplicate = async (obj: Objective) => {
    if (!currentUser) return;
    const { id, createdAt, updatedAt, ...rest } = obj;
    await createObjective({ ...rest });
    setContextMenu(null);
  };

  return (
    <div 
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}
      onClick={() => setContextMenu(null)}
    >
      <style>{`
        .canvas-area { scrollbar-width: none; touch-action: none; overflow: hidden; background-color: var(--bg-color); }
        .canvas-area::-webkit-scrollbar { display: none; }
        .grid-line { pointer-events: none; position: absolute; top: 0; bottom: 0; }
        .context-menu { position: fixed; background: var(--card-bg); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid var(--border-color); z-index: 10000; padding: 6px; min-width: 180px; }
        .menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-color); transition: 0.2s; }
        .menu-item:hover { background: var(--hover-bg); }
        .node-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .node-card:hover { transform: translateY(-4px) scale(1.02); }
        .tag-btn { padding: 8px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; white-space: nowrap; }
      `}</style>

      {/* Header Profissional */}
      <div style={{ padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', borderBottom: '1.5px solid var(--border-color)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#111' }}>Linha do Tempo</h2>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-color)', padding: '3px', borderRadius: '10px' }}>
            <button className="btn" onClick={() => setPxPerUnit(250)} style={{ opacity: pxPerUnit > 180 ? 1 : 0.5, fontSize: '0.7rem', fontWeight: 900 }}>Dias</button>
            <button className="btn" onClick={() => setPxPerUnit(80)} style={{ opacity: pxPerUnit <= 180 && pxPerUnit > 40 ? 1 : 0.5, fontSize: '0.7rem', fontWeight: 900 }}>Semanas</button>
            <button className="btn" onClick={() => setPxPerUnit(15)} style={{ opacity: pxPerUnit <= 40 ? 1 : 0.5, fontSize: '0.7rem', fontWeight: 900 }}>Meses</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8, color: '#333' }} />
            <input className="input" placeholder="Buscar planejamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '34px', width: '220px', height: '38px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500, color: '#000', border: '1.5px solid var(--border-color)' }} />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenAdd()} style={{ height: '38px', borderRadius: '10px', fontWeight: 900, padding: '0 1.2rem' }}><Plus size={18} /> Novo Objetivo</button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div 
        ref={containerRef}
        onPointerDown={e => { if(e.button === 0) setIsPanning(true); }}
        onContextMenu={e => {
          e.preventDefault();
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left + containerRef.current.scrollLeft;
          setContextMenu({ x: e.clientX, y: e.clientY, date: getDateAtX(x) });
        }}
        className="canvas-area"
        style={{ flex: 1, position: 'relative', cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div style={{ width: days.length * pxPerUnit, height: '100%', position: 'relative' }}>
          
          {/* Main Axis */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', backgroundColor: '#000', opacity: 0.15 }} />

          {/* MONTHS GRID (Contrast Boost) */}
          {months.map(m => {
            const startX = getPos(m);
            const daysInMonth = getDaysInMonth(m);
            const monthWidth = daysInMonth * pxPerUnit;

            return (
              <React.Fragment key={m.toISOString()}>
                <div className="grid-line" style={{ left: startX, borderLeft: '3.5px solid #000', opacity: 1.0 }}>
                  <span style={{ position: 'absolute', top: '20px', left: '15px', color: '#000', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>
                    {format(m, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                </div>

                {/* 4 WEEK GRID (Fixed 25%) */}
                {pxPerUnit > 15 && (
                  <>
                    <div className="grid-line" style={{ left: startX + monthWidth * 0.25, borderLeft: '1.5px solid #333', opacity: 0.5 }}>
                       <span style={{ position: 'absolute', top: '50px', left: '10px', color: '#666', fontSize: '10px', fontWeight: 900 }}>S2</span>
                    </div>
                    <div className="grid-line" style={{ left: startX + monthWidth * 0.50, borderLeft: '1.5px solid #333', opacity: 0.5 }}>
                       <span style={{ position: 'absolute', top: '50px', left: '10px', color: '#666', fontSize: '10px', fontWeight: 900 }}>S3</span>
                    </div>
                    <div className="grid-line" style={{ left: startX + monthWidth * 0.75, borderLeft: '1.5px solid #333', opacity: 0.5 }}>
                       <span style={{ position: 'absolute', top: '50px', left: '10px', color: '#666', fontSize: '10px', fontWeight: 900 }}>S4</span>
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* DAYS GRID (Faint) */}
          {pxPerUnit > 120 && days.map(d => (
            <div key={d.toISOString()} className="grid-line" style={{ left: getPos(d), borderLeft: '1px dashed #000', opacity: 0.25 }} />
          ))}

          {/* TODAY LINE */}
          <div style={{ position: 'absolute', left: getPos(new Date()), top: 0, bottom: 0, width: '2.5px', backgroundColor: '#3b82f6', zIndex: 10, boxShadow: '0 0 15px rgba(59,130,246,0.5)' }} />

          {/* OBJECTIVES */}
          {filteredObjectives.map((obj) => {
            const startX = getPos(obj.startDate);
            const stableSide = getStablePos(obj.id);
            const topPos = stableSide === 'top' ? 'calc(50% - 100px)' : 'calc(50% + 60px)';
            const isDone = obj.status === 'done';

            return (
              <div 
                key={obj.id}
                onContextMenu={e => { e.stopPropagation(); e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, objective: obj }); }}
                onClick={() => handleOpenEdit(obj)}
                className="node-card"
                style={{ position: 'absolute', left: startX, top: topPos, transform: 'translateX(-50%)', zIndex: 20, opacity: isDone ? 0.5 : 1 }}
              >
                <div style={{ position: 'absolute', left: '50%', [stableSide === 'top' ? 'top' : 'bottom']: '100%', width: '1.5px', height: '60px', backgroundColor: obj.category.color, opacity: 0.8 }} />
                <div style={{ 
                  padding: '12px 18px', 
                  borderRadius: '16px', 
                  backgroundColor: 'white', 
                  border: `2.5px solid ${obj.category.color}`, 
                  color: '#000', 
                  fontWeight: 900, 
                  fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                  textDecoration: isDone ? 'line-through' : 'none'
                }}>
                  {isDone ? <CheckCircle size={14} color={obj.category.color} /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: obj.category.color }} />}
                  {obj.title}
                  {obj.visibility === 'internal' && <Lock size={12} opacity={0.6} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          {contextMenu.objective ? (
            <>
              <div className="menu-item" onClick={async () => { await updateObjective(contextMenu.objective!.id, { status: contextMenu.objective!.status === 'done' ? 'pending' : 'done' }); setContextMenu(null); }}>
                <CheckCircle size={16} /> {contextMenu.objective!.status === 'done' ? 'Reabrir' : 'Concluir'}
              </div>
              <div className="menu-item" onClick={() => handleDuplicate(contextMenu.objective!)}><Copy size={16} /> Duplicar</div>
              <div className="menu-item" style={{ color: 'var(--danger)' }} onClick={async () => { if(confirm('Excluir objetivo?')) await deleteObjective(contextMenu.objective!.id); setContextMenu(null); }}><Trash size={16} /> Excluir</div>
            </>
          ) : (
            <div className="menu-item" onClick={() => { handleOpenAdd(contextMenu.date); setContextMenu(null); }}><Plus size={16} /> Novo planejamento aqui</div>
          )}
        </div>
      )}

      {/* FULL MODAL (Recovered & Fixed) */}
      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', border: 'none', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', borderRadius: '24px', position: 'relative', backgroundColor: 'var(--card-bg)' }}>
            <button className="btn" onClick={() => setIsAdding(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.5 }}><X size={24} /></button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>{editingObjective ? 'Editar Planejamento' : 'Novo Planejamento'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', marginBottom: '0.75rem', display: 'block' }}>TÍTULO DO OBJETIVO</label>
                <input autoFocus className="input" style={{ height: '54px', fontSize: '1.1rem', fontWeight: 800, border: '2px solid var(--border-color)', borderRadius: '14px' }} value={formFields.title} onChange={e => setFormFields({...formFields, title: e.target.value})} placeholder="Ex: Entrega da Landing Page..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', marginBottom: '0.75rem', display: 'block' }}>DATA ESTIMADA</label>
                  <input type="date" className="input" style={{ height: '54px', borderRadius: '14px' }} value={formFields.startDate} onChange={e => setFormFields({...formFields, startDate: e.target.value, endDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', marginBottom: '0.75rem', display: 'block' }}>VISIBILIDADE</label>
                  <select className="input" style={{ height: '54px', borderRadius: '14px' }} value={formFields.visibility} onChange={e => setFormFields({...formFields, visibility: e.target.value as any})}>
                    <option value="public">Público (Visível para o Cliente)</option>
                    <option value="internal">Interno (Somente equipe DOCA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', marginBottom: '1rem', display: 'block' }}>CATEGORIA / TAG</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.2rem' }}>
                  {allTags.map(tag => (
                    <button key={tag.name} onClick={() => setFormFields({...formFields, category_name: tag.name, category_color: tag.color})} className="tag-btn" style={{ backgroundColor: formFields.category_name === tag.name ? tag.color : '#f1f1f1', color: formFields.category_name === tag.name ? 'white' : '#666' }}>{tag.name}</button>
                  ))}
                  <button onClick={() => { const n = prompt('Nome da nova tag:'); if(n) setFormFields({...formFields, category_name: n}); }} className="tag-btn" style={{ backgroundColor: '#e2e2e2', color: '#000' }}>+ Criar Nova Tag</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setFormFields({...formFields, category_color: c})} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, border: formFields.category_color === c ? '3px solid white' : 'none', boxShadow: formFields.category_color === c ? `0 0 0 2.5px ${c}` : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', marginBottom: '0.75rem', display: 'block' }}>DESCRIÇÃO (NOTAS)</label>
                <textarea className="textarea" style={{ minHeight: '100px', borderRadius: '14px', border: '2px solid var(--border-color)', fontSize: '0.95rem' }} value={formFields.description} onChange={e => setFormFields({...formFields, description: e.target.value})} placeholder="Notas extras sobre este objetivo..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, height: '56px', fontSize: '1.1rem', fontWeight: 900, borderRadius: '16px' }}>{editingObjective ? 'Salvar Edição' : 'Criar Planejamento'}</button>
              {editingObjective && (
                <button className="btn" onClick={async () => { if(confirm('Excluir objetivo?')) await deleteObjective(editingObjective.id); setIsAdding(false); }} style={{ width: '56px', height: '56px', color: 'var(--danger)', borderRadius: '16px' }}><Trash size={20} /></button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
