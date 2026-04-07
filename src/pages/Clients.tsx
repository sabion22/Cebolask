import React, { useState } from 'react';
import { useStore } from '../store';
import { Building2, Search, Plus, Mail, Phone, ChevronLeft, FileText, CheckSquare, FolderPlus, Trash2, Edit2, X, Save, Briefcase, ArrowUp, ArrowDown, ChevronRight, ChevronDown, FilePlus, Folder } from 'lucide-react';
import type { Client } from '../types';
import { APP_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import ConfirmModal from '../components/ConfirmModal';
import CreateFolderModal from '../components/CreateFolderModal';
import MovePicker from '../components/MovePicker';
import Timeline from '../components/Timeline';

const Clients: React.FC = () => {
  const { clients, createClient, briefings, folders, createFolder, updateFolder, deleteFolder, createBriefing, updateBriefing, deleteBriefing, tasks, createTask, toggleTaskStatus, users, updateClient, deleteClient } = useStore();
  const { currentUser } = useAuth();
  
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Client Form
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  // Add Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'briefings' | 'timeline'>('briefings');

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger'
  });
  const [folderModal, setFolderModal] = useState<{ isOpen: boolean; parentFolderId: string | null; parentFolderName: string | null }>({
    isOpen: false, parentFolderId: null, parentFolderName: null
  });
  const [movePicker, setMovePicker] = useState<{ isOpen: boolean; itemId: string; itemType: 'doc' | 'folder'; currentFolderId: string | null; title: string }>({
    isOpen: false, itemId: '', itemType: 'doc', currentFolderId: null, title: ''
  });
  const [viewDocModal, setViewDocModal] = useState<{ isOpen: boolean; docId: string | null }>({
    isOpen: false, docId: null
  });

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState({ company: '', name: '', email: '', phone: '', industry: '', notes: '' });

  const getMovePickerFolders = () => {
    if (!selectedClient) return [];
    return folders
      .filter(f => f.clientId === selectedClient.id)
      .map(f => ({ id: f.id, name: f.name, folderId: f.folderId }));
  };

  const handleCreateFolderSubmit = (name: string, parentFolderId: string | null) => {
    if (!selectedClient) return;
    createFolder({ clientId: selectedClient.id, name, folderId: parentFolderId, order: 0 });
  };

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

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) newExpanded.delete(folderId);
    else newExpanded.add(folderId);
    setExpandedFolders(newExpanded);
  };

  const toggleDoc = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) newExpanded.delete(docId);
    else newExpanded.add(docId);
    setExpandedDocs(newExpanded);
  };

  const handleCreateFolderClick = async (parentFolderId: string | null = null) => {
    if (!selectedClient) return;
    const name = parentFolderId 
      ? prompt('Nome da subpasta:')
      : prompt('Nome da nova pasta:');
    if (!name || !name.trim()) return;
    const clientFolders = folders.filter(f => f.clientId === selectedClient.id && f.folderId === parentFolderId);
    await createFolder({ clientId: selectedClient.id, name: name.trim(), folderId: parentFolderId, order: clientFolders.length });
    if (parentFolderId) setExpandedFolders(prev => new Set([...prev, parentFolderId]));
  };

  const handleCreateBriefingInFolder = async (folderId: string | null = null) => {
    if (!selectedClient) return;
    const clientBriefings = briefings.filter(b => b.clientId === selectedClient.id && b.folderId === folderId);
    const title = `Doc ${clientBriefings.length + 1}`;
    await createBriefing({ clientId: selectedClient.id, folderId, title, content: '', order: clientBriefings.length });
  };

  const handleDeleteFolder = async (folderId: string) => {
    const docsInFolder = briefings.filter(b => b.folderId === folderId);
    const msg = docsInFolder.length > 0 
      ? `Esta pasta contém ${docsInFolder.length} documento(s). Todos serão excluídos. Continuar?`
      : 'Tem certeza que deseja excluir esta pasta?';
    if (!confirm(msg)) return;
    for (const doc of docsInFolder) await deleteBriefing(doc.id);
    await deleteFolder(folderId);
  };

  const handleDeleteBriefing = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    await deleteBriefing(docId);
    const newExpanded = new Set(expandedDocs);
    newExpanded.delete(docId);
    setExpandedDocs(newExpanded);
  };

  const handleMoveDoc = async (docId: string, _currentFolderId: string | null) => {
    if (!selectedClient) return;
    const allFolders = folders.filter(f => f.clientId === selectedClient.id);
    const options = ['Raiz', ...allFolders.map(f => f.name)].join('\n');
    const choice = prompt(`Mover documento para:\n\n${options}\n\nDigite o nome da pasta:`);
    if (!choice) return;
    const targetFolder = choice === 'Raiz' ? null : allFolders.find(f => f.name === choice);
    if (targetFolder) {
      await updateBriefing(docId, { folderId: targetFolder.id });
    } else if (choice === 'Raiz') {
      await updateBriefing(docId, { folderId: null });
    }
  };

  const handleMoveFolder = async (folderId: string, _currentParentId: string | null) => {
    if (!selectedClient) return;
    const allFolders = folders.filter(f => f.clientId === selectedClient.id && f.id !== folderId);
    const options = ['Raiz', ...allFolders.map(f => f.name)].join('\n');
    const choice = prompt(`Mover pasta para:\n\n${options}\n\nDigite o nome da pasta:`);
    if (!choice) return;
    const targetFolder = choice === 'Raiz' ? null : allFolders.find(f => f.name === choice);
    if (targetFolder) {
      await updateFolder(folderId, { folderId: targetFolder.id });
    } else if (choice === 'Raiz') {
      await updateFolder(folderId, { folderId: null });
    }
  };

  const openCreateSubfolder = (folderId: string, _folderName: string) => {
    handleCreateFolderClick(folderId);
  };

  const handleReorder = async (item: { id: string; order: number }, direction: 'up' | 'down', isFolder: boolean) => {
    const items = isFolder ? folders.filter(f => f.clientId === selectedClient?.id && f.folderId === (item as any).folderId) : briefings.filter(b => b.clientId === selectedClient?.id && b.folderId === (item as any).folderId);
    const sorted = items.sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(i => i.id === item.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = sorted[currentIndex - 1];
      if (isFolder) { await updateFolder(item.id, { order: prevItem.order }); await updateFolder(prevItem.id, { order: item.order }); }
      else { await updateBriefing(item.id, { order: prevItem.order }); await updateBriefing(prevItem.id, { order: item.order }); }
    } else if (direction === 'down' && currentIndex < sorted.length - 1) {
      const nextItem = sorted[currentIndex + 1];
      if (isFolder) { await updateFolder(item.id, { order: nextItem.order }); await updateFolder(nextItem.id, { order: item.order }); }
      else { await updateBriefing(item.id, { order: nextItem.order }); await updateBriefing(nextItem.id, { order: item.order }); }
    }
  };

  const startEditClient = () => {
    if (!selectedClient) return;
    setEditClientForm({ company: selectedClient.company, name: selectedClient.name, email: selectedClient.email || '', phone: selectedClient.phone || '', industry: (selectedClient as any).industry || '', notes: (selectedClient as any).notes || '' });
    setIsEditingClient(true);
  };

  const saveClientEdit = async () => {
    if (!selectedClient) return;
    await updateClient(selectedClient.id, editClientForm);
    setIsEditingClient(false);
  };

  const cancelClientEdit = () => setIsEditingClient(false);

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Cliente',
      message: `Tem certeza que deseja excluir "${selectedClient.company}"? Todas as tarefas e documentos associados serão excluídos.`,
      variant: 'danger',
      onConfirm: async () => {
        const clientBriefings = briefings.filter(b => b.clientId === selectedClient.id);
        for (const doc of clientBriefings) await deleteBriefing(doc.id);
        const clientTasks = tasks.filter(t => t.clientId === selectedClient.id);
        for (const task of clientTasks) await deleteClient(task.id);
        await deleteClient(selectedClient.id);
        setSelectedClient(null);
      }
    });
  };

  const renderFolderTree = (parentFolderId: string | null, level: number = 0) => {
    if (!selectedClient) return null;
    const childFolders = folders.filter(f => f.clientId === selectedClient.id && f.folderId === parentFolderId).sort((a, b) => a.order - b.order);
    const childDocs = briefings.filter(b => b.clientId === selectedClient.id && b.folderId === parentFolderId).sort((a, b) => a.order - b.order);
    return (
      <>
        {childFolders.map((folder, idx) => (
          <div key={folder.id} style={{ marginLeft: level * 12, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: expandedFolders.has(folder.id) ? 'var(--hover-bg)' : 'transparent', marginBottom: '4px', border: expandedFolders.has(folder.id) ? '1px solid var(--border-color)' : '1px solid transparent', position: 'relative', zIndex: 1 }}>
              <button type="button" onClick={() => handleReorder(folder, 'up', true)} disabled={idx === 0} title="Mover para cima" style={{ background: 'none', border: 'none', padding: 2, cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === 0 ? 0.2 : 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}><ArrowUp size={12} /></button>
              <button type="button" onClick={() => handleReorder(folder, 'down', true)} disabled={idx === childFolders.length - 1} title="Mover para baixo" style={{ background: 'none', border: 'none', padding: 2, cursor: idx === childFolders.length - 1 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === childFolders.length - 1 ? 0.2 : 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}><ArrowDown size={12} /></button>
              <button type="button" onClick={() => toggleFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}>{expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <Folder size={14} style={{ color: '#f59e0b' }} />
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>{folder.name}</span>
              <button type="button" onClick={() => openCreateSubfolder(folder.id, folder.name)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Criar subpasta"><FolderPlus size={14} /></button>
              <button type="button" onClick={() => handleCreateBriefingInFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Criar documento"><FilePlus size={14} /></button>
              <button type="button" onClick={() => handleMoveFolder(folder.id, folder.folderId)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Mover"><ChevronRight size={14} /></button>
              <button type="button" onClick={() => handleDeleteFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Excluir"><Trash2 size={14} /></button>
            </div>
            {expandedFolders.has(folder.id) && renderFolderTree(folder.id, level + 1)}
          </div>
        ))}
        {childDocs.map((doc, idx) => (
          <div key={doc.id} style={{ marginLeft: level * 12, position: 'relative', zIndex: 1 }}>
            <div onClick={() => toggleDoc(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: expandedDocs.has(doc.id) ? 'var(--hover-bg)' : 'transparent', marginBottom: '4px', border: expandedDocs.has(doc.id) ? '1px solid var(--border-color)' : '1px solid transparent', position: 'relative', zIndex: 1 }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleReorder(doc, 'up', false); }} disabled={idx === 0} title="Mover para cima" style={{ background: 'none', border: 'none', padding: 2, cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === 0 ? 0.2 : 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}><ArrowUp size={12} /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleReorder(doc, 'down', false); }} disabled={idx === childDocs.length - 1} title="Mover para baixo" style={{ background: 'none', border: 'none', padding: 2, cursor: idx === childDocs.length - 1 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === childDocs.length - 1 ? 0.2 : 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}><ArrowDown size={12} /></button>
              <button type="button" style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }}>{expandedDocs.has(doc.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
              {expandedDocs.has(doc.id) ? <input value={doc.title} onChange={(e) => { e.stopPropagation(); updateBriefing(doc.id, { title: e.target.value }); }} onClick={(e) => e.stopPropagation()} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 600, padding: 0 }} /> : <span style={{ flex: 1, fontSize: '0.8rem' }}>{doc.title}</span>}
              {expandedDocs.has(doc.id) && (<><button type="button" onClick={(e) => { e.stopPropagation(); handleMoveDoc(doc.id, doc.folderId); }} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Mover"><ChevronRight size={14} /></button><button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteBriefing(doc.id); }} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)', opacity: 1, display: 'flex', alignItems: 'center', zIndex: 10, position: 'relative' }} title="Excluir"><Trash2 size={14} /></button></>)}
            </div>
            {expandedDocs.has(doc.id) && <div style={{ padding: '8px', marginBottom: '8px', position: 'relative', zIndex: 1 }}><RichTextEditor content={doc.content} onChange={(content) => updateBriefing(doc.id, { content })} placeholder="Escreva o conteúdo do documento..." onMentionClick={(docId) => setViewDocModal({ isOpen: true, docId })} /></div>}
          </div>
        ))}
      </>
    );
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

        <div className="client-detail-layout" style={{ display: 'flex', gap: '2rem', height: '100%' }}>
          <style>{`
            @media (max-width: 768px) {
              .client-detail-layout { flex-direction: column !important; gap: 1rem !important; }
              .client-sidebar { width: 100% !important; }
              .input, .textarea { font-size: 16px !important; } /* Melhora zoom no iOS */
            }
          `}</style>
          {/* Client Details Sidebar */}
          <div className="client-sidebar" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isEditingClient ? (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Editar Cliente</h2>
                  <button onClick={cancelClientEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>EMPRESA</label><input type="text" className="input" value={editClientForm.company} onChange={e => setEditClientForm({...editClientForm, company: e.target.value})} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CONTATO</label><input type="text" className="input" value={editClientForm.name} onChange={e => setEditClientForm({...editClientForm, name: e.target.value})} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>EMAIL</label><input type="email" className="input" value={editClientForm.email} onChange={e => setEditClientForm({...editClientForm, email: e.target.value})} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>TELEFONE</label><input type="tel" className="input" value={editClientForm.phone} onChange={e => setEditClientForm({...editClientForm, phone: e.target.value})} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>SETOR/INDÚSTRIA</label><input type="text" className="input" value={editClientForm.industry} onChange={e => setEditClientForm({...editClientForm, industry: e.target.value})} style={{ width: '100%' }} placeholder="Ex: Tecnologia, Saúde, etc" /></div>
                  <div><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>OBSERVAÇÕES</label><textarea className="textarea" value={editClientForm.notes} onChange={e => setEditClientForm({...editClientForm, notes: e.target.value})} style={{ width: '100%', minHeight: '60px' }} placeholder="Notas sobre o cliente..." /></div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}><button onClick={saveClientEdit} className="btn btn-primary" style={{ flex: 1 }}><Save size={14} /> Salvar</button><button onClick={cancelClientEdit} className="btn" style={{ flex: 1 }}>Cancelar</button></div>
                  <button onClick={handleDeleteClient} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Trash2 size={14} /> Excluir Cliente</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ width: 48, height: 48, backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><Building2 size={24} color="var(--text-color)" /></div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{selectedClient.company}</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>{selectedClient.name}</p>
                  </div>
                  <button onClick={startEditClient} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} title="Editar cliente"><Edit2 size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  {selectedClient.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}><Mail size={16} /><span style={{ color: 'var(--text-color)' }}>{selectedClient.email}</span></div>}
                  {selectedClient.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}><Phone size={16} /><span style={{ color: 'var(--text-color)' }}>{selectedClient.phone}</span></div>}
                  {(selectedClient as any).industry && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}><Briefcase size={16} /><span style={{ color: 'var(--text-color)' }}>{(selectedClient as any).industry}</span></div>}
                  {(selectedClient as any).notes && <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(selectedClient as any).notes}</div>}
                </div>
              </div>
            )}
            
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
              <button 
                onClick={() => setActiveTab('timeline')} 
                style={{ padding: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: activeTab === 'timeline' ? 'var(--hover-bg)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Folder size={16} /> Linha do Tempo
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {activeTab === 'briefings' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Documentos</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
                    <button type="button" onClick={() => handleCreateFolderClick(null)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      <FolderPlus size={14} /> Nova Pasta
                    </button>
                    <button type="button" onClick={() => handleCreateBriefingInFolder(null)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', position: 'relative', zIndex: 10 }}>
                      <Plus size={14} /> Novo Doc
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'auto', flex: 1, position: 'relative', zIndex: 1 }}>
                  {folders.filter(f => f.clientId === selectedClient.id && !f.folderId).length === 0 && briefings.filter(b => b.clientId === selectedClient.id && !b.folderId).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum documento ainda. Crie uma pasta ou documento acima.</p>
                  ) : renderFolderTree(null)}
                </div>
              </div>
            ) : activeTab === 'timeline' ? (
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <Timeline clientId={selectedClient.id} />
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
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <CreateFolderModal
        isOpen={folderModal.isOpen}
        parentFolderId={folderModal.parentFolderId}
        parentFolderName={folderModal.parentFolderName}
        onClose={() => setFolderModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleCreateFolderSubmit}
      />

      {selectedClient && (
      <MovePicker
        isOpen={movePicker.isOpen}
        title={movePicker.title}
        folders={getMovePickerFolders()}
        currentFolderId={movePicker.currentFolderId}
        onClose={() => setMovePicker(prev => ({ ...prev, isOpen: false }))}
        onMove={async (newFolderId: string | null) => {
          if (movePicker.itemType === 'doc') {
            await updateBriefing(movePicker.itemId, { folderId: newFolderId });
          } else {
            await updateFolder(movePicker.itemId, { folderId: newFolderId });
          }
          setMovePicker(prev => ({ ...prev, isOpen: false }));
        }}
      />
      )}

      {viewDocModal.isOpen && viewDocModal.docId && (
        (() => {
          const doc = briefings.find(b => b.id === viewDocModal.docId);
          const client = doc ? clients.find(c => c.id === doc.clientId) : null;
          if (!doc) return null;
          return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }} onClick={() => setViewDocModal({ isOpen: false, docId: null })}>
              <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', backgroundColor: 'var(--bg-color)', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{doc.title}</h3>
                    {client && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{client.company}</p>}
                  </div>
                  <button onClick={() => setViewDocModal({ isOpen: false, docId: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20} /></button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: doc.content || '<p style=\'color: var(--text-muted)\'>Documento vazio...</p>' }} />
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setViewDocModal({ isOpen: false, docId: null })} className="btn">Fechar</button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default Clients;
