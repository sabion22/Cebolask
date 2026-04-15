import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../constants';
import type { Task, TaskStatus } from '../types';
import { useStore } from '../store';
import {
  LayoutList, Columns, Plus, Trash2, Bell, X, Link as LinkIcon, Tag,
  Calendar as CalendarIcon, User, Building2, StickyNote, ChevronDown,
  Search, Users, Clock, CheckCircle2, Circle,
  ArrowUpDown, BarChart3
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const TAG_COLORS = [
  { name: 'Urgente', color: '#ef4444' },
  { name: 'Design', color: '#9b51e0' },
  { name: 'Dev', color: '#2d9cdb' },
  { name: 'Revisão', color: '#f2994a' },
  { name: 'Marketing', color: '#27ae60' },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo:  { label: 'A Fazer',    color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  doing: { label: 'Fazendo',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  done:  { label: 'Concluído',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

const getTaskAssigneeIds = (task: Task): string[] =>
  task.assigneeIds?.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];

const Tasks: React.FC = () => {
  const { tasks, users, clients, toggleTaskStatus, moveTaskStatus, deleteTask, createTask, updateTask, notifyUser } = useStore();
  const { currentUser } = useAuth();

  // Load preferences from localStorage
  const getInitialTab = () => {
    return localStorage.getItem('show_completed_default') === 'true' ? 'completed' : 'pending';
  };
  const getInitialSort = () => {
    return localStorage.getItem('task_sort_by') || 'dueDate';
  };

  // View & Navigation
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(getInitialTab);
  const [sortBy, setSortBy] = useState(getInitialSort);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'client' | 'assignee' | 'status'>('none');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Modal Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedTags, setSelectedTags] = useState<{ name: string; color: string }[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  // Completion Modal
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Expanded notes
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Refs
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Close assignee dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered users for assignee dropdown
  const filteredAssigneeUsers = users.filter(u =>
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === clientId);

  // ─── Filtering ────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTab === 'pending' && t.status === 'done') return false;
      if (activeTab === 'completed' && t.status !== 'done') return false;
      if (filterClient !== 'all' && t.clientId !== filterClient) return false;
      if (filterAssignee !== 'all') {
        const aids = getTaskAssigneeIds(t);
        if (!aids.includes(filterAssignee)) return false;
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, activeTab, filterClient, filterAssignee, filterStatus, searchQuery]);

  // ─── Sorting ───────────────────────────────────────
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          const statusOrder = { doing: 0, todo: 1, done: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredTasks, sortBy]);

  // ─── Grouping ─────────────────────────────────────
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: '', tasks: sortedTasks }];

    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach(task => {
      if (groupBy === 'client') {
        const key = task.clientId || '__none__';
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      } else if (groupBy === 'assignee') {
        const aids = getTaskAssigneeIds(task);
        if (aids.length === 0) {
          if (!groups['__none__']) groups['__none__'] = [];
          groups['__none__'].push(task);
        } else {
          aids.forEach(aid => {
            if (!groups[aid]) groups[aid] = [];
            groups[aid].push(task);
          });
        }
      } else if (groupBy === 'status') {
        if (!groups[task.status]) groups[task.status] = [];
        groups[task.status].push(task);
      }
    });

    return Object.entries(groups).map(([key, tasks]) => {
      let label = key;
      if (groupBy === 'client') {
        label = key === '__none__' ? 'Sem Cliente' : (clients.find(c => c.id === key)?.company || 'Desconhecido');
      } else if (groupBy === 'assignee') {
        label = key === '__none__' ? 'Sem Responsável' : (users.find(u => u.id === key)?.name || 'Desconhecido');
      } else if (groupBy === 'status') {
        label = STATUS_CONFIG[key as TaskStatus]?.label || key;
      }
      return { key, label, tasks };
    });
  }, [filteredTasks, groupBy, clients, users]);

  // ─── Helpers ──────────────────────────────────────
  const getAssigneeName = (id: string) => users.find(u => u.id === id)?.name || 'Anônimo';
  const getClientName = (id: string | null) => id ? (clients.find(c => c.id === id)?.company || '') : '';

  // ─── Completed stats ─────────────────────────────
  const completedTasks = tasks.filter(t => t.status === 'done');
  const completedThisWeek = completedTasks.filter(t => {
    if (!t.finishedAt) return false;
    return differenceInDays(new Date(), parseISO(t.finishedAt)) <= 7;
  });

  // ─── Modal actions ────────────────────────────────
  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setSelectedAssigneeIds(currentUser ? [currentUser.uid] : []);
    setAssigneeSearch('');
    setClientId('');
    setClientSearch('');
    setStatus('todo');
    setPriority('medium');
    setSelectedTags([]);
    setLinks([]);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
    setDueDate(task.dueDate.split('T')[0]);
    setSelectedAssigneeIds(getTaskAssigneeIds(task));
    setAssigneeSearch('');
    setClientId(task.clientId || '');
    setClientSearch('');
    setStatus(task.status);
    setPriority(task.priority);
    setSelectedTags(task.tags || []);
    setLinks(task.links || []);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!clientId) { alert('Por favor, selecione um cliente.'); return; }
    if (selectedAssigneeIds.length === 0) { alert('Selecione ao menos um responsável.'); return; }

    try {
      const taskData = {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        assigneeIds: selectedAssigneeIds,
        assigneeId: selectedAssigneeIds[0] || '',
        clientId,
        status,
        priority,
        tags: selectedTags,
        links,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData as any);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar tarefa: ' + err.message);
    }
  };



  const handleConfirmComplete = async () => {
    if (taskToComplete) {
      await toggleTaskStatus(taskToComplete);
      await updateTask(taskToComplete, {
        completionNotes: completionNotes || undefined,
        finishedAt: new Date().toISOString(),
      });
    }
    setCompletionModalOpen(false);
    setTaskToComplete(null);
  };

  const handleNudge = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const aids = getTaskAssigneeIds(task);
    const names = aids.map(id => getAssigneeName(id)).join(', ');
    if (window.confirm(`Notificar ${names} sobre esta tarefa?`)) {
      Promise.all(
        aids
          .filter(uid => uid !== currentUser?.uid)
          .map(uid =>
            notifyUser(uid, `Ei! Dê uma olhada na tarefa: ${task.title}`)
          )
      )
        .then(() => alert('Notificação enviada!'))
        .catch(err => alert('Erro: ' + err.message));
    }
  };

  // ─── Tag / Link helpers ───────────────────────────
  const toggleTag = (tag: { name: string; color: string }) => {
    setSelectedTags(prev =>
      prev.some(t => t.name === tag.name)
        ? prev.filter(t => t.name !== tag.name)
        : [...prev, tag]
    );
  };

  const addLink = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && linkInput.trim()) {
      e.preventDefault();
      setLinks(prev => [...prev, linkInput.trim()]);
      setLinkInput('');
    }
  };

  const addAssignee = (uid: string) => {
    if (!selectedAssigneeIds.includes(uid)) {
      setSelectedAssigneeIds(prev => [...prev, uid]);
    }
    setAssigneeSearch('');
  };

  const removeAssignee = (uid: string) => {
    setSelectedAssigneeIds(prev => prev.filter(id => id !== uid));
  };

  // ─── Status Pill ──────────────────────────────────
  const StatusPill = ({ status: s, onChange, size = 'sm' }: { status: TaskStatus; onChange: (s: TaskStatus) => void; size?: 'sm' | 'md' }) => {
    const cfg = STATUS_CONFIG[s];
    const fontSize = size === 'md' ? '0.8rem' : '0.7rem';
    const padding = size === 'md' ? '4px 10px' : '2px 8px';
    return (
      <select
        value={s}
        onChange={e => { e.stopPropagation(); onChange(e.target.value as TaskStatus); }}
        onClick={e => e.stopPropagation()}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          border: 'none', outline: 'none', cursor: 'pointer',
          backgroundColor: cfg.bg, color: cfg.color,
          fontWeight: 600, fontSize, padding,
          borderRadius: '12px', textAlign: 'center',
        }}
      >
        <option value="todo">A Fazer</option>
        <option value="doing">Fazendo</option>
        <option value="done">Concluído</option>
      </select>
    );
  };

  // ─── Assignee Chips (read-only) ───────────────────
  const AssigneeChips = ({ ids, max = 3 }: { ids: string[]; max?: number }) => {
    const shown = ids.slice(0, max);
    const extra = ids.length - max;
    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {shown.map(uid => (
          <span key={uid} style={{
            fontSize: '0.7rem', padding: '1px 8px', borderRadius: '10px',
            backgroundColor: 'var(--hover-bg)', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            {getAssigneeName(uid)}
          </span>
        ))}
        {extra > 0 && (
          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
            +{extra}
          </span>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  //  LIST ITEM
  // ═══════════════════════════════════════════════════
  const TaskListItem = ({ task }: { task: Task }) => {
    const isExpanded = expandedNotes.has(task.id);
    const aids = getTaskAssigneeIds(task);
    const clientName = getClientName(task.clientId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', padding: '0.6rem 0.75rem', gap: '0.75rem',
            transition: 'background-color 0.1s ease', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => openEditTaskModal(task)}
        >
          {/* Status */}
          <StatusPill status={task.status} onChange={s => moveTaskStatus(task.id, s)} />

          {/* Title + Tags */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontWeight: 500, fontSize: '0.875rem',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              color: task.status === 'done' ? 'var(--text-muted)' : 'inherit',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.title}
            </p>
            {task.tags && task.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '3px' }}>
                {task.tags.map(t => (
                  <span key={t.name} style={{
                    fontSize: '0.6rem', padding: '1px 6px', borderRadius: '3px',
                    backgroundColor: t.color, color: '#fff', fontWeight: 500,
                  }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Client */}
          {clientName && (
            <span style={{
              fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
              backgroundColor: 'rgba(59,130,246,0.08)', color: '#3b82f6',
              fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {clientName}
            </span>
          )}

          {/* Assignees */}
          <div style={{ flexShrink: 0 }}>
            <AssigneeChips ids={aids} />
          </div>

          {/* Due Date */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '70px', textAlign: 'right', flexShrink: 0 }}>
            {format(parseISO(task.dueDate), 'dd MMM', { locale: ptBR })}
          </div>

          {/* Completion notes toggle */}
          {task.completionNotes && (
            <button
              onClick={e => {
                e.stopPropagation();
                const s = new Set(expandedNotes);
                s.has(task.id) ? s.delete(task.id) : s.add(task.id);
                setExpandedNotes(s);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--accent-color)', flexShrink: 0 }}
              title="Ver anotação"
            >
              <StickyNote size={14} />
            </button>
          )}

          {/* Nudge */}
          <button
            onClick={e => handleNudge(e, task)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)', flexShrink: 0 }}
            title="Cobrar Responsáveis"
          >
            <Bell size={14} />
          </button>
        </div>

        {/* Expanded completion notes */}
        {task.completionNotes && isExpanded && (
          <div style={{ padding: '0.5rem 0.75rem 0.75rem 3.5rem', backgroundColor: 'var(--hover-bg)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>O que fez:</div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>{task.completionNotes}</p>
            {task.finishedAt && (
              <>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Concluído em:</div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{format(parseISO(task.finishedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  //  KANBAN CARD
  // ═══════════════════════════════════════════════════
  const TaskCard = ({ task }: { task: Task }) => {
    const aids = getTaskAssigneeIds(task);
    const clientName = getClientName(task.clientId);
    return (
      <div
        className="card"
        style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        onClick={() => openEditTaskModal(task)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: '0.8rem', wordBreak: 'break-word' }}>{task.title}</p>
          <button
            onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
          >
            <Trash2 size={12} />
          </button>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {task.tags.map(t => (
              <span key={t.name} style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: t.color, color: '#fff', fontWeight: 500 }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {clientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#3b82f6' }}>
            <Building2 size={11} /> {clientName}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
          <AssigneeChips ids={aids} max={2} />
          <span>{format(parseISO(task.dueDate), 'dd MMM')}</span>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  //  KANBAN COLUMN
  // ═══════════════════════════════════════════════════
  const KanbanColumn = ({ status: s, title: colTitle }: { status: TaskStatus; title: string }) => {
    const columnTasks = sortedTasks.filter(t => t.status === s);
    const cfg = STATUS_CONFIG[s];
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--hover-bg)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.color }} />
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {colTitle}
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-color)', padding: '1px 6px', borderRadius: '8px' }}>
            {columnTasks.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {columnTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', position: 'relative' }}>
      {/* ── HEADER ──────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{APP_CONFIG.texts.tasksTitle}</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '0.4rem 0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500,
                borderBottom: activeTab === 'pending' ? '2px solid var(--text-color)' : '2px solid transparent',
                color: activeTab === 'pending' ? 'var(--text-color)' : 'var(--text-muted)',
              }}
            >
              Pendentes
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              style={{
                padding: '0.4rem 0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500,
                borderBottom: activeTab === 'completed' ? '2px solid var(--text-color)' : '2px solid transparent',
                color: activeTab === 'completed' ? 'var(--text-color)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}
            >
              Concluídas
              <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--hover-bg)', padding: '1px 6px', borderRadius: '10px' }}>
                {completedTasks.length}
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--hover-bg)', padding: '2px', borderRadius: 'var(--radius)' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '6px', borderRadius: 'var(--radius)', backgroundColor: viewMode === 'list' ? 'var(--bg-color)' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', display: 'flex' }}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{ padding: '6px', borderRadius: 'var(--radius)', backgroundColor: viewMode === 'kanban' ? 'var(--bg-color)' : 'transparent', boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', display: 'flex' }}
            >
              <Columns size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={openNewTaskModal} style={{ padding: '6px 12px' }}>
            <Plus size={16} /> Nova Tarefa
          </button>
        </div>
      </header>

      {/* ── FILTER BAR ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px', maxWidth: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '5px 8px 5px 28px', border: 'none', borderRadius: 'var(--radius)',
              backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none', color: 'var(--text-color)',
            }}
          />
        </div>

        {/* Client filter */}
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          style={{
            padding: '5px 8px', border: 'none', borderRadius: 'var(--radius)',
            backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none',
            cursor: 'pointer', color: 'var(--text-color)',
          }}
        >
          <option value="all">Todos os Clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
        </select>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          style={{
            padding: '5px 8px', border: 'none', borderRadius: 'var(--radius)',
            backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none',
            cursor: 'pointer', color: 'var(--text-color)',
          }}
        >
          <option value="all">Todos os Responsáveis</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Status filter */}
        {activeTab === 'pending' && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '5px 8px', border: 'none', borderRadius: 'var(--radius)',
              backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none',
              cursor: 'pointer', color: 'var(--text-color)',
            }}
          >
            <option value="all">Todos os Status</option>
            <option value="todo">A Fazer</option>
            <option value="doing">Fazendo</option>
          </select>
        )}

        {/* Group by */}
        {viewMode === 'list' && (
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as any)}
            style={{
              padding: '5px 8px', border: 'none', borderRadius: 'var(--radius)',
              backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none',
              cursor: 'pointer', color: 'var(--text-color)',
            }}
          >
            <option value="none">Sem Agrupamento</option>
            <option value="client">Por Cliente</option>
            <option value="assignee">Por Responsável</option>
            <option value="status">Por Status</option>
          </select>
        )}

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '5px 8px', border: 'none', borderRadius: 'var(--radius)',
            backgroundColor: 'var(--hover-bg)', fontSize: '0.8rem', outline: 'none',
            cursor: 'pointer', color: 'var(--text-color)',
          }}
          title="Ordenar tarefas"
        >
          <option value="dueDate">Prazo</option>
          <option value="priority">Prioridade</option>
          <option value="createdAt">Criação</option>
          <option value="status">Status</option>
        </select>

        {/* Results count */}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {sortedTasks.length} tarefa{sortedTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── COMPLETED STATS BAR ──────────────────────── */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: 600 }}>{completedTasks.length}</span>
            <span style={{ color: 'var(--text-muted)' }}>total concluídas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: 600 }}>{completedThisWeek.length}</span>
            <span style={{ color: 'var(--text-muted)' }}>esta semana</span>
          </div>
          {tasks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="#22c55e" />
              <span style={{ fontWeight: 600 }}>{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
              <span style={{ color: 'var(--text-muted)' }}>taxa de conclusão</span>
            </div>
          )}
        </div>
      )}

      {/* ── TASK CONTENT ────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {viewMode === 'list' ? (
          sortedTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>{APP_CONFIG.texts.noTasks}</p>
          ) : (
            groupedTasks.map(group => (
              <div key={group.key} style={{ marginBottom: groupBy !== 'none' ? '1.5rem' : 0 }}>
                {group.label && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', marginBottom: '0.25rem',
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    {groupBy === 'client' && <Building2 size={13} />}
                    {groupBy === 'assignee' && <User size={13} />}
                    {groupBy === 'status' && <ArrowUpDown size={13} />}
                    {group.label}
                    <span style={{ backgroundColor: 'var(--hover-bg)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {group.tasks.length}
                    </span>
                  </div>
                )}
                {group.tasks.map(task => <TaskListItem key={task.id} task={task} />)}
              </div>
            ))
          )
        ) : (
          <div className="kanban-container" style={{ flex: 1, minHeight: 0 }}>
            <div className="kanban-column"><KanbanColumn status="todo" title="A Fazer" /></div>
            <div className="kanban-column"><KanbanColumn status="doing" title="Fazendo" /></div>
            <div className="kanban-column"><KanbanColumn status="done" title="Concluído" /></div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
           MODAL - CREATE/EDIT TASK
         ═══════════════════════════════════════════════ */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', backgroundColor: 'var(--bg-color)', border: 'none', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem 2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título da Tarefa..."
                style={{ width: '100%', fontSize: '1.35rem', fontWeight: 600, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-h)', wordBreak: 'break-word' }}
                autoFocus
                required
              />

              {/* Properties Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, max-content) 1fr', gap: '0.75rem 1rem', alignItems: 'start', fontSize: '0.875rem' }}>

                {/* Assignees (multi-select) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', paddingTop: '6px' }}>
                  <Users size={15} /> Responsáveis
                </div>
                <div ref={assigneeDropdownRef} style={{ position: 'relative' }}>
                  <div
                    onClick={() => { setAssigneeDropdownOpen(true); assigneeInputRef.current?.focus(); }}
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '6px 8px',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
                      minHeight: '38px', cursor: 'text', alignItems: 'center',
                    }}
                  >
                    {selectedAssigneeIds.map(uid => {
                      const user = users.find(u => u.id === uid);
                      return (
                        <span key={uid} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          padding: '2px 8px', borderRadius: '12px',
                          backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)',
                          fontSize: '0.75rem', fontWeight: 500,
                        }}>
                          {user?.name || 'Anônimo'}
                          <button type="button" onClick={e => { e.stopPropagation(); removeAssignee(uid); }} style={{ background: 'none', border: 'none', color: 'var(--accent-text)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
                            <X size={11} />
                          </button>
                        </span>
                      );
                    })}
                    <input
                      ref={assigneeInputRef}
                      type="text"
                      placeholder={selectedAssigneeIds.length === 0 ? 'Buscar responsáveis...' : ''}
                      value={assigneeSearch}
                      onChange={e => setAssigneeSearch(e.target.value)}
                      onFocus={() => setAssigneeDropdownOpen(true)}
                      style={{ flex: '1 1 100px', minWidth: '80px', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', padding: '2px 0' }}
                    />
                  </div>
                  {assigneeDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)', marginTop: '4px', zIndex: 200,
                      maxHeight: '160px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      {filteredAssigneeUsers.length === 0 ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum usuário encontrado</div>
                      ) : (
                        filteredAssigneeUsers.map(u => (
                          <div
                            key={u.id}
                            onClick={() => addAssignee(u.id)}
                            style={{
                              padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem',
                              display: 'flex', alignItems: 'center', gap: '8px',
                              backgroundColor: selectedAssigneeIds.includes(u.id) ? 'var(--hover-bg)' : 'transparent',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = selectedAssigneeIds.includes(u.id) ? 'var(--hover-bg)' : 'transparent')}
                          >
                            <User size={13} color="var(--text-muted)" />
                            <span style={{ flex: 1 }}>{u.name}</span>
                            {selectedAssigneeIds.includes(u.id) && <CheckCircle2 size={13} color="#22c55e" />}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Client */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', paddingTop: '6px' }}>
                  <Building2 size={15} /> Cliente
                </div>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
                      cursor: 'pointer', minHeight: '38px',
                    }}
                  >
                    {selectedClient ? (
                      <>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedClient.color || '#666', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '0.8rem' }}>{selectedClient.company}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Selecionar Cliente...</span>
                    )}
                    <ChevronDown size={14} color="var(--text-muted)" />
                  </div>
                  {clientDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)', marginTop: '4px', zIndex: 200,
                      maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      <div style={{ padding: '6px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', padding: '4px 6px' }}>
                          <Search size={12} color="var(--text-muted)" />
                          <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '0.8rem' }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredClients.length === 0 ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum cliente</div>
                      ) : (
                        filteredClients.map(c => (
                          <div
                            key={c.id}
                            onClick={() => { setClientId(c.id); setClientSearch(''); setClientDropdownOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                              cursor: 'pointer', backgroundColor: c.id === clientId ? 'var(--hover-bg)' : 'transparent',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = c.id === clientId ? 'var(--hover-bg)' : 'transparent')}
                          >
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.color || '#666', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{c.company}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.name}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <CalendarIcon size={15} /> Período
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>até</span>
                  <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ flex: 1 }} />
                </div>

                {/* Status + Priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Circle size={15} /> Status
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="select" value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={{ flex: 1 }}>
                    <option value="todo">A Fazer</option>
                    <option value="doing">Fazendo</option>
                    <option value="done">Concluído</option>
                  </select>
                  <select className="select" value={priority} onChange={e => setPriority(e.target.value as any)} style={{ flex: 1 }}>
                    <option value="low">Prioridade Baixa</option>
                    <option value="medium">Prioridade Média</option>
                    <option value="high">Prioridade Alta</option>
                  </select>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Tag size={15} /> Tags
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TAG_COLORS.map(tag => {
                    const isSelected = selectedTags.some(t => t.name === tag.name);
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '2px 10px', fontSize: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                          backgroundColor: isSelected ? tag.color : 'var(--hover-bg)',
                          color: isSelected ? '#fff' : 'var(--text-color)',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <textarea
                  className="textarea"
                  placeholder="Descrição detalhada ou briefing..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              {/* Links */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                  <LinkIcon size={14} /> Links
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="Cole URL e aperte Enter..."
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={addLink}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {links.map((link, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', backgroundColor: 'var(--hover-bg)', padding: '3px 8px', borderRadius: '4px' }}>
                      <a href={link} target="_blank" rel="noreferrer" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-color)' }}>{link}</a>
                      <button type="button" onClick={() => setLinks(p => p.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                {editingTask && (
                  <button type="button" className="btn" style={{ marginRight: 'auto', color: 'var(--danger)' }} onClick={() => { deleteTask(editingTask.id); setIsModalOpen(false); }}>
                    Excluir
                  </button>
                )}
                {editingTask && (
                  <button type="button" className="btn" onClick={e => handleNudge(e, editingTask)}>
                    <Bell size={14} /> Cobrar
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           COMPLETION MODAL
         ═══════════════════════════════════════════════ */}
      {completionModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setCompletionModalOpen(false)}
        >
          <div
            style={{ backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '480px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Concluir Tarefa</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>Descreva o que você realizou:</p>

            <textarea
              className="textarea"
              placeholder="Atividades realizadas..."
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              style={{ minHeight: '100px', marginBottom: '1rem' }}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn" onClick={() => setCompletionModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleConfirmComplete} disabled={!completionNotes.trim()}>
                Concluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
