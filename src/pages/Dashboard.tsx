import React, { useState } from 'react';
import { useStore } from '../store';
import { CheckCircle2, Clock, AlertCircle, LayoutDashboard, Filter } from 'lucide-react';
import { isToday, isBefore, parseISO, startOfToday } from 'date-fns';
import { APP_CONFIG } from '../constants';

const Dashboard: React.FC = () => {
  const { tasks, users } = useStore();
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Filter tasks based on selected assignee
  const filteredTasks = assigneeFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.assigneeId === assigneeFilter);

  const pendingTasks = filteredTasks.filter(t => t.status !== 'done');
  
  const todayTasks = filteredTasks.filter(t => 
    t.status !== 'done' && isToday(parseISO(t.dueDate))
  );
  
  const overdueTasks = filteredTasks.filter(t => {
    if (t.status === 'done') return false;
    const taskDate = parseISO(t.dueDate);
    const today = startOfToday();
    return isBefore(taskDate, today) && !isToday(taskDate);
  });

  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: 'none', backgroundColor: 'var(--hover-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>{title}</h3>
        <div style={{ color }}>{icon}</div>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{APP_CONFIG.texts.dashboardTitle}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Acompanhamento geral do projeto.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select 
            value={assigneeFilter} 
            onChange={(e) => setAssigneeFilter(e.target.value)}
            style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-color)', outline: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            <option value="all">Todo o time</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          title="Tarefas Pendentes" 
          value={pendingTasks.length} 
          icon={<LayoutDashboard size={20} />} 
          color="var(--text-color)"
        />
        <StatCard 
          title="Para Hoje" 
          value={todayTasks.length} 
          icon={<Clock size={20} />} 
          color="var(--accent-color)"
        />
        <StatCard 
          title="Atrasadas" 
          value={overdueTasks.length} 
          icon={<AlertCircle size={20} />} 
          color="var(--danger)"
        />
        <StatCard 
          title="Concluídas" 
          value={completedTasks.length} 
          icon={<CheckCircle2 size={20} />} 
          color="var(--text-muted)"
        />
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Foco Imediato (Atrasadas & Hoje)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...overdueTasks, ...todayTasks].length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Tudo em dia! Nenhuma urgência.</p>
          ) : (
            [...overdueTasks, ...todayTasks].slice(0, 5).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '1rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--hover-bg)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: overdueTasks.includes(task) ? 'var(--danger)' : 'var(--accent-color)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{task.title}</p>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {overdueTasks.includes(task) ? 'Atrasada' : 'Hoje'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
