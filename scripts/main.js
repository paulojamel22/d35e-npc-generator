import { D35ENPCGenerator } from "./npc-generator-app.js";

Hooks.once('init', () => {
    console.log("D35E NPC Generator | Inicializando...");

    game.settings.register('d35e-npc-generator', 'apiKey', {
        name: "Google Gemini API Key",
        hint: "Obtenha sua chave no Google AI Studio",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });
    
    game.settings.register("d35e-npc-generator", "apiModel", {
        name: "Modelo da IA",
        scope: "world",
        config: true,
        type: String,
        default: "gemini-2.5-flash"
    });

    // Registra na global do seu módulo para garantir visibilidade
    game.modules.get("d35e-npc-generator").api = {
        D35ENPCGenerator: D35ENPCGenerator
    };

    Handlebars.registerHelper('upper', function (str) {
        if (typeof str !== 'string') return "";
        return str.toUpperCase();
    });
});

Hooks.on("renderActorDirectory", (app, html, data) => {
    // Na V13, precisamos converter o html nativo para jQuery
    const $html = $(html);

    if ($html.find(".npc-gen-btn").length > 0) return;

    const button = $(`
        <div class="action-buttons flexrow">
            <button class="npc-gen-btn">
                <i class="fas fa-robot"></i> Gerar NPC IA
            </button>
        </div>
    `);

    // Injetando no header para garantir compatibilidade com o sistema D35E
    $html.find(".directory-header .header-actions").after(button);

    button.click((ev) => {
        ev.preventDefault();
        const api = game.modules.get("d35e-npc-generator").api;
        new api.D35ENPCGenerator().render(true);
    });
});