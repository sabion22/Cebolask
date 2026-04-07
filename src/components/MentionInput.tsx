import { useState, useRef } from 'react';
import { useStore } from '../store';
import { FileText } from 'lucide-react';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({ value, onChange, placeholder }) => {
  const { briefings, clients } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const allDocs = briefings.map(b => {
    const client = clients.find(c => c.id === b.clientId);
    return { ...b, clientName: client?.company || 'Sem cliente' };
  });

  const filteredDocs = allDocs.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Detectar @
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      // Se não tem espaço depois do @, mostrar dropdown
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setSearchTerm(textAfterAt.toLowerCase());
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  };

  const insertMention = (doc: { id: string; title: string }) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    const newValue = textBeforeCursor.slice(0, lastAtPos) + `[@${doc.title}](doc:${doc.id})` + textAfterCursor;
    onChange(newValue);
    setShowDropdown(false);
    
    // Focar no input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Renderizar menções como links clicáveis
  const renderValueWithMentions = () => {
    const parts = value.split(/\[@([^\]]+)\]\(doc:([^\)]+)\)/g);
    
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        return <span key={index}>{part}</span>;
      } else if (index % 3 === 1) {
        // Nome do doc
        return (
          <span 
            key={index}
            style={{ 
              color: 'var(--accent-color)', 
              fontWeight: 500,
              backgroundColor: 'var(--hover-bg)',
              padding: '0 4px',
              borderRadius: '2px'
            }}
          >
            @{part}
          </span>
        );
      }
      return null;
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '100px',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--hover-bg)',
          fontSize: '0.875rem',
          resize: 'vertical'
        }}
      />
      
      {showDropdown && filteredDocs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => insertMention(doc)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{doc.clientName}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Preview:</strong> {renderValueWithMentions()}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
