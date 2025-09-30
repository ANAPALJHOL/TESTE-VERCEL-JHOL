
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { AppState, ProjectState, Style, Prompt, ChatMessage, AssistantPersonality, ViralAnalysis, PlotTwist, ChannelId, Language, SegmentationConfig } from './types';
import { segmentScript, translateScenes, generateStyles, generateStyleVariations, getStylePrompt, generatePromptsForScene, generateVariations, generateSceneVariation, generateMotionPrompt, generateMotionVariation, generateAssetsForScene, refinePrompt, generateSoundEffects, generateSocialMediaContent, DNACOSMICO_STYLE_PROMPT, analyzeScriptStrength, generateWhatIfPrompts, generateViralAnalysis, generatePlotTwists } from './services/geminiService';
import { Step1_Workspace } from './components/Step1_Workspace';
import { Step2_StyleSelection } from './components/Step2_StyleSelection';
import { Step3_Workspace } from './components/Step3_Workspace';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectModal } from './components/ProjectModal';
import { Toast } from './components/Toast';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getApiKey } from './utils';


const createNewProject = (name: string): ProjectState => ({
  step: 1,
  projectName: name,
  script: '',
  channel: null,
  language: 'pt-br',
  segmentationConfig: { mode: 'automatic', sceneCount: 25, customScenes: '' },
  segmentedScenes: { 'pt-br': [], 'en': [] },
  caption: '',
  hashtags: [],
  musicSuggestions: [],
  viralAnalysis: undefined,
  characterBrief: '',
  styleProposals: [],
  selectedStyles: [],
  customStylePrompt: '',
  favoriteStyles: [],
  promptHistory: {},
  favorites: [],
  chatHistory: [{ role: 'model', parts: [{ text: "Olá! Sou seu copiloto criativo. Como posso ajudar a transformar seu roteiro em uma obra de arte visual hoje?" }] }],
  chatVersion: 1,
  generationContext: [], // Initial empty context
});

