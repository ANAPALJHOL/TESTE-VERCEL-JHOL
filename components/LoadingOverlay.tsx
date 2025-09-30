
import React, { useState, useEffect } from 'react';

interface Props {
  message: string;
  onCancel?: () => void;
}

const inspirationalMessages = [
  "Cultivando a criatividade, um pixel de cada vez...",
  "A paciência é a semente da genialidade. Estamos plantando a sua.",
  "Grandes ideias levam tempo. A sua está florescendo.",
  "Transformando sua visão em realidade. Aguarde a mágica.",
  "O universo está conspirando a seu favor. E nossa IA também.",
  "Analisando os matizes do seu roteiro para encontrar a cor perfeita...",
  "Despertando a IA com o aroma de café e criatividade...",
  "Nossos algoritmos estão dançando para criar algo único para você.",
  "“Não tenha medo da perfeição, você nunca a alcançará.” - Salvador Dalí",
  "“A criatividade é a inteligência se divertindo.” - Albert Einstein",
  "“Cada artista mergulha um pincel em sua própria alma.” - Henry Ward Beecher"
];

const FuturisticLoader: React.FC = () => (
    <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-[--color-primary-base]/30 rounded-full"></div>
        <div className="absolute inset-2 border-4 border-[--color-secondary-base]/30 rounded-full animate-spin-slow"></div>
        <div className="absolute inset-4 border-4 border-[--color-primary-base] rounded-full animate-spin-reverse border-t-transparent"></div>
        <i className="fas fa-robot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[--color-primary-fg] text-2xl animate-pulse"></i>
    </div>
);


export const LoadingOverlay: React.FC<Props> = ({ message, onCancel }) => {
  const [currentMessage, setCurrentMessage] = useState(inspirationalMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = inspirationalMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % inspirationalMessages.length;
        return inspirationalMessages[nextIndex];
      });
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 text-center">
      <FuturisticLoader />
      <p className="mt-6 text-lg text-gray-200 font-semibold">{message}</p>
      <p className="mt-2 text-sm text-[--color-primary-fg] italic h-10 transition-opacity duration-500 animate-fade-in">
        {currentMessage}
      </p>
      {onCancel && (
        <button 
          onClick={onCancel}
          className="mt-6 bg-red-500/50 text-red-200 font-bold py-2 px-6 rounded-lg hover:bg-red-500/70 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
};
