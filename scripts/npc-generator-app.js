import { NPCApiService } from "./api-service.js";

const SKILL_MAP = {
    "abrir fechaduras": "afe",
    "adestrar animais": "aan",
    "arte da fuga": "afu",
    "atuação": "atu", // Atuação geral
    "avalizacao": "ava",
    "cavalgar": "cav",
    "concentracao": "con",
    "conhecimento": "con", // Pode precisar de sub-categorias
    "curar": "cur",
    "decifrar escritas": "des",
    "diplomacia": "dip",
    "disfarce": "dis",
    "equilibrio": "equ",
    "escalar": "esc",
    "espreitar": "esp",
    "falsificacao": "fal",
    "furtividade": "fur",
    "identificar magia": "idm",
    "intimidar": "int",
    "nadar": "nad",
    "observar": "obs",
    "obter informacao": "oin",
    "ouvir": "ouv",
    "oficio": "ofi",
    "operar mecanismo": "ome",
    "procurar": "pro",
    "profissao": "prf",
    "sentir motivacao": "smo",
    "sobrevivencia": "sob",
    "usar cordas": "uco",
    "usar instrumento magico": "uim"
};

export class D35ENPCGenerator extends FormApplication {
    constructor(object, options) {
        super(object, options);
        // Estado inicial do gerador
        this.npcData = null; 
        this.tempItems = [];
        this.isGenerating = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "d35e-npc-generator",
            title: "D35E - NPC Generator & Preview",
            template: "modules/d35e-npc-generator/templates/generator-ui-v2.hbs",
            width: 500,
            height: "auto",
            closeOnSubmit: false,
            classes: ["d35e-generator-window"],
            dragDrop: [{ dropSelector: ".item-drop-zone" }], // Habilita o Drop na zona específica
            resizable: true
        });
    }

    /**
     * Prepara os dados que o Handlebars (.hbs) vai usar
     */
    getData(options) {
        // Forçamos a captura do estado atual da classe
        const data = {
            title: this.options.title,
            categories: [
                { id: "bandit", name: "Bandido" },
                { id: "cultist", name: "Cultista Fanático" },
                { id: "guard", name: "Guarda" },
                { id: "merchant", name: "Mercador" },
                { id: "scholar", name: "Sábio/Acadêmico" }
            ],
            levels: [1, 2, 3, 5, 10, 15, 20],
            npcData: this.npcData,
            tempItems: Array.from(this.tempItems || []), // Criamos uma cópia para garantir a detecção de mudança
            isGenerating: this.isGenerating,
            hasPreview: !!this.npcData
        };

        console.log("D35E | DEBUG HBS | Itens:", data.tempItems);
        return data;
    }

    /**
     * Listener para eventos de clique (Botão Gerar vs Botão Criar)
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.remove-item').click(ev => {
            ev.preventDefault();
            const index = $(ev.currentTarget).data("index");
            if (index !== undefined) {
                this.tempItems.splice(index, 1);
                this.render(true);
            }
        });

        // CORREÇÃO AQUI: Mantenha apenas UMA destas chamadas
        html.find('#finalize-npc').click(ev => {
            ev.preventDefault();
            // Evita múltiplos cliques rápidos
            if (this._submitting) return; 
            this._submitting = true;
            
            this.createFinalActor().finally(() => this._submitting = false);
        });
    }

    /**
     * Gerencia o Drop de itens do Compendium
     */
    async _onDrop(event) {
        try {
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") return;

            // IMPORTANTE: Buscar o item completo para ter nome e ícone
            const item = await Item.fromDropData(data);
            if (!item) return;

            // Criar o objeto que o seu HBS espera
            const simpleItem = {
                name: item.name,
                img: item.img,
                type: item.type,
                uuid: data.uuid, // Guardamos o UUID para criar o actor depois
                id: foundry.utils.randomID() // ID único para o Handlebars não se perder
            };

            // Adiciona ao array da instância
            if (!this.tempItems) this.tempItems = [];
            this.tempItems.push(simpleItem);
            
            console.log("Item adicionado com sucesso:", simpleItem);
            ui.notifications.info(`Adicionado: ${item.name}`);

            // Força o Foundry a rodar o getData() e atualizar o HTML
            this.render(true); 
        } catch (err) {
            console.error("Erro no Drop:", err);
        }
    }

    /**
     * Chamado pelo botão principal (submit) para consultar a IA
     */
    async _updateObject(event, formData) {
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.render(); // Atualiza para mostrar o spinner

        try {
            const dataIA = await NPCApiService.fetchNPCData(formData.category, formData.cr);
            if (dataIA) {
                this.npcData = dataIA;
            }
        } catch (e) {
            ui.notifications.error("Erro ao gerar dados.");
        } finally {
            this.isGenerating = false;
            this.render();
        }
    }

    /**
     * O Gran Finale: Pega tudo da preview e joga no Actor real
     */
    async createFinalActor() {
        if (!this.npcData) return;

        // Prepara as habilidades no formato que o D35E exige
        const formattedAbilities = {};
        for (let [abl, val] of Object.entries(this.npcData.abilities)) {
            formattedAbilities[abl] = { value: val };
        }

        const skillUpdates = {};
        if (this.npcData.skills) {
            for (let [skillName, rank] of Object.entries(this.npcData.skills)) {
                const sigla = SKILL_MAP[skillName];
                if (sigla) {
                    skillUpdates[sigla] = { rank: rank };
                }
            }
        }

        const biosContent = this._buildBio(this.npcData);
        const notesContent = this._buildNotes(this.npcData);

        console.log("D35E Generator | Criando Actor com os seguintes dados:", {
            name: this.npcData.name,
            abilities: formattedAbilities,
            skills: skillUpdates,
            alignment: this.npcData.alignment,
            biography: biosContent,
            notes: notesContent,
            items: this.tempItems
        });

        const actorData = {
            name: this.npcData.name,
            type: "npc",
            img: this.tempItems.find(i => i.type === "class")?.img || "icons/svg/mystery-man.svg",
            system: {
                abilities: formattedAbilities, // Agora vai como { str: { value: 14 }, ... }
                skills: skillUpdates, // <--- INJETA AQUI
                details: {
                    alignment: this.npcData.alignment,
                    biography: { 
                        value: biosContent 
                    },
                    notes: { 
                        value: notesContent
                    }
                }
            },
            items: this.tempItems
        };

        const actor = await Actor.create(actorData);
        ui.notifications.info(`NPC ${actor.name} criado com sucesso!`);
        this.close();
        actor.sheet.render(true);
    }

    _buildBio(data) {
        return `
            <div class="d35e-generator-result">
                <h2>${data.name}</h2>
                <p><strong>Bio:</strong> ${data.bioHtml}</p>
                <div class="hook"><strong>Gancho:</strong> ${data.adventureHook}</div>
            </div>
        `;
    }

    _buildNotes(data) {
        return `<h3><i class="fas fa-robot"></i> Log de Geração IA</h3>
            <pre style="white-space: pre-wrap; background: #f4f4f4; padding: 10px; border: 1px solid #ccc;">
                ${data.notesHtml}
            </pre>
            <hr>
        `;
    }
}