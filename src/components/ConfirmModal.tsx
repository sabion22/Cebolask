import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onCancel();
  };

  const variantStyles = {
    danger: { bg: '#fef2f2', border: '#ef4444', btn: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#f59e0b', btn: '#d97706' },
    info: { bg: '#eff6ff', border: '#3b82f6', btn: '#2563eb' }
  };

  const style = variantStyles[variant];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
      onClick={onCancel}
    >
      <div 
        className="card"
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          backgroundColor: 'var(--bg-color)', 
          border: `2px solid ${style.border}`,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            backgroundColor: style.bg,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={28} color={style.border} />
          </div>
          
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{title}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>{message}</p>
          
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button 
              onClick={onCancel}
              className="btn"
              style={{ flex: 1 }}
            >
              {cancelLabel}
            </button>
            <button 
              onClick={handleConfirm}
              style={{ 
                flex: 1, 
                padding: '0.5rem 1rem',
                backgroundColor: style.btn,
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
