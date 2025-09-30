import React, { useState } from 'react';

interface Props {
  onStart: () => void;
}

const FeatureCard: React.FC<{ icon: string, title: string, description: string, delay: string }> = ({ icon, title, description, delay }) => (
    <div className="glass-effect p-6 rounded-lg text-center flex flex-col items-center animate-fade-in-up" style={{ animationDelay: delay }}>
        <div className="text-3xl text-[--color-primary-fg] mb-4">
            <i className={icon}></i>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
    </div>
);

const GuideSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-2xl font-bold text-[--color-primary-fg] mb-3">{title}</h3>
        <div className="space-y-2 text-gray-300 text-left leading-relaxed">
            {children}
        </div>
    </div>
);

const WelcomeTabContent: React.FC<{ onStart: () => void }> = ({ onStart }) => (
     <div className="animate-fade-in">
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer rings using theme colors */}
                <div className="absolute inset-0 rounded-full border-2 border-[--color-primary-base]/50 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full border-2 border-[--color-secondary-base]/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                
                {/* New JP Logo */}
                <div className="text-6xl font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    <span className="text-[--color-primary-fg]" style={{ filter: 'drop-shadow(0 0 5px var(--color-primary-glow))' }}>J</span>
                    <span className="text-[--color-secondary-fg] relative -left-4" style={{ filter: 'drop-shadow(0 0 5px var(--color-secondary-glow))' }}>P</span>
                </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-widest text-gray-200">
                JHOL PIXEL <span className="text-[--color-primary-fg]">1.0</span>
            </h1>
            <p className="text-lg text-gray-300" style={{fontFamily: 'Poppins, sans-serif'}}>Seu copiloto criativo para narrativas visuais.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <FeatureCard 
                icon="fas fa-file-invoice" 
                title="Do Roteiro à Imagem"
                description="Cole seu roteiro e deixe nossa IA segmentar cenas e sugerir legendas automaticamente."
                delay="0.2s"
            />
            <FeatureCard 
                icon="fas fa-palette" 
                title="Universo de Estilos"
                description="Explore, mescle e crie estilos visuais únicos para dar vida à sua visão criativa."
                delay="0.4s"
            />
            <FeatureCard 
                icon="fas fa-robot" 
                title="Geração Inteligente"
                description="Crie prompts detalhados, movimentos de câmera e até efeitos sonoros com um clique."
                delay="0.6s"
            />
        </div>

        <button
            onClick={onStart}
            className="text-white font-bold py-4 px-10 rounded-lg text-lg transition duration-300 btn-glow-primary animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
        >
            INICIAR PROJETO <i className="fas fa-rocket ml-2"></i>
        </button>
    </div>
);

