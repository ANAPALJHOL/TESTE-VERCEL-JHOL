
import React, { useState } from 'react';
import { Settings, Prompt, AssistantPersonality } from '../types';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
  history: Record<string, Prompt[]>;
}

const personalityOptions: { id: AssistantPersonality, name: string, description: string }[] = [
    { id: 'creative', name: 'Criativo e Inspirador', description: 'O assistente padrão. Proativo, inspirador e focado em storytelling.' },
    { id: 'technical', name: 'Técnico e Direto', description: 'Respostas concisas e focadas nos aspectos técnicos. Menos conversa, mais dados.' },
    { id: 'sarcastic', name: 'Sarcástico e Desafiador', description: 'Um copiloto com humor seco que irá questionar suas ideias para te forçar a pensar.' }
]

export const SettingsModal: React.FC<Props> = ({ settings, onSave, onClose, history }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);

  const handleSave = () => {
    onSave(currentSettings);
  };
  
  const handleExport = () => {
    if (Object.keys(history).length > 0) {
        try {
            let textOutput = `Jhol Pixel - Histórico de Prompts\n\n`;
            Object.entries(history).forEach(([scene, prompts]) => {
                textOutput += `========================================\n`;
                textOutput += `CENA: ${scene}\n`;
                textOutput += `========================================\n\n`;
                (prompts as Prompt[]).forEach((prompt, index) => {
                    textOutput += `PROMPT ${index + 1}:\n${prompt.text}\n\n`;
                    if (prompt.motionPrompt) {
                        textOutput += `-> MOVIMENTO: ${prompt.motionPrompt}\n\n`;
                    }
                });
            });
            const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jhol-pixel-history.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to export history", e);
            alert("Falha ao exportar histórico.");
        }
    } else {
        alert("Nenhum histórico para exportar.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-effect w-full max-w-lg rounded-lg shadow-2xl flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Configurações</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </header>
        <main className="p-6 space-y-4">
          <div>
            <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-200 mb-1">Prompt Negativo</label>
            <input
              type="text"
              id="negativePrompt"
              value={currentSettings.negativePrompt}
              onChange={(e) => setCurrentSettings({ ...currentSettings, negativePrompt: e.target.value })}
              className="w-full bg-white/5 text-white p-2 rounded-md border border-white/20 focus:border-[--color-primary-border]"
              placeholder="text, watermark, blurry"
            />
             <p className="text-xs text-gray-400 mt-1">Palavras-chave a serem evitadas na geração de imagens (ex: texto, logo, mãos extras).</p>
          </div>
          <div>
            <label htmlFor="globalSuffix" className="block text-sm font-medium text-gray-200 mb-1">Sufixo Global</label>
            <input
              type="text"
              id="globalSuffix"
              value={currentSettings.globalSuffix}
              onChange={(e) => setCurrentSettings({ ...currentSettings, globalSuffix: e.target.value })}
              className="w-full bg-white/5 text-white p-2 rounded-md border border-white/20 focus:border-[--color-primary-border]"
              placeholder="--ar 9:16 --v 6.0"
            />
            <p className="text-xs text-gray-400 mt-1">Parâmetros técnicos adicionados ao final de todos os prompts (ex: --ar 9:16, --v 6.0).</p>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Personalidade do Assistente de IA</label>
             <select
                id="assistant-personality"
                value={currentSettings.assistantPersonality}
                onChange={(e) => setCurrentSettings({ ...currentSettings, assistantPersonality: e.target.value as AssistantPersonality })}
                className="w-full bg-white/5 text-white p-2 rounded-md border border-white/20 focus:border-[--color-primary-border]"
            >
                {personalityOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{personalityOptions.find(o => o.id === currentSettings.assistantPersonality)?.description}</p>
          </div>
          <div>
            <button onClick={handleExport} className="w-full text-left mt-2 p-2 rounded-md text-[--color-primary-fg] hover:bg-white/10 transition">
                <i className="fas fa-file-export mr-2"></i>Exportar Histórico (.txt)
            </button>
          </div>
        </main>
        <footer className="flex justify-end p-4 border-t border-white/10 bg-black/20 rounded-b-lg">
          <button onClick={onClose} className="bg-white/10 text-white font-bold py-2 px-4 rounded-md mr-2 hover:bg-white/20">Cancelar</button>
          <button onClick={handleSave} className="bg-[--color-primary-base] text-white font-bold py-2 px-4 rounded-md hover:bg-[--color-primary-border]">Salvar</button>
        </footer>
      </div>
    </div>
  );
};
