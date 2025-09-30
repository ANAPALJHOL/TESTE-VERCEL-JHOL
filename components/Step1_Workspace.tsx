
import React, { useState } from 'react';
import { AppState, ChannelId, Language, SegmentationConfig } from '../types';
import { CHANNELS, LANGUAGES } from '../constants';
import { AIAssistant } from './AIAssistant';

interface Props {
  state: AppState;
  setScript: (value: string) => void;
  setChannel: (value: ChannelId) => void;
  setLanguage: (value: Language) => void;
  setSegmentationConfig: (config: SegmentationConfig) => void;
  onAnalyze: () => void;
  onNext: () => void;
  onAnalyzeScriptStrength: () => Promise<boolean>;
  onViralAnalysis: () => Promise<boolean>;
  onSuggestTwists: () => Promise<boolean>;
  onSendMessageToAssistant: (message: string) => void;
  onToggleGenerationContext: (context: string) => void;
  showToast: (message: string) => void;
}

export const Step1_Workspace: React.FC<Props> = ({ state, setScript, setChannel, setLanguage, setSegmentationConfig, onAnalyze, onNext, onAnalyzeScriptStrength, onViralAnalysis, onSuggestTwists, onSendMessageToAssistant, onToggleGenerationContext, showToast }) => {
  const activeProject = state.projects[state.activeProjectId!];
  const { script, channel, language, segmentationConfig, segmentedScenes, caption, hashtags, musicSuggestions, chatHistory, generationContext } = activeProject;
  const { isChatting } = state;
  const [activeTab, setActiveTab] = useState<'script' | 'assistant'>('script');
  const [sceneLangTab, setSceneLangTab] = useState<'pt-br' | 'en'>('pt-br');

  const handleCopyScenes = () => {
    const scenes = segmentedScenes[sceneLangTab] || [];
    if (scenes.length > 0) {
      const sceneText = scenes.map((scene, index) => `SCENE ${index + 1}:\n${scene}`).join('\n\n');
      navigator.clipboard.writeText(sceneText);
      showToast('Todas as cenas foram copiadas!');
    }
  };
  
  const handleAnalyzeAndSwitch = async () => {
      const success = await onAnalyzeScriptStrength();
      if (success) {
        setActiveTab('assistant');
      }
  };
  
  const handleViralAnalysisAndSwitch = async () => {
    const success = await onViralAnalysis();
    if (success) {
        setActiveTab('assistant');
    }
  };

  const handleSuggestTwistsAndSwitch = async () => {
    const success = await onSuggestTwists();
    if (success) {
        setActiveTab('assistant');
    }
  };

  const handleScriptInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const currentScenes = segmentedScenes ? (segmentedScenes[sceneLangTab] || []) : [];
  const hasScenes = segmentedScenes && segmentedScenes['pt-br'].length > 0;

  const segmentationModeButtonClasses = (mode: 'automatic' | 'manual' | 'custom') => 
    `w-full text-center px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
        segmentationConfig.mode === mode
        ? 'bg-[--color-primary-base] text-white'
        : 'bg-transparent text-gray-300 hover:bg-white/10'
    }`;

  return (
    <div className="animate-fade-in">
        <div className="flex border-b border-white/10 mb-6">
            <button onClick={() => setActiveTab('script')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'script' ? 'border-b-2 border-[--color-primary-border] text-white' : 'text-gray-400 hover:text-white'}`}>
                <i className="fas fa-file-alt mr-2"></i>Roteiro
            </button>
            <button onClick={() => setActiveTab('assistant')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'assistant' ? 'border-b-2 border-[--color-primary-border] text-white' : 'text-gray-400 hover:text-white'}`}>
               <i className="fas fa-magic mr-2"></i>Copiloto Criativo
            </button>
        </div>

      {activeTab === 'script' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="flex flex-col space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-100">Passo 1: Contexto e Segmentação</h2>
                <p className="text-gray-300">Forneça o roteiro, defina as opções e analise para criar a fila de cenas.</p>
            </div>
    
            <div className="glass-effect p-4 rounded-lg space-y-4">
                 <div className="flex justify-between items-center">
                    <label htmlFor="script-input" className="block text-gray-200 font-medium">
                        1. Cole seu roteiro de vídeo aqui:
                    </label>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <button
                            onClick={handleAnalyzeAndSwitch}
                            disabled={!script}
                            className="text-xs bg-white/10 text-white font-semibold py-1 px-3 rounded-md hover:bg-white/20 transition disabled:opacity-50"
                            title="Receba feedback da IA sobre a qualidade do seu roteiro"
                        >
                            <i className="fas fa-brain mr-2 text-[--color-secondary-fg]"></i>Analisar Força
                        </button>
                        <button
                            onClick={handleViralAnalysisAndSwitch}
                            disabled={!script}
                            className="text-xs bg-white/10 text-white font-semibold py-1 px-3 rounded-md hover:bg-white/20 transition disabled:opacity-50"
                            title="Receba um score e sugestões para viralizar seu conteúdo"
                        >
                            <i className="fas fa-chart-line mr-2 text-[--color-primary-fg]"></i>Analisar Potencial Viral
                        </button>
                        <button
                            onClick={handleSuggestTwistsAndSwitch}
                            disabled={!script}
                            className="text-xs bg-white/10 text-white font-semibold py-1 px-3 rounded-md hover:bg-white/20 transition disabled:opacity-50"
                            title="A IA irá sugerir reviravoltas baseadas no seu estilo narrativo"
                        >
                            <i className="fas fa-dna mr-2 text-teal-400"></i>Sugerir Reviravoltas
                        </button>
                    </div>
                </div>
                <textarea
                id="script-input"
                value={script}
                onChange={handleScriptInputChange}
                placeholder="Era uma vez, em uma galáxia muito, muito distante..."
                className="w-full bg-black/20 text-white p-3 rounded-lg focus:border-[--color-primary-border] focus:ring-[--color-primary-border] transition duration-200 min-h-[12rem] custom-scrollbar resize-none overflow-hidden"
                />
            </div>
    
            <div className="glass-effect p-4 rounded-lg space-y-4">
              <p className="block text-gray-200 font-medium">2. Selecione o canal (estética visual):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHANNELS.map(ch => (
                  <button 
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className={`p-4 rounded-lg text-left transition-all duration-200 h-full ${
                      channel === ch.id 
                      ? 'bg-[--color-primary-base]/30 border-2 border-[--color-primary-border]' 
                      : 'bg-black/20 hover:border-[--color-primary-border] border-2 border-transparent'
                    }`}
                  >
                    <p className="font-bold text-lg text-white">{ch.name}</p>
                    <p className="text-sm text-gray-300">{ch.description}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="glass-effect p-4 rounded-lg space-y-4">
                <p className="block text-gray-200 font-medium">3. Configure a segmentação:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center">
                         <label htmlFor="language-select" className="text-sm text-gray-300 mr-2 whitespace-nowrap">Idioma Social:</label>
                         <select id="language-select" value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full bg-black/20 p-2 rounded-md border border-white/20 text-sm">
                            {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                        </select>
                    </div>
                     <div className="flex bg-black/20 p-1 rounded-lg gap-1">
                        <button onClick={() => setSegmentationConfig({...segmentationConfig, mode: 'automatic'})} className={segmentationModeButtonClasses('automatic')}>Automático</button>
                        <button onClick={() => setSegmentationConfig({...segmentationConfig, mode: 'manual'})} className={segmentationModeButtonClasses('manual')}>Manual</button>
                        <button onClick={() => setSegmentationConfig({...segmentationConfig, mode: 'custom'})} className={segmentationModeButtonClasses('custom')}>Personalizado</button>
                    </div>
                </div>

                {segmentationConfig.mode === 'automatic' && (
                    <p className="text-xs text-gray-400 mt-2 text-center">A IA dividirá o roteiro com base na pontuação para um ritmo natural.</p>
                )}

                {segmentationConfig.mode === 'manual' && (
                    <div className="animate-fade-in">
                        <label htmlFor="scene-count" className="text-sm text-gray-300">Número de Cenas: {segmentationConfig.sceneCount}</label>
                        <input id="scene-count" type="range" min="10" max="40" value={segmentationConfig.sceneCount} onChange={e => setSegmentationConfig({...segmentationConfig, sceneCount: parseInt(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                )}
                
                {segmentationConfig.mode === 'custom' && (
                     <div className="animate-fade-in">
                        <label htmlFor="custom-scenes-input" className="text-sm text-gray-300">Cole suas cenas (uma por linha):</label>
                        <textarea
                            id="custom-scenes-input"
                            value={segmentationConfig.customScenes}
                            onChange={(e) => setSegmentationConfig({ ...segmentationConfig, customScenes: e.target.value })}
                            placeholder={"Cena 1...\nCena 2...\nCena 3..."}
                            className="w-full mt-1 bg-black/20 text-white p-2 rounded-lg focus:border-[--color-primary-border] transition duration-200 h-24 custom-scrollbar text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">O roteiro completo acima ainda será usado para gerar legendas e hashtags.</p>
                    </div>
                )}
            </div>
            
            <button
                onClick={onAnalyze}
                disabled={!script || !channel}
                className="w-full text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-glow-secondary"
            >
                Analisar Roteiro <i className="fas fa-cogs ml-2"></i>
            </button>
          </div>
    
          <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold text-gray-100">Fila de Cenas</h2>
                    <p className="text-gray-300">Suas cenas aparecerão aqui após a análise.</p>
                </div>
                 {hasScenes && (
                     <button onClick={handleCopyScenes} className="text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0">
                        <i className="fas fa-copy mr-1"></i> Copiar Todas
                    </button>
                 )}
            </div>
            <div className="glass-effect rounded-lg p-4 h-full flex flex-col">
                {hasScenes ? (
                     <div className="flex-grow flex flex-col overflow-hidden">
                        <div className="flex border-b border-white/10 mb-2">
                           <button onClick={() => setSceneLangTab('pt-br')} className={`px-3 py-1 text-xs font-semibold rounded-t-md ${sceneLangTab === 'pt-br' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Português</button>
                           <button onClick={() => setSceneLangTab('en')} className={`px-3 py-1 text-xs font-semibold rounded-t-md ${sceneLangTab === 'en' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Inglês</button>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                            <ol className="space-y-3 text-gray-200">
                            {currentScenes.map((scene, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="bg-[--color-primary-base]/50 text-[--color-primary-fg] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p>{scene}</p>
                                </li>
                            ))}
                            </ol>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-400">
                        <p>Aguardando análise do roteiro...</p>
                    </div>
                )}
               
                {hasScenes && (caption || (hashtags && hashtags.length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fade-in">
                        {caption && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-gray-200">Legenda Sugerida</h3>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(caption);
                                        showToast('Legenda copiada!');
                                    }} className="text-sm text-gray-400 hover:text-white transition-colors">
                                        <i className="fas fa-copy mr-1"></i> Copiar
                                    </button>
                                </div>
                                <p className="text-sm text-gray-300 bg-black/20 p-2 rounded-md">{caption}</p>
                            </div>
                        )}
                        {hashtags && hashtags.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-gray-200">Hashtags Sugeridas</h3>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(hashtags.join(' '));
                                        showToast('Hashtags copiadas!');
                                    }} className="text-sm text-gray-400 hover:text-white transition-colors">
                                        <i className="fas fa-copy mr-1"></i> Copiar
                                    </button>
                                </div>
                                 <p className="text-sm text-[--color-primary-fg] bg-black/20 p-2 rounded-md">{hashtags.join(' ')}</p>
                            </div>
                        )}
                        {musicSuggestions && musicSuggestions.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-200 mb-1">Músicas Sugeridas (CapCut/TikTok)</h3>
                                <div className="space-y-2">
                                {musicSuggestions.map((music, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm text-gray-300 bg-black/20 p-2 rounded-md">
                                        <span><i className="fas fa-music mr-2 text-teal-400"></i>{music}</span>
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(music);
                                            showToast('Nome da música copiado!');
                                        }} className="text-gray-400 hover:text-white transition-colors">
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onNext}
                    disabled={!hasScenes}
                    className="w-full mt-4 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-glow-primary"
                >
                    Continuar para Estilos <i className="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assistant' && (
          <AIAssistant 
              history={chatHistory}
              isChatting={isChatting}
              onSendMessage={onSendMessageToAssistant}
              generationContext={generationContext}
              onToggleGenerationContext={onToggleGenerationContext}
          />
      )}
    </div>
  );
};
