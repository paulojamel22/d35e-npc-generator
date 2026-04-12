export class NPCApiService {
    static async fetchNPCData(category, cr, language = "english") {
        const apiKey = game.settings.get("d35e-npc-generator", "apiKey");
        const modelName = game.settings.get("d35e-npc-generator", "apiModel") || "gemini-1.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        // Detecta o idioma do Foundry VTT
        const currentLang = game.i18n.lang; 
        const isEn = currentLang === 'en';
        
        // Define as instruções de linguagem baseadas no sistema
        const langInstruction = isEn 
            ? "Respond in English. Use official D&D 3.5E terminology." 
            : "Responda em Português Brasileiro. Use a terminologia oficial do D&D 3.5E.";

        if (!apiKey) {
            ui.notifications.error(game.i18n.localize("D35E_NPC_GEN.ErrorNoApiKey"));
            return null;
        }

        // PROMPT INTERNACIONALIZADO v1.0.0.0
        // Note que as tags [NAME], [STATS], etc permanecem em inglês para facilitar o seu Regex (getTag)
        const prompt = `System: You are a D&D 3.5E expert generator. ${langInstruction}
            Task: Generate a NPC for Category: ${category}, CR: ${cr}.
            IMPORTANT: All text fields (name, biography, notes, and skill names) MUST be in ${language}.
            
            Follow exactly this tag model:
            [NAME] Character Name and Epithet. IMPORTANT: Original, unique and evocative and not Kaelen.
            [ALIGNMENT] Alignment (e.g., Lawful Good / Leal e Bom)
            [RACE] Random race consistent with D&D 3.5E. Human, Elf, Dwarf, etc. (Use the official names in the chosen language)
            [CLASS] Official 3.5E Class (No homebrew). If the NPC is a commoner, specify "Commoner". Fighter, Wizard, Rogue, etc. (Use the official names in the chosen language)
            [LEVEL] ${cr}
            [STATS] str:10, dex:10, con:10, int:10, wis:10, cha:10 (Values between 8-18)
            [SKILLS] Skill Name:Value, Skill Name:Value (Consistent with class/level)
            [TALENTOS] Feat names separated by comma.
            [GEAR_SUMMARY] Short equipment list string.
            [GEAR_HTML] <ul><li>Item</li></ul>
            [BIO] Short backstory in HTML.
            [HOOK] Adventure hook.

            Ensure the response is high quality and consistent with the requested language (${currentLang}).
            IMPORTANT: Do not include any additional text outside of the tags. Do not explain anything. Only respond with the tagged content.
            IMPORTANT: Avoid generating the same name repeatedly (Kaelen).
            IMPORTANT: Avoid generating the same race/class combinations repeatedly. Be creative and varied.`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.9, // Aumentado para 0.9 para evitar o bug do nome repetido (Kaelen)
                        topP: 0.95
                    }
                })
            });

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;

            const getTag = (tag) => {
                const regex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`, "i");
                const match = text.match(regex);
                return match ? match[1].trim() : "";
            };

            // Processamento de Stats e Skills
            const statsStr = getTag("STATS");
            const skillsStr = getTag("SKILLS");
            const featsStr = getTag("TALENTOS");
            
            const skills = {};
            if (skillsStr) {
                // No loop de skills da api-service.js:
                skillsStr.split(",").forEach(s => {
                    const parts = s.split(":");
                    if(parts.length >= 2) {
                        const name = parts[0].trim().toLowerCase().replace(/[.:]/g, ""); // Limpeza extra
                        const val = parts[1].trim();
                        skills[name] = parseInt(val);
                    }
                });
            }

            const abilities = {};
            if (statsStr) {
                statsStr.split(",").forEach(s => {
                    const [key, val] = s.split(":");
                    if(key && val) abilities[key.trim().toLowerCase()] = parseInt(val.trim());
                });
            }

            const finalJson = {
                name: getTag("NAME") || (isEn ? "Unknown NPC" : "NPC Desconhecido"),
                language: language,
                alignment: getTag("ALIGNMENT"),
                race: getTag("RACE"),
                className: getTag("CLASS"),
                level: getTag("LEVEL") || cr,
                cr: cr,
                abilities: abilities,
                skills: skills,
                feats: featsStr ? featsStr.split(",").map(f => f.trim()) : [],
                gearSummary: getTag("GEAR_SUMMARY"),
                gearHtml: getTag("GEAR_HTML"),
                bioHtml: getTag("BIO"),
                notesHtml: text,
                adventureHook: getTag("HOOK")
            };

            return finalJson;

        } catch (error) {
            console.error("D35E Generator | API Error:", error);
            return null;
        }
    }
}