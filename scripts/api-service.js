export class NPCApiService {
    static async fetchNPCData(category, cr) {
        const apiKey = game.settings.get("d35e-npc-generator", "apiKey");
        const modelName = game.settings.get("d35e-npc-generator", "apiModel") || "gemini-2.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        if (!apiKey) {
            ui.notifications.error("D35E Generator: API Key não configurada!");
            return null;
        }

        const prompt = `Gere um NPC para D&D 3.5E. Categoria: ${category}, CR: ${cr}. 
            Responda seguindo exatamente este modelo de tags:
            [NAME] Nome do Personagem
            [ALINHAMENTO] Alinhamento (ex: Leal e Bom) (Obrigatório)
            [RACE] Raça e Classe
            [STATS] str:10, dex:10, con:10, int:10, wis:10, cha:10
            [HP_AC] HP:15, AC:12
            [GEAR] <ul><li>Item 1</li></ul>
            [BIO] <p>História curta.</p>
            [HOOK] Gancho de aventura.
            Tudo em Português Brasileiro.`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.5 } // Temperatura mais baixa = mais consistência nas tags
                })
            });

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;

            // Função de captura melhorada para ignorar case e espaços
            const getTag = (tag) => {
                const regex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`, "i");
                const match = text.match(regex);
                return match ? match[1].trim() : "";
            };

            const statsStr = getTag("STATS");
            const abilities = {};
            statsStr.split(",").forEach(s => {
                const [key, val] = s.split(":");
                if(key && val) abilities[key.trim().toLowerCase()] = parseInt(val.trim());
            });

            // Montagem do JSON incluindo os novos campos informativos
            const finalJson = {
                name: getTag("NAME") || "NPC Desconhecido",
                alignment: getTag("ALINHAMENTO"),
                raceClass: getTag("RACE"),
                abilities: abilities,
                hp: getTag("HP_AC").split(",")[0]?.replace(/HP:/i, "").trim() || "10",
                ac: getTag("HP_AC").split(",")[1]?.replace(/AC:/i, "").trim() || "10",
                gearHtml: getTag("GEAR"),
                bioHtml: getTag("BIO"),
                adventureHook: getTag("HOOK")
            };

            console.log("D35E Generator | Objeto Montado:", finalJson);
            return finalJson;

        } catch (error) {
            console.error("D35E Generator | Erro na API do Gemini:", error);
            return null;
        }
    }
}