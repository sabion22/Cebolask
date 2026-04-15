import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ChevronLeft, ChevronRight, X, Users, Building2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  doing: '#3b82f6',
  done: '#22c55e',
};

const Calendar: React.FC = () => {
  const { tasks, users, clients } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAssigneeNames = (task: typeof tasks[0]) => {
    const aids = task.assigneeIds?.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];
    return aids.map(id => users.find(u => u.id === id)?.name || 'Anônimo');
  };

  const getClientName = (id: string | null) => id ? (clients.find(c => c.id === id)?.company || '') : '';

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return tasks.filter(t => isSameDay(parseISO(t.dueDate), selectedDay));
  }, [tasks, selectedDay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Calendário</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Visualize prazos e entregas da equipe.</p>
        </div>
      </header>

      {/* Month Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, textTransform: 'capitalize', margin: 0 }}>
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="btn" onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '6px' }}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn" onClick={() => setCurrentDate(new Date())} style={{ fontSize: '0.8rem' }}>
            Hoje
          </button>
          <button className="btn" onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '6px' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)' }}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minHeight: 0 }}>
          {/* Empty offset cells */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`e-${i}`} style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }} />
          ))}

          {daysInMonth.map((day: Date) => {
            const dayTasks = tasks.filter(t => isSameDay(parseISO(t.dueDate), day));
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  padding: '0.35rem',
                  backgroundColor: isSelected ? 'var(--hover-bg)' : 'transparent',
                  cursor: 'pointer',
                  minHeight: '80px',
                  transition: 'background-color 0.15s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {/* Day Number */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.75rem',
                  fontWeight: isTodayDay ? 700 : 400,
                  backgroundColor: isTodayDay ? 'var(--text-color)' : 'transparent',
                  color: isTodayDay ? 'var(--bg-color)' : 'inherit',
                }}>
                  {format(day, 'd')}
                </span>

                {/* Tasks inside cell */}
                <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} style={{
                      fontSize: '0.6rem', lineHeight: 1.3,
                      padding: '2px 4px', borderRadius: '3px',
                      borderLeft: `2px solid ${STATUS_COLORS[task.status] || '#94a3b8'}`,
                      backgroundColor: `${STATUS_COLORS[task.status] || '#94a3b8'}10`,
                      overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                      wordBreak: 'break-word',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      color: task.status === 'done' ? 'var(--text-muted)' : 'inherit',
                    }}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                      +{dayTasks.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail - Slide-up panel instead of side panel */}
      {selectedDay && (
        <div style={{
          borderTop: '1px solid var(--border-color)',
          padding: '1rem 0 0 0',
          animation: 'fadeIn 0.2s ease',
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
              {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 400 }}>
                {selectedDayTasks.length} tarefa{selectedDayTasks.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <button
              className="btn"
              onClick={() => setSelectedDay(null)}
              style={{ padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>

          {selectedDayTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhuma tarefa para este dia.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
              {selectedDayTasks.map(task => {
                const assigneeNames = getAssigneeNames(task);
                const clientName = getClientName(task.clientId);
                return (
                  <div key={task.id} style={{
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--hover-bg)',
                    borderLeft: `3px solid ${STATUS_COLORS[task.status] || '#94a3b8'}`,
                    display: 'flex', flexDirection: 'column', gap: '0.35rem',
                  }}>
                    <p style={{
                      margin: 0, fontWeight: 500, fontSize: '0.85rem',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      color: task.status === 'done' ? 'var(--text-muted)' : 'inherit',
                      wordBreak: 'break-word',
                    }}>
                      {task.title}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {/* Priority */}
                      <span style={{
                        padding: '1px 6px', borderRadius: '6px', fontWeight: 500,
                        backgroundColor: task.priority === 'high' ? 'rgba(239,68,68,0.1)' : task.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'var(--hover-bg)',
                        color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : 'var(--text-muted)',
                      }}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>

                      {/* Client */}
                      {clientName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Building2 size={10} /> {clientName}
                        </span>
                      )}

                      {/* Assignees */}
                      {assigneeNames.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={10} /> {assigneeNames.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {task.tags.map(tag => (
                          <span key={tag.name} style={{
                            fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px',
                            backgroundColor: tag.color, color: '#fff', fontWeight: 500,
                          }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
