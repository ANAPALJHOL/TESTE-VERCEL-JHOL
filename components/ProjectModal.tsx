
import React, { useState, useRef } from 'react';
import { ProjectState } from '../types';

interface Props {
  projects: Record<string, ProjectState>;
  activeProjectId: string | null;
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
  onCreateProject: (projectName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const ProjectModal: React.FC<Props> = ({ projects, activeProjectId, onClose, onLoadProject, onCreateProject, onDeleteProject, onRenameProject, onDuplicateProject, onExport, onImport }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);


  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const handleRename = (projectId: string) => {
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  }
  
  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        onImport(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-effect w-full max-w-2xl rounded-lg shadow-2xl flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Gerenciar Projetos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </header>

        <main className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nome do Novo Projeto"
              className="flex-grow bg-white/5 text-white p-2 rounded-md border border-white/20 focus:border-[--color-primary-border]"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button onClick={handleCreate} className="bg-[--color-primary-base] text-white font-bold py-2 px-4 rounded-md hover:bg-[--color-primary-border] disabled:opacity-50" disabled={!newProjectName.trim()}>
              Criar
            </button>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mt-4">Projetos Salvos</h3>
            {Object.keys(projects).map((id) => {
              const project = projects[id];
              return (
              <div key={id} className={`p-3 rounded-md flex items-center justify-between ${id === activeProjectId ? 'bg-[--color-primary-base]/20' : 'bg-white/5'}`}>
                {editingId === id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename(id)}
                    className="bg-black/20 text-white p-1 rounded-md border border-[--color-primary-border] flex-grow mr-2"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium flex-grow mr-2 truncate">{project.projectName}</span>
                )}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {editingId === id ? (
                    <>
                        <button onClick={() => handleRename(id)} className="text-green-400 hover:text-green-300" title="Salvar">
                            <i className="fas fa-check"></i>
                        </button>
                        <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300" title="Cancelar">
                            <i className="fas fa-times"></i>
                        </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onLoadProject(id)} className="text-gray-300 hover:text-white" title="Carregar Projeto">
                        <i className="fas fa-folder-open"></i>
                      </button>
                      <button onClick={() => onDuplicateProject(id)} className="text-gray-300 hover:text-white" title="Duplicar Projeto">
                        <i className="fas fa-copy"></i>
                      </button>
                      <button onClick={() => { setEditingId(id); setEditingName(project.projectName); }} className="text-gray-300 hover:text-white" title="Renomear">
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button onClick={() => onDeleteProject(id)} className="text-red-400 hover:text-red-300" title="Excluir">
                        <i className="fas fa-trash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              );
            })}
            {Object.keys(projects).length === 0 && (
              <p className="text-gray-400 text-center py-4">Nenhum projeto salvo ainda.</p>
            )}
          </div>
        </main>

        <footer className="flex justify-between items-center p-4 border-t border-white/10 bg-black/20 rounded-b-lg">
          <div className="flex gap-2">
            <button onClick={onExport} className="bg-white/10 text-white font-bold py-2 px-4 rounded-md hover:bg-white/20 text-sm">
                <i className="fas fa-file-export mr-2"></i>Exportar Tudo
            </button>
             <button onClick={handleImportClick} className="bg-white/10 text-white font-bold py-2 px-4 rounded-md hover:bg-white/20 text-sm">
                <i className="fas fa-file-import mr-2"></i>Importar
            </button>
            <input type="file" ref={importFileRef} onChange={handleFileChange} className="hidden" accept=".json"/>
          </div>
          <button onClick={onClose} className="bg-white/10 text-white font-bold py-2 px-4 rounded-md hover:bg-white/20">Fechar</button>
        </footer>
      </div>
    </div>
  );
};
