
import React, { useState, useMemo } from 'react';
import { AppState, Style } from '../types';
import { StyleAssistant } from './StyleAssistant';

interface Props {
  state: AppState;
  onSelectStyle: (style: Style, isMultiSelect: boolean) => void;
  onSetCustomStylePrompt: (prompt: string) => void;
  onRegenerate: (isRegenerating: boolean) => void;
  onGenerateVariations: (style: Style) => void;
  onToggleFavorite: (style: Style) => void;
  onAddNewStyleProposal: (style: Omit<Style, 'id'>) => Style;
  onConfirm: () => void;
  onBack: () => void;
  showToast: (message: string) => void;
}

const StyleCard: React.FC<{ 
    style: Style; 
    index: number;
    isSelected: boolean; 
    isFavorite: boolean;
    onSelect: (e: React.MouseEvent) => void; 
    onCopy: () => void;
    onGenerateVariations: () => void;
    onToggleFavorite: () => void;
}> = ({ style, index, isSelected, isFavorite, onSelect, onCopy, onGenerateVariations, onToggleFavorite }) => {
  const isGenerated = !style.isPredefined;
  const isExtra = !!style.isExtra;

  let borderColor = 'border-transparent';
  let hoverBorderColor = 'hover:border-purple-400';
  let selectedBorderColor = 'border-purple-500';
  let selectedBgColor = 'bg-purple-600/30';
  let titleColor = 'text-purple-400';

  if (isExtra) {
      hoverBorderColor = 'hover:border-[--color-secondary-border]';
      selectedBorderColor = 'border-[--color-secondary-border]';
      selectedBgColor = 'bg-[--color-secondary-base]/30';
      titleColor = 'text-[--color-secondary-fg]';
  } else if (isGenerated) {
      hoverBorderColor = 'hover:border-teal-400';
      selectedBorderColor = 'border-teal-500';
      selectedBgColor = 'bg-teal-600/30';
      titleColor = 'text-teal-400';
  }

  const cardClassName = `style-card p-4 rounded-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative group animate-fade-in-up border-2 ${
    isSelected
      ? `${selectedBorderColor} ${selectedBgColor} scale-105 shadow-lg`
      : `${borderColor} glass-effect ${hoverBorderColor}`
  }`;
  
  return (
    <div 
      onClick={onSelect}
      className={cardClassName}
    >
       {isExtra && (
        <div className="absolute top-2 left-2 bg-[--color-secondary-base] text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1.5">
          <i className="fas fa-bolt"></i> SURPRESA
        </div>
      )}
       {!isExtra && isGenerated && (
        <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          NOVO
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-2">
           <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
                title={isFavorite ? "Remover dos Favoritos" : "Salvar nos Favoritos"}
            >
                <i className={`fas fa-star ${isFavorite ? 'text-yellow-400' : ''}`}></i>
            </button>
      </div>

      <div>
        <h3 className="font-bold text-lg text-white mb-1 pr-8 flex items-start">
            <span className={`font-black text-xl mr-2 ${titleColor}`}>{String(index + 1).padStart(2, '0')}.</span>
            <span>{style.name}</span>
        </h3>
        <p className="text-xs text-gray-300 italic break-words">"{style.prompt}"</p>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-wrap gap-2">
          {style.tags.map(tag => (
            <span key={tag} className="text-xs bg-white/10 text-gray-200 px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-sm border-t border-white/10 pt-2 mt-auto">
            <button onClick={(e) => {e.stopPropagation(); onCopy()}} className="hover:text-white transition-colors" title="Copiar Prompt"><i className="fas fa-copy mr-1"></i> Copiar</button>
            <button onClick={(e) => {e.stopPropagation(); onGenerateVariations()}} className="hover:text-white transition-colors" title="Gerar Variações"><i className="fas fa-magic mr-1"></i> Variações</button>
        </div>
      </div>
    </div>
  )
}

export const Step2_StyleSelection: React.FC<Props> = ({ state, onSelectStyle, onSetCustomStylePrompt, onRegenerate, onGenerateVariations, onToggleFavorite, onAddNewStyleProposal, onConfirm, onBack, showToast }) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'favorites'>('proposals');
  const [searchTerm, setSearchTerm] = useState('');
  const activeProject = state.projects[state.activeProjectId!];
  const isCustomPromptActive = activeProject.customStylePrompt.trim().length > 0;

  const handleCopy = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('Prompt de estilo copiado!');
  };

  const handleStyleGenerated = (style: Omit<Style, 'id'>) => {
      const newStyle = onAddNewStyleProposal(style);
      onSelectStyle(newStyle, false);
      showToast(`Estilo "${newStyle.name}" gerado e selecionado!`);
      setActiveTab('proposals');
  };

  const filteredList = useMemo(() => {
    const sourceList = activeTab === 'proposals' ? activeProject.styleProposals : activeProject.favoriteStyles;
    if (!searchTerm) {
        return sourceList;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return sourceList.filter(style => 
        style.name.toLowerCase().includes(lowercasedFilter) || 
        style.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter))
    );
  }, [activeTab, searchTerm, activeProject.styleProposals, activeProject.favoriteStyles]);

  const listTitle = activeTab === 'proposals' ? "Propostas Geradas" : "Meus Estilos Favoritos";

  return (
    <div className="max-w-7xl mx-auto flex flex-col space-y-6 animate-fade-in">
        <div>
            <h2 className="text-xl font-semibold text-gray-100">Passo 2: Seleção de Estilo Visual</h2>
            <p className="text-gray-300">Escolha um estilo, cole o seu próprio, ou segure <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl/Cmd</kbd> para selecionar e mesclar dois.</p>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect p-4 rounded-lg space-y-3">
            <label htmlFor="custom-prompt" className="block text-lg font-semibold text-gray-100">
            Ou cole seu prompt personalizado
            </label>
            <textarea
            id="custom-prompt"
            value={activeProject.customStylePrompt}
            onChange={(e) => onSetCustomStylePrompt(e.target.value)}
            placeholder="Ex: cinematic, hyperrealistic, 8k, dramatic lighting..."
            className="w-full bg-black/20 text-white p-3 rounded-lg focus:border-purple-500 transition duration-200 h-24 custom-scrollbar"
            />
            <p className="text-xs text-gray-400 mt-2">
            Digitar aqui desmarcará qualquer estilo selecionado abaixo.
            </p>
        </div>
         <StyleAssistant 
            script={activeProject.script}
            onStyleGenerated={handleStyleGenerated}
            showToast={showToast}
         />
      </div>

      {activeProject.selectedStyles.length > 0 && !isCustomPromptActive && (
          <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Selecionados:</h3>
              <div className="glass-effect p-4 rounded-lg flex flex-col sm:flex-row gap-4">
                  {activeProject.selectedStyles.map((style, index) => (
                      <div key={style.id} className="bg-black/20 p-3 rounded-lg flex-grow w-full">
                          <h4 className="font-bold text-white">{style.name} {activeProject.selectedStyles.length > 1 && `(${index + 1})`}</h4>
                          <p className="text-xs text-gray-300 italic line-clamp-2">"{style.prompt}"</p>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex border-b border-white/10">
            <button onClick={() => setActiveTab('proposals')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'proposals' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>Propostas</button>
            <button onClick={() => setActiveTab('favorites')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'favorites' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>Favoritos ({activeProject.favoriteStyles.length})</button>
        </div>
         <div className="relative">
            <input 
                type="text"
                placeholder="Buscar por nome ou tag..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/5 text-white p-2 rounded-md border border-white/20 focus:border-purple-500 pl-8 w-full sm:w-64"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <div className={`${isCustomPromptActive ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <h3 className="font-semibold mb-4 text-gray-200">{listTitle} ({filteredList.length})</h3>
        {filteredList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredList.map((style, index) => (
                <StyleCard 
                    key={style.id} 
                    style={style} 
                    index={index}
                    isSelected={activeProject.selectedStyles.some(s => s.id === style.id)}
                    isFavorite={activeProject.favoriteStyles.some(s => s.id === style.id)}
                    onSelect={(e) => onSelectStyle(style, e.ctrlKey || e.metaKey)}
                    onCopy={() => handleCopy(style.prompt)}
                    onGenerateVariations={() => onGenerateVariations(style)}
                    onToggleFavorite={() => onToggleFavorite(style)}
                />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 glass-effect rounded-lg">
                {searchTerm ? (
                     <p className="text-gray-400">{`Nenhum estilo encontrado para "${searchTerm}".`}</p>
                ) : (
                    activeTab === 'proposals' ? (
                        <p className="text-gray-400">Nenhuma proposta gerada ainda.</p>
                    ) : (
                        <div className="flex flex-col items-center">
                             <i className="fas fa-star text-4xl text-gray-600 mb-4"></i>
                             <h4 className="font-semibold text-lg text-gray-300">Nenhum Estilo Favorito</h4>
                             <p className="text-gray-400 mt-1">Clique na estrela <i className="fas fa-star text-xs"></i> em um estilo para salvá-lo aqui.</p>
                        </div>
                    )
                )}
            </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4 sticky bottom-0 py-4 bg-[#0D1B2A]/50 backdrop-blur-sm">
        <button onClick={onBack} className="w-full sm:w-auto bg-white/5 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 transition">
          <i className="fas fa-arrow-left mr-2"></i> Voltar
        </button>
        {activeTab === 'proposals' && (
            <button onClick={() => onRegenerate(true)} className="w-full sm:w-auto bg-white/5 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 transition">
            <i className="fas fa-sync-alt mr-2"></i> Gerar Novas Propostas
            </button>
        )}
        <button 
          onClick={onConfirm}
          disabled={activeProject.selectedStyles.length === 0 && !isCustomPromptActive}
          className="w-full sm:w-auto flex-grow text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed btn-glow-purple"
        >
          {activeProject.selectedStyles.length > 1 ? 'Mesclar Estilos e Continuar' : 'Confirmar Estilo e Gerar'} <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};
