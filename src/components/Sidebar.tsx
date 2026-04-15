import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Users, X, Building2, Settings as SettingsIcon, Bot } from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import { APP_CONFIG } from '../constants';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onClose, isCollapsed }) => {
  const { currentUser } = useAuth();
  const { users } = useStore();
  const currentUserData = users.find(u => u.id === currentUser?.uid);
  
  const userAvatar = currentUserData?.avatar;
  const userName = currentUserData?.name || currentUser?.email || 'Visitante';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'tasks', label: 'Tarefas', icon: <CheckSquare size={24} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={24} /> },
    { id: 'clients', label: 'Clientes Workspace', icon: <Users size={24} /> },
    { id: 'office', label: 'Escritório', icon: <Building2 size={24} /> },
    { id: 'agents', label: 'Agentes', icon: <Bot size={24} /> },
  ];

  return (
    <aside style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      padding: isCollapsed ? '0.75rem 0.5rem' : '1rem',
      boxShadow: 'rgba(15, 15, 15, 0.05) 1px 0px 0px 0px'
    }}>
      <div style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center', marginBottom: isCollapsed ? '1rem' : '1.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '8px', justifyContent: 'center' }}>
          <img src={APP_CONFIG.logoPath} alt="Logo" style={{ width: isCollapsed ? 32 : 24, height: isCollapsed ? 32 : 24, borderRadius: '4px', objectFit: 'contain' }} />
          {!isCollapsed && <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{APP_CONFIG.appName}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onClose && (
              <button onClick={onClose} className="mobile-only btn" style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            )}
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: isCollapsed ? '0.75rem 0.5rem' : '0.6rem 0.75rem',
              borderRadius: 'var(--radius)',
              color: currentPage === item.id ? 'var(--text-color)' : 'var(--text-muted)',
              backgroundColor: currentPage === item.id ? 'var(--hover-bg)' : 'transparent',
              fontWeight: currentPage === item.id ? 500 : 400,
              fontSize: isCollapsed ? '0' : '0.875rem',
              transition: 'background-color 0.1s ease',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
          >
            {item.icon}
            {!isCollapsed && item.label}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={() => onNavigate('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: isCollapsed ? '0.75rem 0.5rem' : '0.6rem 0.75rem',
            borderRadius: 'var(--radius)',
            color: currentPage === 'settings' ? 'var(--text-color)' : 'var(--text-muted)',
            backgroundColor: currentPage === 'settings' ? 'var(--hover-bg)' : 'transparent',
            fontWeight: currentPage === 'settings' ? 500 : 400,
            fontSize: isCollapsed ? '0' : '0.875rem',
            transition: 'background-color 0.1s ease',
            textAlign: 'left',
            border: 'none',
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
        >
          <SettingsIcon size={24} />
          {!isCollapsed && 'Configurações'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.5rem 0' : '0' }}>
          <div style={{ width: 32, height: 32, backgroundColor: 'var(--hover-bg)', borderRadius: '50%', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{userInitials}</span>
            )}
          </div>
          {!isCollapsed && (
            <span style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-color)' }}>
              {userName}
            </span>
          )}
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
