import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Users, Zap, MessageSquare, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import type { NotificationType } from '../types';

const NOTIF_ICONS: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  task_assigned: { icon: <Users size={14} />, color: '#3b82f6' },
  task_nudge: { icon: <Zap size={14} />, color: '#f59e0b' },
  task_completed: { icon: <CheckCircle2 size={14} />, color: '#22c55e' },
  general: { icon: <MessageSquare size={14} />, color: '#94a3b8' },
};

const NotificationsDropdown: React.FC = () => {
  const { notifications, markNotificationRead, users } = useStore();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const userNotifications = notifications
    .filter(n => currentUser ? (n.userId === currentUser.uid || n.userId === 'all') : true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Play sound when new notification arrives
  useEffect(() => {
    const soundSetting = localStorage.getItem('notification_sound');
    if (soundSetting && soundSetting !== 'none' && userNotifications.length > prevCountRef.current) {
      import('../sounds').then(({ soundManager }) => {
        soundManager.play();
      });
    }
    prevCountRef.current = userNotifications.length;
  }, [userNotifications.length]);

  const getActorName = (actorId?: string) => {
    if (!actorId) return '';
    return users.find(u => u.id === actorId)?.name || '';
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const distance = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
      return distance;
    } catch {
      return '';
    }
  };

  const formatFullTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '0.5rem', borderRadius: 'var(--radius)', position: 'relative' }}
      >
        <Bell size={18} color="var(--text-muted)" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            minWidth: '16px', height: '16px',
            backgroundColor: 'var(--danger)', borderRadius: '8px',
            fontSize: '0.6rem', fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card" style={{
          position: 'fixed', top: '60px', right: '8px',
          width: '360px', padding: 0,
          boxShadow: 'rgba(15,15,15,0.05) 0px 0px 0px 1px, rgba(15,15,15,0.1) 0px 3px 6px, rgba(15,15,15,0.2) 0px 9px 24px',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          maxHeight: '420px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Notificações</h3>
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Content */}
          {userNotifications.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <Bell size={24} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Nenhuma notificação.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {userNotifications.slice(0, 20).map(notification => {
                const notifType = (notification.type || 'general') as NotificationType;
                const iconCfg = NOTIF_ICONS[notifType] || NOTIF_ICONS.general;
                const actorName = getActorName(notification.actorId);

                return (
                  <div
                    key={notification.id}
                    onClick={() => { if (!notification.read) markNotificationRead(notification.id); }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: notification.read ? 'default' : 'pointer',
                      backgroundColor: notification.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                      transition: 'background-color 0.15s ease',
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => { if (!notification.read) e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(59,130,246,0.04)'; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: `${iconCfg.color}15`, color: iconCfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      {iconCfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: '0.8rem', lineHeight: 1.4,
                        fontWeight: notification.read ? 400 : 500,
                        color: notification.read ? 'var(--text-muted)' : 'var(--text-color)',
                      }}>
                        {notification.message}
                      </p>

                      {/* Meta: actor + time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                        {actorName && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            por {actorName}
                          </span>
                        )}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }} title={formatFullTime(notification.createdAt)}>
                          <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>

                      {/* Tags */}
                      {notification.tags && notification.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                          {notification.tags.map(tag => (
                            <span key={tag} style={{
                              fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px',
                              backgroundColor: 'var(--hover-bg)', color: 'var(--text-muted)', fontWeight: 500,
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notification.read && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0, marginTop: '8px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
