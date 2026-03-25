import React, { useState } from 'react';
import { useStore } from '../store';
import { Building2, Search, Plus, Mail, Phone, ChevronLeft, FileText, CheckSquare } from 'lucide-react';
import type { Client } from '../types';
import { APP_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const Clients: React.FC = () => {
  const { clients, createClient, briefings, createBriefing, updateBriefing, tasks, createTask, toggleTaskStatus, users } = useStore();
  const { currentUser } = useAuth();
  
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Client Form
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  // Add Briefing Form
  const [briefingTitle, setBriefingTitle] = useState('');
  
  // Add Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'briefings'>('briefings');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.company) return;
    try {
      await createClient(newClient);
      setNewClient({ name: '', company: '', email: '', phone: '' });
      setIsCreating(false);
    } catch (err: any) {
      alert("Erro ao criar cliente: " + err.message);
    }
  };

  const handleCreateBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefingTitle.trim() || !selectedClient) return;
    try {
      await createBriefing({
        clientId: selectedClient.id,
        title: briefingTitle,
        content: ''
      });
      setBriefingTitle('');
    } catch (err: any) {
      alert("Erro ao criar briefing: " + err.message);
    }
  };

  const handleCreateClientTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedClient) return;
    try {
      await createTask({
        title: newTaskTitle,
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: currentUser ? currentUser.uid : (users[0]?.id || 'unknown'),
        clientId: selectedClient.id,
        dueDate: new Date().toISOString()
      });
      setNewTaskTitle('');
      setIsCreatingTask(false);
    } catch (err: any) {
      alert("Erro ao criar tarefa pro cliente: " + err.message);
    }
  };

  if (selectedClient) {
    const clientBriefings = briefings.filter(b => b.clientId === selectedClient.id);
    const clientTasks = tasks.filter(t => t.clientId === selectedClient.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
        <button 
          onClick={() => setSelectedClient(null)}
          className="btn"
          style={{ alignSelf: 'flex-start', border: 'none' }}
        >
          <ChevronLeft size={18} />
          Voltar para {APP_CONFIG.texts.clientsTitle}
        </button>

        <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
          {/* Client Details Sidebar */}
          <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
              <div style={{ width: 48, height: 48, backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Building2 size={24} color="var(--text-color)" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{selectedClient.company}</h1>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>{selectedClient.name}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                  <span style={{ color: 'var(--text-color)' }}>{selectedClient.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  <Phone size={16} />
                  <span style={{ color: 'var(--text-color)' }}>{selectedClient.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => setActiveTab('briefings')} 
                style={{ padding: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: activeTab === 'briefings' ? 'var(--hover-bg)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileText size={16} /> Briefings & Docs
              </button>
              <button 
                onClick={() => setActiveTab('tasks')} 
                style={{ padding: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: activeTab === 'tasks' ? 'var(--hover-bg)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckSquare size={16} /> Tarefas ({(clientTasks || []).length})
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'briefings' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Briefings</h2>
                  <form onSubmit={handleCreateBriefing} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Criar novo arquivo doc..." 
                      style={{ width: '250px', backgroundColor: 'var(--hover-bg)', border: 'none' }}
                      value={briefingTitle}
                      onChange={e => setBriefingTitle(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
                      <Plus size={16} />
                    </button>
                  </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {clientBriefings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum doc criado ainda.</p>
                  ) : (
                    clientBriefings.map(b => (
                      <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{b.title}</div>
                        <textarea 
                          className="textarea" 
                          style={{ minHeight: '300px', backgroundColor: 'var(--hover-bg)', border: 'none', resize: 'vertical' }}
                          value={b.content}
                          onChange={(e) => updateBriefing(b.id, { content: e.target.value })}
                          placeholder="Digite aqui..."
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tarefas do Cliente</h2>
                  <button onClick={() => setIsCreatingTask(true)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem' }}>
                    <Plus size={16} /> Nova Tarefa
                  </button>
                </div>
                
                {isCreatingTask && (
                  <form onSubmit={handleCreateClientTask} style={{ marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      autoFocus
                      placeholder="Tarefa para este cliente..." 
                      style={{ backgroundColor: 'var(--hover-bg)', border: 'none' }}
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onBlur={() => { if (!newTaskTitle) setIsCreatingTask(false); }}
                    />
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {clientTasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>{APP_CONFIG.texts.noTasks}</p>
                  ) : (
                    clientTasks.map(task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '1rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--hover-bg)' }}>
                        <input 
                          type="checkbox" 
                          checked={task.status === 'done'}
                          onChange={() => toggleTaskStatus(task.id)}
                          style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        />
                        <div style={{ flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{task.title}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{APP_CONFIG.texts.clientsTitle}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Central de clientes e briefings integrados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={18} />
          Novo Cliente
        </button>
      </header>

      {isCreating && (
        <form className="card" onSubmit={handleCreateClient} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem', padding: '1.5rem', border: 'none', backgroundColor: 'var(--hover-bg)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>EMPRESA</label>
            <input type="text" className="input" style={{ border: 'none', backgroundColor: 'var(--bg-color)' }} value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>CONTATO</label>
            <input type="text" className="input" style={{ border: 'none', backgroundColor: 'var(--bg-color)' }} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn" onClick={() => setIsCreating(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input"
          placeholder="Buscar clientes..."
          style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--hover-bg)', border: 'none' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filteredClients.map(client => (
          <div 
            key={client.id} 
            className="card" 
            style={{ cursor: 'pointer', transition: 'all 0.2s', border: 'none', backgroundColor: 'var(--hover-bg)' }}
            onClick={() => setSelectedClient(client)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="var(--text-color)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 600 }}>{client.company}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{client.name}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FileText size={14} /> Briefings ({briefings.filter(b => b.clientId === client.id).length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckSquare size={14} /> Tarefas ({tasks.filter(t => t.clientId === client.id).length})
              </div>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
