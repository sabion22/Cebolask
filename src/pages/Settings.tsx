import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { 
  User as UserIcon, Settings, Activity, Trash2, Download, 
  Moon, Sun, Bell, LogOut, Camera 
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import AvatarCustomizer from '../components/AvatarCustomizer';

type Tab = 'profile' | 'app' | 'logs';

const SettingsPage: React.FC = () => {
  const { logs, clearOldLogs, users, updateUser } = useStore();
  const { currentUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);

  const currentUserData = users.find(u => u.id === currentUser?.uid);
  const isAdmin = currentUserData?.role === 'admin';
  const avatarStyle = currentUserData?.avatarStyle || 'initials';

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
    }
  }, [currentUserData?.name]);

  const handleSaveName = async () => {
    if (!currentUser?.uid || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateUser(currentUser.uid, { name: displayName.trim() });
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveAvatar = async (style: 'glass' | 'icons' | 'identicon' | 'initials' | 'rings' | 'shapes' | 'thumbs') => {
    if (!currentUser?.uid) return;
    await updateUser(currentUser.uid, { avatarStyle: style });
  };

  const AVATAR_SEED = 'cebolask-avatar';

  const getAvatarUrl = (style: string) => {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${AVATAR_SEED}`;
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `doca_logs_backup_${new Date().toISOString().split('T')[0]}.json`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Configurações</h1>
        <p style={{ color: '#666', fontWeight: 500 }}>Gerencie sua conta e as preferências do DOCA.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Nav Tabs */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`btn-tab ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <UserIcon size={18} /> Minha Conta
          </button>
          <button 
            onClick={() => setActiveTab('app')}
            className={`btn-tab ${activeTab === 'app' ? 'active' : ''}`}
          >
            <Settings size={18} /> Aplicativo
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('logs')}
              className={`btn-tab ${activeTab === 'logs' ? 'active' : ''}`}
            >
              <Activity size={18} /> Logs do Sistema
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="card" style={{ flex: 1, padding: '2rem', overflowY: 'auto', border: 'none', backgroundColor: '#fff', boxShadow: 'rgba(0, 0, 0, 0.02) 0px 4px 12px' }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowAvatarCustomizer(true)}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
                    <img 
                      src={getAvatarUrl(avatarStyle)} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff'
                  }}>
                    <Camera size={14} color="#fff" />
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{currentUserData?.name}</h3>
                  <p style={{ color: '#666', margin: '4px 0 12px 0' }}>{currentUser?.email}</p>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: isAdmin ? '#FEE2E2' : '#E0E7FF', color: isAdmin ? '#B91C1C' : '#4338CA', fontWeight: 700 }}>
                    {isAdmin ? 'ADMINISTRADOR' : 'USUÁRIO PADRÃO'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome de Exibição</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{ backgroundColor: '#F9F9F9', flex: 1 }} 
                    />
                    <button 
                      onClick={handleSaveName} 
                      disabled={savingName || displayName === (currentUserData?.name || '')}
                      className="btn"
                      style={{ backgroundColor: '#000', color: '#fff', whiteSpace: 'nowrap' }}
                    >
                      {savingName ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Senha</label>
                  <button className="btn" style={{ border: '1px solid #eee' }}>Redefinir Senha via Email</button>
                </div>
              </div>

              <button onClick={signOut} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', backgroundColor: 'transparent', border: 'none', padding: 0, fontWeight: 700, cursor: 'pointer', marginTop: '2rem' }}>
                <LogOut size={18} /> Sair da conta
              </button>
            </div>
          )}

          {activeTab === 'app' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Preferências Visuais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    onClick={() => setTheme('light')}
                    style={{ 
                      padding: '1.5rem', borderRadius: '12px', border: theme === 'light' ? '2px solid #000' : '2px solid #eee', 
                      backgroundColor: theme === 'light' ? '#fff' : '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', cursor: 'pointer' 
                    }}
                  >
                    <Sun size={24} color={theme === 'light' ? '#000' : '#999'} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Modo Claro</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    style={{ 
                      padding: '1.5rem', borderRadius: '12px', border: theme === 'dark' ? '2px solid #3b82f6' : '2px solid #eee', 
                      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', cursor: 'pointer', color: theme === 'dark' ? '#fff' : '#333'
                    }}
                  >
                    <Moon size={24} color={theme === 'dark' ? '#3b82f6' : '#999'} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Modo Escuro (Beta)</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Notificações</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', backgroundColor: '#F9F9F9' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Bell size={20} color="#666" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Alertas de Browser</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Receber avisos de novas tarefas quando estiver em outra aba.</p>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Histórico de Atividades</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleBackup} className="btn" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', border: '1px solid #eee' }}>
                    <Download size={14} /> Backup
                  </button>
                  <button onClick={() => { if(confirm('Limpar logs agora?')) clearOldLogs(); }} className="btn" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', border: '1px solid #FEE2E2', color: '#B91C1C' }}>
                    <Trash2 size={14} /> Limpar Tudo
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {logs.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Sem logs registrados.</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #F7F7F7', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '4px', height: '100%', minHeight: '30px', backgroundColor: getActionColor(log.action), borderRadius: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{log.userName}</span>
                          <span style={{ fontSize: '0.7rem', color: '#999' }}>
                            {formatDistanceToNow(parseISO(log.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#444' }}>{log.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AvatarCustomizer
        isOpen={showAvatarCustomizer}
        onClose={() => setShowAvatarCustomizer(false)}
        onSave={handleSaveAvatar}
        currentStyle={avatarStyle}
        seed={currentUser?.email || 'default-user'}
      />

      <style>{`
        .btn-tab {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #666;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .btn-tab:hover { background-color: #f0f0f0; }
        .btn-tab.active { background-color: #EBEBEB; color: #000; }
      `}</style>
    </div>
  );
};

export default SettingsPage;
