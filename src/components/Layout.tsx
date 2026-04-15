import React, { useState } from 'react';
import Sidebar from './Sidebar';
import NotificationsDropdown from './NotificationsDropdown';
import type { Page } from '../App';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* NOTIFICATIONS - Fixed position on desktop */}
      <div className="desktop-only" style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
        <NotificationsDropdown />
      </div>

      {/* MOBILE HEADER */}
      <header className="mobile-only" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '60px', 
        backgroundColor: 'var(--bg-color)', 
        borderBottom: '1px solid var(--border-color)',
        alignItems: 'center',
        padding: '0 1rem',
        zIndex: 5,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--text-color)', borderRadius: '4px' }} />
          {APP_CONFIG.appName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={toggleSidebar} className="btn" style={{ padding: '0.5rem' }}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* OVERLAY for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 9,
            display: 'block'
          }} 
          className="mobile-only"
        />
      )}

      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={(p: Page) => { onNavigate(p); setIsSidebarOpen(false); }} 
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
        />
        {/* Collapse button - only on desktop */}
        <button 
          onClick={toggleCollapse}
          className="desktop-only"
          style={{
            position: 'absolute',
            top: '50%',
            right: '-12px',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 11,
            color: 'var(--text-muted)'
          }}
          title={isSidebarCollapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <main style={{ 
        flex: 1, 
        padding: '2rem', 
        width: '100%',
        marginLeft: isSidebarCollapsed ? '60px' : '250px',
        transition: 'margin-left 0.2s ease',
        maxWidth: 'none'
      }} className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
