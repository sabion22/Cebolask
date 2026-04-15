import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { Excalidraw, getSceneVersion } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface ClientStrategyProps {
  clientId: string;
}

const ClientStrategy: React.FC<ClientStrategyProps> = ({ clientId }) => {
  const { strategies, saveStrategy } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = format(currentDate, 'yyyy-MM');
  
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSceneVersionRef = useRef<number>(-1);

  // Load data for the current month when it changes
  useEffect(() => {
    // Localiza a estratégia do mês no cache local/banco
    const strategy = strategies.find(s => s.clientId === clientId && s.month === monthKey);
    
    // We must pass elements and appState from the start if we have them
    const loadedElements = strategy?.payload ? JSON.parse(strategy.payload) : (strategy?.elements || []);
    const loadedBg = strategy?.bgPayload || strategy?.appState?.viewBackgroundColor || '#ffffff';
    
    if (strategy && loadedElements.length > 0) {
      setInitialData({
        elements: loadedElements,
        appState: { viewBackgroundColor: loadedBg },
      });
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: loadedElements,
          appState: { viewBackgroundColor: loadedBg },
        });
      }
      lastSceneVersionRef.current = getSceneVersion(loadedElements);
    } else {
      setInitialData({ elements: [], appState: {} });
      if (excalidrawAPI) {
         // Reset scene se não houver dados para o mês
         excalidrawAPI.updateScene({ elements: [], appState: {} });
      }
      lastSceneVersionRef.current = -1;
    }
  }, [clientId, monthKey, strategies, excalidrawAPI]);

  // Debounced Auto-save
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    const sceneVersion = getSceneVersion(elements);
    
    // Only trigger save if the scene actually changed visually or elements mutated
    if (sceneVersion > lastSceneVersionRef.current && elements.length > 0) {
      lastSceneVersionRef.current = sceneVersion;
      setIsSaving(true);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveStrategy(clientId, monthKey, elements as any[], appState);
          setLastSaved(new Date());
        } catch (err) {
          console.error("Erro ao autosalvar estratégia:", err);
        } finally {
          setIsSaving(false);
        }
      }, 3000); // 3 seconds debounced save
    }
  }, [clientId, monthKey, saveStrategy]);

  const handleManualSave = async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    try {
      await saveStrategy(clientId, monthKey, elements as any[], appState);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Erro ao salvar manual:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <style>{`
        .excalidraw {
          --ui-font: 'Inter', sans-serif;
        }
        .excalidrawLayer {
          z-index: 1;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={prevMonth} className="btn" style={{ padding: '0.5rem' }}><ArrowLeft size={16} /></button>
          <span style={{ fontWeight: 700, minWidth: '120px', textAlign: 'center', textTransform: 'capitalize', color: 'var(--text-color)' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="btn" style={{ padding: '0.5rem' }}><ArrowRight size={16} /></button>
          
          {isSameMonth(currentDate, new Date()) && (
            <span style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'var(--hover-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>Mês Atual</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSaving ? (
              <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 1s infinite' }} /> Salvando...</>
            ) : lastSaved ? (
              <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} /> Salvo às {format(lastSaved, 'HH:mm')}</>
            ) : null}
          </div>
          <button onClick={handleManualSave} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Forçar Salvar
          </button>
        </div>

      </div>

      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <Excalidraw 
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          theme="light"
          langCode="pt-BR"
        />
      </div>
    </div>
  );
};

export default ClientStrategy;
