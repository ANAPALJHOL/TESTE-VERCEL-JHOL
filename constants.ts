
import { ChannelId, Language } from "./types";

export const CHANNELS: { id: ChannelId, name: string, description: string }[] = [
    { 
        id: 'dnacosmico', 
        name: '@dnacosmico', 
        description: 'Realismo cinematográfico, 4K, temas de conspiração.' 
    },
    { 
        id: 'sombrasdearkive', 
        name: '@sombrasdearkive', 
        description: 'Terror estilizado, graphic novel, cartoon sombrio.' 
    },
    {
        id: 'hq',
        name: 'HQ (Quadrinhos)',
        description: 'Estilo de histórias em quadrinhos, cores vibrantes, arte de linha ousada.'
    },
    {
        id: 'bw',
        name: 'Preto & Branco',
        description: 'Cinematográfico, alto contraste, foco em textura e iluminação dramática.'
    }
];

export const LANGUAGES: { id: Language, name: string }[] = [
    { id: 'pt-br', name: 'Português (Brasil)' },
    { id: 'en', name: 'Inglês' },
    { id: 'es', name: 'Espanhol' },
];
