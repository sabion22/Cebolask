import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';

const NotificationsDropdown: React.FC = () => {
  const { notifications, markNotificationRead } = useStore();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Consider all notifications as global for the mock, or filter by currentUser.uid
  // Because it's a mock state with complex auth link, we just show all unread for demo
  const userNotifications = notifications.filter(n => !n.read && (currentUser ? n.userId === currentUser.uid || n.userId === 'all' : true));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '0.5rem', borderRadius: 'var(--radius)', position: 'relative' }}
      >
        <Bell size={18} color="var(--text-muted)" />
        {userNotifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--danger)',
            borderRadius: '50%'
          }} />
        )}
      </button>

      {isOpen && (
        <div className="card" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '320px',
          padding: '0.75rem',
          boxShadow: 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0.5rem 0.5rem' }}>Atualizações</h3>
          
          {userNotifications.length === 0 ? (
            <p style={{ margin: '0 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nenhuma notificação nova.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '300px', overflowY: 'auto' }}>
              {userNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {notification.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
