
import React, { useState } from 'react';
import { AppState } from '../types';
import { generatePromptsForCustomScene } from '../services/geminiService';

interface Props {
    state: AppState;
    characterBrief: string;
    showToast: (message: string) => void;
}

export const CustomPromptGenerator: React.FC<Props> = ({ state, characterBrief, showToast }) => {
    const [customScene, setCustomScene] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] : null;

    const handleGenerate = async () => {
        if (!activeProject || !customScene.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedPrompts([]);

        try {
            const prompts = await generatePromptsForCustomScene(
                activeProject.script,
                customScene,
                activeProject.selectedStyles,
                state.settings.negativePrompt,
                state.settings.globalSuffix,
                characterBrief
            );
            if (!prompts || prompts.length === 0) {
                 throw new Error("A IA não retornou prompts. Tente novamente.");
            }
            setGeneratedPrompts(prompts);
            showToast('Prompts personalizados gerados!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao gerar prompts.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Prompt copiado!');
    };

    return (
        <aside className="glass-effect p-4 rounded-lg flex flex-col space-y-4 h-fit mt-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-pencil-ruler text-teal-400"></i>
                Gerador de Prompt Avulso
            </h3>
            <p className="text-sm text-gray-400">Crie prompts para qualquer frase ou ideia, usando o estilo visual atual do projeto.</p>
            <textarea
                value={customScene}
                onChange={(e) => setCustomScene(e.target.value)}
                placeholder="Digite uma frase ou descreva uma cena aqui..."
                className="w-full bg-black/20 text-white p-2 rounded-lg focus:border-teal-500 transition duration-200 h-24 custom-scrollbar"
                disabled={isLoading}
            />
            <button
                onClick={handleGenerate}
                disabled={!customScene.trim() || isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed btn-glow-cyan"
            >
                {isLoading ? 'Gerando...' : 'Gerar Prompts'}
                <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-magic'} ml-2`}></i>
            </button>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {generatedPrompts.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                    <h4 className="font-semibold text-gray-300">Resultados:</h4>
                    {generatedPrompts.map((prompt, index) => (
                        <div key={index} className="bg-black/20 p-2 rounded-md text-sm text-gray-300 flex justify-between items-start gap-2">
                           <p className="flex-grow break-words">{prompt}</p>
                           <button onClick={() => handleCopy(prompt)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" title="Copiar Prompt">
                               <i className="fas fa-copy"></i>
                           </button>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
};
