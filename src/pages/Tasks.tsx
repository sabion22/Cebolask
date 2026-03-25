import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../constants';
import type { Task, TaskStatus } from '../types';
import { useStore } from '../store';
import { LayoutList, Columns, Plus, Trash2, Bell, X, Link as LinkIcon, Tag, AlignLeft, Calendar as CalendarIcon, User, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const TAG_COLORS = [
  { name: 'Urgente', color: 'var(--danger)' },
  { name: 'Design', color: '#9b51e0' },
  { name: 'Dev', color: '#2d9cdb' },
  { name: 'Revisão', color: '#f2994a' },
  { name: 'Marketing', color: '#27ae60' },
];

const Tasks: React.FC = () => {
  const { tasks, users, clients, toggleTaskStatus, moveTaskStatus, deleteTask, createTask, updateTask, notifyUser } = useStore();
  const { currentUser } = useAuth();
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [assigneeId, setAssigneeId] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedTags, setSelectedTags] = useState<{name: string, color: string}[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const filteredTasks = tasks.filter(t => {
    if (filterMode === 'mine' && currentUser) {
      return t.assigneeId === currentUser.uid;
    }
    return true;
  });

  const getAssigneeName = (id: string) => users.find(u => u.id === id)?.name || 'Anônimo';

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setAssigneeId(currentUser?.uid || (users[0]?.id || ''));
    setClientId('');
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
    setDueDate(task.dueDate.split('T')[0]);
    setAssigneeId(task.assigneeId);
    setClientId(task.clientId || '');
    setStatus(task.status);
    setPriority(task.priority);
    setSelectedTags(task.tags || []);
    setLinks(task.links || []);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!clientId) {
      alert("Por favor, selecione um cliente para esta tarefa.");
      return;
    }
    if (!assigneeId) {
      alert("Por favor, selecione um responsável.");
      return;
    }
    
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title, description, dueDate: new Date(dueDate).toISOString(), assigneeId, clientId, status, priority, tags: selectedTags, links
        });
      } else {
        await createTask({
          title, description, status, priority, assigneeId, clientId,
          dueDate: new Date(dueDate).toISOString(), tags: selectedTags, links
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar tarefa: " + err.message);
    }
  };

  const handleNudge = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const assigneeName = getAssigneeName(task.assigneeId);
    if (window.confirm(`Deseja notificar ${assigneeName} sobre esta tarefa?`)) {
      notifyUser(task.assigneeId, `Ei! Dê uma olhada na tarefa: ${task.title}`).then(() => {
        alert("Notificação enviada com sucesso!");
      }).catch((err) => {
        alert("Erro ao notificar: " + err.message);
      });
    }
  };

  const toggleTag = (tag: {name: string, color: string}) => {
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

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };


  const TaskCard = ({ task }: { task: Task }) => (
    <div 
      className="card" 
      style={{ padding: '1rem', cursor: 'grab', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      onClick={() => openEditTaskModal(task)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{task.title}</p>
        <button 
          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {(task.tags && task.tags.length > 0) && (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {task.tags.map(t => (
            <span key={t.name} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: t.color, color: '#fff', fontWeight: 500 }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ backgroundColor: 'var(--hover-bg)', padding: '2px 6px', borderRadius: '4px' }}>
            {getAssigneeName(task.assigneeId)}
          </span>
          {task.links && task.links.length > 0 && <LinkIcon size={12} />}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{format(parseISO(task.dueDate), "dd 'de' MMM", { locale: ptBR })}</span>
          <select 
            value={task.status}
            onChange={(e) => { e.stopPropagation(); moveTaskStatus(task.id, e.target.value as TaskStatus); }}
            onClick={(e) => e.stopPropagation()}
            style={{ border: 'none', background: 'transparent', color: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            <option value="todo">A Fazer</option>
            <option value="doing">Fazendo</option>
            <option value="done">Concluído</option>
          </select>
        </div>
      </div>
    </div>
  );

  const TaskListItem = ({ task }: { task: Task }) => (
    <div 
      style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '1rem', borderRadius: 'var(--radius)', transition: 'background-color 0.1s ease', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={() => openEditTaskModal(task)}
    >
      <input 
        type="checkbox" 
        checked={task.status === 'done'}
        onChange={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
      />
      <div style={{ flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{task.title}</p>
        {(task.tags && task.tags.length > 0) && (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {task.tags.map(t => (
              <span key={t.name} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: t.color, color: '#fff' }}>
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={14} /> {getAssigneeName(task.assigneeId)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
          <CalendarIcon size={14} /> {format(parseISO(task.dueDate), "dd MMM")}
        </div>
        <select 
          value={task.status}
          onChange={(e) => { e.stopPropagation(); moveTaskStatus(task.id, e.target.value as TaskStatus); }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 'auto', padding: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'inherit', outline: 'none', cursor: 'pointer' }}
        >
          <option value="todo">A Fazer</option>
          <option value="doing">Fazendo</option>
          <option value="done">Concluído</option>
        </select>
        <button 
          onClick={(e) => handleNudge(e, task)} 
          style={{ color: 'var(--text-color)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
          title="Cobrar Responsável"
        >
          <Bell size={16} />
        </button>
      </div>
    </div>
  );

  const KanbanColumn = ({ status, title }: { status: TaskStatus; title: string }) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--hover-bg)', padding: '1rem', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title} ({columnTasks.length})</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {columnTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{APP_CONFIG.texts.tasksTitle}</h1>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setFilterMode('all')}
              style={{ padding: '0.5rem 0', background: 'none', border: 'none', borderBottom: filterMode === 'all' ? '2px solid var(--text-color)' : '2px solid transparent', color: filterMode === 'all' ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: 500, cursor: 'pointer' }}
            >
              Visão da Agência
            </button>
            <button 
              onClick={() => setFilterMode('mine')}
              style={{ padding: '0.5rem 0', background: 'none', border: 'none', borderBottom: filterMode === 'mine' ? '2px solid var(--text-color)' : '2px solid transparent', color: filterMode === 'mine' ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: 500, cursor: 'pointer' }}
            >
              Minhas Tarefas
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--hover-bg)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius)', backgroundColor: viewMode === 'list' ? 'var(--bg-color)' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
            >
              <LayoutList size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius)', backgroundColor: viewMode === 'kanban' ? 'var(--bg-color)' : 'transparent', boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
            >
              <Columns size={18} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={openNewTaskModal}>
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>
      </header>

      {/* TAREFAS CONTENT */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>{APP_CONFIG.texts.noTasks}</p>
          ) : (
            filteredTasks.map(task => <TaskListItem key={task.id} task={task} />)
          )}
        </div>
      ) : (
        <div className="kanban-container" style={{ flex: 1, minHeight: 0 }}>
          <div className="kanban-column">
            <KanbanColumn status="todo" title="A Fazer" />
          </div>
          <div className="kanban-column">
            <KanbanColumn status="doing" title="Fazendo" />
          </div>
          <div className="kanban-column">
            <KanbanColumn status="done" title="Concluído" />
          </div>
        </div>
      )}

      {/* RICH MODAL FORM */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-color)', border: 'none', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Título da Tarefa..." 
                  style={{ width: '100%', fontSize: '1.5rem', fontWeight: 600, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-h)' }}
                  autoFocus
                  required
                />
              </div>

              {/* PROPERTIES GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, max-content) 1fr', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <User size={16} /> Responsável
                </div>
                <select className="select" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                  <option value="">Selecionar Responsável...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Building2 size={16} /> Cliente
                </div>
                <select className="select" value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Selecionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <CalendarIcon size={16} /> Prazo
                </div>
                <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <AlignLeft size={16} /> Status
                </div>
                <select className="select" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                  <option value="todo">A Fazer</option>
                  <option value="doing">Fazendo</option>
                  <option value="done">Concluído</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Tag size={16} /> Tags
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {TAG_COLORS.map(tag => {
                    const isSelected = selectedTags.some(t => t.name === tag.name);
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                          backgroundColor: isSelected ? tag.color : 'var(--hover-bg)',
                          color: isSelected ? '#fff' : 'var(--text-color)',
                          fontWeight: isSelected ? 500 : 400
                        }}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <textarea 
                  className="textarea" 
                  placeholder="Adicione uma descrição detalhada ou briefing..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  style={{ minHeight: '120px', resize: 'vertical' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <LinkIcon size={16} /> Adicionar Links
                </div>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Cole uma URL e aperte Enter..." 
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={addLink}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {links.map((link, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--hover-bg)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      <a href={link} target="_blank" rel="noreferrer" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-color)' }}>{link}</a>
                      <button type="button" onClick={() => removeLink(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                {editingTask && (
                  <button type="button" className="btn" style={{ marginRight: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); deleteTask(editingTask.id); setIsModalOpen(false); }}>
                    Excluir
                  </button>
                )}
                {editingTask && (
                  <button type="button" className="btn" onClick={(e) => handleNudge(e, editingTask)} style={{ marginRight: '0.5rem' }}>
                    <Bell size={16} /> Cobrar Resp.
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Tarefa</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
