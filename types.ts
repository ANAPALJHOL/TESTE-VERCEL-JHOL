
export type ChannelId = 'dnacosmico' | 'sombrasdearkive' | 'hq' | 'bw';
export type Language = 'pt-br' | 'en' | 'es';
export type AssistantPersonality = 'creative' | 'technical' | 'sarcastic';

export interface Style {
  id: string;
  name: string;
  prompt: string;
  tags: string[];
  isPredefined: boolean;
  isExtra?: boolean;
}

export interface Prompt {
  id: string;
  text: string;
  isSelected: boolean;
  motionPrompt?: string;
  soundEffects?: string[];
  variationType?: 'variation' | 'scene_variation' | 'asset';
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    suggestions?: string[];
}

export interface ViralAnalysis {
    score: number;
    analysis: string;
    suggestions: string[];
}

export interface PlotTwist {
    title: string;
    description: string;
}

export interface SegmentationConfig {
    mode: 'automatic' | 'manual' | 'custom';
    sceneCount: number;
    customScenes: string;
}

export interface ProjectState {
  step: 1 | 2 | 3;
  projectName: string;
  script: string;
  channel: ChannelId | null;
  language: Language;
  segmentationConfig: SegmentationConfig;
  segmentedScenes: { 'pt-br': string[], 'en': string[] };
  caption: string;
  hashtags: string[];
  musicSuggestions: string[];
  viralAnalysis?: ViralAnalysis;
  characterBrief: string;
  styleProposals: Style[];
  selectedStyles: Style[];
  customStylePrompt: string;
  favoriteStyles: Style[];
  promptHistory: Record<string, Prompt[]>;
  favorites: string[];
  chatHistory: ChatMessage[];
  chatVersion: number;
  generationContext: string[];
}

export interface Settings {
    negativePrompt: string;
    globalSuffix: string;
    assistantPersonality: AssistantPersonality;
}

export interface AppState {
  projects: Record<string, ProjectState>;
  activeProjectId: string | null;
  settings: Settings;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  toast: string | null;
  isSettingsOpen: boolean;
  isProjectModalOpen: boolean;
  isChatting: boolean;
  isFocusMode: boolean;
  showWelcomeScreen: boolean;
}
