import { NPCApiService } from "./api-service.js";

/**
 * Interface principal do D35E - NPC Generator
 */
export class D35ENPCGenerator extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "d35e-npc-generator",
            title: "D35E - NPC Generator",
            template: "modules/d35e-npc-generator/templates/generator-ui.hbs",
            width: 400,
            height: "auto",
            closeOnSubmit: false
        });
    }

    getData() {
        return {
            categories: [
                { id: "bandit", name: "Bandido" },
                { id: "cultist", name: "Cultista Fanático" },
                { id: "guard", name: "Guarda" },
                { id: "merchant", name: "Mercador" },
                { id: "scholar", name: "Sábio/Acadêmico" }
            ],
            levels: [1, 2, 3, 5, 10, 15, 20]
        };
    }

    async _updateObject(event, formData) {
        // Bloqueia o botão para evitar cliques duplos
        const button = $(event.currentTarget).find('button[name="submit"]');
        button.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Gerando...');

        try {
            await this.generateNPC(formData.category, formData.cr);
        } finally {
            // Reabilita o botão após terminar (sucesso ou erro)
            button.prop("disabled", false).html('<i class="fas fa-magic"></i> Gerar NPC');
        }
    }

    async generateNPC(category, cr) {
        ui.notifications.info("Consultando os oráculos (IA)...");
        
        const dataIA = await NPCApiService.fetchNPCData(category, cr);
        if (!dataIA) {
            ui.notifications.error("Falha ao obter dados da IA.");
            return;
        }

        // HTML limpo e organizado para as Notas
        const notesContent = `
            <div class="d35e-generator-result">
                <h2 style="border-bottom: 2px solid #7a2828;">${dataIA.name}</h2>
                <p><strong>Tipo:</strong> ${dataIA.raceClass} | <strong>CR:</strong> ${cr}</p>
                <p><strong>HP:</strong> ${dataIA.hp} | <strong>CA:</strong> ${dataIA.ac}</p>
                
                <section>
                    <h3 style="font-size: 1.1em; color: #7a2828;"><i class="fas fa-fist-raised"></i> Equipamento Sugerido</h3>
                    <div class="gear-list">${dataIA.gearHtml}</div>
                </section>

                <section>
                    <h3 style="font-size: 1.1em; color: #7a2828;"><i class="fas fa-book-open"></i> Biografia & Personalidade</h3>
                    ${dataIA.bioHtml}
                </section>

                <div class="hook-box" style="background: rgba(122, 40, 40, 0.1); padding: 10px; border-left: 4px solid #7a2828; margin-top: 15px; font-style: italic;">
                    <strong>Gancho de Aventura:</strong> ${dataIA.adventureHook}
                </div>
            </div>
        `;

        // Criação do Actor injetando os valores nos campos corretos do D35E
        const actor = await Actor.create({
            name: dataIA.name,
            type: "npc",
            system: {
                abilities: {
                    str: { value: dataIA.abilities?.str || 10 },
                    dex: { value: dataIA.abilities?.dex || 10 },
                    con: { value: dataIA.abilities?.con || 10 },
                    int: { value: dataIA.abilities?.int || 10 },
                    wis: { value: dataIA.abilities?.wis || 10 },
                    cha: { value: dataIA.abilities?.cha || 10 }
                },
                details: {
                    alignment: dataIA.alignment,
                    biography: { 
                        value: notesContent
                    } // Aqui vai o HTML formatado com a Bio e Hook
                }
            }
        });

        ui.notifications.info(`NPC ${actor.name} materializado!`);
        actor.sheet.render(true);
    }
}