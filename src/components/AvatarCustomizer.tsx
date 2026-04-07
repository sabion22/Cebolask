import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type AvatarStyle = 'glass' | 'icons' | 'identicon' | 'initials' | 'rings' | 'shapes' | 'thumbs';

interface AvatarCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: AvatarStyle) => void;
  currentStyle?: AvatarStyle;
  seed?: string;
}

const styles: { id: AvatarStyle; label: string }[] = [
  { id: 'glass', label: 'Glass' },
  { id: 'icons', label: 'Icons' },
  { id: 'identicon', label: 'Identicon' },
  { id: 'initials', label: 'Iniciais' },
  { id: 'rings', label: 'Anéis' },
  { id: 'shapes', label: 'Formas' },
  { id: 'thumbs', label: 'Polegar' },
];

const AVATAR_SEED = 'cebolask-avatar';

const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  isOpen,
  onClose,
  onSave,
  currentStyle = 'initials',
  seed = AVATAR_SEED,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(currentStyle);

  useEffect(() => {
    setSelectedStyle(currentStyle);
  }, [currentStyle, isOpen]);

  if (!isOpen) return null;

  const getAvatarUrl = (style: AvatarStyle) => {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
  };

  const handleSave = () => {
    onSave(selectedStyle);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '380px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Personalizar Avatar</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="#666" />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #eee',
            backgroundColor: '#f9f9f9'
          }}>
            <img
              src={getAvatarUrl(selectedStyle)}
              alt="Avatar preview"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Escolha um estilo:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {styles.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '8px',
                  border: selectedStyle === style.id ? '2px solid #000' : '2px solid #eee',
                  backgroundColor: selectedStyle === style.id ? '#f5f5f5' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <img
                  src={getAvatarUrl(style.id)}
                  alt={style.label}
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
                <span style={{ fontSize: '0.65rem', color: '#666' }}>{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #eee',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#000',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
