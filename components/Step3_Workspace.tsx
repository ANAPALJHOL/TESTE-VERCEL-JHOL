
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Prompt } from '../types';
import { CHANNELS } from '../constants';
import { MotionFusionPanel } from './MotionFusionPanel';
import { PromptCard } from './PromptCard';
import { CustomPromptGenerator } from './CustomPromptGenerator';
import { getSerendipityIdea } from '../services/geminiService';
import { ConsistencyBrief } from './ConsistencyBrief';
import { debounce } from '../utils';

const GenerationContextPanel: React.FC<{
    context: string[];
    onToggleContext: (context: string) => void;
}> = ({ context, onToggleContext }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (context.length === 0) {
        return null;
    }

    return (
        <div className="w-full border-t border-white/10 pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left">
                <h4 className="text-sm font-medium text-gray-300">
                    <i className="fas fa-lightbulb mr-2 text-yellow-300"></i>
                    Diretrizes Criativas Ativas ({context.length})
                </h4>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
            </button>
            {isExpanded && (
                <div className="mt-2 animate-fade-in-up space-y-2">
                     <p className="text-xs text-gray-400">Estas diretrizes da IA estão sendo aplicadas a todas as novas gerações de prompts.</p>
                    {context.map((item, index) => (
                        <div key={index} className="bg-yellow-900/20 p-2 rounded-md flex justify-between items-start gap-2">
                           <p className="text-sm text-yellow-200 flex-grow" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                           <button onClick={() => onToggleContext(item)} className="text-yellow-200 hover:text-white transition-colors flex-shrink-0" title="Remover Diretriz">
                                <i className="fas fa-times"></i>
                           </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface SceneColumnProps {
  scene: string;
  sceneIndex: number;
  prompts: Prompt[];
  state: AppState;
  onGeneratePrompts: (scene: string) => void;
  onGenerateWhatIfPrompts: (scene: string, whatIfRequest: string) => void;
  onGenerateVariations: (scene: string, prompt: Prompt) => Promise<void>;
  onGenerateSceneVariation: (scene: string, prompt: Prompt) => Promise<void>;
  onGenerateMotion: (scene: string, promptId: string) => Promise<void>;
  onGenerateMotionVariation: (scene: string, promptId: string, originalMotion: string) => Promise<void>;
  onGenerateAssets: (scene: string, originalPrompt: Prompt) => Promise<void>;
  onGenerateSoundEffects: (scene: string, promptId: string) => Promise<void>;
  onToggleFavorite: (promptText: string) => void;
  onRefinePrompt: (scene: string, promptId: string, modificationRequest: string) => Promise<void>;
  onSelectPrompt: (scene: string, promptId: string) => void;
  showToast: (message: string) => void;
  setFusionPrompt: (type: 'start' | 'end', prompt: Prompt) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const SceneColumn: React.FC<SceneColumnProps> = ({ scene, sceneIndex, prompts, state, onGeneratePrompts, onGenerateWhatIfPrompts, setFusionPrompt, onSelectPrompt, showToast, isDragging, onDragStart, onDragOver, onDrop, onDragLeave, onDragEnd, ...rest }) => {
  const activeProject = state.projects[state.activeProjectId!];
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [whatIfInput, setWhatIfInput] = useState('');
  const [isGeneratingSerendipity, setIsGeneratingSerendipity] = useState(false);
  
  const isSceneSelected = prompts?.some(p => p.isSelected);

  const handleWhatIfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (whatIfInput.trim()) {
        onGenerateWhatIfPrompts(scene, whatIfInput.trim());
        setWhatIfInput('');
        setIsWhatIfOpen(false);
    }
  };
  
  const handleCopyAllPrompts = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!prompts || prompts.length === 0) {
          showToast("Nenhum prompt para copiar.");
          return;
      };
      const allPromptsText = prompts.map((p, i) => `PROMPT ${i+1}:\n${p.text}`).join('\n\n');
      navigator.clipboard.writeText(allPromptsText);
      showToast('Todos os prompts da cena foram copiados!');
  };
  
  const handleSerendipityClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingSerendipity(true);
    try {
        const idea = await getSerendipityIdea();
        if (idea) {
            showToast(`Idéia da Serendipidade: "${idea}"`);
            onGenerateWhatIfPrompts(scene, idea);
        } else {
            throw new Error("A IA não retornou uma ideia.");
        }
    } catch (err) {
        showToast(err instanceof Error ? err.message : "Falha ao buscar ideia.");
    } finally {
        setIsGeneratingSerendipity(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      className={`glass-effect rounded-lg flex flex-col h-[75vh] w-96 flex-shrink-0 transition-opacity ${isDragging ? 'opacity-30 cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="p-3 border-b border-white/10 flex-shrink-0">
         <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-100 flex items-start gap-2 flex-grow min-w-0">
              <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 ${isSceneSelected ? 'bg-yellow-500/50 text-yellow-200' : prompts?.length > 0 ? 'bg-green-600/50 text-green-200' : 'bg-[--color-primary-base]/50 text-[--color-primary-fg]'}`}>
                {isSceneSelected ? <i className="fas fa-check"></i> : String(sceneIndex + 1).padStart(2, '0')}
              </span>
              <span className="break-words">{scene}</span>
            </h3>
            <div className="flex items-center gap-1 text-gray-400">
                <button onClick={handleCopyAllPrompts} title="Copiar Todos os Prompts" className="w-7 h-7 rounded-full hover:bg-white/10"><i className="fas fa-copy"></i></button>
                <button onClick={() => setIsWhatIfOpen(p => !p)} title="E se?" className={`w-7 h-7 rounded-full hover:bg-white/10 ${isWhatIfOpen ? 'bg-white/10 text-white' : ''}`}><i className="fas fa-question-circle"></i></button>
                <button onClick={handleSerendipityClick} disabled={isGeneratingSerendipity} title="Serendipidade" className="w-7 h-7 rounded-full hover:bg-white/10 disabled:opacity-50">{isGeneratingSerendipity ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-dice"></i>}</button>
                <button onClick={() => onGeneratePrompts(scene)} title="Gerar Novamente" className="w-7 h-7 rounded-full hover:bg-white/10"><i className="fas fa-sync-alt"></i></button>
            </div>
         </div>
         {isWhatIfOpen && (
            <form onSubmit={handleWhatIfSubmit} className="mt-2 animate-fade-in space-y-1">
                <div className="flex gap-2">
                    <input type="text" value={whatIfInput} onChange={(e) => setWhatIfInput(e.target.value)} placeholder="Ex: e se chovesse?" className="w-full bg-black/20 text-white p-1.5 rounded-md text-sm border border-white/20 focus:border-[--color-secondary-border]" autoFocus/>
                    <button type="submit" className="bg-[--color-secondary-base] text-white px-3 rounded-md hover:bg-[--color-secondary-border] text-sm"><i className="fas fa-magic"></i></button>
                </div>
            </form>
         )}
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-3">
        {prompts && prompts.length > 0 ? (
          <div className="space-y-3">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isSelected={!!prompt.isSelected}
                isFavorite={activeProject.favorites.includes(prompt.text)}
                showToast={showToast}
                onSelect={() => onSelectPrompt(scene, prompt.id)}
                onToggleFavorite={() => rest.onToggleFavorite(prompt.text)}
                onGenerateVariations={() => rest.onGenerateVariations(scene, prompt)}
                onGenerateSceneVariation={() => rest.onGenerateSceneVariation(scene, prompt)}
                onGenerateMotion={() => rest.onGenerateMotion(scene, prompt.id)}
                onGenerateMotionVariation={() => rest.onGenerateMotionVariation(scene, prompt.id, prompt.motionPrompt || '')}
                onGenerateAssets={() => rest.onGenerateAssets(scene, prompt)}
                onGenerateSoundEffects={() => rest.onGenerateSoundEffects(scene, prompt.id)}
                onRefine={(req) => rest.onRefinePrompt(scene, prompt.id, req)}
                onSetFusionStart={() => setFusionPrompt('start', prompt)}
                onSetFusionEnd={() => setFusionPrompt('end', prompt)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <button onClick={() => onGeneratePrompts(scene)} className="bg-[--color-primary-base]/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-[--color-primary-border] transition">
              <i className="fas fa-magic mr-2"></i> Gerar Prompts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  state: AppState;
  onGeneratePrompts: (scene: string) => void;
  onGenerateAllPrompts: () => void;
  onGenerateWhatIfPrompts: (scene: string, whatIfRequest: string) => void;
  onGenerateVariations: (scene: string, prompt: Prompt) => Promise<void>;
  onGenerateSceneVariation: (scene: string, prompt: Prompt) => Promise<void>;
  onGenerateMotion: (scene: string, promptId: string) => Promise<void>;
  onGenerateMotionVariation: (scene: string, promptId: string, originalMotion: string) => Promise<void>;
  onGenerateAssets: (scene: string, originalPrompt: Prompt) => Promise<void>;
  onGenerateSoundEffects: (scene: string, promptId: string) => Promise<void>;
  onToggleFavorite: (promptText: string) => void;
  onUpdateStylePrompt: (newPrompt: string) => void;
  onUpdateCharacterBrief: (newBrief: string) => void;
  onRefinePrompt: (scene: string, promptId: string, modificationRequest: string) => Promise<void>;
  onSelectPrompt: (scene: string, promptId: string) => void;
  onReorderScenes: (sourceIndex: number, destinationIndex: number) => void;
  onToggleGenerationContext: (context: string) => void;
  onBack: () => void;
  showToast: (message: string) => void;
}

export const Step3_Workspace: React.FC<Props> = ({ state, onGenerateAllPrompts, onBack, onUpdateStylePrompt, onUpdateCharacterBrief, onReorderScenes, onToggleGenerationContext, showToast, ...rest }) => {
  const activeProject = state.projects[state.activeProjectId!];
  const scenes = activeProject.segmentedScenes['pt-br'] || [];
  const [fusionPrompts, setFusionPrompts] = useState<{ start: Prompt | null, end: Prompt | null }>({ start: null, end: null });
  
  const activeStyle = activeProject.selectedStyles[0];
  const [editedStylePrompt, setEditedStylePrompt] = useState(activeStyle?.prompt || '');
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeStyle?.prompt) {
      setEditedStylePrompt(activeStyle.prompt);
    }
  }, [activeStyle?.prompt]);

  const debouncedUpdateBrief = useCallback(debounce((brief: string) => {
    onUpdateCharacterBrief(brief);
    showToast("Briefing de consistência salvo!");
  }, 1500), [onUpdateCharacterBrief, showToast]);


  const channelInfo = CHANNELS.find(c => c.id === activeProject.channel);
  const completedScenes = Object.keys(activeProject.promptHistory).filter(key => activeProject.promptHistory[key]?.length > 0).length;
  const totalScenes = scenes.length;
  
  const handleSetFusionPrompt = (type: 'start' | 'end', prompt: Prompt) => {
    setFusionPrompts(prev => ({ ...prev, [type]: prompt }));
    showToast(`Prompt definido como Cena ${type === 'start' ? 'Inicial' : 'Final'}.`);
  };

  const handleStyleUpdate = () => {
    onUpdateStylePrompt(editedStylePrompt);
    showToast("Estilo visual ativo foi atualizado!");
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderScenes(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col space-y-6 animate-fade-in h-full">
      <div className="glass-effect p-4 rounded-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Passo 3: Storyboard de Geração</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300 mt-1">
              <span><strong>Canal:</strong> {channelInfo?.name}</span>
              <span className="font-bold text-[--color-primary-fg]">
                  {completedScenes} de {totalScenes} cenas concluídas
              </span>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
              <button onClick={onBack} className="bg-white/5 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/10 transition">
                  <i className="fas fa-arrow-left mr-2"></i> Alterar Estilo
              </button>
              <button onClick={onGenerateAllPrompts} disabled={completedScenes === totalScenes} className="text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed btn-glow-secondary">
                  <i className="fas fa-fast-forward mr-2"></i> Gerar para Todas
              </button>
          </div>
        </div>
        <div className="w-full border-t border-white/10 pt-4">
          <label htmlFor="active-style-prompt" className="block text-sm font-medium text-gray-300 mb-1">
            Estilo Visual Ativo ({activeStyle?.name}):
          </label>
          <div className="flex items-start gap-2">
            <textarea
              id="active-style-prompt"
              value={editedStylePrompt}
              onChange={(e) => setEditedStylePrompt(e.target.value)}
              className="w-full bg-black/20 text-white p-2 rounded-md border border-white/20 focus:border-[--color-primary-border] text-sm h-20 custom-scrollbar resize-y"
              placeholder="O prompt do estilo visual aparecerá aqui..."
              rows={3}
            />
            <button
                onClick={handleStyleUpdate}
                className="bg-[--color-primary-base] text-white font-bold py-2 px-4 rounded-lg hover:bg-[--color-primary-border] transition h-20 flex items-center justify-center flex-shrink-0"
                title="Salva as alterações no prompt de estilo para todas as futuras gerações"
            >
                <i className="fas fa-sync-alt mr-2"></i>
                Atualizar
            </button>
          </div>
        </div>
        <ConsistencyBrief
          brief={activeProject.characterBrief || ''}
          onUpdateBrief={debouncedUpdateBrief}
        />
        <GenerationContextPanel
          context={activeProject.generationContext}
          onToggleContext={onToggleGenerationContext}
        />
      </div>
      
      <div className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow min-h-0">
              <div className="w-full h-full flex items-start gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {scenes.map((scene, index) => (
                      <SceneColumn
                          key={scene + index}
                          scene={scene}
                          sceneIndex={index}
                          prompts={activeProject.promptHistory[scene]}
                          state={state}
                          setFusionPrompt={handleSetFusionPrompt}
                          showToast={showToast}
                          isDragging={draggedIndex === index}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                          {...rest}
                      />
                  ))}
              </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MotionFusionPanel 
                  startPrompt={fusionPrompts.start}
                  endPrompt={fusionPrompts.end}
                  onClearStart={() => setFusionPrompts(p => ({...p, start: null}))}
                  onClearEnd={() => setFusionPrompts(p => ({...p, end: null}))}
              />
              <CustomPromptGenerator 
                  state={state}
                  characterBrief={activeProject.characterBrief || ''}
                  showToast={showToast}
              />
          </div>
      </div>
    </div>
  );
};
