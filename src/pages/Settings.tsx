import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import {
  User as UserIcon, Settings, Activity, Trash2, Download, Search,
  Moon, Sun, Bell, LogOut, Camera, Upload, Palette,
  Database, Mail, Key, Volume2
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { soundManager, type SoundType } from '../sounds';

type Tab = 'profile' | 'app' | 'logs';

const SettingsPage: React.FC = () => {
  const { logs, clearOldLogs, users, updateUser } = useStore();
  const { currentUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [displayName, setDisplayName] = useState('');
  const [nameSaved, setNameSaved] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logSearch, setLogSearch] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notif_enabled') !== 'false');
  const [notificationSound, setNotificationSound] = useState(() => localStorage.getItem('notification_sound') || 'default');

  const currentUserData = users.find(u => u.id === currentUser?.uid);
  const isAdmin = currentUserData?.role === 'admin';

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  useEffect(() => {
    if (currentUserData?.name) {
      setDisplayName(currentUserData.name);
      setNameSaved(true);
    }
    if (currentUserData?.avatar) {
      setAvatarPreview(currentUserData.avatar);
    }
  }, [currentUserData?.name, currentUserData?.avatar]);

  useEffect(() => { localStorage.setItem('notif_enabled', String(notificationsEnabled)); }, [notificationsEnabled]);
  useEffect(() => { localStorage.setItem('notification_sound', notificationSound); }, [notificationSound]);

  // Initialize sound manager with saved preference
  useEffect(() => {
    soundManager.setSound(notificationSound as SoundType);
  }, []);

  const handleSoundChange = (newSound: string) => {
    setNotificationSound(newSound);
    soundManager.setSound(newSound as SoundType);
    // Play preview sound
    setTimeout(() => soundManager.play(), 50);
  };

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const search = logSearch.toLowerCase();
    return logs.filter(log => 
      log.userName.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.details.toLowerCase().includes(search)
    );
  }, [logs, logSearch]);

  const handleSaveName = async () => {
    if (!currentUser?.uid || !displayName.trim()) return;
    try {
      await updateUser(currentUser.uid, { name: displayName.trim() });
      setNameSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameChange = (value: string) => {
    setDisplayName(value);
    setNameSaved(value !== (currentUserData?.name || ''));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        const scale = Math.min(size / img.width, size / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const resized = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarPreview(resized);
          await updateUser(currentUser.uid, { avatar: resized });
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser?.uid) return;
    setAvatarPreview(null);
    await updateUser(currentUser.uid, { avatar: '' });
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `doca_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return '#22c55e';
    if (action.includes('delete')) return '#ef4444';
    if (action.includes('update')) return '#3b82f6';
    return '#666';
  };

  const getAvatarDisplay = () => {
    if (avatarPreview) {
      return <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }
    const name = currentUserData?.name || 'U';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--hover-bg)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>
        {initials}
      </div>
    );
  };

  const Toggle = ({ enabled, onChange, label, description, icon }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '14px', backgroundColor: 'var(--hover-bg)', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon && <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>{icon}</div>}
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-color)' }}>{label}</p>
          {description && <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
          backgroundColor: enabled ? 'var(--accent-color)' : 'var(--border-color)',
          position: 'relative', transition: 'all 0.2s ease', flexShrink: 0,
        }}
      >
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff',
          position: 'absolute', top: '3px', left: enabled ? '25px' : '3px',
          transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Configurações</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Personalize sua experiência no DOCA.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'profile', icon: <UserIcon size={18} />, label: 'Minha Conta' },
            { id: 'app', icon: <Settings size={18} />, label: 'Aplicativo' },
            { id: 'logs', icon: <Activity size={18} />, label: 'Logs de Atividade' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '12px', border: 'none',
              backgroundColor: activeTab === item.id ? 'var(--hover-bg)' : 'transparent', color: activeTab === item.id ? 'var(--text-color)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '2rem', borderRadius: '20px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--hover-bg)', borderRadius: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--accent-color)', backgroundColor: 'var(--bg-color)' }}>
                    {getAvatarDisplay()}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-color)', cursor: 'pointer',
                  }}>
                    <Camera size={12} color="white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{currentUserData?.name}</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 8px 0', fontSize: '0.85rem' }}>{currentUser?.email}</p>
                  <span style={{ fontSize: '0.7rem', padding: '3px 12px', borderRadius: '20px', fontWeight: 700, backgroundColor: isAdmin ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: isAdmin ? '#dc2626' : '#2563eb' }}>
                    {isAdmin ? 'ADMIN' : 'USUÁRIO'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={14} /> Alterar Foto
                </button>
                {avatarPreview && (
                  <button className="btn" onClick={handleRemoveAvatar} style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trash2 size={14} /> Remover
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nome de Exibição</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input type="text" className="input" value={displayName} onChange={(e) => handleNameChange(e.target.value)} style={{ paddingRight: '50px' }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: nameSaved ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                      {nameSaved ? '✓ Salvo' : '•'}
                    </span>
                  </div>
                  <button onClick={handleSaveName} disabled={nameSaved} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Salvar
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Segurança</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                    <Key size={16} /> Alterar Senha
                  </button>
                  <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                    <Mail size={16} /> Alterar Email
                  </button>
                </div>
              </div>

              <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', backgroundColor: 'transparent', border: 'none', padding: '0', fontWeight: 700, cursor: 'pointer', marginTop: '1rem', fontSize: '0.9rem' }}>
                <LogOut size={18} /> Sair da conta
              </button>
            </div>
          )}

          {activeTab === 'app' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Palette size={18} /> Aparência
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button onClick={() => setTheme('light')} style={{ padding: '1.25rem', borderRadius: '16px', cursor: 'pointer', border: theme === 'light' ? '2px solid var(--accent-color)' : '2px solid var(--border-color)', backgroundColor: theme === 'light' ? 'var(--hover-bg)' : 'transparent', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', color: 'var(--text-color)' }}>
                    <Sun size={24} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Modo Claro</span>
                  </button>
                  <button onClick={() => setTheme('dark')} style={{ padding: '1.25rem', borderRadius: '16px', cursor: 'pointer', border: theme === 'dark' ? '2px solid var(--accent-color)' : '2px solid var(--border-color)', backgroundColor: theme === 'dark' ? 'var(--hover-bg)' : 'transparent', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', color: 'var(--text-color)' }}>
                    <Moon size={24} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Modo Escuro</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} /> Notificações
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} label="Notificações do Browser" description="Alertas quando receber novas tarefas" icon={<Bell size={16} />} />
                </div>
                <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: '14px', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Volume2 size={18} color="var(--text-muted)" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Som de Notificação</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Som ao receber nova tarefa</p>
                  </div>
                  <select value={notificationSound} onChange={(e) => handleSoundChange(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '0.85rem' }}>
                    <option value="default">Padrão</option>
                    <option value="ding">Ding</option>
                    <option value="chime">Sino</option>
                    <option value="pop">Pop</option>
                    <option value="none">Silencioso</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} /> Dados
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleBackup} className="btn" style={{ fontSize: '0.85rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.25rem' }}>
                    <Download size={16} /> Exportar Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Histórico de Atividades</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      style={{ 
                        paddingLeft: '32px', 
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--bg-color)', 
                        fontSize: '0.8rem',
                        color: 'var(--text-color)',
                        width: '180px'
                      }} 
                    />
                  </div>
                  <button onClick={handleBackup} className="btn" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem' }}>
                    <Download size={14} /> Backup
                  </button>
                  <button onClick={() => { if(confirm('Limpar logs?')) clearOldLogs(); }} className="btn" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '0.5rem 0.75rem' }}>
                    <Trash2 size={14} /> Limpar
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredLogs.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {logSearch ? 'Nenhum resultado encontrado.' : 'Sem atividades registradas.'}
                  </p>
                ) : filteredLogs.map(log => (
                  <div key={log.id} style={{ padding: '1rem 1.25rem', borderRadius: '14px', backgroundColor: 'var(--hover-bg)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '3px', minHeight: '32px', backgroundColor: getActionColor(log.action), borderRadius: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.userName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(parseISO(log.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;