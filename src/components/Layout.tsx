import React from 'react';
import Sidebar from './Sidebar';
import type { Page } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main style={{ flex: 1, padding: '2rem', marginLeft: '250px', maxWidth: '1200px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
