
import React, { useState } from 'react';
import { Prompt } from '../types';

interface PromptCardProps {
    prompt: Prompt;
    isSelected: boolean;
    isFavorite: boolean;
    showToast: (message: string) => void;
    onSelect: () => void;
    onToggleFavorite: () => void;
    onGenerateVariations: () => Promise<void>;
    onGenerateSceneVariation: () => Promise<void>;
    onGenerateMotion: () => Promise<void>;
    onGenerateMotionVariation: () => Promise<void>;
    onGenerateAssets: () => Promise<void>;
    onGenerateSoundEffects: () => Promise<void>;
    onRefine: (modificationRequest: string) => Promise<void>;
    onSetFusionStart: () => void;
    onSetFusionEnd: () => void;
}

const getVariationStyle = (variationType?: 'variation' | 'scene_variation' | 'asset') => {
    switch (variationType) {
        case 'variation':
            return {
                borderColor: 'border-fuchsia-500/60',
                badgeBg: 'bg-fuchsia-500',
                badgeText: 'VARIAÇÃO'
            };
        case 'scene_variation':
            return {
                borderColor: 'border-amber-500/60',
                badgeBg: 'bg-amber-500',
                badgeText: 'CENA ALT.'
            };
        case 'asset':
             return {
                borderColor: 'border-emerald-500/60',
                badgeBg: 'bg-emerald-500',
                badgeText: 'ASSET'
            };
        default:
            return {
                borderColor: 'border-transparent',
                badgeBg: '',
                badgeText: ''
            };
    }
};

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, isSelected, isFavorite, showToast, onSelect, onToggleFavorite, onGenerateVariations, onGenerateSceneVariation, onGenerateMotion, onGenerateMotionVariation, onGenerateAssets, onGenerateSoundEffects, onRefine, onSetFusionStart, onSetFusionEnd }) => {
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isMotionExpanded, setIsMotionExpanded] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [refineInput, setRefineInput] = useState('');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    
    const variationStyle = getVariationStyle(prompt.variationType);

    const handleAction = async (actionName: string, actionFn: () => Promise<void>) => {
        setLoadingAction(actionName);
        try {
            await actionFn();
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRefineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (refineInput.trim()) {
            await handleAction('refine', () => onRefine(refineInput.trim()));
            setRefineInput('');
            setIsRefining(false);
        }
    };
    
    const copyFullPrompt = () => {
        let fullText = prompt.text;
        if(prompt.motionPrompt) {
            fullText += ` --move ${prompt.motionPrompt}`;
        }
        navigator.clipboard.writeText(fullText);
        showToast('Prompt completo copiado!');
    };

    const renderCollapsibleText = (text: string | undefined, isExpanded: boolean, setExpanded: (isExpanded: boolean) => void, type: 'text' | 'motion') => {
        if (!text) return null;
        const isLong = text.length > 150;
        const content = isLong && !isExpanded ? `${text.substring(0, 150)}...` : text;
        const button = isLong ? (
             <button onClick={(e) => { e.stopPropagation(); setExpanded(!isExpanded); }} className="text-[--color-primary-fg] hover:text-[--color-primary-border] ml-2 text-xs font-semibold">
                {isExpanded ? 'Ver menos' : 'Ver mais'}
            </button>
        ) : null;
        const baseClasses = "whitespace-pre-wrap";
        const typeClasses = type === 'motion' ? 'text-sm text-[--color-primary-fg] break-all' : 'text-gray-200 flex-grow';
        
        return (
            <p className={`${baseClasses} ${typeClasses}`}>
                {type === 'motion' && <i className="fas fa-video mr-2"></i>}
                {content}
                {button}
            </p>
        )
    };
    
    const ActionButton: React.FC<{name: string, title: string, icon: string, colorClass?: string, onClick: () => void}> = ({ name, title, icon, colorClass, onClick }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }} 
            title={title} 
            disabled={!!loadingAction}
            className={`transition-colors disabled:opacity-50 ${colorClass || 'hover:text-white'}`}
        >
            {loadingAction === name ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className={`${icon} mr-1`}></i>}
            {title}
        </button>
    );

    return (
        <div 
            className={`glass-effect p-3 rounded-lg flex flex-col space-y-3 animate-fade-in-up cursor-pointer transition-all duration-200 border-2 relative ${variationStyle.borderColor} ${isSelected ? 'ring-2 ring-yellow-400' : 'hover:border-white/20'}`}
            onClick={onSelect}
        >
            {prompt.variationType && (
                 <div className={`absolute -top-2 -left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${variationStyle.badgeBg}`}>
                    {variationStyle.badgeText}
                </div>
            )}
           
            {renderCollapsibleText(prompt.text, isTextExpanded, setIsTextExpanded, 'text')}
            
            {prompt.motionPrompt && (
                <div className="bg-black/20 p-2 rounded-md border border-white/10 space-y-2">
                    {renderCollapsibleText(prompt.motionPrompt, isMotionExpanded, setIsMotionExpanded, 'motion')}
                    <div className="flex items-center gap-3 text-gray-400 text-xs border-t border-white/10 pt-2">
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(prompt.motionPrompt || ''); showToast('Movimento copiado!');}} title="Copiar Movimento" className="hover:text-white transition-colors"><i className="fas fa-copy mr-1"></i>Copiar</button>
                        <ActionButton name="motionVariation" title="Variar" icon="fas fa-sync-alt" onClick={() => handleAction('motionVariation', () => onGenerateMotionVariation())} />
                    </div>
                </div>
            )}
             {isRefining && (
                <form onSubmit={handleRefineSubmit} className="bg-cyan-900/20 p-2 rounded-md border border-cyan-500/30 animate-fade-in space-y-2">
                    <label htmlFor={`refine-${prompt.id}`} className="text-xs font-semibold text-cyan-300">Refinar Prompt:</label>
                    <div className="flex gap-2">
                        <input
                            id={`refine-${prompt.id}`}
                            type="text"
                            value={refineInput}
                            onChange={(e) => setRefineInput(e.target.value)}
                            placeholder="Ex: remova o personagem, adicione chuva..."
                            className="w-full bg-black/20 text-white p-1 rounded-md text-sm border border-white/20 focus:border-cyan-500"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            disabled={loadingAction === 'refine'}
                        />
                        <button type="submit" className="bg-cyan-500 text-white px-2 rounded-md hover:bg-cyan-600 text-sm" disabled={loadingAction === 'refine'}>
                            {loadingAction === 'refine' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                        </button>
                    </div>
                </form>
            )}

            {prompt.soundEffects && prompt.soundEffects.length > 0 && (
                <div className="bg-green-900/20 p-2 rounded-md border border-green-500/30 space-y-2 animate-fade-in">
                    <h4 className="text-xs font-semibold text-green-300">Sugestões de Efeitos Sonoros:</h4>
                    <ul className="space-y-1">
                        {prompt.soundEffects.map((sfx, index) => (
                            <li key={index} className="flex justify-between items-center text-sm text-gray-300">
                                <span>{sfx}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(sfx); showToast('Efeito sonoro copiado!'); }} title="Copiar Efeito Sonoro" className="text-gray-400 hover:text-white transition-colors text-xs ml-2">
                                    <i className="fas fa-copy"></i>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-300 text-sm border-t border-white/10 pt-3 mt-auto">
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(prompt.text); showToast('Prompt copiado!'); }} title="Copiar" className="hover:text-white transition-colors"><i className="fas fa-copy mr-1"></i>Copiar</button>
                <button onClick={(e) => { e.stopPropagation(); copyFullPrompt(); }} title="Copiar Prompt e Movimento" className="hover:text-white transition-colors"><i className="fas fa-film mr-1"></i>Copiar Tudo</button>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} title={isFavorite ? "Remover Favorito" : "Favoritar"} className={`transition-colors ${isFavorite ? 'text-yellow-400' : 'hover:text-yellow-400'}`}>
                    <i className={`fas fa-star mr-1`}></i>Favorito
                </button>
                 <button onClick={(e) => { e.stopPropagation(); setIsRefining(!isRefining); }} title="Refinar com IA" className="transition-colors text-cyan-400 hover:text-cyan-300">
                    <i className="fas fa-wand-magic-sparkles mr-1"></i>Refinar
                </button>
                <ActionButton name="variations" title="Variações" icon="fas fa-magic" onClick={() => handleAction('variations', onGenerateVariations)} />
                <ActionButton name="sceneVariation" title="Cena" icon="fas fa-dice" onClick={() => handleAction('sceneVariation', onGenerateSceneVariation)} />
                <ActionButton name="asset" title="Asset" icon="fas fa-cut" onClick={() => handleAction('asset', onGenerateAssets)} />
                <ActionButton name="motion" title="Movimento" icon="fas fa-camera" onClick={() => handleAction('motion', onGenerateMotion)} />
                <ActionButton name="sfx" title="Sonoplastia" icon="fas fa-volume-up" colorClass="text-green-400 hover:text-green-300" onClick={() => handleAction('sfx', onGenerateSoundEffects)} />
            </div>
             <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-300 text-sm border-t border-[--color-primary-base]/50 pt-2 mt-2">
                 <button onClick={(e) => { e.stopPropagation(); onSetFusionStart(); }} className="text-sm bg-[--color-primary-base]/20 text-[--color-primary-fg] px-2 py-1 rounded hover:bg-[--color-primary-base]/40 transition"><i className="fas fa-flag-checkered mr-2"></i>Definir como Início</button>
                 <button onClick={(e) => { e.stopPropagation(); onSetFusionEnd(); }} className="text-sm bg-[--color-primary-base]/20 text-[--color-primary-fg] px-2 py-1 rounded hover:bg-[--color-primary-base]/40 transition"><i className="fas fa-bullseye mr-2"></i>Definir como Fim</button>
            </div>
        </div>
    );
};
