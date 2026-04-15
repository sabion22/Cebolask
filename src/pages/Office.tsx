import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { CONTENT_CONFIG } from '../content';
import type { User } from '../types';
import { X, Briefcase, FileText } from 'lucide-react';
import { formatDistanceToNow, parseISO, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const getAvatarContent = (user: User) => {
  if (user.avatar) {
    return <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>
      {initials}
    </div>
  );
};

const DESK_POSITIONS = [
  { top: 250, left: 250 },
  { top: 250, left: 650 },
  { top: 550, left: 250 },
  { top: 550, left: 650 },
];

const Office: React.FC = () => {
  const { users, tasks, clients } = useStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCabinet, setShowCabinet] = useState(false);

  // Camera States
  const [rotation, setRotation] = useState(45);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const officeUsers = users.slice(0, CONTENT_CONFIG.office.maxUsers);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation(prev => prev + deltaX * 0.5);
    setStartX(e.clientX);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 2.5));
  };

  const focusOnUser = (user: User, index: number) => {
    setSelectedUser(user);
    const pos = DESK_POSITIONS[index] || { top: 400, left: 500 };
    const dx = (pos.left + 50) - 500;
    const dy = (pos.top + 25) - 400;
    const rad = rotation * (Math.PI / 180);
    const screenX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const screenY = (dx * Math.sin(rad) + dy * Math.cos(rad)) * 0.5;
    setOffset({ x: -screenX, y: -screenY });
    setZoom(1.8);
  };

  const isUserOnline = (lastActive?: string) => {
    if (!lastActive) return false; // Se não tem lastActive, assume offline
    const diff = Date.now() - new Date(lastActive).getTime();
    return diff < 300000; // 5 minutos
  };

  // Funções de filtro - usando valores corretos do tipo TaskStatus
  const getUserAssigneeIds = (t: typeof tasks[0]) => t.assigneeIds?.length ? t.assigneeIds : t.assigneeId ? [t.assigneeId] : [];

  const getTasksFazendo = (userId: string) => tasks.filter(t => {
    if (!getUserAssigneeIds(t).includes(userId)) return false;
    return t.status === 'doing';
  });

  const getTasksAFazer = (userId: string) => tasks.filter(t => {
    if (!getUserAssigneeIds(t).includes(userId)) return false;
    return t.status === 'todo';
  });

  const getTasksConcluidasHoje = (userId: string) => tasks.filter(t => {
    if (!getUserAssigneeIds(t).includes(userId)) return false;
    if (t.status !== 'done') return false;

    try {
      const dateToCheck = t.updatedAt || t.createdAt;
      if (!dateToCheck) return true;
      return isDateToday(new Date(dateToCheck));
    } catch (error) {
      return true;
    }
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F7F7F7'
      }}
      onWheel={handleWheel}
    >
      <header style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 50, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{CONTENT_CONFIG.texts.officeTitle}</h1>
          <p style={{ color: '#64748b', fontWeight: 500, margin: '2px 0 0 0', fontSize: '0.8rem' }}>{CONTENT_CONFIG.office.roomName} • {officeUsers.length} Colaboradores</p>
        </div>
      </header>

      {/* PAN E ZOOM WRAPPER */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none',
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: '1000px', height: '800px',
          transform: 'translate(-50%, -50%)',
          perspective: '3000px',
          transformStyle: 'preserve-3d'
        }}>

          <div style={{
            position: 'absolute', inset: 0,
            transform: `rotateX(60deg) rotateZ(${rotation}deg)`,
            transformStyle: 'preserve-3d',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(#eee 2px, transparent 2px), linear-gradient(90deg, #eee 2px, transparent 2px)',
            backgroundSize: '40px 40px',
            boxShadow: '0 0 0 10px #f8f8f8, 0 20px 50px rgba(0,0,0,0.05)',
            borderRadius: '8px'
          }}>

            {/* GAVETEIRO SÓLIDO */}
            <div onClick={(e) => { e.stopPropagation(); setShowCabinet(true); }} style={{ position: 'absolute', top: '80px', right: '80px', width: '60px', height: '40px', transformStyle: 'preserve-3d', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: '#3b82f6', transform: 'translateZ(60px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '60px', height: '60px', backgroundColor: '#2563eb', transformOrigin: 'bottom', transform: 'rotateX(-90deg)', display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px' }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, border: '1px solid rgba(255,255,255,0.4)', borderRadius: '2px', backgroundColor: '#1d4ed8' }} />)}
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '60px', backgroundColor: '#1e3a8a', transformOrigin: 'top', transform: 'rotateX(90deg)' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '40px', backgroundColor: '#1d4ed8', transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '40px', backgroundColor: '#1d4ed8', transformOrigin: 'right', transform: 'rotateY(90deg)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translateZ(90px) rotateZ(${-rotation}deg) rotateX(-60deg)`, backgroundColor: 'rgba(255,255,255,0.95)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, color: '#2563eb', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>CLIENTES</div>
            </div>

            {/* MESAS DOS USUÁRIOS */}
            {officeUsers.map((user, index) => {
              const pos = DESK_POSITIONS[index] || { top: 400, left: 500 };
              const online = isUserOnline(user.lastActive);

              const tasksFazendo = getTasksFazendo(user.id);
              const tasksAFazer = getTasksAFazer(user.id);
              const tasksConcluidasHoje = getTasksConcluidasHoje(user.id);

              const paperCount = Math.min(tasksAFazer.length + tasksFazendo.length, 10);
              const hasTaskFazendo = tasksFazendo.length > 0;
              const coffeeCount = Math.min(tasksConcluidasHoje.length, 15);

              return (
                <div key={user.id} style={{ position: 'absolute', top: pos.top, left: pos.left, width: '100px', height: '50px', transformStyle: 'preserve-3d', flexShrink: 0 }}>

                  {/* TAMPO DA MESA */}
                  <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(30px)', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '2px', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)', transformStyle: 'preserve-3d' }}>

                    {/* ESQUERDA: TASKS (Papéis) - animação para DIREITA (longe do user) */}
                    <div style={{ position: 'absolute', left: '10px', top: '12px', width: '20px', height: '26px', transformStyle: 'preserve-3d' }}>
                      {Array.from({ length: Math.max(paperCount, hasTaskFazendo ? 1 : 0) }).map((_, i) => {
                        const isTopPaper = i === (Math.max(paperCount, hasTaskFazendo ? 1 : 0) - 1);
                        const shouldAnimate = hasTaskFazendo && isTopPaper;

                        return (
                          <div key={`paper-${i}`} style={{ position: 'absolute', transform: `translateZ(${i * 1.5}px)`, transformStyle: 'preserve-3d' }}>
                            <div className={shouldAnimate ? "fly-paper-right-anim" : ""} style={{ width: '20px', height: '26px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '1px', boxShadow: '1px 1px 2px rgba(0,0,0,0.1)', animationDelay: `${i * 0.3}s` }} />
                          </div>
                        )
                      })}
                    </div>

                    {/* DIREITA: CAFÉS (Tasks concluídas hoje) */}
                    <div style={{ position: 'absolute', right: '20px', top: '16px', transformStyle: 'preserve-3d' }}>
                      {Array.from({ length: coffeeCount }).map((_, i) => {
                        const col = i % 5;
                        const stackLevel = Math.floor(i / 5);
                        return (
                          <div key={`coffee-${i}`} style={{
                            position: 'absolute',
                            left: `${col * 8}px`,
                            transform: `translateZ(${stackLevel * 9}px) rotateX(-90deg)`,
                            transformOrigin: 'bottom',
                            width: '6px', height: '8px',
                            backgroundColor: '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '1px 1px 3px 3px',
                            boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                            transformStyle: 'preserve-3d'
                          }}>
                            <div style={{ position: 'absolute', top: '1px', right: '-3px', width: '4px', height: '4px', border: '1px solid #d1d5db', borderRadius: '50%' }} />
                            <div className="coffee-plume" style={{ position: 'absolute', top: '-10px', left: '1px', transform: 'rotateX(90deg)' }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* PÉS DA MESA */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '30px', height: '4px', backgroundColor: '#475569', transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, width: '30px', height: '4px', backgroundColor: '#475569', transformOrigin: 'right', transform: 'rotateY(90deg)' }} />
                  <div style={{ position: 'absolute', left: 0, bottom: 0, width: '30px', height: '4px', backgroundColor: '#475569', transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />
                  <div style={{ position: 'absolute', right: 0, bottom: 0, width: '30px', height: '4px', backgroundColor: '#475569', transformOrigin: 'right', transform: 'rotateY(90deg)' }} />

                  {/* NOME E AVATAR */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translateZ(85px) rotateZ(${-rotation}deg) rotateX(-60deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20 }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#000', fontSize: '11px', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, marginBottom: '8px', border: '1px solid #eee', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {user.name.toUpperCase()}
                    </div>
                    <div onClick={() => focusOnUser(user, index)} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ width: '64px', height: '64px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: online ? '4px solid #22c55e' : '4px solid #CBD5E1', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                        {getAvatarContent(user)}
                      </div>
                      {online && <div className="online-pulse" />}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAINEL LATERAL CLIENTES */}
      {showCabinet && (
        <div className="cabinet-overlay" onClick={() => setShowCabinet(false)}>
          <div className="cabinet-panel" onClick={e => e.stopPropagation()}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Briefcase size={20} color="#3b82f6" /> Gaveteiro de Clientes</h2>
              <button onClick={() => setShowCabinet(false)} className="btn"><X size={20} /></button>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
              {clients.map(client => (
                <div key={client.id} className="client-folder">
                  <FileText size={16} color="#666" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>{client.company}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>ID: {client.id.slice(0, 8)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOCUS SIDEBAR DO USUÁRIO */}
      {selectedUser && (
        <div className="focus-sidebar">
          <button onClick={() => { setSelectedUser(null); setZoom(1); setOffset({ x: 0, y: 0 }); }} className="close-btn"><X size={24} /></button>
          <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 80, height: 80, backgroundColor: '#f9f9f9', borderRadius: '50%', margin: '0 auto 1.5rem', border: '4px solid #f9f9f9', boxShadow: '0 8px 16px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {getAvatarContent(selectedUser)}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedUser.name}</h2>
            <p style={{ fontSize: '0.875rem', color: isUserOnline(selectedUser.lastActive) ? '#22c55e' : '#999', fontWeight: 600 }}>
              {isUserOnline(selectedUser.lastActive) ? '● NO DOCA AGORA' : `Última vez ${formatDistanceToNow(parseISO(selectedUser.lastActive || new Date().toISOString()), { addSuffix: true, locale: ptBR })}`}
            </p>
          </header>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: '1.5rem' }}>Trabalhando Agora</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {getTasksFazendo(selectedUser.id).map(task => (
                <div key={task.id} style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: '#0369a1' }}>{task.title}</p>
                </div>
              ))}
              {getTasksFazendo(selectedUser.id).length === 0 && <p style={{ color: '#999', fontSize: '0.875rem', textAlign: 'center' }}>Nenhuma tarefa em andamento.</p>}
            </div>

            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: '1.5rem' }}>Pendentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getTasksAFazer(selectedUser.id).map(task => (
                <div key={task.id} style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#F9F9F9', border: '1px solid #efefef' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>{task.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .online-pulse { position: absolute; bottom: 0; right: 0; width: 16px; height: 16px; background-color: #22c55e; border: 3px solid #fff; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        
        @keyframes flyPaperOut {
            0% { transform: translateZ(0px) rotateZ(0deg); opacity: 1; }
            30% { transform: translateZ(10px) rotateZ(10deg); }
            50% { transform: translateZ(25px) rotateZ(15deg); opacity: 1; }
            70% { transform: translateZ(35px) rotateZ(20deg) translateX(15px); opacity: 0; }
            100% { transform: translateZ(0px) rotateZ(0deg); opacity: 0; }
        }
        .fly-paper-doing-anim { animation: flyPaperOut 2.5s infinite ease-out; }
        
        @keyframes flyPaperRight {
            0% { transform: translateZ(0px) rotateZ(0deg); opacity: 1; }
            30% { transform: translateZ(10px) rotateZ(-10deg); }
            50% { transform: translateZ(25px) rotateZ(-15deg); opacity: 1; }
            70% { transform: translateZ(35px) rotateZ(-20deg) translateX(-15px); opacity: 0; }
            100% { transform: translateZ(0px) rotateZ(0deg); opacity: 0; }
        }
        .fly-paper-right-anim { animation: flyPaperRight 2.5s infinite ease-out; }

        .coffee-plume {
            width: 4px; height: 10px;
            background: linear-gradient(0deg, rgba(148,163,184,0) 0%, rgba(148,163,184,0.5) 30%, rgba(148,163,184,0) 100%);
            border-radius: 4px;
            animation: coffeeSteam 2.5s infinite;
        }
        @keyframes coffeeSteam { 
            0% { transform: translateY(0) scaleX(1); opacity: 0; } 
            50% { transform: translateY(-8px) scaleX(1.5); opacity: 1; } 
            100% { transform: translateY(-15px) scaleX(2); opacity: 0; } 
        }

        .focus-sidebar { position: absolute; top: 1rem; right: 1rem; bottom: 1rem; width: 340px; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 20px; z-index: 100; display: flex; flex-direction: column; padding: 2.5rem; animation: slideInRight 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); pointer-events: auto; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .close-btn { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; cursor: pointer; color: #999; }
        
        .cabinet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.05); z-index: 1000; display: flex; justify-content: flex-end; }
        .cabinet-panel { width: 400px; height: 100%; background: #fff; box-shadow: -10px 0 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; padding: 2rem; animation: slideInRight 0.3s ease-out; }
        .client-folder { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; background-color: #F9F9F9; border: 1px solid #efefef; cursor: pointer; transition: all 0.2s; }
        .client-folder:hover { background-color: #f0f0f0; transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default Office;