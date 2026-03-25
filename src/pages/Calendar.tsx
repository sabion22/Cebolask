import React, { useState } from 'react';
import { useStore } from '../store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const Calendar: React.FC = () => {
  const { tasks } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const selectedDayTasks = tasks.filter(t => selectedDay && isSameDay(parseISO(t.dueDate), selectedDay));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Calendário</h1>
        <p style={{ color: 'var(--text-muted)' }}>Veja os prazos das suas tarefas.</p>
      </header>

      <div className="calendar-layout" style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        <style>{`
          @media (max-width: 1024px) {
            .calendar-layout { flex-direction: column !important; }
            .calendar-grid-container { order: 2; }
            .selected-day-container { order: 1; position: sticky; top: 80px; z-index: 2; }
            .day-cell { min-height: 60px !important; }
            .day-task-label { display: none !important; }
            .day-task-dot { display: block !important; }
          }
          .day-task-dot { width: 4px; height: 4px; border-radius: 50%; background-color: var(--text-color); display: none; margin: 0 auto; }
        `}</style>
        
        {/* Calendar Grid */}
        <div className="card calendar-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                Anterior
              </button>
              <button className="btn" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </button>
              <button className="btn" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                Próximo
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--border-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', backgroundColor: 'var(--bg-color)' }}>
                {day}
              </div>
            ))}
            
            {/* Empty slots for start of month offset */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} style={{ backgroundColor: 'var(--bg-color)', opacity: 0.5, borderTop: '1px solid var(--border-color)', minHeight: '100px' }} />
            ))}

            {daysInMonth.map((day: Date) => {
              const dayTasks = tasks.filter(t => isSameDay(parseISO(t.dueDate), day));
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              
              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDay(day)}
                  className="day-cell"
                  style={{ 
                    borderTop: '1px solid var(--border-color)',
                    borderLeft: '1px solid var(--border-color)',
                    minHeight: '100px', 
                    padding: '0.5rem', 
                    backgroundColor: isSelected ? 'var(--hover-bg)' : 'var(--bg-color)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    fontWeight: isToday(day) ? 'bold' : 'normal',
                    backgroundColor: isToday(day) ? 'var(--text-color)' : 'transparent',
                    color: isToday(day) ? 'var(--bg-color)' : 'inherit',
                    fontSize: '0.875rem'
                  }}>
                    {format(day, 'd')}
                  </span>
                  
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayTasks.length > 0 && <div className="day-task-dot" />}
                    {dayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="day-task-label" style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.125rem 0.25rem', 
                        backgroundColor: task.status === 'done' ? 'var(--hover-bg)' : 'var(--bg-color)', 
                        border: `1px solid var(--border-color)`,
                        borderRadius: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="day-task-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        + {dayTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day View */}
        <div className="card selected-day-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!selectedDay ? (
               <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Clique em um dia no calendário.</p>
            ) : selectedDayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nenhuma tarefa para este dia.</p>
            ) : (
              selectedDayTasks.map(task => (
                <div key={task.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{task.title}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Prioridade: {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
