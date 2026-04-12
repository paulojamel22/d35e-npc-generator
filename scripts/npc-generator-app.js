import { NPCApiService } from "./api-service.js";

const SKILL_MAP = {
    // Português (v1.0.0.0 Standard)
    portuguese: {
    "avaliar": "apr",
    "auto-hipnose": "aut",
    "equilíbrio": "blc",
    "blefar": "blf",
    "escalar": "clm",
    "concentração": "coc",
    "ofícios": "crf", // Exceção: subSkill
    "decifrar escrita": "dsc",
    "diplomacia": "dip",
    "operar mecanismo": "dev",
    "disfarces": "dis",
    "arte da fuga": "esc",
    "falsificação": "fog",
    "obter informação": "gif",
    "adestrar animais": "han",
    "curar": "hea",
    "esconder-se": "hid",
    "intimidar": "int",
    "saltar": "jmp",
    "conhecimento arcano": "kar",
    "conhecimento masmorras": "kdu",
    "conhecimento engenharia": "ken",
    "conhecimento geografia": "kge",
    "conhecimento história": "khi",
    "conhecimento local": "klo",
    "conhecimento natureza": "kno",
    "conhecimento nobreza": "kno",
    "conhecimento planos": "kpl",
    "conhecimento psiônico": "kps",
    "conhecimento religião": "kre",
    "ouvir": "lis",
    "furtividade": "mos",
    "abrir fechaduras": "opl",
    "atuação": "prf", // Exceção: subSkill
    "profissão": "pro", // Exceção: subSkill
    "psicocraft": "psi",
    "cavalgar": "rid",
    "procurar": "src",
    "sentir motivação": "sen",
    "prestidigitação": "slt",
    "falar idiomas": "spk",
    "identificar magia": "spl",
    "observar": "spt",
    "sobrevivência": "sur",
    "natação": "swm",
    "acrobacia": "tmb",
    "usar instrumento mágico": "umd",
    "usar instrumento psiônico": "upd",
    "usar cordas": "uro",
    },

    english: {
    // English (v1.0.0.0 Standard)
    "appraise": "apr",
    "autohypnosis": "aut",
    "balance": "blc",
    "bluff": "blf",
    "climb": "clm",
    "concentration": "coc",
    "craft": "crf",
    "decypher script": "dsc",
    "diplomacy": "dip",
    "disable device": "dev",
    "disguise": "dis",
    "escape artist": "esc",
    "forgery": "fog",
    "gather information": "gif",
    "handle animal": "han",
    "heal": "hea",
    "hide": "hid",
    "intimidate": "int",
    "jump": "jmp",
    "knowledge arcana": "kar",
    "knowledge dungeoneering": "kdu",
    "knowledge engineering": "ken",
    "knowledge geography": "kge",
    "knowledge history": "khi",
    "knowledge local": "klo",
    "knowledge nature": "kno",
    "knowledge nobility": "kno",
    "knowledge planes": "kpl",
    "knowledge psionics": "kps",
    "knowledge religion": "kre",
    "listen": "lis",
    "move silently": "mos",
    "open lock": "opl",
    "perform": "prf",
    "profession": "pro",
    "psycraft": "psi",
    "ride": "rid",
    "search": "src",
    "sense motive": "sen",
    "sleight of hand": "slt",
    "speak languages": "spk",
    "spellcraft": "spl",
    "spot": "spt",
    "survival": "sur",
    "swim": "swm",
    "tumble": "tmb",
    "use magic device": "umd",
    "use psionic device": "upd",
    "use rope": "uro",
    }
};

