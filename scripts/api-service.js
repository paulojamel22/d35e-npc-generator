export class NPCApiService {
    static async fetchNPCData(category, cr) {
        const apiKey = game.settings.get("d35e-npc-generator", "apiKey");
        const modelName = game.settings.get("d35e-npc-generator", "apiModel") || "gemini-1.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        if (!apiKey) {
            ui.notifications.error("D35E Generator: API Key não configurada!");
            return null;
        }

        // PROMPT AJUSTADO: Pedimos RACE, CLASS e LEVEL separados
        const prompt = `Gere um NPC para D&D 3.5E. Categoria: ${category}, CR: ${cr}. 
            Responda seguindo exatamente este modelo de tags:
            [NAME] Korag, o Brutal, Leela, etc... IMPORTANTE: O nome deve ser curto, evocativo, original e não usar palavras repetidas.
            [ALINHAMENTO] Alinhamento (ex: Leal e Bom)
            [RACE] Humano, Elfo, Anão, etc... A raça deve ser aleatória e coerente com o CR e a classe.
            [CLASS] Barbaro, Mago, Ladino, etc... A classe deve ser aleatória e coerente com o CR e a raça. e deve ser uma classe oficial do D&D 3.5E, sem homebrew.
            [LEVEL] ${cr}
            [STATS] str:10, dex:10, con:10, int:10, wis:10, cha:10 - As habilidades devem ser coerentes com a classe e raça, e adequadas para o CR. e nunca devem ser menor que 8 ou maior que 18.
            [SKILLS] Acrobacia:5, Furtividade:3, Ouvir:4, Procurar:2, Observar:3 - As perícias devem ser coerentes com a classe e raça, e adequadas para o CR. O formato deve ser "Nome da Perícia:Valor", separados por vírgula.
            [TALENTOS] Ataque Poderoso, Iniciativa Aprimorada
            [HP_AC] HP:15, AC:12
            [GEAR_SUMMARY] Lista curta de equipamentos (ex: Espada Longa, Adaga)
            [GEAR_HTML] <ul><li>Item 1</li></ul>
            [BIO] <p>História curta.</p>
            [HOOK] Gancho de aventura.
            Tudo em Português Brasileiro e Coerente com as regras do D&D 3.5E.`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.8 }
                })
            });

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;

            const getTag = (tag) => {
                const regex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`, "i");
                const match = text.match(regex);
                return match ? match[1].trim() : "";
            };

            const statsStr = getTag("STATS");
            const skillsStr = getTag("SKILLS");
            const featsStr = getTag("TALENTOS");
            const skills = {};
            if (skillsStr) {
                skillsStr.split(",").forEach(s => {
                    const [name, val] = s.split(":");
                    if(name && val) skills[name.trim().toLowerCase()] = parseInt(val.trim());
                });
            }
            const abilities = {};
            statsStr.split(",").forEach(s => {
                const [key, val] = s.split(":");
                if(key && val) abilities[key.trim().toLowerCase()] = parseInt(val.trim());
            });

            // MONTAGEM DO JSON: Agora com as chaves que o Handlebars espera
            const finalJson = {
                name: getTag("NAME") || "NPC Desconhecido",
                alignment: getTag("ALINHAMENTO"),
                race: getTag("RACE"),       // <--- Agora existe separadamente
                className: getTag("CLASS"),  // <--- Agora existe separadamente
                level: getTag("LEVEL") || cr,
                cr: cr,
                abilities: abilities,
                skills: skills,
                feats: featsStr ? featsStr.split(",").map(f => f.trim()) : [],
                hp: getTag("HP_AC").split(",")[0]?.replace(/HP:/i, "").trim() || "10",
                ac: getTag("HP_AC").split(",")[1]?.replace(/AC:/i, "").trim() || "10",
                gearSummary: getTag("GEAR_SUMMARY"), // <--- Para o texto da preview
                gearHtml: getTag("GEAR_HTML"),       // <--- Para as notas da ficha
                bioHtml: getTag("BIO"),
                notesHtml: text,
                adventureHook: getTag("HOOK")
            };

            console.log("D35E Generator | Objeto Montado para Preview:", finalJson);
            return finalJson;

        } catch (error) {
            console.error("D35E Generator | Erro na API do Gemini:", error);
            return null;
        }
    }
}