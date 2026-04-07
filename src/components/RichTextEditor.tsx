import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, AtSign } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onMentionClick?: (docId: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder = 'Escreva aqui...', onMentionClick }) => {
  const { briefings, clients } = useStore();
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const allDocs = briefings.map(b => {
    const client = clients.find(c => c.id === b.clientId);
    return { ...b, clientName: client?.company || 'Sem cliente' };
  });

  const filteredDocs = allDocs.filter(d => 
    d.title.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
        style: 'min-height: 150px; padding: 0.75rem; outline: none;',
      },
      handleClickOn: (_view, _pos, _node, _nodePos, event, _direct) => {
        if (!onMentionClick) return false;
        const target = event.target as HTMLElement;
        const mentionEl = target.closest('.doc-mention');
        if (mentionEl) {
          const docId = mentionEl.getAttribute('data-doc-id');
          if (docId) {
            onMentionClick(docId);
            return true;
          }
        }
        return false;
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Digite a URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertMention = (doc: { id: string; title: string; clientName: string }) => {
    editor.chain().focus().insertContent(`<span class="doc-mention" data-doc-id="${doc.id}" style="color: var(--accent-color); font-weight: 500; background: var(--hover-bg); padding: 0 4px; border-radius: 2px; cursor: pointer;">@${doc.title}</span>`).run();
    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  const ToolbarButton = ({ 
    onClick, 
    active, 
    children,
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 8px',
        border: 'none',
        background: active ? 'var(--accent-color)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-color)',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        padding: '8px', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--hover-bg)',
        flexWrap: 'wrap'
      }}>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          active={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold size={16} />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          active={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic size={16} />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          active={editor.isActive('underline')}
          title="Sublinhado"
        >
          <Underline size={16} />
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          active={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          active={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          active={editor.isActive('bulletList')}
          title="Lista com bullets"
        >
          <List size={16} />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <ToolbarButton 
          onClick={addLink}
          active={editor.isActive('link')}
          title="Adicionar link"
        >
          <LinkIcon size={16} />
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        <div style={{ position: 'relative' }}>
          <ToolbarButton 
            onClick={() => setShowMentionDropdown(!showMentionDropdown)}
            title="Mencionar documento"
          >
            <AtSign size={16} />
          </ToolbarButton>
          
          {showMentionDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              minWidth: '200px',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Buscar docs..."
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--hover-bg)'
                  }}
                />
              </div>
              {filteredDocs.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Nenhum documento encontrado
                </div>
              ) : (
                filteredDocs.map(doc => (
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1 }}>{doc.title}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{doc.clientName}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .rich-text-editor-content ul,
        .rich-text-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        .rich-text-editor-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        .rich-text-editor-content p {
          margin: 0.25rem 0;
        }
        .rich-text-editor-content a {
          color: var(--accent-color);
          text-decoration: underline;
        }
        .rich-text-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
