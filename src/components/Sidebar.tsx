import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Users, LogOut } from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import { APP_CONFIG } from '../constants';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { currentUser, signOut } = useAuth();
  
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'tasks', label: 'Tarefas', icon: <CheckSquare size={18} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={18} /> },
    { id: 'clients', label: 'Clientes Workspace', icon: <Users size={18} /> },
  ];

  return (
    <aside style={{
      width: '240px',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      zIndex: 10,
      boxShadow: 'rgba(15, 15, 15, 0.05) 1px 0px 0px 0px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'var(--text-color)', borderRadius: '4px' }} />
          {APP_CONFIG.appName}
        </div>
        <NotificationsDropdown />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.375rem 0.5rem',
              borderRadius: 'var(--radius)',
              color: currentPage === item.id ? 'var(--text-color)' : 'var(--text-muted)',
              backgroundColor: currentPage === item.id ? 'var(--hover-bg)' : 'transparent',
              fontWeight: currentPage === item.id ? 500 : 400,
              fontSize: '0.875rem',
              transition: 'background-color 0.1s ease',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 24, height: 24, backgroundColor: 'var(--hover-bg)', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
            {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser?.email || 'Visitante'}
          </span>
        </div>
        <button 
          onClick={signOut}
          style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          padding: '0.25rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          justifyContent: 'flex-start'
        }}>
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
