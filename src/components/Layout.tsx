import React, { useState } from 'react';
import Sidebar from './Sidebar';
import type { Page } from '../App';
import { Menu } from 'lucide-react';
import { APP_CONFIG } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
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
        <button onClick={toggleSidebar} className="btn" style={{ padding: '0.5rem' }}>
          <Menu size={24} />
        </button>
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

      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={(p: Page) => { onNavigate(p); setIsSidebarOpen(false); }} 
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <main style={{ 
        flex: 1, 
        padding: '2rem', 
        maxWidth: '1200px',
        width: '100%'
      }} className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