export class D35ENPCGenerator extends FormApplication {
    constructor(object, options) {
        super(object, options);
        this.npcData = null; 
        this.tempItems = [];
        this.isGenerating = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "d35e-npc-generator",
            title: game.i18n.localize("D35E_NPC_GEN.Title"),
            template: "modules/d35e-npc-generator/templates/generator-ui-v2.hbs",
            width: 500,
            height: "auto",
            closeOnSubmit: false,
            classes: ["d35e-generator-window"],
            dragDrop: [{ dropSelector: ".item-drop-zone" }],
            resizable: true
        });
    }

    getData(options) {
        return {
            title: this.options.title,
            categories: [
                { id: "bandit", name: game.i18n.localize("D35E_NPC_GEN.CatBandit") },
                { id: "cultist", name: game.i18n.localize("D35E_NPC_GEN.CatCultist") },
                { id: "guard", name: game.i18n.localize("D35E_NPC_GEN.CatGuard") },
                { id: "merchant", name: game.i18n.localize("D35E_NPC_GEN.CatMerchant") },
                { id: "scholar", name: game.i18n.localize("D35E_NPC_GEN.CatScholar") }
            ],
            levels: [1, 2, 3, 5, 10, 15, 20],
            isGM: game.user.isGM,
            npcData: this.npcData,
            tempItems: Array.from(this.tempItems || []),
            isGenerating: this.isGenerating,
            hasPreview: !!this.npcData
        };
    }

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

        html.find('#finalize-npc').click(ev => {
            ev.preventDefault();
            if (this._submitting) return; 
            this._submitting = true;
            this.createFinalActor().finally(() => this._submitting = false);
        });
    }

    async _onDrop(event) {
        try {
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") return;

            const item = await Item.fromDropData(data);
            if (!item) return;

            const itemData = item.toObject();

            const simpleItem = {
                name: item.name,
                img: item.img,
                type: item.type,
                uuid: data.uuid,
                system: itemData.system,
                id: foundry.utils.randomID()
            };

            if (!this.tempItems) this.tempItems = [];
            this.tempItems.push(simpleItem);
            
            ui.notifications.info(`${game.i18n.localize("D35E_NPC_GEN.Added")}: ${item.name}`);
            this.render(true); 
        } catch (err) {
            console.error("D35E Generator | Drop Error:", err);
        }
    }

    async _updateObject(event, formData) {
        if (this.isGenerating) return;

        if (!game.user.isGM) { return; }

        this.isGenerating = true;
        this.render();

        try {
            const dataIA = await NPCApiService.fetchNPCData(
                formData.category, 
                formData.cr,
                formData.language
            );

            if (dataIA) {
                this.npcData = dataIA;
            }
        } catch (e) {
            ui.notifications.error(game.i18n.localize("D35E_NPC_GEN.ErrorGenerating"));
        } finally {
            this.isGenerating = false;
            this.render();
        }
    }

    async createFinalActor() {
        if (!this.npcData) return;

        // 1. Habilidades (Abilities)
        const formattedAbilities = {};
        for (let [abl, val] of Object.entries(this.npcData.abilities)) {
            formattedAbilities[abl] = { value: parseInt(val) };
        }

        const currentLang = this.npcData.language || "english";
        const activeMap = SKILL_MAP[currentLang] || SKILL_MAP["english"]; // Fallback para inglês se o idioma não tiver mapeamento

        // 2. Perícias (Skills) - Padrão 'points' da 3.0.1
        const skillUpdates = {};
        if (this.npcData.skills) {
            for (let [skillName, pointsVal] of Object.entries(this.npcData.skills)) {
                const cleanName = skillName.toLowerCase().replace(/[:\.]/g, "").trim();
                const sigla = activeMap[cleanName];

                if (sigla) {
                    // Tratamento para Ofícios, Atuação e Profissão
                    if (["crf", "prf", "pro"].includes(sigla)) {
                        skillUpdates[sigla] = {
                            subSkills: {
                                [`${sigla}1`]: { 
                                    name: skillName, // Ex: "Ofícios: Ferraria"
                                    points: parseFloat(pointsVal) 
                                }
                            }
                        };
                    } else {
                        // Perícias padrão
                        skillUpdates[sigla] = { points: parseFloat(pointsVal) };
                    }
                }
            }
        }

        const levelVal = parseInt(this.npcData.level) || 1;

        // 3. Itens (Apenas repassa o que foi arrastado, injetando o nível no item de classe)
        const finalItems = this.tempItems.map(i => {
            const sData = foundry.utils.deepClone(i.system || {});
            
            if (i.type === "class") {
                sData.level = levelVal;
            }

            return {
                name: i.name,
                type: i.type,
                img: i.img,
                system: sData
            };
        });

        // 4. Montagem do Actor Data
        const actorData = {
            name: this.npcData.name,
            type: "npc",
            img: this.tempItems.find(i => i.type === "class")?.img || "icons/svg/mystery-man.svg",
            system: {
                abilities: formattedAbilities,
                skills: skillUpdates,
                details: {
                    // Estrutura de objeto para evitar o erro 'in operator' no level
                    level: { value: levelVal },
                    alignment: this.npcData.alignment,
                    biography: { value: this._buildBio(this.npcData) },
                    notes: { value: this._buildNotes(this.npcData) }
                }
            },
            items: finalItems
        };

        try {
            const actor = await Actor.create(actorData);

            // O alinhamento na 3.0.1 costuma precisar desse update para registrar visualmente
            if (this.npcData.alignment) {
                await actor.update({ "system.details.alignment": this.npcData.alignment });
            }

            ui.notifications.info(game.i18n.format("D35E_NPC_GEN.CreationSuccess", { name: actor.name }));
            this.close();
            
            // Timer de segurança para o processamento de 'Derived Data' do sistema
            setTimeout(() => actor.sheet.render(true), 200);
        } catch (err) {
            console.error("D35E Generator | Creation Error:", err);
            //ui.notifications.error("Erro ao criar o NPC. Verifique o console.");
        }
    }

    _buildBio(data) {
        return `
            <div class="d35e-generator-result">
                <h2>${data.name}</h2>
                <p><strong>${game.i18n.localize("D35E_NPC_GEN.BioLabel")}:</strong> ${data.bioHtml}</p>
                <div class="hook"><strong>${game.i18n.localize("D35E_NPC_GEN.HookLabel")}:</strong> ${data.adventureHook}</div>
            </div>
        `;
    }

    _buildNotes(data) {
        return `<h3><i class="fas fa-robot"></i> ${game.i18n.localize("D35E_NPC_GEN.AILog")}</h3>
            <pre style="white-space: pre-wrap; background: #f4f4f4; padding: 10px; border: 1px solid #ccc;">
                ${data.notesHtml}
            </pre>
            <hr>
        `;
    }
}