
import React, { useState } from 'react';
import { Prompt } from '../types';
import { generateFusionMotionPrompt, generateMotionVariation } from '../services/geminiService';

interface Props {
  startPrompt: Prompt | null;
  endPrompt: Prompt | null;
  onClearStart: () => void;
  onClearEnd: () => void;
}

const PromptDropZone: React.FC<{ prompt: Prompt | null, title: string, onClear: () => void }> = ({ prompt, title, onClear }) => (
  <div className="bg-black/20 p-3 rounded-lg border-2 border-dashed border-white/20 min-h-[100px] flex flex-col justify-between">
    <div>
      <h4 className="font-semibold text-gray-300">{title}</h4>
      {prompt ? (
        <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{prompt.text}"</p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Selecione um prompt...</p>
      )}
    </div>
    {prompt && (
      <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 self-end mt-2">Limpar</button>
    )}
  </div>
);


export const MotionFusionPanel: React.FC<Props> = ({ startPrompt, endPrompt, onClearStart, onClearEnd }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVarying, setIsVarying] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!startPrompt || !endPrompt) return;
    setIsLoading(true);
    setError(null);
    setResult('');
    try {
      const motionPrompt = await generateFusionMotionPrompt(startPrompt.text, endPrompt.text);
      setResult(motionPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar o prompt de movimento.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVary = async () => {
    if (!result) return;
    setIsVarying(true);
    setError(null);
    try {
        const newVariation = await generateMotionVariation(result);
        setResult(newVariation);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao gerar variação.');
    } finally {
        setIsVarying(false);
    }
  };

  const handleCopy = () => {
      if(!result) return;
      navigator.clipboard.writeText(result);
  }

  const charCount = result.length;
  const isOverLimit = charCount > 950;

  return (
    <aside className="glass-effect p-4 rounded-lg flex flex-col space-y-4 lg:sticky lg:top-8 h-fit animate-fade-in">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <i className="fas fa-film text-[--color-primary-fg]"></i>
        Dreamia Motion Fusion
      </h3>

      <div className="space-y-3">
        <PromptDropZone prompt={startPrompt} title="1. Cena Inicial" onClear={onClearStart} />
        <PromptDropZone prompt={endPrompt} title="2. Cena Final" onClear={onClearEnd} />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!startPrompt || !endPrompt || isLoading}
        className="w-full text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed btn-glow-primary"
      >
        {isLoading ? 'Gerando...' : 'Gerar Movimento de Fusão'}
        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-magic-sparkles'} ml-2`}></i>
      </button>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      {result && (
        <div className="space-y-2 animate-fade-in">
          <h4 className="font-semibold text-gray-300">Prompt de Movimento Gerado:</h4>
          <textarea
            value={result}
            readOnly
            className="w-full bg-black/20 text-white p-2 rounded-md border border-white/20 text-sm h-32 custom-scrollbar resize-none"
          />
          <div className="flex justify-between items-center text-xs">
             <div className="flex gap-3">
                 <button onClick={handleCopy} className="text-gray-300 hover:text-white"><i className="fas fa-copy mr-1"></i> Copiar</button>
                 <button onClick={handleVary} disabled={isVarying} className="text-gray-300 hover:text-white disabled:opacity-50">
                     {isVarying ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-sync-alt mr-1"></i>}
                     Variar
                 </button>
             </div>
             <span className={`${isOverLimit ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                {charCount} / 950 caracteres
             </span>
          </div>
        </div>
      )}
    </aside>
  );
};