const getInitialState = (): AppState => {
  try {
    if (typeof window !== 'undefined') {
      const savedStateJSON = localStorage.getItem('jhol-pixel-app-state-v3');
      if (savedStateJSON) {
        const savedState: AppState = JSON.parse(savedStateJSON);
        
        // Migration for project properties
        if (savedState.projects) {
            Object.values(savedState.projects).forEach((project: any) => {
                if (!project) return;
                
                if (Array.isArray(project.segmentedScenes)) {
                    console.log(`Migrating project "${project.projectName}" scene structure.`);
                    project.segmentedScenes = { 'pt-br': project.segmentedScenes, 'en': [] };
                }
                 if (!project.segmentedScenes) {
                    project.segmentedScenes = { 'pt-br': [], 'en': [] };
                 }
                 if (!project.viralAnalysis) {
                     project.viralAnalysis = undefined;
                 }
                 if (!project.characterBrief) {
                    project.characterBrief = '';
                 }
                 if (!project.chatVersion) {
                    project.chatVersion = 1;
                 }
                 if (project.segmentationConfig && !project.segmentationConfig.mode) {
                    console.log(`Migrating project "${project.projectName}" segmentation config.`);
                    project.segmentationConfig.mode = project.segmentationConfig.isAutomatic ? 'automatic' : 'manual';
                    delete project.segmentationConfig.isAutomatic;
                    project.segmentationConfig.customScenes = '';
                 }
                 if (!project.generationContext) {
                      project.generationContext = [];
                 }
                 if (!project.musicSuggestions) {
                      project.musicSuggestions = [];
                 }
            });
        }
         
        if (savedState.settings && savedState.settings.assistantPersonality === undefined) {
            savedState.settings.assistantPersonality = 'creative';
        }

        if (savedState.projects && Object.keys(savedState.projects).length > 0) {
          return {
            ...savedState,
            isLoading: false,
            loadingMessage: '',
            error: null,
            toast: null,
            isSettingsOpen: false,
            isProjectModalOpen: false,
            isChatting: false,
            isFocusMode: false,
            showWelcomeScreen: savedState.showWelcomeScreen !== false,
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse saved state:", error);
  }
  
  const firstProjectId = crypto.randomUUID();
  const firstProject = createNewProject('Meu Primeiro Projeto');
  return {
    projects: { [firstProjectId]: firstProject },
    activeProjectId: firstProjectId,
    settings: { negativePrompt: '', globalSuffix: '--ar 9:16 --v 6.0', assistantPersonality: 'creative' },
    isLoading: false,
    loadingMessage: '',
    error: null,
    toast: null,
    isSettingsOpen: false,
    isProjectModalOpen: false,
    isChatting: false,
    isFocusMode: false,
    showWelcomeScreen: true,
  };
};

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const cancelGenerationRef = useRef(false);
  
  useEffect(() => {
    setState(getInitialState());
  }, []);

  const activeProject = state?.activeProjectId ? state.projects[state.activeProjectId] : null;

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsInitialized(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (activeProject?.channel) {
      document.body.setAttribute('data-theme', activeProject.channel);
    } else {
      document.body.setAttribute('data-theme', 'dnacosmico');
    }
  }, [activeProject?.channel, state]);
  
  useEffect(() => {
    if (!state) return;
    if (state.isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  }, [state?.isFocusMode, state]);

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey || !activeProject || !state) return;

    const getSystemInstruction = (personality: AssistantPersonality): string => {
        switch (personality) {
            case 'technical':
                return 'Você é um assistente técnico, direto ao ponto. Sua especialidade é a engenharia de prompts. Analise o roteiro do usuário e forneça diretrizes visuais e estilísticas precisas e concisas para a geração de imagens. Evite opiniões sobre a narrativa.';
            case 'sarcastic':
                return 'Você é um diretor de arte cínico e sarcástico. Seu humor é seco. Analise o roteiro e aponte, com ironia, as oportunidades visuais que o usuário está perdendo. Suas sugestões, apesar de sarcásticas, devem ser diretrizes de prompt visualmente poderosas. Você não se importa com a história, apenas com a imagem.';
            case 'creative':
            default:
                return 'Você é um "Copiloto Criativo", um especialista em transformar roteiros em narrativas visuais. Sua função é analisar o roteiro fornecido para extrair o máximo potencial visual, sugerindo diretrizes de estilo, enquadramento, ritmo e composição para a geração dos prompts de imagem. Você NUNCA sugere alterações no texto do roteiro; em vez disso, você oferece ideias sobre COMO representar visualmente a história existente da maneira mais impactante possível.';
        }
    };

    const ai = new GoogleGenAI({ apiKey });
    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(state.settings.assistantPersonality),
      },
       history: activeProject.chatHistory.slice(0, -1)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.activeProjectId, state?.settings.assistantPersonality, activeProject?.chatVersion, state]);

  useEffect(() => {
    if (!state) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jhol-pixel-app-state-v3', JSON.stringify(state));
      }
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, [state]);

  if (!state) {
    return <SplashScreen />;
  }

  const updateState = <K extends keyof AppState,>(key: K, value: AppState[K]) => {
    setState(prevState => ({ ...prevState!, [key]: value, error: null }));
  };

  const updateActiveProjectState = (update: Partial<ProjectState>) => {
    if (!state.activeProjectId) return;
    setState(prevState => ({
      ...prevState!,
      projects: {
        ...prevState!.projects,
        [state.activeProjectId!]: {
          ...prevState!.projects[state.activeProjectId!],
          ...update,
        }
      }
    }));
  };
  
  const showToast = (message: string) => {
    updateState('toast', message);
    setTimeout(() => updateState('toast', null), 3000);
  };

  const handleApiCall = async <T,>(apiFunc: () => Promise<T>, loadingMessage: string): Promise<T | null> => {
    cancelGenerationRef.current = false;
    setState(s => ({...s!, isLoading: true, loadingMessage, error: null}));
    try {
      const result = await apiFunc();
      if (cancelGenerationRef.current) return null;
      return result;
    } catch (err) {
       if (cancelGenerationRef.current) return null;
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setState(s => ({...s!, error: errorMessage}));
      return null;
    } finally {
      if (!cancelGenerationRef.current) {
        setState(s => ({...s!, isLoading: false, loadingMessage: ''}));
      }
      cancelGenerationRef.current = false;
    }
  };
  
  const handleCancelGeneration = () => {
    cancelGenerationRef.current = true;
    setState(s => ({...s!, isLoading: false, loadingMessage: ''}));
    showToast("Operação cancelada.");
  };

  const handleGoHome = () => {
    updateState('showWelcomeScreen', true);
  };

  const handleToggleFocusMode = () => {
    updateState('isFocusMode', !state.isFocusMode);
  };

  const handleCreateProject = (projectName: string) => {
    const newId = crypto.randomUUID();
    const newProject = createNewProject(projectName);
    setState(prevState => ({
      ...prevState!,
      projects: { ...prevState!.projects, [newId]: newProject },
      activeProjectId: newId,
      isProjectModalOpen: false,
    }));
    showToast(`Projeto "${projectName}" criado!`);
  };

  const handleLoadProject = (projectId: string) => {
    if (state.projects[projectId]) {
      setState(prevState => ({ ...prevState!, activeProjectId: projectId, isProjectModalOpen: false }));
      showToast(`Projeto "${state.projects[projectId].projectName}" carregado!`);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setState(prevState => {
      const currentProjects = { ...prevState!.projects };
      if (Object.keys(currentProjects).length <= 1) {
        showToast("Não é possível excluir o único projeto existente.");
        return prevState!;
      }

      const projectToDelete = currentProjects[projectId];
      if (!projectToDelete) return prevState!;

      if (window.confirm(`Tem certeza que deseja excluir o projeto "${projectToDelete.projectName}"?`)) {
        const projectName = projectToDelete.projectName;
        delete currentProjects[projectId];
        
        let newActiveId = prevState!.activeProjectId;
        if (projectId === prevState!.activeProjectId) {
          newActiveId = Object.keys(currentProjects)[0] || null;
        }

        showToast(`Projeto "${projectName}" excluído.`);
        return {
          ...prevState!,
          projects: currentProjects,
          activeProjectId: newActiveId,
        };
      }
      
      return prevState!;
    });
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setState(prevState => {
        const projectToRename = prevState!.projects[projectId];
        if (!projectToRename) return prevState!;
        const updatedProject = { ...projectToRename, projectName: newName };
        return {
            ...prevState!,
            projects: { ...prevState!.projects, [projectId]: updatedProject }
        };
    });
    showToast("Projeto renomeado!");
  };

  const handleDuplicateProject = (projectId: string) => {
    const originalProject = state.projects[projectId];
    if (!originalProject) return;
    
    const newId = crypto.randomUUID();
    const newProject = {
      ...JSON.parse(JSON.stringify(originalProject)),
      projectName: `${originalProject.projectName} (Cópia)`
    };
    
    setState(prevState => ({
      ...prevState!,
      projects: { ...prevState!.projects, [newId]: newProject }
    }));
    showToast(`Projeto "${originalProject.projectName}" duplicado!`);
  };

  const handleRestartProject = () => {
    if (!state.activeProjectId) return;
    const currentProject = state.projects[state.activeProjectId];
    
    if (!currentProject) {
        showToast("Erro: Projeto ativo não encontrado.");
        return;
    }

    const currentProjectName = currentProject.projectName;
    if (window.confirm(`Tem certeza que deseja reiniciar o projeto "${currentProjectName}"? Todo o progresso (roteiro, cenas, estilos) será perdido.`)) {
      const restartedProject = createNewProject(currentProjectName);
      restartedProject.chatVersion = (currentProject.chatVersion || 1) + 1;

      setState(prevState => {
        if (!prevState!.activeProjectId) return prevState!;
        return {
          ...prevState!,
          projects: {
            ...prevState!.projects,
            [prevState!.activeProjectId]: restartedProject,
          }
        }
      });
      
      showToast(`Projeto "${currentProjectName}" reiniciado.`);
    }
  };
  
  const handleExportState = () => {
    try {
        const stateJSON = JSON.stringify(state, null, 2);
        const blob = new Blob([stateJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `jhol-pixel-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup de todos os projetos exportado!');
    } catch (error) {
        console.error("Failed to export state:", error);
        showToast('Erro ao exportar backup.');
        updateState('error', 'Falha ao exportar os dados do projeto.');
    }
  };

  const handleImportState = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error("File content is not readable.");
            }
            const importedState = JSON.parse(result);

            if (importedState.projects && importedState.settings && importedState.activeProjectId) {
                if (window.confirm("Isso substituirá todos os projetos e configurações atuais. Deseja continuar?")) {
                    setState({ ...importedState, isProjectModalOpen: false });
                    showToast('Projetos e configurações importados com sucesso!');
                }
            } else {
                throw new Error("Arquivo de backup inválido ou corrompido.");
            }
        } catch (error) {
            console.error("Failed to import state:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            showToast(`Erro ao importar: ${message}`);
            updateState('error', `Falha ao importar o arquivo de backup: ${message}`);
        }
    };
    reader.readAsText(file);
  };

  const handleAnalyzeAndSegment = async () => {
    if (!activeProject || !activeProject.script || !activeProject.channel) {
      updateState('error', 'Por favor, insira o roteiro e selecione um canal.');
      return;
    }
    setState(s => ({ ...s!, isLoading: true, loadingMessage: 'Analisando, segmentando e gerando conteúdo...', error: null }));
    try {
        let scenes: { 'pt-br': string[], 'en': string[] };

        if (activeProject.segmentationConfig.mode === 'custom') {
            const customScenesPt = activeProject.segmentationConfig.customScenes
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            if (customScenesPt.length === 0) {
                throw new Error('Por favor, insira as cenas personalizadas na área de texto.');
            }
            const customScenesEn = await translateScenes(customScenesPt);
            scenes = { 'pt-br': customScenesPt, 'en': customScenesEn };
        } else {
            scenes = await segmentScript(
                activeProject.script, 
                activeProject.segmentationConfig.mode === 'automatic', 
                activeProject.segmentationConfig.sceneCount
            );
        }

        if (!scenes || scenes['pt-br'].length === 0) {
            throw new Error('A segmentação falhou. A IA não retornou cenas.');
        }

        const socialContent = await generateSocialMediaContent(activeProject.script, activeProject.language);
        if (!socialContent) {
            throw new Error('A geração de legenda, hashtags e músicas falhou.');
        }

        updateActiveProjectState({
            segmentedScenes: scenes,
            promptHistory: {},
            caption: socialContent.caption,
            hashtags: socialContent.hashtags,
            musicSuggestions: socialContent.musicSuggestions,
        });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setState(s => ({ ...s!, error: errorMessage }));
    } finally {
        setState(s => ({ ...s!, isLoading: false, loadingMessage: '' }));
    }
  };
  
  const handleConfirmSegmentation = async () => {
    if (!activeProject || activeProject.segmentedScenes['pt-br'].length === 0) {
      updateState('error', 'Por favor, complete a análise do roteiro primeiro.');
      return;
    }
    
    if (activeProject.channel === 'dnacosmico') {
        const dnaCosmicoStyle: Style = {
            id: 'default-dnacosmico-' + crypto.randomUUID(),
            name: 'DNA Cósmico Padrão',
            prompt: DNACOSMICO_STYLE_PROMPT,
            tags: ['cinematic', 'conspiracy', 'hyperrealism'],
            isPredefined: true,
        };
        updateActiveProjectState({ step: 3, selectedStyles: [dnaCosmicoStyle] });
        showToast("Estilo @dnacosmico carregado. Pulando para a Geração.");
    } else {
        updateActiveProjectState({ step: 2 });
        if (activeProject.styleProposals.length === 0) {
            await handleGenerateStyles();
        }
    }
  };
  
  const handleGenerateStyles = async (isRegenerating = false) => {
    if (!activeProject || !activeProject.channel) return;
     const styles = await handleApiCall(
      () => generateStyles(activeProject!.script, activeProject!.channel!),
      isRegenerating ? 'Gerando novas propostas...' : 'Gerando propostas de estilo...'
    );
    if(styles) {
      const stylesWithIds: Style[] = styles.map(s => ({ ...s, id: crypto.randomUUID() }));
      updateActiveProjectState({ styleProposals: stylesWithIds });
    }
  };

  const handleAddNewStyleProposal = (style: Omit<Style, 'id'>): Style => {
      if (!activeProject) throw new Error("No active project");
      const newStyleWithId: Style = { ...style, id: crypto.randomUUID(), isPredefined: false };
      updateActiveProjectState({
          styleProposals: [newStyleWithId, ...activeProject.styleProposals]
      });
      return newStyleWithId;
  };

  const handleGenerateStyleVariations = async (style: Style) => {
    if (!activeProject) return;
    const variations = await handleApiCall(
      () => generateStyleVariations(style),
      `Gerando variações para "${style.name}"...`
    );
    if (variations) {
      const variationsWithIds: Style[] = variations.map(s => ({ ...s, id: crypto.randomUUID() }));
      const styleIndex = activeProject.styleProposals.findIndex(s => s.id === style.id);
      if (styleIndex !== -1) {
        const newProposals = [...activeProject.styleProposals];
        newProposals.splice(styleIndex + 1, 0, ...variationsWithIds);
        updateActiveProjectState({ styleProposals: newProposals });
      }
    }
  };
  
  const handleSetCustomStylePrompt = (prompt: string) => {
    if (!state.activeProjectId) return;
    updateActiveProjectState({ customStylePrompt: prompt, selectedStyles: [] });
  };

  const handleSelectStyle = (clickedStyle: Style, isMultiSelect: boolean) => {
    if (!activeProject) return;
    const currentSelection = [...activeProject.selectedStyles];
    const isAlreadySelected = currentSelection.some(s => s.id === clickedStyle.id);

    let newSelection: Style[];

    if (isMultiSelect) {
      newSelection = isAlreadySelected
        ? currentSelection.filter(s => s.id !== clickedStyle.id)
        : (currentSelection.length < 2 ? [...currentSelection, clickedStyle] : currentSelection);
      if (!isAlreadySelected && currentSelection.length >= 2) showToast("Você pode mesclar no máximo 2 estilos.");
    } else {
      newSelection = isAlreadySelected && currentSelection.length === 1 ? [] : [clickedStyle];
    }
    updateActiveProjectState({ selectedStyles: newSelection, customStylePrompt: '' });
  };
  
  const handleConfirmStyle = async () => {
    if (!activeProject) return;

    if (activeProject.customStylePrompt.trim()) {
        const customStyle: Style = {
            id: 'custom-' + crypto.randomUUID(),
            name: 'Estilo Personalizado',
            prompt: activeProject.customStylePrompt.trim(),
            tags: ['personalizado'],
            isPredefined: false
        };
        updateActiveProjectState({ 
            step: 3, 
            selectedStyles: [customStyle], 
            customStylePrompt: '' 
        });
        return;
    }
    
    if (activeProject.selectedStyles.length === 0) {
        updateState('error', 'Por favor, selecione ou insira um estilo visual.');
        return;
    }
    
    let finalStyles = activeProject.selectedStyles;
    if (activeProject.selectedStyles.length > 1) {
        const mergedPromptText = await handleApiCall(
            () => getStylePrompt(activeProject.selectedStyles),
            'Mesclando estilos...'
        );

        if (!mergedPromptText) {
            updateState('error', 'Falha ao mesclar os estilos.');
            return;
        }

        const mergedStyle: Style = {
            id: 'merged-' + crypto.randomUUID(),
            name: `${activeProject.selectedStyles[0].name} + ${activeProject.selectedStyles[1].name}`,
            prompt: mergedPromptText,
            tags: [...new Set([...activeProject.selectedStyles[0].tags, ...activeProject.selectedStyles[1].tags])],
            isPredefined: false,
        };
        finalStyles = [mergedStyle];
    }
    
    updateActiveProjectState({ step: 3, selectedStyles: finalStyles });
  };

  const handleUpdateStylePrompt = (newPrompt: string) => {
    if (!state.activeProjectId) return;

    setState(prevState => {
        const projectId = prevState!.activeProjectId!;
        const project = prevState!.projects[projectId];
        if (!project || !project.selectedStyles[0]) return prevState!;

        const newSelectedStyles = [...project.selectedStyles];
        newSelectedStyles[0] = { ...newSelectedStyles[0], prompt: newPrompt };
        
        return {
            ...prevState!,
            projects: {
                ...prevState!.projects,
                [projectId]: { ...project, selectedStyles: newSelectedStyles }
            }
        };
    });
  };

  const handleGeneratePrompts = async (scene: string) => {
    if (!activeProject || activeProject.selectedStyles.length === 0 || !activeProject.channel) return;
    const prompts = await handleApiCall(
        () => generatePromptsForScene(activeProject!.script, scene, activeProject!.selectedStyles, state.settings.negativePrompt, state.settings.globalSuffix, activeProject!.channel!, activeProject!.characterBrief, activeProject!.generationContext),
        `Gerando prompts para: "${scene}"`
    );
    if (prompts) {
        const newPrompts: Prompt[] = prompts.map((p: string) => ({ id: crypto.randomUUID(), text: p, isSelected: false }));
        updateActiveProjectState({
            promptHistory: { ...activeProject!.promptHistory, [scene]: newPrompts }
        });
        showToast(`3 prompts gerados para "${scene.substring(0,20)}..."`);
    }
  };
  
  const handleGenerateWhatIfPrompts = async (scene: string, whatIfRequest: string) => {
    if (!activeProject || activeProject.selectedStyles.length === 0 || !activeProject.channel) return;
    const prompts = await handleApiCall(
        () => generateWhatIfPrompts(activeProject!.script, scene, whatIfRequest, activeProject!.selectedStyles, state.settings.negativePrompt, state.settings.globalSuffix, activeProject!.channel!, activeProject!.characterBrief, activeProject!.generationContext),
        `Gerando cenário "E se?": "${whatIfRequest}"`
    );
    if (prompts) {
        const newPrompts: Prompt[] = prompts.map((p: string) => ({ id: crypto.randomUUID(), text: p, isSelected: false }));
        const currentScenePrompts = activeProject.promptHistory[scene] || [];
        updateActiveProjectState({
            promptHistory: { 
                ...activeProject!.promptHistory, 
                [scene]: [...currentScenePrompts, ...newPrompts] 
            }
        });
        showToast(`3 prompts "E se?" gerados!`);
    }
  };

  const handleGenerateAllPrompts = async () => {
    if (!activeProject || !activeProject.channel) return;
    const scenesToGenerate = activeProject.segmentedScenes['pt-br'].filter(scene => !activeProject.promptHistory[scene] || activeProject.promptHistory[scene].length === 0);
    if (scenesToGenerate.length === 0) {
        showToast("Todas as cenas já possuem prompts!");
        return;
    }
    
    cancelGenerationRef.current = false;
    setState(s => ({...s!, isLoading: true, loadingMessage: `Preparando para gerar ${scenesToGenerate.length} cenas...`}));
    
    try {
        let newHistory = {...activeProject.promptHistory};
        let count = 1;
        for (const scene of scenesToGenerate) {
            if (cancelGenerationRef.current) break;
            setState(s => ({...s!, loadingMessage: `Gerando prompts para a cena ${count} de ${scenesToGenerate.length}...`}));
            
            const prompts = await generatePromptsForScene(activeProject.script, scene, activeProject.selectedStyles, state.settings.negativePrompt, state.settings.globalSuffix, activeProject.channel, activeProject.characterBrief, activeProject.generationContext);
            
            if (prompts) {
                newHistory[scene] = prompts.map((p: string) => ({ id: crypto.randomUUID(), text: p, isSelected: false }));
            }
            count++;
        }
        updateActiveProjectState({ promptHistory: newHistory });
        if (!cancelGenerationRef.current) {
            showToast("Geração em lote concluída!");
        }
    } catch (err) {
        if (cancelGenerationRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro na geração em lote.';
        setState(s => ({...s!, error: errorMessage}));
    } finally {
        if (!cancelGenerationRef.current) {
            setState(s => ({...s!, isLoading: false, loadingMessage: ''}));
        }
        cancelGenerationRef.current = false;
    }
  };

  const handleGenerateVariations = async (scene: string, originalPrompt: Prompt) => {
    const variations = await generateVariations(originalPrompt.text, 3);
    if (variations) {
        const newPrompts: Prompt[] = variations.map((p: string) => ({ id: crypto.randomUUID(), text: p, isSelected: false, variationType: 'variation' }));
        const updatedScenePrompts = [...activeProject!.promptHistory[scene]];
        const originalIndex = updatedScenePrompts.findIndex(p => p.id === originalPrompt.id);
        updatedScenePrompts.splice(originalIndex + 1, 0, ...newPrompts);
        updateActiveProjectState({ promptHistory: { ...activeProject!.promptHistory, [scene]: updatedScenePrompts } });
        showToast("Variações geradas!");
    } else {
        showToast("Falha ao gerar variações.");
    }
  };

   const handleGenerateSceneVariation = async (scene: string, originalPrompt: Prompt) => {
    const variation = await generateSceneVariation(originalPrompt.text);
    if (variation && variation.length > 0) {
        const newPrompt: Prompt = { id: crypto.randomUUID(), text: variation[0], isSelected: false, variationType: 'scene_variation' };
        const updatedScenePrompts = [...activeProject!.promptHistory[scene]];
        const originalIndex = updatedScenePrompts.findIndex(p => p.id === originalPrompt.id);
        updatedScenePrompts.splice(originalIndex + 1, 0, newPrompt);
        updateActiveProjectState({ promptHistory: { ...activeProject!.promptHistory, [scene]: updatedScenePrompts } });
        showToast("Variação de cena gerada!");
    } else {
         showToast("Falha ao gerar variação de cena.");
    }
  };

  const handleGenerateAssets = async (scene: string, originalPrompt: Prompt) => {
    const assets = await generateAssetsForScene(originalPrompt.text);
    if (assets) {
        const newPrompts: Prompt[] = assets.map((p: string) => ({ id: crypto.randomUUID(), text: p, isSelected: false, variationType: 'asset' }));
        const updatedScenePrompts = [...activeProject!.promptHistory[scene]];
        const originalIndex = updatedScenePrompts.findIndex(p => p.id === originalPrompt.id);
        updatedScenePrompts.splice(originalIndex + 1, 0, ...newPrompts);
        updateActiveProjectState({ promptHistory: { ...activeProject!.promptHistory, [scene]: updatedScenePrompts } });
        showToast("Assets gerados!");
    } else {
         showToast("Falha ao gerar assets.");
    }
  };
  
  const handleGenerateMotion = async (scene: string, promptId: string) => {
      if (!activeProject) return;
      const targetPrompt = activeProject.promptHistory[scene].find(p => p.id === promptId);
      if (!targetPrompt) return;

      const motion = await generateMotionPrompt(targetPrompt.text, activeProject.script);

      if (motion) {
          const updatedPrompts = activeProject.promptHistory[scene].map(p => p.id === promptId ? { ...p, motionPrompt: motion.trim() } : p);
          updateActiveProjectState({ promptHistory: { ...activeProject.promptHistory, [scene]: updatedPrompts } });
          showToast("Prompt de movimento gerado!");
      } else {
           showToast("Falha ao gerar prompt de movimento.");
      }
  };

  const handleGenerateMotionVariation = async (scene: string, promptId: string, originalMotion: string) => {
      if (!activeProject) return;
      const variation = await generateMotionVariation(originalMotion);
      if (variation) {
          const updatedPrompts = activeProject.promptHistory[scene].map(p => 
              p.id === promptId ? { ...p, motionPrompt: variation.trim() } : p
          );
          updateActiveProjectState({ promptHistory: { ...activeProject.promptHistory, [scene]: updatedPrompts } });
          showToast("Variação de movimento gerada!");
      } else {
          showToast("Falha ao gerar variação de movimento.");
      }
  };
  
  const handleGenerateSoundEffects = async (scene: string, promptId: string) => {
    if (!activeProject) return;
    const targetPrompt = activeProject.promptHistory[scene].find(p => p.id === promptId);
    if (!targetPrompt) return;

    const sfx = await generateSoundEffects(targetPrompt.text);

    if (sfx) {
      const updatedPrompts = activeProject.promptHistory[scene].map(p =>
        p.id === promptId ? { ...p, soundEffects: sfx } : p
      );
      updateActiveProjectState({ promptHistory: { ...activeProject.promptHistory, [scene]: updatedPrompts } });
      showToast("Sugestões de áudio geradas!");
    } else {
        showToast("Falha ao gerar sugestões de áudio.");
    }
  };

  const handleRefinePrompt = async (scene: string, promptId: string, modificationRequest: string) => {
    if (!activeProject) return;
    const originalPrompt = activeProject.promptHistory[scene]?.find(p => p.id === promptId);
    if (!originalPrompt) {
        showToast("Prompt original não encontrado.");
        return;
    }

    const newPromptText = await refinePrompt(originalPrompt.text, modificationRequest);

    if (newPromptText) {
      const updatedPrompts = activeProject.promptHistory[scene].map(p =>
        p.id === promptId ? { ...p, text: newPromptText } : p
      );
      updateActiveProjectState({
        promptHistory: { ...activeProject.promptHistory, [scene]: updatedPrompts }
      });
      showToast("Prompt atualizado!");
    } else {
        showToast("Falha ao refinar prompt.");
    }
  };

  const handleSelectPrompt = (scene: string, promptIdToSelect: string) => {
    if (!activeProject || !activeProject.promptHistory[scene]) return;

    const updatedScenePrompts = activeProject.promptHistory[scene].map(p => ({
        ...p,
        isSelected: p.id === promptIdToSelect
    }));

    updateActiveProjectState({
        promptHistory: {
            ...activeProject.promptHistory,
            [scene]: updatedScenePrompts
        }
    });
    showToast("Prompt selecionado!");
  };

  const handleSendMessageToAssistant = async (message: string) => {
    if (!chatRef.current || !activeProject) return;
    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    updateActiveProjectState({ chatHistory: [...activeProject.chatHistory, newUserMessage]});
    updateState('isChatting', true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message });
      let modelResponse = '';
      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setState(prevState => {
          if (!prevState) return null;
          const currentProj = prevState.projects[prevState.activeProjectId!];
          const newHistory = [...currentProj.chatHistory];
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'model') {
            newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
          } else {
            newHistory.push({ role: 'model', parts: [{ text: modelResponse }] });
          }
          return { ...prevState, projects: { ...prevState.projects, [prevState.activeProjectId!]: { ...currentProj, chatHistory: newHistory } } };
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro no chat.';
       updateState('error', errorMessage);
    } finally {
      updateState('isChatting', false);
    }
  };
  
    const handleAnalyzeScriptStrength = async (): Promise<boolean> => {
    if (!activeProject || !activeProject.script) {
        showToast("Por favor, insira um roteiro para analisar.");
        return false;
    }
    
    const analysis = await handleApiCall(
        () => analyzeScriptStrength(activeProject.script),
        "Analisando a força do roteiro..."
    );

    if (analysis) {
        const assistantMessage: ChatMessage = { role: 'model', parts: [{ text: `**Análise de Força do Roteiro:**\n\n${analysis}` }]};
        updateActiveProjectState({ chatHistory: [...activeProject.chatHistory, assistantMessage] });
        showToast("Análise concluída! Veja no assistente.");
        return true;
    }
    return false;
  };

    const handleViralAnalysis = async (): Promise<boolean> => {
    if (!activeProject || !activeProject.script) {
      showToast("Por favor, insira um roteiro para analisar.");
      return false;
    }

    const analysisResult = await handleApiCall(
      () => generateViralAnalysis(activeProject.script),
      "Analisando potencial viral do roteiro..."
    );

    if (analysisResult) {
      const { score, analysis, suggestions } = analysisResult;
      const assistantMessageText = `**Análise de Potencial Viral:**\n\n- **Score Viral:** ${score}/100\n- **Análise:** ${analysis}`;
      const assistantMessage: ChatMessage = { 
          role: 'model', 
          parts: [{ text: assistantMessageText }],
          suggestions: suggestions 
      };

      updateActiveProjectState({
        viralAnalysis: analysisResult,
        chatHistory: [...activeProject.chatHistory, assistantMessage]
      });
      showToast("Análise concluída! Veja no assistente.");
      return true;
    }
    return false;
  };

  const handleSuggestTwists = async (): Promise<boolean> => {
    if (!activeProject || !activeProject.script) {
        showToast("Por favor, insira um roteiro para sugerir reviravoltas.");
        return false;
    }

    const twists = await handleApiCall(
        () => generatePlotTwists(activeProject.script),
        "Mapeando seu DNA criativo para reviravoltas..."
    );

    if (twists && twists.length > 0) {
        const assistantMessageText = `**Mapeamento de DNA Criativo: Sugestões de Reviravoltas Visuais**\n\nCom base no seu roteiro, aqui estão algumas ideias visuais que podem ressoar com sua assinatura criativa:`;
        const assistantMessage: ChatMessage = { 
            role: 'model', 
            parts: [{ text: assistantMessageText }],
            suggestions: twists.map(t => `**${t.title}:** ${t.description}`)
        };

        updateActiveProjectState({
            chatHistory: [...activeProject.chatHistory, assistantMessage]
        });
        showToast("Sugestões de reviravoltas geradas! Veja no assistente.");
        return true;
    }
    return false;
  };

  const handleToggleFavorite = (promptText: string) => {
    if (!activeProject) return;
    const isFavorite = activeProject.favorites.includes(promptText);
    const newFavorites = isFavorite
      ? activeProject.favorites.filter(fav => fav !== promptText)
      : [...activeProject.favorites, promptText];
    updateActiveProjectState({ favorites: newFavorites });
    showToast(isFavorite ? "Removido dos favoritos." : "Adicionado aos favoritos!");
  };

  const handleToggleStyleFavorite = (style: Style) => {
    if (!activeProject) return;
    const isFavorite = activeProject.favoriteStyles.some(s => s.id === style.id);
    const newFavorites = isFavorite
      ? activeProject.favoriteStyles.filter(s => s.id !== style.id)
      : [...activeProject.favoriteStyles, style];
    updateActiveProjectState({ favoriteStyles: newFavorites });
    showToast(isFavorite ? "Estilo removido dos favoritos." : "Estilo salvo nos favoritos!");
  }
  
  const handleToggleGenerationContext = (context: string) => {
    if (!activeProject) return;
    const isAlreadyActive = activeProject.generationContext.includes(context);
    const newContext = isAlreadyActive
        ? activeProject.generationContext.filter(c => c !== context)
        : [...activeProject.generationContext, context];
    updateActiveProjectState({ generationContext: newContext });
    showToast(isAlreadyActive ? "Diretriz removida." : "Diretriz criativa aplicada!");
  };

  const handleReorderScenes = (sourceIndex: number, destinationIndex: number) => {
    if (!activeProject || sourceIndex === destinationIndex) return;

    const reorder = (arr: string[]) => {
      const result = Array.from(arr);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result;
    };

    const newPtBrScenes = reorder(activeProject.segmentedScenes['pt-br']);
    const newEnScenes = reorder(activeProject.segmentedScenes['en']);

    updateActiveProjectState({
      segmentedScenes: {
        'pt-br': newPtBrScenes,
        'en': newEnScenes,
      }
    });
  };

  const renderStep = () => {
    if (!activeProject) {
        return <div className="text-center p-8">Nenhum projeto ativo. Crie ou carregue um projeto para começar.</div>
    }
    switch (activeProject.step) {
      case 1:
        return <Step1_Workspace
                  state={state}
                  setScript={(s) => updateActiveProjectState({ script: s })}
                  setChannel={(c) => updateActiveProjectState({ channel: c })}
                  setLanguage={(l) => updateActiveProjectState({ language: l })}
                  setSegmentationConfig={(c) => updateActiveProjectState({ segmentationConfig: c })}
                  onAnalyze={handleAnalyzeAndSegment}
                  onNext={handleConfirmSegmentation}
                  onAnalyzeScriptStrength={handleAnalyzeScriptStrength}
                  onViralAnalysis={handleViralAnalysis}
                  onSuggestTwists={handleSuggestTwists}
                  onSendMessageToAssistant={handleSendMessageToAssistant}
                  onToggleGenerationContext={handleToggleGenerationContext}
                  showToast={showToast}
                />;
      case 2:
        return <Step2_StyleSelection 
                  state={state}
                  onSelectStyle={handleSelectStyle}
                  onSetCustomStylePrompt={handleSetCustomStylePrompt}
                  onRegenerate={handleGenerateStyles}
                  onGenerateVariations={handleGenerateStyleVariations}
                  onToggleFavorite={handleToggleStyleFavorite}
                  onAddNewStyleProposal={handleAddNewStyleProposal}
                  onConfirm={handleConfirmStyle}
                  onBack={() => updateActiveProjectState({ step: 1 })}
                  showToast={showToast}
                />;
      case 3:
        return <Step3_Workspace 
                  state={state}
                  onGeneratePrompts={handleGeneratePrompts}
                  onGenerateAllPrompts={handleGenerateAllPrompts}
                  onGenerateWhatIfPrompts={handleGenerateWhatIfPrompts}
                  onGenerateVariations={handleGenerateVariations}
                  onGenerateSceneVariation={handleGenerateSceneVariation}
                  onGenerateMotion={handleGenerateMotion}
                  onGenerateMotionVariation={handleGenerateMotionVariation}
                  onGenerateAssets={handleGenerateAssets}
                  onGenerateSoundEffects={handleGenerateSoundEffects}
                  onToggleFavorite={handleToggleFavorite}
                  onUpdateStylePrompt={handleUpdateStylePrompt}
                  onUpdateCharacterBrief={(brief) => updateActiveProjectState({ characterBrief: brief })}
                  onRefinePrompt={handleRefinePrompt}
                  onSelectPrompt={handleSelectPrompt}
                  onReorderScenes={handleReorderScenes}
                  onToggleGenerationContext={handleToggleGenerationContext}
                  onBack={() => updateActiveProjectState({ step: 2 })}
                  showToast={showToast}
                />;
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return <SplashScreen />;
  }
  
  if (state.showWelcomeScreen) {
    return <WelcomeScreen onStart={() => updateState('showWelcomeScreen', false)} />;
  }

  return (
    <div className="container mx-auto font-sans min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <Header 
        projectName={activeProject?.projectName || "Nenhum Projeto"}
        step={activeProject?.step}
        onOpenProjects={() => updateState('isProjectModalOpen', true)}
        onOpenSettings={() => updateState('isSettingsOpen', true)}
        onRestartProject={handleRestartProject}
        onGoHome={handleGoHome}
        isFocusMode={state.isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
      />
      {state.error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-sm my-4 animate-shake">
          <strong>Erro:</strong> {state.error}
        </div>
      )}
      <main className="flex-grow mt-6">
        {renderStep()}
      </main>

      {state.isProjectModalOpen && (
        <ProjectModal
          projects={state.projects}
          activeProjectId={state.activeProjectId}
          onClose={() => updateState('isProjectModalOpen', false)}
          onCreateProject={handleCreateProject}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onDuplicateProject={handleDuplicateProject}
          onExport={handleExportState}
          onImport={handleImportState}
        />
      )}

      {state.isSettingsOpen && (
        <SettingsModal 
          settings={state.settings}
          onSave={(newSettings) => {
            updateState('settings', newSettings);
            updateState('isSettingsOpen', false);
            showToast("Configurações salvas!");
          }}
          onClose={() => updateState('isSettingsOpen', false)}
          history={activeProject?.promptHistory || {}}
        />
      )}
      {state.toast && <Toast message={state.toast} />}
      {state.isLoading && <LoadingOverlay message={state.loadingMessage} onCancel={handleCancelGeneration} />}
    </div>
  );
}

export default App;
