
import React, { useState, useEffect } from 'react';

interface Props {
    brief: string;
    onUpdateBrief: (newBrief: string) => void;
}

export const ConsistencyBrief: React.FC<Props> = ({ brief, onUpdateBrief }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localBrief, setLocalBrief] = useState(brief);

    useEffect(() => {
        setLocalBrief(brief);
    }, [brief]);
    
    const handleBriefChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newBrief = e.target.value;
        setLocalBrief(newBrief);
        onUpdateBrief(newBrief);
    };

    return (
        <div className="w-full border-t border-white/10 pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left">
                <h4 className="text-sm font-medium text-gray-300">
                    <i className="fas fa-user-shield mr-2 text-[--color-secondary-fg]"></i>
                    Módulo de Consistência (Personagens, Cenários)
                </h4>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
            </button>
            {isExpanded && (
                <div className="mt-2 animate-fade-in-up space-y-2">
                    <p className="text-xs text-gray-400">Descreva personagens principais, objetos recorrentes ou cenários para que a IA os mantenha consistentes em todos os prompts. Salva automaticamente.</p>
                    <textarea
                        value={localBrief}
                        onChange={handleBriefChange}
                        className="w-full bg-black/20 text-white p-2 rounded-md border border-white/20 focus:border-[--color-secondary-border] text-sm h-24 custom-scrollbar"
                        placeholder="Ex: John, um detetive de 40 anos, casaco marrom, sempre cansado. A cidade é Neo-Kyoto, chuvosa e com hologramas."
                    />
                </div>
            )}
        </div>
    );
};
