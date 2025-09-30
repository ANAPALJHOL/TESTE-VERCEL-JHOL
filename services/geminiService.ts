
import { GoogleGenAI, Type } from "@google/genai";
import { Style, Language, ChannelId, ViralAnalysis, PlotTwist } from '../types';
import { getApiKey } from "../utils";

const apiKey = getApiKey();

if (!apiKey) {
    // In a real app, you might show a more user-friendly error or disable functionality.
    // For this context, we throw an error to make the problem explicit during development.
    console.error("API_KEY environment variable is not set. Please refer to the setup instructions.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "fallback_key_if_not_set" });
const model = 'gemini-2.5-flash';

const SOMBRAS_BASE_STYLES: Omit<Style, 'id'>[] = [
    {
        name: "Clone Proibido (SCP)",
        prompt: "psychological horror cartoon, SCP-inspired underground facility, giant cloning tank filled with red glowing liquid, inside an ambiguous figure, shadowy government agents observing from behind glass, exaggerated cartoon faces shocked and fearful, arcane symbols on lab walls, eerie saturated dark palette, VHS static, chromatic aberration, graphic novel cinematic panel, unsettling mood of paranoia and forbidden knowledge",
        tags: ["psychological-horror", "cartoon", "scp", "vhs", "paranoia"],
        isPredefined: true,
    },
    {
        name: "Visitante Noturna",
        prompt: "Creepy animated horror illustration, graphic novel cartoon style, a subject standing frozen in a dimly lit location, staring at a terrifying figure, VHS glitch overlay, high contrast shadows, desaturated colors with sickly green tint, unsettling psychological tension, eerie cinematic composition, unsettling details on the creature's face",
        tags: ["animated-horror", "graphic-novel", "cartoon", "vhs-glitch", "creepy"],
        isPredefined: true,
    },
    {
        name: "Relíquia Biomecânica",
        prompt: "Dark graphic novel horror illustration, a surreal dream-like depiction of a sacred object suspended within a futuristic, glowing chamber in a cavernous, subterranean research facility. The object is a complex, biomechanical structure, hinting at manipulated sacred relics. Glitching neon strokes emanate from the chamber, illuminating decaying equipment. Rendered in high-contrast B&W ink, with bold outlines creating a haunting, unsettling psychological tension. sketchy",
        tags: ["graphic-novel", "b&w", "surreal", "sci-fi", "horror"],
        isPredefined: true,
    },
    {
        name: "Oficina Macabra",
        prompt: "Black and white dark cartoon illustration, graphic novel horror style, high contrast, heavy ink shadows, creepy atmosphere. Two characters with exaggerated expressions and glowing eyes, in an eerie workshop full of mechanical parts and old tools. A giant machine looms in the background, unsettling and mysterious. Highly detailed linework, textured shading, psychological horror mood.",
        tags: ["dark-cartoon", "graphic-novel", "b&w", "horror", "mechanical"],
        isPredefined: true,
    },
    {
        name: "Descoberta Congelada",
        prompt: "Dark graphic novel horror illustration, surreal dream-like aesthetic, rendered in high-contrast B&W ink with bold sketchy outlines. Focus on creating a haunting, unsettling psychological tension. A group of distressed 1980s scientists discover an ancient, grotesque form partially unearthed from a jagged crevice in ice. Glitching neon green strokes highlight the frozen, decaying high-tech digging equipment and the ominous contours of the unknown discovery.",
        tags: ["graphic-novel", "b&w", "horror", "sci-fi", "1980s"],
        isPredefined: true,
    },
    {
        name: "Horror Biomecânico Neon",
        prompt: "Dark graphic novel horror illustration, surreal dream-like aesthetic, rendered in high-contrast B&W ink with bold sketchy outlines. Focus on creating a haunting, unsettling psychological tension, with glitching neon strokes for accent lighting on decaying high-tech or biomechanical elements.",
        tags: ["graphic-novel", "b&w", "neon-glitch", "biomechanical", "horror"],
        isPredefined: true,
    },
    {
        name: "Entidade Ressuscitada",
        prompt: "Dark graphic novel horror illustration, surreal dream-like depiction of a complex, biomechanical structure suspended within a futuristic, glowing cryogenic chamber at the heart of a cavernous, subterranean 1980s research facility. Glitching neon strokes of light emanate from the chamber, illuminating high-tech yet decaying scientific equipment. Rendered in high-contrast B&W ink with bold, sketchy outlines, creating a haunting psychological tension that emphasizes the forbidden nature of an attempt to revive an unknown entity.",
        tags: ["graphic-novel", "b&w", "sci-fi", "horror", "forbidden"],
        isPredefined: true,
    },
    {
        name: "Autópsia Proibida",
        prompt: "Disturbing graphic novel illustration, set in a clandestine, stark white medical facility. A heavily cloaked, masked figure performs a grotesque, unsettling procedure on an ambiguous, alien-like being or a non-human biological specimen. Surgical tools glint under sterile, clinical light. The background features blurred, official-looking surveillance monitors showing static or encrypted data. High contrast B&W with sharp, almost painful details. Psychological horror of forbidden science and hidden truths.",
        tags: ["graphic-novel", "b&w", "medical-horror", "sci-fi", "conspiracy"],
        isPredefined: true,
    },
    {
        name: "Diário do Louco",
        prompt: "Hand-drawn, sketch journal horror graphic novel illustration. The scene is depicted as if torn from a madman's sketchbook: a series of quick, frantic charcoal and ink sketches on yellowed, creased paper, documenting a person's escalating psychological breakdown while staring into a mirror. Each small panel shows a subtle but increasingly grotesque distortion of the reflection. Annotations in shaky, handwritten text describe the growing paranoia. The overall composition looks like a page from a forbidden journal. Raw, visceral, deeply personal psychological horror.",
        tags: ["sketch", "journal", "psychological-horror", "hand-drawn", "charcoal"],
        isPredefined: true,
    }
];

const callGemini = async (prompt: string, schema?: any, retries = 3): Promise<string> => {
    try {
        const config = schema ? { responseMimeType: "application/json", responseSchema: schema } : {};
        const response = await ai.models.generateContent({ model, contents: prompt, config });
        return response.text;
    } catch (error) {
        console.error(`Error calling Gemini API (retries left: ${retries}):`, error);
        if (retries > 0) {
            await new Promise(res => setTimeout(res, 1500));
            return callGemini(prompt, schema, retries - 1);
        }
        throw new Error("Falha na comunicação com o modelo de IA após várias tentativas. Verifique o console.");
    }
};

const parseGeminiJson = <T,>(jsonString: string): T => {
    try {
        const sanitizedString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(sanitizedString) as T;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", jsonString);
        throw new Error("A IA retornou uma resposta em formato inválido. Por favor, tente novamente.");
    }
};

export const segmentScript = async (script: string, isAutomatic: boolean, sceneCount: number): Promise<{ 'pt-br': string[], 'en': string[] }> => {
    const segmentationInstruction = isAutomatic
        ? `Divida o roteiro em pelo menos 15 cenas, usando a pontuação (especialmente pontos finais) como guia principal.`
        : `Divida o roteiro em exatamente ${sceneCount} cenas.`;

    const prompt = `
        Sua tarefa é segmentar o roteiro de vídeo a seguir em dois idiomas: Português do Brasil e Inglês.
        VOCÊ NÃO DEVE REESCREVER, RESUMIR OU ALTERAR O CONTEÚDO ORIGINAL. Apenas divida o texto existente.
        ${segmentationInstruction}
        O resultado deve ser um objeto JSON com duas chaves: "pt-br" e "en". Cada chave deve conter um array de strings com as cenas no respectivo idioma.

        Roteiro: "${script}"
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            'pt-br': { type: Type.ARRAY, items: { type: Type.STRING }, description: "As cenas segmentadas em Português do Brasil." },
            'en': { type: Type.ARRAY, items: { type: Type.STRING }, description: "As cenas segmentadas em Inglês." },
        },
        required: ['pt-br', 'en']
    };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const translateScenes = async (scenes: string[]): Promise<string[]> => {
    const prompt = `
        Translate the following array of video script scenes from Brazilian Portuguese to English.
        Your response MUST be a JSON array of strings, with each string being the translation of the corresponding scene in the input array. Maintain the same order. Do not add any extra explanations or text outside the JSON array.

        Input Scenes:
        ${JSON.stringify(scenes)}
    `;
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "The translated scenes in English."
    };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generateSocialMediaContent = async (script: string, language: Language): Promise<{ caption: string, hashtags: string[], musicSuggestions: string[] }> => {
    const languageMap = { 'pt-br': 'Português do Brasil', 'en': 'Inglês', 'es': 'Espanhol' };
    const prompt = `
        Baseado no seguinte roteiro de vídeo, gere o seguinte conteúdo para mídias sociais no idioma ${languageMap[language]}:
        1. Uma legenda curta e envolvente para o vídeo.
        2. Exatamente 5 hashtags pontuais e otimizadas para a barra de pesquisa do TikTok.
        3. Exatamente 3 sugestões de músicas (formato: "Nome da Música - Artista") que estejam em alta no TikTok e sejam fáceis de encontrar no CapCut.

        O resultado deve ser um objeto JSON.

        Roteiro: "${script}"
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            caption: { type: Type.STRING, description: "A legenda para o vídeo." },
            hashtags: {
                type: Type.ARRAY,
                description: "Um array de 5 strings de hashtag.",
                items: { type: Type.STRING }
            },
            musicSuggestions: {
                type: Type.ARRAY,
                description: "Um array de 3 strings com sugestões de música (nome e artista).",
                items: { type: Type.STRING }
            }
        },
        required: ["caption", "hashtags", "musicSuggestions"]
    };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const DNACOSMICO_STYLE_PROMPT = `na estética de "realismo cinematográfico e surrealismo fantástico". Os visuais devem ser incrivelmente detalhados, hiper-realistas (8K, fotorrealista), mas retratando eventos impossíveis e grandiosos relacionados a teorias da conspiração, civilizações antigas e tecnologia alienígena. Use iluminação dramática, ângulos de câmera épicos e uma paleta de cores rica e saturada para criar um sentimento de admiração e mistério. A composição deve ser de tirar o fôlego, como se fosse uma cena de um blockbuster de ficção científica de alto orçamento.`;

const getChannelStylePrompt = (channelId: ChannelId) => {
    switch (channelId) {
        case 'sombrasdearkive':
            return `na estética de "terror no estilo de graphic novel, cartoon sombrio e estilizado".`;
        case 'hq':
            return `na estética de "histórias em quadrinhos (HQ), com arte de linha ousada, cores vibrantes e um toque cinematográfico".`;
        case 'bw':
            return `na estética de "preto e branco, com alto contraste, iluminação dramática (film noir), e foco em texturas e sombras".`;
        case 'dnacosmico':
        default:
             return DNACOSMICO_STYLE_PROMPT;
    }
}

export const generateStyles = async (script: string, channelId: ChannelId): Promise<Omit<Style, 'id'>[]> => {
    const aestheticPrompt = getChannelStylePrompt(channelId);
     const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                prompt: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                isPredefined: { type: Type.BOOLEAN },
                isExtra: { type: Type.BOOLEAN },
            },
            required: ["name", "prompt", "tags", "isPredefined"]
        }
    };

    const firstSentence = (script.match(/^.*?[.?!]/)?.[0] || script.substring(0, 200)).trim();
    
    let prompt: string;

    if (channelId === 'sombrasdearkive') {
        prompt = `
        Sua tarefa é criar 21 propostas de estilo visual para um vídeo, baseadas na PRIMEIRA FRASE DO ROTEIRO: "${firstSentence}".
        A estética geral do canal é: ${aestheticPrompt}.

        As 21 propostas devem ser divididas em três partes:

        PARTE 1: ESTILOS FIXOS ADAPTADOS (9 propostas)
        Pegue os 9 "Estilos Base" a seguir e ADAPTE seus prompts para incorporar o conteúdo e o tema da PRIMEIRA FRASE DO ROTEIRO. O objetivo é manter a essência artística do estilo base, mas fazer com que ele descreva visualmente a cena da frase do roteiro.
        - Mantenha os nomes, tags e o campo "isPredefined" originais.
        - O campo "isExtra" DEVE ser 'false'.

        Estilos Base:
        ${JSON.stringify(SOMBRAS_BASE_STYLES, null, 2)}

        PARTE 2: NOVOS ESTILOS (7 propostas)
        Crie 7 propostas de estilo visual COMPLETAMENTE NOVAS e distintas, também baseadas na primeira frase do roteiro e na estética do canal. Para cada uma, forneça:
        1. Um nome criativo em português.
        2. Um prompt detalhado em inglês.
        3. 3 a 5 tags em inglês.
        4. O campo "isPredefined" DEVE ser 'false'.
        5. O campo "isExtra" DEVE ser 'false'.

        PARTE 3: ESTILOS SURPRESA (5 propostas)
        Crie 5 propostas de estilo visual FINAIS que sejam EXTREMAMENTE CRIATIVAS, SURPREENDENTES e INOVADORAS. Elas devem seguir a estética do canal, mas levar a ideia para direções inesperadas e que quebrem as convenções. Pense fora da caixa. Elas devem ser ajustadas unicamente para este roteiro. Para cada uma, forneça:
        1. Um nome criativo em português.
        2. Um prompt detalhado em inglês.
        3. 3 a 5 tags em inglês.
        4. O campo "isPredefined" DEVE ser 'false'.
        5. O campo "isExtra" DEVE ser 'true'.

        Contexto do Roteiro Completo (para referência): "${script}"
        Gere o resultado final como um único array JSON contendo todas as 21 propostas. O array deve ser embaralhado para que todos os tipos de estilos apareçam misturados.`;
    } else {
        prompt = `
        Sua tarefa é criar 20 propostas de estilo visual ÚNICAS e distintas. Cada proposta deve ser uma interpretação visual da PRIMEIRA FRASE DO ROTEIRO, que é: "${firstSentence}".

        A estética geral do canal é: ${aestheticPrompt}.

        Para as 15 primeiras propostas, forneça:
        1. Um nome criativo e evocativo em português.
        2. Um prompt de estilo detalhado e poderoso em inglês.
        3. 3 a 5 tags de palavra-chave em inglês.
        4. O campo "isPredefined" DEVE ser 'false'.
        5. O campo "isExtra" DEVE ser 'false'.
        As propostas devem ser bem variadas.

        Para as 5 últimas propostas (ESTILOS SURPRESA), elas devem ser EXTREMAMENTE INOVADORAS, surpreendentes e que criem imagens que prendam a atenção do espectador, talvez até quebrando um pouco as convenções do estilo do canal, mas ainda mantendo o tema. Para cada uma:
        1. Um nome criativo e evocativo em português.
        2. Um prompt de estilo detalhado e poderoso em inglês.
        3. 3 a 5 tags de palavra-chave em inglês.
        4. O campo "isPredefined" DEVE ser 'false'.
        5. O campo "isExtra" DEVE ser 'true'.

        Contexto do Roteiro Completo (para referência): "${script}"
        Gere as 20 propostas em formato de array JSON. O array DEVE ser embaralhado.`;
    }

    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generateSingleStyleFromChat = async (request: string, script: string): Promise<Omit<Style, 'id'>> => {
    const prompt = `
        Um usuário está buscando um estilo visual para um vídeo.
        Roteiro do vídeo (para contexto): "${script}"
        Pedido do usuário: "${request}"

        Sua tarefa é criar UMA proposta de estilo visual baseada no pedido do usuário e no contexto do roteiro.

        Forneça:
        1. Um nome criativo para o estilo em português.
        2. Um prompt de estilo detalhado e poderoso em inglês.
        3. 3 a 5 tags de palavra-chave em inglês.

        Retorne o resultado como um único objeto JSON.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            prompt: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "prompt", "tags"]
    };
    const responseText = await callGemini(prompt, schema);
    return { ...parseGeminiJson(responseText), isPredefined: false };
};


export const generateStyleVariations = async (originalStyle: Style): Promise<Omit<Style, 'id'>[]> => {
    const prompt = `Gere 3 novas variações da seguinte proposta de estilo. Mantenha o nome e o tema central, mas explore diferentes nuances visuais e artísticas no prompt detalhado em inglês e nas tags. Retorne como um array JSON. Estilo Original: ${JSON.stringify({name: originalStyle.name, prompt: originalStyle.prompt, tags: originalStyle.tags})}`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                prompt: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "prompt", "tags"]
        }
    };
    const responseText = await callGemini(prompt, schema);
    return (parseGeminiJson(responseText) as any[]).map(item => ({...item, isPredefined: false}));
};

export const getStylePrompt = async (styles: Style[]): Promise<string> => {
    if (styles.length === 1) {
        return styles[0].prompt;
    }
    if (styles.length > 1) {
        const prompt = `Crie um novo prompt de estilo visual em inglês que mescle de forma coesa e criativa as estéticas dos seguintes prompts: \n\n1. "${styles[0].prompt}"\n2. "${styles[1].prompt}"\n\nO resultado deve ser um único prompt de estilo detalhado. Retorne apenas o texto do prompt mesclado.`;
        return await callGemini(prompt);
    }
    return "cinematic realism, 4k, detailed, dramatic lighting, sharp focus";
}

export const generatePromptsForScene = async (fullScript: string, scene: string, styles: Style[], negativePrompt: string, globalSuffix: string, channelId: ChannelId, characterBrief?: string, generationContext?: string[]): Promise<string[]> => {
    const stylePrompt = await getStylePrompt(styles);
    const finalNegative = negativePrompt ? `--no ${negativePrompt}` : '';
    const consistencyPrompt = characterBrief ? `\n-   **CHARACTER/WORLD CONSISTENCY:** Use the following description to maintain consistency: "${characterBrief}"` : '';
    const contextPrompt = (generationContext && generationContext.length > 0)
        ? `\n-   **ADDITIONAL CREATIVE GUIDELINES:** Consider the following guidelines when creating prompts:\n    - ${generationContext.join('\n    - ')}`
        : '';

    const prompt = `
        ⚡ **GOD MODE ACTIVATED – MASTER INSTRUCTION** ⚡

        Your primary task is to generate 3 distinct, creative, and detailed image prompts in English.

        **1. CORE RULES & PRIORITIES:**
        -   **PRIORITY 1 (CONTENT):** The prompt's content MUST strictly and faithfully represent the **"SCENE TO VISUALIZE"**. Use the "FULL SCRIPT CONTEXT" for understanding, but the image must ONLY depict the current scene.
        -   **PRIORITY 2 (AESTHETICS):** The prompt's aesthetic MUST adhere to the provided **"VISUAL STYLE"**.
        -   **PRIORITY 3 (VARIETY):** You MUST generate **3 unique versions** for the scene, ensuring there are real, perceptible differences between them.

        **2. HOW TO USE THE VISUAL STYLE:**
        -   The "VISUAL STYLE" is an **AESTHETIC GUIDE ONLY** (for color palette, lighting, atmosphere, detail level).
        -   ❌ **DO NOT** literally copy any subjects, characters, or specific actions from the style prompt's text.
        -   ✅ **DO** apply the *feeling* and *artistic direction* of the style to the content of the "SCENE TO VISUALIZE".
        -   The final prompts must be a fusion: the **content from the scene** rendered with the **aesthetics of the style**.

        **3. HOW TO CREATE VARIATIONS:**
        -   For the same scene, create 3 different prompts by exploring variations in:
            -   **Composition & Framing:** (e.g., close-up, wide shot, rule of thirds).
            -   **Camera Angle:** (e.g., low angle, high angle, point-of-view).
            -   **Atmosphere & Mood:** (e.g., adding fog, changing time of day, emphasizing a specific emotion).
            -   **Focus:** Highlighting different elements or characters within the scene.
        -   The 3 options CANNOT be identical. They must offer clear and distinct visual alternatives.

        ---
        **EXECUTION DATA**
        ---

        -   **SCENE TO VISUALIZE:** "${scene}"
        -   **FULL SCRIPT CONTEXT:** "${fullScript}"
        -   **VISUAL STYLE TO FOLLOW:** "${stylePrompt}"
        ${consistencyPrompt}
        ${contextPrompt}
        ${channelId === 'sombrasdearkive' ? `
        -   **SPECIAL INSTRUCTION for @sombrasdearkive:** The prompt's content MUST be a VISUAL and LITERAL representation of the "SCENE TO VISUALIZE". Be extremely faithful to the action, subjects, and environment described. DO NOT add elements not explicitly in the sentence.
        ` : ''}

        ---
        **FINAL FORMATTING**
        ---
        1.  At the end of EACH of the 3 prompts, add the following suffix exactly as it is: "${globalSuffix} ${finalNegative}".
        2.  Return the 3 prompts as a JSON array of strings.
    `;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generatePromptsForCustomScene = async (fullScript: string, customScene: string, styles: Style[], negativePrompt: string, globalSuffix: string, characterBrief?: string): Promise<string[]> => {
    const stylePrompt = await getStylePrompt(styles);
    const finalNegative = negativePrompt ? `--no ${negativePrompt}` : '';
    const consistencyPrompt = characterBrief ? `\n-   **CHARACTER/WORLD CONSISTENCY:** Use the following description to maintain consistency: "${characterBrief}"` : '';
    const prompt = `
        ⚡ **GOD MODE ACTIVATED – MASTER INSTRUCTION** ⚡

        Your primary task is to generate 3 distinct, creative, and detailed image prompts in English for a custom user-provided idea.

        **1. CORE RULES & PRIORITIES:**
        -   **PRIORITY 1 (CONTENT):** The prompt's content MUST strictly and faithfully represent the **"IDEA TO VISUALIZE"**. Use the "FULL SCRIPT CONTEXT" for thematic consistency only.
        -   **PRIORITY 2 (AESTHETICS):** The prompt's aesthetic MUST adhere to the provided **"VISUAL STYLE"**.
        -   **PRIORITY 3 (VARIETY):** You MUST generate **3 unique versions** for the idea, ensuring there are real, perceptible differences between them.

        **2. HOW TO USE THE VISUAL STYLE:**
        -   The "VISUAL STYLE" is an **AESTHETIC GUIDE ONLY** (for color palette, lighting, atmosphere, detail level).
        -   ❌ **DO NOT** literally copy any subjects or specific actions from the style prompt's text.
        -   ✅ **DO** apply the *feeling* and *artistic direction* of the style to the content of the "IDEA TO VISUALIZE".

        **3. HOW TO CREATE VARIATIONS:**
        -   For the same idea, create 3 different prompts by exploring variations in:
            -   **Composition & Framing:** (e.g., close-up, wide shot).
            -   **Camera Angle:** (e.g., low angle, high angle).
            -   **Atmosphere & Mood:** (e.g., adding fog, emphasizing a specific emotion).

        ---
        **EXECUTION DATA**
        ---

        -   **IDEA TO VISUALIZE:** "${customScene}"
        -   **FULL SCRIPT CONTEXT (for theme consistency):** "${fullScript}"
        -   **VISUAL STYLE TO FOLLOW:** "${stylePrompt}"
        ${consistencyPrompt}

        ---
        **FINAL FORMATTING**
        ---
        1.  At the end of EACH of the 3 prompts, add the following suffix exactly as it is: "${globalSuffix} ${finalNegative}".
        2.  Return the 3 prompts as a JSON array of strings.
    `;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generateWhatIfPrompts = async (fullScript: string, scene: string, whatIfRequest: string, styles: Style[], negativePrompt: string, globalSuffix: string, channelId: ChannelId, characterBrief?: string, generationContext?: string[]): Promise<string[]> => {
    const stylePrompt = await getStylePrompt(styles);
    const finalNegative = negativePrompt ? `--no ${negativePrompt}` : '';
    const consistencyPrompt = characterBrief ? `\n-   **CHARACTER/WORLD CONSISTENCY:** Use the following description to maintain consistency: "${characterBrief}"` : '';
    const contextPrompt = (generationContext && generationContext.length > 0)
        ? `\n-   **ADDITIONAL CREATIVE GUIDELINES:** Consider the following guidelines when creating prompts:\n    - ${generationContext.join('\n    - ')}`
        : '';

    const prompt = `
        ⚡ **GOD MODE ACTIVATED – "WHAT IF?" SCENARIO** ⚡

        Your primary task is to generate 3 distinct, creative, and detailed image prompts in English for a hypothetical "What If?" scenario.

        **1. CORE RULES & PRIORITIES:**
        -   **PRIORITY 1 (CONTENT):** The prompt's content MUST strictly and faithfully represent the **"WHAT IF SCENARIO"**, NOT the original scene. Use other context for understanding only.
        -   **PRIORITY 2 (AESTHETICS):** The prompt's aesthetic MUST adhere to the provided **"VISUAL STYLE"**.
        -   **PRIORITY 3 (VARIETY):** You MUST generate **3 unique versions** for the scenario, ensuring there are real, perceptible differences between them.

        **2. HOW TO USE THE VISUAL STYLE:**
        -   The "VISUAL STYLE" is an **AESTHETIC GUIDE ONLY** (for color palette, lighting, atmosphere).
        -   ❌ **DO NOT** literally copy any subjects or actions from the style prompt's text.
        -   ✅ **DO** apply the *artistic direction* of the style to the content of the "WHAT IF SCENARIO".

        **3. HOW TO CREATE VARIATIONS:**
        -   For the same "What If?" scenario, create 3 different prompts by exploring variations in:
            -   **Composition & Framing:** (e.g., close-up, wide shot).
            -   **Camera Angle:** (e.g., low angle, point-of-view).
            -   **Atmosphere & Mood:** (e.g., more dramatic, more mysterious).
        -   The 3 options CANNOT be identical and must offer clear visual alternatives.

        ---
        **EXECUTION DATA**
        ---

        -   **"WHAT IF" SCENARIO TO VISUALIZE:** "${whatIfRequest}"
        -   **ORIGINAL SCENE (for context):** "${scene}"
        -   **FULL SCRIPT CONTEXT (for narrative understanding):** "${fullScript}"
        -   **VISUAL STYLE TO FOLLOW:** "${stylePrompt}"
        ${consistencyPrompt}
        ${contextPrompt}
        ${channelId === 'sombrasdearkive' ? `
        -   **SPECIAL INSTRUCTION for @sombrasdearkive:** The prompt's content MUST be a VISUAL and LITERAL representation of the "WHAT IF" scenario. Be extremely faithful to the new action, subjects, and environment described.
        ` : ''}

        ---
        **FINAL FORMATTING**
        ---
        1.  At the end of EACH of the 3 prompts, add the following suffix exactly as it is: "${globalSuffix} ${finalNegative}".
        2.  Return the 3 prompts as a JSON array of strings.
    `;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};


export const generateVariations = async (originalPrompt: string, count: number): Promise<string[]> => {
    const prompt = `Gere ${count} novas variações numeradas do seguinte prompt de imagem, mantendo o mesmo tema e estilo, mas alterando detalhes como ângulo da câmera, composição ou iluminação. Retorne como um array JSON de strings. Prompt Original: "${originalPrompt}"`;
     const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generateSceneVariation = async (originalPrompt: string): Promise<string[]> => {
    const prompt = `Crie uma variação de cena para o prompt de imagem a seguir. Mantenha o sujeito e o estilo principal, mas mude drasticamente a composição, o ângulo da câmera ou o ambiente para criar uma imagem visualmente diferente, mas tematicamente conectada. Retorne como um array JSON de uma única string. Prompt Original: "${originalPrompt}"`;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
}

export const generateMotionPrompt = async (imagePrompt: string, fullScript: string): Promise<string> => {
    const prompt = `
        Baseado no contexto do roteiro e no prompt de imagem a seguir, crie um prompt de movimento para animar a imagem.
        O prompt deve ser descritivo, em INGLÊS, e focar em movimentos que façam sentido para a narrativa (ex: "slow zoom in on the artifact", "camera pans left to reveal a shadow", "subtle dust particles floating in the light").
        O prompt de movimento deve ter no máximo 950 caracteres.
        Retorne apenas o texto do prompt de movimento.

        Roteiro: "${fullScript}"
        Prompt de Imagem: "${imagePrompt}"
    `;
    return await callGemini(prompt);
};

export const generateMotionVariation = async (originalMotionPrompt: string): Promise<string> => {
    const prompt = `
        Gere uma variação criativa do seguinte prompt de movimento, mantendo o mesmo tema mas alterando a dinâmica, velocidade ou tipo de movimento da câmera.
        Retorne apenas o texto do novo prompt de movimento.

        Prompt Original: "${originalMotionPrompt}"
    `;
    return await callGemini(prompt);
};

export const generateAssetsForScene = async (originalPrompt: string): Promise<string[]> => {
    const prompt = `
        Analise o seguinte prompt de imagem para identificar o personagem ou objeto principal.
        Sua tarefa é gerar 2 novos prompts de imagem que isolem esse sujeito principal.
        Cada prompt deve descrever o sujeito em uma pose ligeiramente diferente, com um fundo de cor sólida e contrastante (como 'plain green background' ou 'solid gray background') para facilitar a remoção do fundo.
        Mantenha o estilo visual do prompt original.
        Retorne o resultado como um array JSON de 2 strings.

        Prompt Original: "${originalPrompt}"
    `;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const refinePrompt = async (originalPrompt: string, modificationRequest: string): Promise<string> => {
    const prompt = `
        Sua tarefa é modificar um prompt de geração de imagem existente com base na solicitação de um usuário.
        Retorne APENAS o texto completo do novo prompt. Não adicione nenhum texto explicativo, introduções ou "Aqui está o prompt modificado:".
        O idioma do prompt resultante deve ser o mesmo do original (provavelmente inglês).

        Prompt Original: "${originalPrompt}"
        Solicitação de Modificação: "${modificationRequest}"
    `;
    const responseText = await callGemini(prompt);
    return responseText.trim().replace(/^"|"$/g, '');
};


export const generateFusionMotionPrompt = async (prompt1: string, prompt2: string): Promise<string> => {
    const prompt = `
        Você é um especialista em criar prompts de movimento para a IA de vídeo 'dreamia.capcut'.
        Dados dois prompts de imagem representando uma cena inicial e final, crie um ÚNICO e fluido prompt de movimento que faça a transição da primeira imagem para a segunda.
        O movimento deve parecer um movimento de câmera único, como um zoom 3D, uma panorâmica, um travelling complexo ou uma transformação de cena.
        O prompt de movimento final deve ser em INGLÊS e ter MENOS de 950 caracteres.
        Não descreva as imagens, APENAS o movimento da câmera e a transição entre elas.

        Prompt da Imagem Inicial: "${prompt1}"
        Prompt da Imagem Final: "${prompt2}"
    `;
    const responseText = await callGemini(prompt);
    return responseText.trim();
};

export const generateSoundEffects = async (imagePrompt: string): Promise<string[]> => {
    const prompt = `
        Based on the following image prompt, generate 3 to 5 short, descriptive sound effect names in English that would be easily searchable on a stock audio website like Pixabay.
        Focus on the main action, atmosphere, and key elements in the prompt.
        Examples: "cinematic whoosh", "deep space drone", "creepy ambient horror sound", "robotic footsteps on metal".
        Return the result as a JSON array of strings.

        Image Prompt: "${imagePrompt}"
    `;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const analyzeScriptStrength = async (script: string): Promise<string> => {
    const prompt = `
        Você é um "Script Doctor", um analista de roteiros profissional e premiado. Sua tarefa é analisar o roteiro a seguir e fornecer um feedback construtivo.

        **IMPORTANTE:** Seu feedback NÃO deve sugerir mudanças no texto ou na história. Em vez disso, foque em como a EXECUÇÃO VISUAL pode fortalecer a narrativa existente.

        Roteiro para Análise:
        "${script}"

        Analise os seguintes pontos sob uma ótica VISUAL:
        1.  **Estrutura e Ritmo Visual:** O roteiro permite um ritmo de edição envolvente? Onde a edição poderia ser mais rápida ou mais lenta para criar impacto?
        2.  **Clareza e Impacto Visual:** A mensagem principal pode ser reforçada com imagens fortes? Quais são os momentos de maior potencial para um alto impacto visual?
        3.  **Originalidade Visual:** Como este roteiro pode ser representado visualmente de uma forma única e memorável?
        4.  **Pontos de Melhoria Visual:** Ofereça 1 a 2 sugestões específicas sobre enquadramento, iluminação, ou estilo que poderiam elevar o material.

        Seja direto, honesto e encorajador. Retorne sua análise como um texto simples (markdown é aceitável).
    `;
    return callGemini(prompt);
};

export const getSerendipityIdea = async (): Promise<string> => {
    const prompt = `
      Gere uma única restrição criativa, aleatória e surreal para uma cena de vídeo, em português e com no máximo 10 palavras.
      Exemplos: "a gravidade é invertida", "os personagens só podem falar em rimas", "tudo é feito de vidro", "o tempo anda para trás", "as cores estão erradas".
      Retorne APENAS o texto da restrição, nada mais.
    `;
    const responseText = await callGemini(prompt);
    return responseText.trim().replace(/^"|"$/g, '');
};

export const generateViralAnalysis = async (script: string): Promise<ViralAnalysis> => {
    const prompt = `
        Você é um especialista em viralização de conteúdo em plataformas como TikTok e YouTube Shorts.
        Analise o roteiro a seguir e forneça uma análise de potencial viral.

        Roteiro: "${script}"

        Sua resposta DEVE ser um objeto JSON com a seguinte estrutura:
        - "score": um número de 0 a 100 representando o potencial viral.
        - "analysis": uma análise curta e direta (2-3 frases) explicando a pontuação.
        - "suggestions": um array com 2 ou 3 sugestões **VISUAIS e ESTILÍSTICAS** para aumentar o potencial viral. As sugestões devem ser diretrizes para a criação de prompts (ex: "Use um zoom dramático no início para prender a atenção", "Aplique um efeito de glitch em cenas de tensão"). Elas NÃO DEVEM sugerir mudanças na história do roteiro.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: "O potencial viral de 0 a 100." },
            analysis: { type: Type.STRING, description: "A análise da pontuação." },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sugestões de melhoria visual/estilística." }
        },
        required: ['score', 'analysis', 'suggestions']
    };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};

