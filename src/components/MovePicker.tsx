import React, { useState } from 'react';
import { X, Folder, ChevronRight, ChevronDown, Home } from 'lucide-react';

export interface FolderOption {
  id: string;
  name: string;
  folderId: string | null;
}

interface MovePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (newFolderId: string | null) => void;
  folders: FolderOption[];
  currentFolderId: string | null;
  title: string;
}

const MovePicker: React.FC<MovePickerProps> = ({
  isOpen,
  onClose,
  onMove,
  folders,
  currentFolderId,
  title
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const getFolderPath = (folderId: string | null): FolderOption[] => {
    const path: FolderOption[] = [];
    let current = folderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.folderId;
      } else {
        break;
      }
    }
    return path;
  };

  const renderFolderTree = (parentId: string | null, level: number = 0) => {
    const childFolders = folders
      .filter(f => f.folderId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <>
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const isSelected = selectedFolderId === folder.id;
          const hasChildren = folders.some(f => f.folderId === folder.id);
          const path = getFolderPath(folder.id);
          const isDescendant = path.some(p => p.id === currentFolderId);

          return (
            <React.Fragment key={folder.id}>
              <div
                onClick={() => setSelectedFolderId(folder.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  paddingLeft: `${0.75 + level * 1.5}rem`,
                  cursor: isDescendant ? 'not-allowed' : 'pointer',
                  backgroundColor: isSelected ? 'var(--hover-bg)' : 'transparent',
                  borderRadius: 'var(--radius)',
                  opacity: isDescendant ? 0.4 : 1,
                  transition: 'background-color 0.15s'
                }}
              >
                {hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newExpanded = new Set(expandedFolders);
                      if (newExpanded.has(folder.id)) {
                        newExpanded.delete(folder.id);
                      } else {
                        newExpanded.add(folder.id);
                      }
                      setExpandedFolders(newExpanded);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span style={{ width: 14 }} />
                )}
                <Folder size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {folder.name}
                </span>
              </div>
              {isExpanded && renderFolderTree(folder.id, level + 1)}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const currentPath = selectedFolderId ? getFolderPath(selectedFolderId) : [];

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
          maxWidth: '400px', 
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-color)', 
          border: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Home size={14} color="var(--text-muted)" />
          {currentPath.length > 0 ? (
            currentPath.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                {idx > 0 && <ChevronRight size={12} color="var(--text-muted)" />}
                <span style={{ fontSize: '0.75rem', color: idx === currentPath.length - 1 ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: idx === currentPath.length - 1 ? 500 : 400 }}>
                  {folder.name}
                </span>
              </React.Fragment>
            ))
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Raiz</span>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
          <div
            onClick={() => setSelectedFolderId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              backgroundColor: selectedFolderId === null ? 'var(--hover-bg)' : 'transparent',
              borderRadius: 'var(--radius)',
              marginBottom: '0.25rem'
            }}
          >
            <Home size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.875rem' }}>Raiz (sem pasta)</span>
          </div>
          {renderFolderTree(null)}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn">
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleMove}
            className="btn btn-primary"
          >
            Mover aqui
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovePicker;