const GuideTabContent: React.FC = () => (
    <div className="glass-effect p-8 rounded-lg max-w-4xl mx-auto animate-fade-in custom-scrollbar max-h-[80vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Como o Jhol Pixel Funciona</h2>
        
        <GuideSection title="Visão Geral">
            <p>O Jhol Pixel é seu copiloto criativo, projetado para transformar roteiros de texto em narrativas visuais prontas para produção. O fluxo de trabalho é dividido em três passos principais, cada um com ferramentas poderosas para refinar sua visão.</p>
        </GuideSection>

        <GuideSection title="Passo 1: Contexto e Segmentação">
            <p>Nesta etapa, você fornece a matéria-prima para sua criação.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Roteiro:</strong> Cole seu roteiro completo. Ele será a base para a segmentação de cenas, legendas, hashtags e para o contexto geral da IA.</li>
                <li><strong>Canal (Estética):</strong> A escolha do canal (`@dnacosmico`, `@sombrasdearkive`, etc.) define a estética visual fundamental que a IA usará como ponto de partida para todas as criações.</li>
                <li><strong>Configuração de Segmentação:</strong> Escolha entre 'Automático' (IA decide as cenas), 'Manual' (você define o número de cenas) ou 'Personalizado' (você cola suas próprias cenas).</li>
                <li><strong>Copiloto Criativo:</strong> Sua central de análise. As sugestões geradas aqui são diretrizes para a IA sobre como criar os prompts visuais, não para alterar seu roteiro. Ao clicar em "Aplicar Diretriz", você instrui a IA a levar essa sugestão em conta no Passo 3.</li>
            </ul>
        </GuideSection>

        <GuideSection title="Passo 2: Seleção de Estilo Visual">
            <p>Aqui, você define a "alma" visual do seu projeto.</p>
             <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Propostas Geradas:</strong> Com base no seu roteiro e canal, a IA gera 20 propostas de estilo únicas, incluindo estilos "Surpresa" inovadores para inspirar novas direções.</li>
                <li><strong>Ações do Card de Estilo:</strong> Clique para selecionar, segure `Ctrl/Cmd` e clique em dois para mesclar, ou favorite para usar depois.</li>
                <li><strong>Prompt Personalizado:</strong> Ignore as propostas e cole seu próprio prompt de estilo diretamente na caixa de texto.</li>
                <li><strong>Assistente de Estilo:</strong> Descreva um estilo com suas próprias palavras (ex: "um visual de filme de faroeste antigo") e o assistente criará um prompt detalhado para você.</li>
            </ul>
        </GuideSection>
        
        <GuideSection title="Passo 3: Storyboard de Geração">
            <p>Esta é sua mesa de produção, onde as cenas ganham vida.</p>
             <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Visão de Storyboard:</strong> Suas cenas são organizadas horizontalmente. Você pode arrastar e soltar as colunas para reordenar a narrativa.</li>
                <li><strong>Geração de Prompts:</strong> Clique em "Gerar Prompts" em qualquer cena para que a IA crie 3 opções visuais detalhadas, seguindo o estilo definido e as Diretrizes Criativas ativas.</li>
                <li><strong>Tipos de Variação:</strong> Use os botões 'Variações' (alternativas sutis), 'Cena' (mudança drástica) e 'Asset' (isolar objeto/personagem) para explorar possibilidades criativas.</li>
                <li><strong>Ferramentas Adicionais:</strong> Refine prompts com linguagem natural, gere movimentos de câmera e sugira efeitos sonoros para cada cena.</li>
                <li><strong>Módulos do Painel Direito:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><strong>Consistência:</strong> Descreva seus personagens e cenários para mantê-los consistentes em todos os prompts.</li>
                      <li><strong>Diretrizes Criativas:</strong> Veja e gerencie as diretrizes que você aplicou no Passo 1.</li>
                      <li><strong>Motion Fusion:</strong> Crie um movimento de câmera fluido e complexo entre duas cenas do seu storyboard.</li>
                      <li><strong>Gerador Avulso:</strong> Crie prompts para qualquer ideia que não esteja no roteiro, usando o estilo visual atual.</li>
                    </ul>
                </li>
            </ul>
        </GuideSection>
    </div>
);


export const WelcomeScreen: React.FC<Props> = ({ onStart }) => {
  const [activeTab, setActiveTab] = useState<'welcome' | 'guide'>('welcome');

  const tabButtonClasses = (tabName: 'welcome' | 'guide') => 
    `font-bold py-4 px-10 rounded-lg text-lg transition duration-300 ${
        activeTab === tabName
        ? 'btn-glow-primary'
        : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10'
    }`;


  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="max-w-5xl mx-auto text-center">
            
            <div className="mb-10 flex justify-center gap-4">
                <button onClick={() => setActiveTab('welcome')} className={tabButtonClasses('welcome')}>
                    Boas-vindas
                </button>
                <button onClick={() => setActiveTab('guide')} className={tabButtonClasses('guide')}>
                    Como Funciono
                </button>
            </div>
            
            {activeTab === 'welcome' ? <WelcomeTabContent onStart={onStart} /> : <GuideTabContent />}

            <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
              <p className="text-sm text-gray-500 mb-3">Acesse meus canais no TikTok:</p>
              <div className="flex justify-center items-center gap-6">
                <a href="https://www.tiktok.com/@sombrasdearkive" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-[--color-primary-fg] transition-colors font-semibold">
                  <i className="fab fa-tiktok"></i>
                  <span>@sombrasdearkive</span>
                </a>
                <a href="https://www.tiktok.com/@dnacosmico" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-[--color-primary-fg] transition-colors font-semibold">
                  <i className="fab fa-tiktok"></i>
                  <span>@dnacosmico</span>
                </a>
              </div>
            </div>
        </div>
    </div>
  );
};