export const generatePlotTwists = async (script: string): Promise<PlotTwist[]> => {
    const prompt = `
        Você é um "Mestre de Roteiros" com uma mente para reviravoltas chocantes.
        Sua tarefa é analisar o roteiro a seguir e gerar 3 reviravoltas (plot twists) **VISUAIS** inesperadas que poderiam ser incorporadas à narrativa.
        **IMPORTANTE:** Não mude a história. As reviravoltas devem ser sobre a *forma* como a história é mostrada.

        Roteiro para Análise:
        "${script}"

        Para cada reviravolta visual, forneça:
        1.  Um título curto e impactante em português (ex: "A Revelação da Cor", "O Close-up Enganoso").
        2.  Uma breve descrição de como a reviravoltas funcionaria visualmente (ex: "Toda a cena é em preto e branco, exceto por um objeto vermelho que se revela crucial no final.", "Um close-up extremo em um olho reflete a verdadeira identidade do vilão.").

        O resultado DEVE ser um array JSON de objetos, onde cada objeto tem as chaves "title" e "description".
    `;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "O título da reviravolta visual." },
                description: { type: Type.STRING, description: "A descrição da reviravolta visual." }
            },
            required: ['title', 'description']
        }
    };
    const responseText = await callGemini(prompt, schema);
    return parseGeminiJson(responseText);
};
