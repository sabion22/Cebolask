import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Upload, ChevronDown, X, Sparkles, Plus, History, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_AGENTS, sendMessageToAgent } from '../services/agents';
import type { AgentContext } from '../services/agents';
import { AVAILABLE_MODELS } from '../services/openRouter';
import type { Agent, AgentMessage, ChatSession } from '../types';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Agents: React.FC = () => {
  const { clients, tasks, briefings, objectives, users } = useStore();
  const { currentUser } = useAuth();
  
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENTS[0]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const currentSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const context: AgentContext = { clients, tasks, briefings, objectives, users };

  // Carregar sessões do Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as ChatSession))
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setSessions(loadedSessions);
      console.log('Total sessions loaded for user:', loadedSessions.length);
      
      // Carregar sessão mais recente apenas no load INICIAL verdadeiro.
      // E evitar trocar de agente do nada.
      if (loadedSessions.length > 0 && !currentSessionIdRef.current) {
        // ... selects the first one from the sorted list
        const latest = loadedSessions[0];
        setCurrentSessionId(latest.id);
        setMessages(latest.messages || []);
        const agent = DEFAULT_AGENTS.find(a => a.id === latest.agentId) || DEFAULT_AGENTS[0];
        setSelectedAgent(agent);
      }
    }, (error) => {
      console.error('Firestore listener error:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  const createNewSession = () => {
    setCurrentSessionId('');
    setMessages([]);
    setStreamingResponse('');
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    const agent = DEFAULT_AGENTS.find(a => a.id === session.agentId) || DEFAULT_AGENTS[0];
    setSelectedAgent(agent);
  };

  const saveMessages = async (targetSessionId: string, msgs: AgentMessage[]) => {
    if (!targetSessionId) return;
    await setDoc(doc(db, 'chatSessions', targetSessionId), {
      messages: msgs,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chatSessions', sessionId));
      if (currentSessionId === sessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId && currentUser) {
      targetSessionId = `session_${Date.now()}`;
      await setDoc(doc(db, 'chatSessions', targetSessionId), {
        userId: currentUser.uid,
        agentId: selectedAgent.id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setCurrentSessionId(targetSessionId);
    }

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingResponse('');

    // Salvar imediatamente a mensagem do usuário no banco assim que enviada
    await saveMessages(targetSessionId, newMessages);

    try {
      const response = await sendMessageToAgent(
        selectedAgent,
        userMessage.content,
        newMessages,
        context,
        (chunk) => {
          setStreamingResponse(prev => prev + chunk);
        }
      );

      const assistantMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingResponse('');
      await saveMessages(targetSessionId, finalMessages);
    } catch (error) {
      console.error('Agent error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erro: ${errorMsg}\n\nTente outro modelo.`,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      await saveMessages(targetSessionId, finalMessages);
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedAgent(prev => ({ ...prev, model: modelId }));
    setShowModelSelector(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const uploadMessage: AgentMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `📄 ${file.name}\n\n${content.slice(0, 1000)}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, uploadMessage]);
    };
    reader.readAsText(file);
  };

  const changeAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setStreamingResponse('');
    createNewSession();
  };

  const textColor = 'var(--text-color)';
  const bgCard = 'var(--bg-color)';
  const bgHover = 'var(--hover-bg)';
  const borderColor = 'var(--border-color)';
  const primaryColor = 'var(--accent-color)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', gap: '1rem' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bot size={24} style={{ color: primaryColor }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: textColor }}>Agentes</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowKnowledge(!showKnowledge)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.375rem', 
              padding: '0.375rem 0.75rem', borderRadius: 'var(--radius)', 
              border: `1px solid ${borderColor}`, 
              backgroundColor: showKnowledge ? bgHover : 'transparent', 
              color: textColor, fontSize: '0.8rem', cursor: 'pointer' 
            }}
          >
            <Sparkles size={14} /> Conhecimento
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowModelSelector(!showModelSelector)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.375rem', 
                padding: '0.375rem 0.75rem', borderRadius: 'var(--radius)', 
                border: `1px solid ${borderColor}`, 
                backgroundColor: 'transparent', 
                color: textColor, fontSize: '0.8rem', cursor: 'pointer' 
              }}
            >
              {AVAILABLE_MODELS.find(m => m.id === selectedAgent.model)?.name || selectedAgent.model.split('/').pop()} 
              <ChevronDown size={14} />
            </button>
            {showModelSelector && (
              <div style={{ 
                position: 'absolute', top: '100%', right: 0, marginTop: '4px', 
                backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius)', 
                maxHeight: '250px', overflowY: 'auto', zIndex: 100, minWidth: '180px' 
              }}>
                {AVAILABLE_MODELS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => handleModelChange(m.id)} 
                    style={{ 
                      display: 'block', width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', 
                      backgroundColor: selectedAgent.model === m.id ? bgHover : 'transparent', 
                      border: 'none', color: textColor, fontSize: '0.8rem', cursor: 'pointer' 
                    }}
                  >
                    {m.name} ({m.price})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AGENT + SESSION */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {DEFAULT_AGENTS.map(agent => (
          <button 
            key={agent.id} 
            onClick={() => changeAgent(agent)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.375rem', 
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid', 
              borderColor: selectedAgent.id === agent.id ? primaryColor : borderColor, 
              backgroundColor: selectedAgent.id === agent.id ? primaryColor : 'transparent', 
              color: selectedAgent.id === agent.id ? '#fff' : textColor, 
              fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 
            }}
          >
            <span>{agent.icon}</span> {agent.name}
          </button>
        ))}
        
        <button 
          onClick={createNewSession} 
          title="Nova conversa" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '0.5rem', borderRadius: 'var(--radius)', 
            border: `1px solid ${borderColor}`, backgroundColor: 'transparent', 
            color: textColor, cursor: 'pointer' 
          }}
        >
          <Plus size={16} />
        </button>
        
        <button 
          onClick={() => setShowHistory(true)}
          title="Histórico de conversas"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', 
            border: `1px solid ${borderColor}`, backgroundColor: showHistory ? bgHover : 'transparent', 
            color: textColor, cursor: 'pointer', fontSize: '0.8rem'
          }}
        >
          <History size={16} />
          Histórico
        </button>
      </div>

      {/* CHAT AREA */}
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        backgroundColor: bgCard, borderRadius: 'var(--radius)', 
        border: `1px solid ${borderColor}`, overflow: 'hidden', minHeight: 0 
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && !streamingResponse && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto' }}>
              <Bot size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ color: textColor, margin: 0 }}>Olá! Sou o {selectedAgent.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedAgent.description}</p>
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', 
                backgroundColor: msg.role === 'user' ? primaryColor : bgHover, 
                color: msg.role === 'user' ? '#fff' : textColor, 
                fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' 
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {streamingResponse && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ 
                maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', 
                backgroundColor: bgHover, color: textColor, 
                fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' 
              }}>
                {streamingResponse}<span style={{ animation: 'blink 1s infinite' }}>|</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '1rem', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md,.json,.csv" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            title="Carregar documento" 
            style={{ 
              padding: '0.5rem', borderRadius: 'var(--radius)', border: `1px solid ${borderColor}`, 
              backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <Upload size={18} />
          </button>
          
          <textarea 
            ref={inputRef} 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder={`Mensagem para ${selectedAgent.name}...`} 
            disabled={isLoading} 
            style={{ 
              flex: 1, minHeight: '40px', maxHeight: '120px', padding: '0.5rem 0.75rem', 
              borderRadius: 'var(--radius)', border: `1px solid ${borderColor}`, 
              backgroundColor: 'var(--bg-input)', color: textColor, 
              fontSize: '0.875rem', resize: 'none', fontFamily: 'inherit' 
            }} 
          />
          
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()} 
            style={{ 
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: 'none', 
              backgroundColor: isLoading ? 'var(--text-muted)' : primaryColor, 
              color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            {isLoading ? <span style={{ animation: 'blink 1s infinite' }}>⏳</span> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* KNOWLEDGE PANEL */}
      {showKnowledge && (
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '90%', maxWidth: '500px', maxHeight: '80%', 
          backgroundColor: bgCard, border: `1px solid ${borderColor}`, 
          borderRadius: 'var(--radius)', padding: '1.5rem', 
          overflowY: 'auto', zIndex: 300, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: textColor }}>Conhecimento do Agente</h2>
            <button 
              onClick={() => setShowKnowledge(false)} 
              style={{ 
                padding: '0.5rem', backgroundColor: 'transparent', 
                border: 'none', cursor: 'pointer', color: textColor 
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: bgHover, borderRadius: 'var(--radius)' }}>
              <strong style={{ color: textColor }}>Fontes de Dados</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                {selectedAgent.knowledgeSources.map(s => (
                  <span key={s} style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', backgroundColor: bgCard, borderRadius: '4px', color: textColor }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: bgHover, borderRadius: 'var(--radius)' }}>
              <strong style={{ color: textColor }}>Clientes:</strong> <span style={{ color: textColor }}>{clients.length}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {clients.slice(0, 3).map(c => c.company).join(', ')}...
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: bgHover, borderRadius: 'var(--radius)' }}>
              <strong style={{ color: textColor }}>Tarefas:</strong> <span style={{ color: textColor }}>{tasks.length}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tasks.filter(t => t.status !== 'done').length} ativas
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: bgHover, borderRadius: 'var(--radius)' }}>
              <strong style={{ color: textColor }}>Briefings:</strong> <span style={{ color: textColor }}>{briefings.length}</span>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: bgHover, borderRadius: 'var(--radius)' }}>
              <strong style={{ color: textColor }}>Equipe:</strong> <span style={{ color: textColor }}>{users.length}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {users.map(u => u.name).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY PANEL */}
      {showHistory && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '320px',
          backgroundColor: bgCard, borderLeft: `1px solid ${borderColor}`,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 300,
          display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: textColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} /> Histórico
            </h2>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sessions.filter(s => s.agentId === selectedAgent.id).length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Nenhuma conversa com {selectedAgent.name}
                </p>
                {sessions.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    Mas você tem {sessions.length} conversas com outros agentes.
                  </p>
                )}
                {sessions.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    0 conversas totais encontradas para seu usuário.
                  </p>
                )}
              </div>
            )}
            {sessions.filter(s => s.agentId === selectedAgent.id).map(s => {
              const firstUserMsg = s.messages?.find(m => m.role === 'user')?.content;
              const title = firstUserMsg ? firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '') : 'Nova Conversa';
              return (
                <div 
                  key={s.id} 
                  onClick={() => { selectSession(s); setShowHistory(false); }}
                  className="history-item"
                  style={{ 
                    padding: '0.75rem', borderRadius: 'var(--radius)', 
                    backgroundColor: currentSessionId === s.id ? bgHover : 'transparent', 
                    border: `1px solid ${currentSessionId === s.id ? borderColor : 'transparent'}`,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(s.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="delete-session-btn"
                    title="Excluir conversa"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .delete-session-btn { opacity: 0; transition: opacity 0.2s; }
        .history-item:hover .delete-session-btn { opacity: 1; }
      `}</style>
    </div>
  );
};

export default Agents;