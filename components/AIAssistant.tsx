
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface Props {
  history: ChatMessage[];
  isChatting: boolean;
  onSendMessage: (message: string) => void;
  generationContext: string[];
  onToggleGenerationContext: (context: string) => void;
}

export const AIAssistant: React.FC<Props> = ({ history, isChatting, onSendMessage, generationContext, onToggleGenerationContext }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isChatting) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-effect rounded-lg p-4 flex flex-col h-[70vh] animate-fade-in-up">
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex flex-col items-start group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-[--color-primary-base] text-white' : 'bg-gray-700 text-gray-200'}`}>
              <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.parts.map(p => p.text).join('').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            </div>
             {msg.role === 'model' && (
                <button 
                  onClick={() => handleCopy(msg.parts.map(p => p.text).join(''))}
                  className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-copy mr-1"></i> Copiar
                </button>
             )}
             {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="max-w-xl w-full mt-2 p-3 rounded-lg bg-black/20 border border-white/10 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-200">Sugestões da IA:</h4>
                    <ul className="space-y-2">
                        {msg.suggestions.map((suggestion, sIndex) => {
                            const isActive = generationContext.includes(suggestion);
                            return (
                                <li key={sIndex} className="flex justify-between items-start gap-3 p-2 rounded-md bg-white/5">
                                    <p className="text-sm text-gray-300 flex-grow" dangerouslySetInnerHTML={{ __html: suggestion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                    <button
                                        onClick={() => onToggleGenerationContext(suggestion)}
                                        className={`text-xs font-bold py-1 px-3 rounded-md transition-colors flex-shrink-0 ${isActive ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
                                    >
                                      {isActive ? <><i className="fas fa-check mr-1.5"></i>Ativa</> : <><i className="fas fa-plus mr-1.5"></i>Aplicar Diretriz</>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
             )}
          </div>
        ))}
        {isChatting && history.length > 0 && history[history.length - 1].role === 'user' && (
            <div className="flex justify-start">
                 <div className="max-w-xl p-3 rounded-lg bg-gray-700 text-gray-200">
                    <span className="animate-pulse">...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-white/10 pt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Peça ideias, ajuda com o roteiro..."
          className="w-full bg-black/20 text-white p-3 rounded-lg focus:border-[--color-primary-border] focus:ring-[--color-primary-border] transition duration-200 custom-scrollbar resize-none"
          rows={2}
          disabled={isChatting}
        />
        <button type="submit" disabled={isChatting || !input.trim()} className="bg-[--color-primary-base] text-white font-bold p-3 rounded-lg hover:bg-[--color-primary-border] transition disabled:opacity-50 disabled:cursor-not-allowed h-full">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};
