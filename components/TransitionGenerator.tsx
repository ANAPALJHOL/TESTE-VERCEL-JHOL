
import React, { useState } from 'react';

interface Props {
    onGenerate: () => Promise<void> | void;
}

export const TransitionGenerator: React.FC<Props> = ({ onGenerate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await onGenerate();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center my-1 group">
            <div className="w-full h-px bg-white/10"></div>
            <button 
                onClick={handleClick}
                disabled={isLoading}
                className="mx-2 px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-[--color-primary-base]/50 text-[--color-primary-fg] transition-all whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                title="Gerar uma cena de transição entre as cenas acima e abaixo"
            >
                {isLoading 
                    ? <><i className="fas fa-spinner fa-spin"></i> Gerando...</>
                    : <><i className="fas fa-plus-circle"></i> Inserir Transição</>
                }
            </button>
            <div className="w-full h-px bg-white/10"></div>
        </div>
    );
};
