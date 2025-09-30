
import React from 'react';

interface HeaderProps {
  projectName: string;
  step?: 1 | 2 | 3;
  onOpenProjects: () => void;
  onOpenSettings: () => void;
  onRestartProject: () => void;
  onGoHome: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ projectName, step, onOpenProjects, onOpenSettings, onRestartProject, onGoHome, isFocusMode, onToggleFocusMode }) => {
  return (
    <header className="glass-effect flex flex-col sm:flex-row justify-between items-center p-4 rounded-lg mb-6 gap-4 transition-opacity">
      <div className="flex items-center gap-3">
        <i className="fas fa-robot text-[--color-primary-fg] text-2xl"></i>
        <h1 className="text-xl md:text-2xl font-bold text-white p-1 rounded-md flex items-center gap-3">
            <span>{projectName}</span>
            {step && (
              <span className="text-sm font-semibold bg-white/10 text-[--color-primary-fg] rounded-full px-3 py-1">
                PASSO {step}
              </span>
            )}
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={onToggleFocusMode}
          className="p-2 w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title={isFocusMode ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
          aria-label={isFocusMode ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
        >
          <i className={`fas ${isFocusMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button 
          onClick={onGoHome}
          className="p-2 w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title="Voltar à Tela Inicial"
          aria-label="Voltar à Tela Inicial"
        >
          <i className="fas fa-home"></i>
        </button>
         <button 
          onClick={onOpenProjects} 
          className="p-2 w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title="Gerenciar Projetos"
          aria-label="Gerenciar Projetos"
        >
          <i className="fas fa-project-diagram"></i>
        </button>
        <button 
          onClick={onRestartProject} 
          className="p-2 w-10 h-10 rounded-md bg-white/5 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors"
          title="Reiniciar Projeto"
          aria-label="Reiniciar Projeto"
        >
          <i className="fas fa-undo"></i>
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title="Configurações"
          aria-label="Configurações"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
};
