
import React, { useState, useRef, useEffect } from 'react';
import { Style } from '../types';
import { generateSingleStyleFromChat } from '../services/geminiService';

type AssistantMessage = 
  | { type: 'text', role: 'user' | 'model', content: string }
  | { type: 'style', role: 'model', style: Omit<Style, 'id'> };

interface Props {
  script: string;
  onStyleGenerated: (style: Omit<Style, 'id'>) => void;
  showToast: (message: string) => void;
}

export const StyleAssistant: React.FC<Props> = ({ script, onStyleGenerated, showToast }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: AssistantMessage = { type: 'text', role: 'user', content: input };
      setHistory(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const style = await generateSingleStyleFromChat(input, script);
        const styleMessage: AssistantMessage = { type: 'style', role: 'model', style };
        setHistory(prev => [...prev, styleMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao gerar o estilo.';
        const textMessage: AssistantMessage = { type: 'text', role: 'model', content: `Desculpe, não consegui gerar o estilo. Erro: ${errorMessage}` };
        setHistory(prev => [...prev, textMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="glass-effect rounded-lg p-4 flex flex-col h-full animate-fade-in-up">
       <h3 className="text-lg font-semibold text-gray-100 mb-2">
         <i className="fas fa-magic-sparkles text-teal-300 mr-2"></i>Assistente de Estilo
      </h3>
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-[150px]">
        {history.length === 0 && (
            <div className="flex items-center justify-center h-full text-center text-gray-400 text-sm">
                <p>Peça um estilo visual para seu roteiro.<br/>Ex: "Crie um estilo de anime dos anos 80 para um vídeo sobre carros."</p>
            </div>
        )}
        {history.map((msg, index) => (
          <div key={index} className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             {msg.type === 'text' && (
                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
             )}
             {msg.type === 'style' && (
                <div className="max-w-md p-3 rounded-lg bg-teal-900/50 border border-teal-500/50 w-full">
                    <p className="text-sm text-gray-200 mb-2">Aqui está uma sugestão de estilo para você:</p>
                    <div className="bg-black/20 p-2 rounded-md space-y-1">
                        <h4 className="font-bold text-white">{msg.style.name}</h4>
                        <p className="text-xs text-gray-300 italic">"{msg.style.prompt}"</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                            {msg.style.tags.map(tag => (
                                <span key={tag} className="text-xs bg-white/10 text-gray-200 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                         <button 
                            onClick={() => onStyleGenerated(msg.style)}
                            className="text-sm bg-teal-500 text-white font-bold py-1 px-3 rounded-md hover:bg-teal-600 transition"
                        >
                           <i className="fas fa-check mr-1"></i> Usar este Estilo
                        </button>
                         <button 
                            onClick={() => {
                                navigator.clipboard.writeText(msg.style.prompt);
                                showToast("Prompt de estilo copiado!");
                            }}
                            className="text-sm bg-white/10 text-white py-1 px-3 rounded-md hover:bg-white/20 transition"
                        >
                           <i className="fas fa-copy mr-1"></i> Copiar
                        </button>
                    </div>
                </div>
             )}
          </div>
        ))}
         {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xl p-3 rounded-lg bg-gray-700 text-gray-200">
                    <span className="animate-pulse">Gerando estilo...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-white/10 pt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Peça um estilo..."
          className="w-full bg-black/20 text-white p-2 rounded-lg focus:border-teal-500 transition duration-200"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="bg-teal-600 text-white font-bold p-2 w-12 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
};
