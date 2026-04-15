import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  Clock, AlertCircle, Filter,
  Users, Building2, BarChart3, Target, ListTodo, CheckCircle
} from 'lucide-react';
import { isToday, isBefore, parseISO, startOfToday, differenceInDays } from 'date-fns';
import { APP_CONFIG } from '../constants';

const Dashboard: React.FC = () => {
  const { tasks, users, clients } = useStore();

  const [filterClient, setFilterClient] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterClient !== 'all' && t.clientId !== filterClient) return false;
      if (filterAssignee !== 'all') {
        const aids = t.assigneeIds?.length ? t.assigneeIds : t.assigneeId ? [t.assigneeId] : [];
        if (!aids.includes(filterAssignee)) return false;
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterClient, filterAssignee, filterStatus]);

  const sortedTasks = useMemo(() => {
    const sorted = filteredTasks.filter(t => showCompleted || t.status !== 'done');
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredTasks, sortBy, showCompleted]);

  const totalTasks = filteredTasks.length;
  const pendingTasks = filteredTasks.filter(t => t.status !== 'done');
  const todayTasks = sortedTasks.filter(t => t.status !== 'done' && isToday(parseISO(t.dueDate)));
  const doingTasks = sortedTasks.filter(t => t.status === 'doing');
  const overdueTasks = sortedTasks.filter(t => {
    if (t.status === 'done') return false;
    const taskDate = parseISO(t.dueDate);
    return isBefore(taskDate, startOfToday()) && !isToday(taskDate);
  });
  const completedTasks = filteredTasks.filter(t => t.status === 'done');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const completedThisWeek = completedTasks.filter(t => {
    if (!t.finishedAt) return false;
    return differenceInDays(new Date(), parseISO(t.finishedAt)) <= 7;
  });

  const clientStats = useMemo(() => {
    const stats: Record<string, { name: string; total: number; done: number; overdue: number; doing: number; color: string; logo?: string }> = {};
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];
    filteredTasks.forEach((t) => {
      if (!t.clientId) return;
      if (!stats[t.clientId]) {
        const client = clients.find(c => c.id === t.clientId);
        stats[t.clientId] = { 
          name: client?.company || 'Desconhecido', 
          total: 0, done: 0, overdue: 0, doing: 0, 
          color: colors[Object.keys(stats).length % colors.length],
          logo: client?.logo
        };
      }
      stats[t.clientId].total++;
      if (t.status === 'done') stats[t.clientId].done++;
      if (t.status === 'doing') stats[t.clientId].doing++;
      if (t.status !== 'done' && isBefore(parseISO(t.dueDate), startOfToday()) && !isToday(parseISO(t.dueDate))) {
        stats[t.clientId].overdue++;
      }
    });
    return Object.entries(stats).sort(([, a], [, b]) => b.total - a.total).slice(0, 5);
  }, [filteredTasks, clients]);

  const assigneeStats = useMemo(() => {
    const stats: Record<string, { name: string; total: number; done: number; doing: number; avatar?: string }> = {};
    filteredTasks.forEach(t => {
      const aids = t.assigneeIds?.length ? t.assigneeIds : t.assigneeId ? [t.assigneeId] : [];
      aids.forEach(uid => {
        const user = users.find(u => u.id === uid);
        if (!stats[uid]) {
          stats[uid] = { name: user?.name || 'Anônimo', total: 0, done: 0, doing: 0, avatar: user?.avatar };
        }
        stats[uid].total++;
        if (t.status === 'done') stats[uid].done++;
        if (t.status === 'doing') stats[uid].doing++;
      });
    });
    return Object.entries(stats).sort(([, a], [, b]) => b.total - a.total).slice(0, 5);
  }, [filteredTasks, users]);

  const KPICard = ({ title, value, subtitle, icon, accent }: {
    title: string; value: string | number; subtitle?: string; icon: React.ReactNode; accent?: string;
  }) => (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      padding: '1.5rem', 
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '3px', 
        background: accent || 'var(--accent-color)',
        opacity: 0.8
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: 0, color: accent || 'var(--text-color)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', fontWeight: 500 }}>{subtitle}</span>}
    </div>
  );

  const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%', height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
    </div>
  );

  const GlassCard = ({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '1.5rem', 
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-color)' }}>{title}</h2>
          {subtitle && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-color)' }}>{APP_CONFIG.texts.dashboardTitle}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Acompanhe o progresso da sua equipe.</p>
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        padding: '0.875rem 1rem', 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <Filter size={16} color="var(--text-muted)" />
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-color)' }}>
          <option value="all">Todos os Clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-color)' }}>
          <option value="all">Toda a Equipe</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-color)' }}>
          <option value="all">Todos os Status</option>
          <option value="todo">A Fazer</option>
          <option value="doing">Fazendo</option>
          <option value="done">Concluído</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-color)' }} title="Ordenar">
          <option value="dueDate">Prazo</option>
          <option value="priority">Prioridade</option>
          <option value="createdAt">Criação</option>
        </select>
        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          style={{
            padding: '6px 12px', 
            border: 'none', 
            borderRadius: '8px', 
            background: showCompleted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
            fontSize: '0.8rem', 
            cursor: 'pointer', 
            color: showCompleted ? '#22c55e' : 'var(--text-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CheckCircle size={14} /> {showCompleted ? 'Ocultar' : 'Mostrar'} Concluídas
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard title="Pendentes" value={pendingTasks.length} subtitle={`${doingTasks.length} em andamento`} icon={<ListTodo size={20} />} />
        <KPICard title="Hoje" value={todayTasks.length} subtitle={todayTasks.length > 0 ? 'Foco priority' : 'Tudo em dia'} icon={<Clock size={20} />} accent="#3b82f6" />
        <KPICard title="Atrasadas" value={overdueTasks.length} subtitle={overdueTasks.length > 0 ? 'Atenção!' : 'Nenhuma'} icon={<AlertCircle size={20} />} accent={overdueTasks.length > 0 ? '#ef4444' : undefined} />
        <KPICard title="Concluídas" value={`${completionRate}%`} subtitle={`${completedTasks.length} de ${totalTasks}`} icon={<Target size={20} />} accent="#22c55e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <GlassCard title="Foco Imediato" subtitle={`${overdueTasks.length + todayTasks.length} tarefas`} icon={<Clock size={16} />}>
          {[...overdueTasks, ...todayTasks].length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '14px' }}>
              <CheckCircle size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tudo em dia!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...overdueTasks, ...todayTasks].slice(0, 5).map(task => {
                const isOverdue = overdueTasks.includes(task);
                const clientName = task.clientId ? (clients.find(c => c.id === task.clientId)?.company || '') : '';
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.75rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', borderLeft: isOverdue ? '3px solid #ef4444' : '3px solid #3b82f6' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isOverdue ? '#ef4444' : '#3b82f6', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                      {clientName && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{clientName}</span>}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px', borderRadius: '10px', background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: isOverdue ? '#ef4444' : '#3b82f6' }}>
                      {isOverdue ? 'ATRASADA' : 'HOJE'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard title="Por Cliente" subtitle="Progresso" icon={<Building2 size={16} />}>
          {clientStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Nenhuma tarefa.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {clientStats.map(([id, s]) => {
                const rate = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {s.logo ? <img src={s.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={14} color="var(--text-muted)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-color)' }}>{s.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color }}>{rate}%</span>
                      </div>
                      <MiniBar value={s.done} max={s.total} color={s.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard title="Equipe" subtitle="Produtividade" icon={<Users size={16} />}>
          {assigneeStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Nenhuma atribuição.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assigneeStats.map(([id, s]) => {
                const rate = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {s.avatar ? <img src={s.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={14} color="var(--text-muted)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-color)' }}>{s.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6' }}>{rate}%</span>
                      </div>
                      <MiniBar value={s.done} max={s.total} color="#8b5cf6" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem', 
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={16} color="var(--text-color)" /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-color)' }}>Resumo Geral</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.1)', borderLeft: '3px solid #22c55e' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', display: 'block' }}>{completedThisWeek.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>esta semana</span>
          </div>
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', display: 'block' }}>{tasks.filter(t => t.status === 'doing').length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>em andamento</span>
          </div>
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', display: 'block' }}>{clients.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>clientes</span>
          </div>
          <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', borderLeft: '3px solid #8b5cf6' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6', display: 'block' }}>{users.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>membros</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;