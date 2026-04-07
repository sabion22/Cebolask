import React, { useState, useEffect, useRef } from 'react';
import { X, Folder } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, parentFolderId: string | null) => void;
  parentFolderId?: string | null;
  parentFolderName?: string | null;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentFolderId = null,
  parentFolderName = null
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), parentFolderId);
    onClose();
  };

  if (!isOpen) {
    console.log('CreateFolderModal: isOpen = false');
    return null;
  }

  console.log('CreateFolderModal: isOpen = true, renderizando modal');
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
      onClick={onClose}
    >
      <div 
        className="card"
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          backgroundColor: 'var(--bg-color)', 
          border: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 'var(--radius)', 
                backgroundColor: 'var(--hover-bg)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <Folder size={20} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Nova Pasta</h3>
                {parentFolderName && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    dentro de <Folder size={12} color="#f59e0b" /> {parentFolderName}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <input 
              ref={inputRef}
              type="text" 
              className="input"
              placeholder="Nome da pasta..."
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            />
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn">
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!name.trim()}
              >
                Criar Pasta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
