import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { 
  Building2, Search, Plus, Mail, Phone, ChevronLeft, FileText, CheckSquare, 
  FolderPlus, Trash2, Edit2, X, Save, ArrowUp, ArrowDown, ChevronRight, 
  ChevronDown, FilePlus, Folder, Globe, Key, Layout, PieChart, Lock, 
  Camera, MapPin, Briefcase, User, Calendar, ExternalLink, MessageCircle, Target
} from 'lucide-react';
import type { Client, Briefing } from '../types';
import { APP_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import ConfirmModal from '../components/ConfirmModal';
import Timeline from '../components/Timeline';
import ClientStrategy from '../components/ClientStrategy';


const CLIENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const SEGMENTS = [
  'Tecnologia', 'E-commerce', 'Marketing Digital', 'Design', 'Financeiro',
  'Saúde', 'Educação', 'Varejo', 'Indústria', 'Alimentos', 'Imóveis',
  'Automotivo', 'Entretenimento', 'Outros'
];

const DOC_ICONS = [
  { value: 'file', icon: FileText, label: 'Documento' },
  { value: 'key', icon: Key, label: 'Senhas/Acesso' },
  { value: 'layout', icon: Layout, label: 'Design/Layout' },
  { value: 'globe', icon: Globe, label: 'Link/Site' },
  { value: 'chart', icon: PieChart, label: 'Relatório' },
  { value: 'lock', icon: Lock, label: 'Restrito' },
];

const Clients: React.FC = () => {
  const { clients, createClient, briefings, folders, createFolder, updateFolder, deleteFolder, createBriefing, updateBriefing, deleteBriefing, tasks, createTask, deleteTask, toggleTaskStatus, users, updateClient, deleteClient } = useStore();
  const { currentUser } = useAuth();
  
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [newClient, setNewClient] = useState({
    name: '', company: '', email: '', phone: '', whatsapp: '', website: '',
    address: '', cnpj: '', segment: '', contactRole: '', notes: '', logo: '', color: CLIENT_COLORS[0]
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'briefings' | 'timeline' | 'strategy'>('briefings');
  const [showClientPanel, setShowClientPanel] = useState(true);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger'
  });

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState<any>({});
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isNew) {
        setNewClient({ ...newClient, logo: base64 });
      } else {
        setEditLogoPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.company) return;
    try {
      await createClient(newClient);
      setNewClient({ name: '', company: '', email: '', phone: '', whatsapp: '', website: '', address: '', cnpj: '', segment: '', contactRole: '', notes: '', logo: '', color: CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)] });
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
    const name = parentFolderId ? prompt('Nome da subpasta:') : prompt('Nome da nova pasta:');
    if (!name || !name.trim()) return;
    const clientFolders = folders.filter(f => f.clientId === selectedClient.id && f.folderId === parentFolderId);
    await createFolder({ clientId: selectedClient.id, name: name.trim(), folderId: parentFolderId, order: clientFolders.length });
    if (parentFolderId) setExpandedFolders(prev => new Set([...prev, parentFolderId]));
  };

  const handleCreateBriefingInFolder = async (folderId: string | null = null) => {
    if (!selectedClient) return;
    const clientBriefings = briefings.filter(b => b.clientId === selectedClient.id && b.folderId === folderId);
    await createBriefing({ clientId: selectedClient.id, folderId, title: `Doc ${clientBriefings.length + 1}`, content: '', order: clientBriefings.length });
  };

  const handleDeleteFolder = async (folderId: string) => {
    const docsInFolder = briefings.filter(b => b.folderId === folderId);
    const msg = docsInFolder.length > 0 ? `Esta pasta contém ${docsInFolder.length} documento(s). Continuar?` : 'Excluir esta pasta?';
    if (!confirm(msg)) return;
    for (const doc of docsInFolder) await deleteBriefing(doc.id);
    await deleteFolder(folderId);
  };

  const handleDeleteBriefing = async (docId: string) => {
    if (!confirm('Excluir este documento?')) return;
    await deleteBriefing(docId);
    const newExpanded = new Set(expandedDocs);
    newExpanded.delete(docId);
    setExpandedDocs(newExpanded);
  };

  const handleMoveDoc = async (docId: string, _currentFolderId: string | null) => {
    if (!selectedClient) return;
    const allFolders = folders.filter(f => f.clientId === selectedClient.id);
    const options = ['Raiz', ...allFolders.map(f => f.name)].join('\n');
    const choice = prompt(`Mover para:\n\n${options}\n\nDigite o nome da pasta:`);
    if (!choice) return;
    const targetFolder = choice === 'Raiz' ? null : allFolders.find(f => f.name === choice);
    if (targetFolder) await updateBriefing(docId, { folderId: targetFolder.id });
    else if (choice === 'Raiz') await updateBriefing(docId, { folderId: null });
  };

  const handleMoveFolder = async (folderId: string, _currentParentId: string | null) => {
    if (!selectedClient) return;
    const allFolders = folders.filter(f => f.clientId === selectedClient.id && f.id !== folderId);
    const options = ['Raiz', ...allFolders.map(f => f.name)].join('\n');
    const choice = prompt(`Mover para:\n\n${options}\n\nDigite o nome da pasta:`);
    if (!choice) return;
    const targetFolder = choice === 'Raiz' ? null : allFolders.find(f => f.name === choice);
    if (targetFolder) await updateFolder(folderId, { folderId: targetFolder.id });
    else if (choice === 'Raiz') await updateFolder(folderId, { folderId: null });
  };

  const handleReorder = async (item: { id: string; order: number }, direction: 'up' | 'down', isFolder: boolean) => {
    const items = isFolder 
      ? folders.filter(f => f.clientId === selectedClient?.id && f.folderId === (item as any).folderId)
      : briefings.filter(b => b.clientId === selectedClient?.id && b.folderId === (item as any).folderId);
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
    setEditClientForm({ ...selectedClient });
    setEditLogoPreview(selectedClient.logo || null);
    setIsEditingClient(true);
  };

  const saveClientEdit = async () => {
    if (!selectedClient) return;
    const updates = { ...editClientForm };
    if (editLogoPreview && editLogoPreview !== selectedClient.logo) {
      updates.logo = editLogoPreview;
    }
    await updateClient(selectedClient.id, updates);
    setIsEditingClient(false);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Cliente',
      message: `Excluir "${selectedClient.company}"? Todas as tarefas e documentos serão perdidos.`,
      variant: 'danger',
      onConfirm: async () => {
        const clientBriefings = briefings.filter(b => b.clientId === selectedClient.id);
        for (const doc of clientBriefings) await deleteBriefing(doc.id);
        const clientTasks = tasks.filter(t => t.clientId === selectedClient.id);
        for (const task of clientTasks) await deleteTask(task.id);
        await deleteClient(selectedClient.id);
        setSelectedClient(null);
      }
    });
  };

  const getDocIcon = (doc: Briefing) => {
    const iconData = DOC_ICONS.find(i => i.value === doc.icon);
    if (iconData) return iconData.icon;
    const lowerTitle = doc.title.toLowerCase();
    if (lowerTitle.includes('senha') || lowerTitle.includes('acesso')) return Key;
    if (lowerTitle.includes('design') || lowerTitle.includes('layout')) return Layout;
    if (lowerTitle.includes('link') || lowerTitle.includes('site')) return Globe;
    if (lowerTitle.includes('relatório') || lowerTitle.includes('report')) return PieChart;
    return FileText;
  };

  const handleDocIconChange = (docId: string, iconValue: string) => {
    updateBriefing(docId, { icon: iconValue });
  };

  const renderFolderTree = (parentFolderId: string | null, level: number = 0) => {
    if (!selectedClient) return null;
    const childFolders = folders.filter(f => f.clientId === selectedClient.id && f.folderId === parentFolderId).sort((a, b) => a.order - b.order);
    const childDocs = briefings.filter(b => b.clientId === selectedClient.id && b.folderId === parentFolderId).sort((a, b) => a.order - b.order);
    return (
      <>
        {childFolders.map((folder, idx) => (
          <div key={folder.id} style={{ marginLeft: level * 12, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: expandedFolders.has(folder.id) ? 'var(--hover-bg)' : 'transparent', marginBottom: '4px', border: expandedFolders.has(folder.id) ? '1px solid var(--border-color)' : '1px solid transparent' }}>
              <button type="button" onClick={() => handleReorder(folder, 'up', true)} disabled={idx === 0} style={{ background: 'none', border: 'none', padding: 2, cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === 0 ? 0.2 : 1 }}><ArrowUp size={12} /></button>
              <button type="button" onClick={() => handleReorder(folder, 'down', true)} disabled={idx === childFolders.length - 1} style={{ background: 'none', border: 'none', padding: 2, cursor: idx === childFolders.length - 1 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === childFolders.length - 1 ? 0.2 : 1 }}><ArrowDown size={12} /></button>
              <button type="button" onClick={() => toggleFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>{expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <Folder size={14} style={{ color: '#f59e0b' }} />
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>{folder.name}</span>
              <button type="button" onClick={() => handleCreateFolderClick(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Criar subpasta"><FolderPlus size={14} /></button>
              <button type="button" onClick={() => handleCreateBriefingInFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Criar documento"><FilePlus size={14} /></button>
              <button type="button" onClick={() => handleMoveFolder(folder.id, folder.folderId)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Mover"><ChevronRight size={14} /></button>
              <button type="button" onClick={() => handleDeleteFolder(folder.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Excluir"><Trash2 size={14} /></button>
            </div>
            {expandedFolders.has(folder.id) && renderFolderTree(folder.id, level + 1)}
          </div>
        ))}
        {childDocs.map((doc, idx) => {
          const DocIcon = getDocIcon(doc);
          return (
          <div key={doc.id} style={{ marginLeft: level * 12, position: 'relative', zIndex: 1 }}>
            <div onClick={() => toggleDoc(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: expandedDocs.has(doc.id) ? 'var(--hover-bg)' : 'transparent', marginBottom: '4px', border: expandedDocs.has(doc.id) ? '1px solid var(--border-color)' : '1px solid transparent' }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleReorder(doc, 'up', false); }} disabled={idx === 0} style={{ background: 'none', border: 'none', padding: 2, cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === 0 ? 0.2 : 1 }}><ArrowUp size={12} /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleReorder(doc, 'down', false); }} disabled={idx === childDocs.length - 1} style={{ background: 'none', border: 'none', padding: 2, cursor: idx === childDocs.length - 1 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: idx === childDocs.length - 1 ? 0.2 : 1 }}><ArrowDown size={12} /></button>
              <button type="button" style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>{expandedDocs.has(doc.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <DocIcon size={14} style={{ color: 'var(--text-muted)' }} />
              {expandedDocs.has(doc.id) ? <input value={doc.title} onChange={(e) => { e.stopPropagation(); updateBriefing(doc.id, { title: e.target.value }); }} onClick={(e) => e.stopPropagation()} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '0.8rem', fontWeight: 600, padding: 0 }} /> : <span style={{ flex: 1, fontSize: '0.8rem' }}>{doc.title}</span>}
              {expandedDocs.has(doc.id) && (
                <>
                  <select value={doc.icon || 'file'} onChange={(e) => { e.stopPropagation(); handleDocIconChange(doc.id, e.target.value); }} onClick={(e) => e.stopPropagation()} style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.7rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
                    {DOC_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                  </select>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleMoveDoc(doc.id, doc.folderId); }} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Mover"><ChevronRight size={14} /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteBriefing(doc.id); }} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }} title="Excluir"><Trash2 size={14} /></button>
                </>
              )}
            </div>
            {expandedDocs.has(doc.id) && <div style={{ padding: '8px', marginBottom: '8px' }}><RichTextEditor content={doc.content} onChange={(content) => updateBriefing(doc.id, { content })} placeholder="Escreva o conteúdo..." /></div>}
          </div>
          );
        })}
      </>
    );
  };

  const handleCreateClientTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedClient) return;
    try {
      const uid = currentUser ? currentUser.uid : (users[0]?.id || 'unknown');
      await createTask({ title: newTaskTitle, description: '', status: 'todo', priority: 'medium', assigneeId: uid, assigneeIds: [uid], clientId: selectedClient.id, dueDate: new Date().toISOString() } as any);
      setNewTaskTitle('');
      setIsCreatingTask(false);
    } catch (err: any) {
      alert("Erro: " + err.message);
    }
  };

  if (selectedClient) {
    const clientTasks = tasks.filter(t => t.clientId === selectedClient.id);
    const clientColor = selectedClient.color || '#3b82f6';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
        <button onClick={() => setSelectedClient(null)} className="btn" style={{ alignSelf: 'flex-start', border: 'none' }}>
          <ChevronLeft size={18} /> Voltar para {APP_CONFIG.texts.clientsTitle}
        </button>

        <div className="client-detail-layout" style={{ display: 'flex', gap: '2rem', height: '100%' }}>
          <style>{`@media (max-width: 768px) { .client-detail-layout { flex-direction: column !important; } .client-sidebar { width: 100% !important; } }`}</style>
          <div className="client-sidebar" style={{ width: showClientPanel ? '320px' : '0px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden', transition: 'width 0.2s ease' }}>
            {isEditingClient ? (
              <div className="card" style={{ padding: '1.5rem', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Editar Cliente</h2>
                  <button onClick={() => setIsEditingClient(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div onClick={() => editLogoInputRef.current?.click()} style={{ width: 60, height: 60, borderRadius: '12px', backgroundColor: 'var(--hover-bg)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                      {editLogoPreview ? <img src={editLogoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="var(--text-muted)" />}
                    </div>
                    <input ref={editLogoInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, false)} style={{ display: 'none' }} />
                    <div style={{ flex: 1 }}>
                      <input type="text" className="input" placeholder="Nome da Empresa" value={editClientForm.company || ''} onChange={e => setEditClientForm({ ...editClientForm, company: e.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <input type="text" className="input" placeholder="Contato Principal" value={editClientForm.name || ''} onChange={e => setEditClientForm({ ...editClientForm, name: e.target.value })} />
                  <input type="email" className="input" placeholder="Email" value={editClientForm.email || ''} onChange={e => setEditClientForm({ ...editClientForm, email: e.target.value })} />
                  <input type="tel" className="input" placeholder="Telefone" value={editClientForm.phone || ''} onChange={e => setEditClientForm({ ...editClientForm, phone: e.target.value })} />
                  <input type="text" className="input" placeholder="WhatsApp" value={editClientForm.whatsapp || ''} onChange={e => setEditClientForm({ ...editClientForm, whatsapp: e.target.value })} />
                  <input type="text" className="input" placeholder="Website" value={editClientForm.website || ''} onChange={e => setEditClientForm({ ...editClientForm, website: e.target.value })} />
                  <input type="text" className="input" placeholder="Endereço" value={editClientForm.address || ''} onChange={e => setEditClientForm({ ...editClientForm, address: e.target.value })} />
                  <input type="text" className="input" placeholder="CNPJ" value={editClientForm.cnpj || ''} onChange={e => setEditClientForm({ ...editClientForm, cnpj: e.target.value })} />
                  <select className="input" value={editClientForm.segment || ''} onChange={e => setEditClientForm({ ...editClientForm, segment: e.target.value })}>
                    <option value="">Selecione o segmento</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" className="input" placeholder="Cargo do Contato" value={editClientForm.contactRole || ''} onChange={e => setEditClientForm({ ...editClientForm, contactRole: e.target.value })} />
                  <textarea className="textarea" placeholder="Notas..." value={editClientForm.notes || ''} onChange={e => setEditClientForm({ ...editClientForm, notes: e.target.value })} style={{ minHeight: '60px' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {CLIENT_COLORS.map(c => (
                      <button key={c} onClick={() => setEditClientForm({ ...editClientForm, color: c })} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: editClientForm.color === c ? '3px solid white' : 'none', boxShadow: editClientForm.color === c ? `0 0 0 2px ${c}` : 'none' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={saveClientEdit} className="btn btn-primary" style={{ flex: 1 }}><Save size={14} /> Salvar</button>
                    <button onClick={() => setIsEditingClient(false)} className="btn" style={{ flex: 1 }}>Cancelar</button>
                  </div>
                  <button onClick={handleDeleteClient} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Trash2 size={14} /> Excluir Cliente</button>
                </div>
              </div>
            ) : showClientPanel ? (
              <div className="card" style={{ padding: '1.5rem', border: 'none', position: 'relative', backgroundColor: 'var(--bg-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <button onClick={startEditClient} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: clientColor + '20', border: `2px solid ${clientColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {selectedClient.logo ? <img src={selectedClient.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={28} color={clientColor} />}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-color)' }}>{selectedClient.company}</h1>
                    {selectedClient.segment && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: clientColor + '20', color: clientColor, fontWeight: 600 }}>{selectedClient.segment}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {selectedClient.name && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} color="var(--text-muted)" /> <span style={{ color: 'var(--text-muted)' }}>Contato:</span> <span style={{ fontWeight: 500 }}>{selectedClient.name}</span> {selectedClient.contactRole && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({selectedClient.contactRole})</span>}</div>}
                  {selectedClient.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} color="var(--text-muted)" /> <a href={`mailto:${selectedClient.email}`} style={{ color: 'var(--accent-color)' }}>{selectedClient.email}</a></div>}
                  {selectedClient.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} color="var(--text-muted)" /> <a href={`tel:${selectedClient.phone}`} style={{ color: 'var(--text-color)' }}>{selectedClient.phone}</a></div>}
                  {selectedClient.whatsapp && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageCircle size={14} color="#25D366" /> <a href={`https://wa.me/${selectedClient.whatsapp.replace(/\D/g,'')}`} target="_blank" style={{ color: '#25D366' }}>WhatsApp</a></div>}
                  {selectedClient.website && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={14} color="var(--text-muted)" /> <a href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`} target="_blank" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>{selectedClient.website} <ExternalLink size={10} /></a></div>}
                  {selectedClient.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="var(--text-muted)" /> <span style={{ color: 'var(--text-muted)' }}>{selectedClient.address}</span></div>}
                  {selectedClient.cnpj && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={14} color="var(--text-muted)" /> <span style={{ color: 'var(--text-muted)' }}>CNPJ: {selectedClient.cnpj}</span></div>}
                  {selectedClient.notes && <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedClient.notes}</div>}
                </div>
              </div>
            ) : null}
            
            {showClientPanel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[{ tab: 'briefings', icon: FileText, label: 'Briefings & Docs' }, { tab: 'tasks', icon: CheckSquare, label: `Tarefas (${clientTasks.length})` }, { tab: 'timeline', icon: Calendar, label: 'Linha do Tempo' }, { tab: 'strategy', icon: Target, label: 'Estratégia' }].map(item => (
                <button key={item.tab} onClick={() => { setActiveTab(item.tab as any); if (item.tab === 'timeline' || item.tab === 'strategy') setShowClientPanel(true); }} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: activeTab === item.tab ? 'var(--hover-bg)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: activeTab === item.tab ? 'var(--text-color)' : 'var(--text-muted)' }}>
                  <item.icon size={16} /> {item.label}
                </button>
              ))}
            </div>
            )}
            {(activeTab === 'timeline' || activeTab === 'strategy') && (
              <button onClick={() => setShowClientPanel(!showClientPanel)} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: showClientPanel ? 'var(--hover-bg)' : 'transparent', border: 'none', textAlign: 'left', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: showClientPanel ? 'var(--text-color)' : 'var(--text-muted)' }}>
                {showClientPanel ? <Calendar size={16} /> : <Calendar size={16} />}
                {showClientPanel ? 'Ocultar Painel' : 'Mostrar Painel'}
              </button>
            )}
          </div>

          <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {activeTab === 'briefings' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Documentos</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleCreateFolderClick(null)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}><FolderPlus size={14} /> Nova Pasta</button>
                    <button onClick={() => handleCreateBriefingInFolder(null)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}><Plus size={14} /> Novo Doc</button>
                  </div>
                </div>
                {folders.filter(f => f.clientId === selectedClient.id && !f.folderId).length === 0 && briefings.filter(b => b.clientId === selectedClient.id && !b.folderId).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum documento. Crie uma pasta ou documento acima.</p>
                ) : renderFolderTree(null)}
              </div>
            ) : activeTab === 'timeline' ? (
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <Timeline clientId={selectedClient.id} />
              </div>
            ) : activeTab === 'strategy' ? (
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <ClientStrategy clientId={selectedClient.id} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tarefas do Cliente</h2>
                  <button onClick={() => setIsCreatingTask(true)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem' }}><Plus size={16} /> Nova Tarefa</button>
                </div>
                {isCreatingTask && (
                  <form onSubmit={handleCreateClientTask}>
                    <input type="text" className="input" autoFocus placeholder="Tarefa para este cliente..." style={{ backgroundColor: 'var(--hover-bg)', border: 'none' }} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onBlur={() => { if (!newTaskTitle) setIsCreatingTask(false); }} />
                  </form>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {clientTasks.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{APP_CONFIG.texts.noTasks}</p> : clientTasks.map(task => {
                    const statusCfg: Record<string, { label: string; color: string; bg: string }> = { todo: { label: 'A Fazer', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' }, doing: { label: 'Fazendo', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }, done: { label: 'Concluído', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' } };
                    const cfg = statusCfg[task.status] || statusCfg.todo;
                    const aids = task.assigneeIds?.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];
                    return (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', gap: '0.75rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--hover-bg)' }}>
                        <select value={task.status} onChange={e => { if (e.target.value === 'done' && task.status !== 'done') toggleTaskStatus(task.id); else if (e.target.value !== 'done' && task.status === 'done') toggleTaskStatus(task.id); }} onClick={e => e.stopPropagation()} style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', cursor: 'pointer', backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', textAlign: 'center', minWidth: '70px' }}>
                          <option value="todo">A Fazer</option>
                          <option value="doing">Fazendo</option>
                          <option value="done">Concluído</option>
                        </select>
                        <div style={{ flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: '0.85rem' }}>{task.title}</p>
                        </div>
                        {aids.length > 0 && <div style={{ display: 'flex', gap: '3px' }}>{aids.slice(0, 2).map(uid => <span key={uid} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>{users.find(u => u.id === uid)?.name?.split(' ')[0] || 'Anon'}</span>)}</div>}
                        <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>{APP_CONFIG.texts.clientsTitle}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Central de clientes e briefings integrados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isCreating ? <X size={16} /> : <Plus size={16} />}
          {isCreating ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </header>

      {isCreating && (
        <div style={{ border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '16px', backgroundColor: 'var(--bg-color)', marginBottom: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleCreateClient}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div onClick={() => logoInputRef.current?.click()} style={{ width: 80, height: 80, borderRadius: '16px', backgroundColor: 'var(--hover-bg)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                {newClient.logo ? <img src={newClient.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} color="var(--text-muted)" />}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e)} style={{ display: 'none' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" className="input" placeholder="Nome da Empresa *" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} required style={{ backgroundColor: 'var(--hover-bg)', fontWeight: 600 }} />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {CLIENT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewClient({ ...newClient, color: c })} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: newClient.color === c ? '3px solid white' : 'none', boxShadow: newClient.color === c ? `0 0 0 2px ${c}` : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ position: 'relative' }}><Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="email" className="input" placeholder="Email Principal" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={{ paddingLeft: '36px', backgroundColor: 'var(--hover-bg)' }} /></div>
              <div style={{ position: 'relative' }}><Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="tel" className="input" placeholder="Telefone" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} style={{ paddingLeft: '36px', backgroundColor: 'var(--hover-bg)' }} /></div>
              <div style={{ position: 'relative' }}><MessageCircle size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#25D366' }} /><input type="text" className="input" placeholder="WhatsApp" value={newClient.whatsapp} onChange={e => setNewClient({ ...newClient, whatsapp: e.target.value })} style={{ paddingLeft: '36px', backgroundColor: 'var(--hover-bg)' }} /></div>
              <div style={{ position: 'relative' }}><Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="text" className="input" placeholder="Website" value={newClient.website} onChange={e => setNewClient({ ...newClient, website: e.target.value })} style={{ paddingLeft: '36px', backgroundColor: 'var(--hover-bg)' }} /></div>
              <input type="text" className="input" placeholder="Pessoa de Contato" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ backgroundColor: 'var(--hover-bg)' }} />
              <input type="text" className="input" placeholder="Cargo do Contato" value={newClient.contactRole} onChange={e => setNewClient({ ...newClient, contactRole: e.target.value })} style={{ backgroundColor: 'var(--hover-bg)' }} />
              <div style={{ position: 'relative' }}><MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="text" className="input" placeholder="Endereço" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} style={{ paddingLeft: '36px', backgroundColor: 'var(--hover-bg)' }} /></div>
              <input type="text" className="input" placeholder="CNPJ" value={newClient.cnpj} onChange={e => setNewClient({ ...newClient, cnpj: e.target.value })} style={{ backgroundColor: 'var(--hover-bg)' }} />
              <select className="input" value={newClient.segment} onChange={e => setNewClient({ ...newClient, segment: e.target.value })} style={{ backgroundColor: 'var(--hover-bg)' }}>
                <option value="">Selecione o segmento</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea className="textarea" placeholder="Notas sobre o cliente..." value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} style={{ marginTop: '1rem', backgroundColor: 'var(--hover-bg)' }} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}><Save size={16} /> Criar Cliente</button>
          </form>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" className="input" placeholder="Buscar clientes..." style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--hover-bg)', border: 'none' }} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {filteredClients.map(client => {
          const clientColor = client.color || '#3b82f6';
          return (
            <div key={client.id} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} onClick={() => setSelectedClient(client)} onMouseOver={e => { e.currentTarget.style.borderColor = clientColor; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 25px ${clientColor}20`; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: clientColor + '20', border: `1px solid ${clientColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {client.logo ? <img src={client.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={22} color={clientColor} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-color)' }}>{client.company}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email || client.phone || client.name || 'Sem contato'}</p>
                </div>
                {client.segment && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: clientColor + '15', color: clientColor, fontWeight: 600 }}>{client.segment}</span>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={14} /> {briefings.filter(b => b.clientId === client.id).length}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckSquare size={14} /> {tasks.filter(t => t.clientId === client.id).length}</div>
                {(client.whatsapp || client.website) && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>{client.whatsapp && <MessageCircle size={14} color="#25D366" />}{client.website && <Globe size={14} />}</div>}
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</div>}
      </div>

      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};

export default Clients;