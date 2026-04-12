import { D35ENPCGenerator } from "./npc-generator-app.js";

Hooks.once('init', () => {
    console.log("D35E NPC Generator | Initializing...");

    // Configuração da API Key
    game.settings.register('d35e-npc-generator', 'apiKey', {
        name: game.i18n.localize("D35E_NPC_GEN.SettingsApiKeyName"),
        hint: game.i18n.localize("D35E_NPC_GEN.SettingsApiKeyHint"),
        scope: "world",
        config: true,
        type: String,
        default: ""
    });
    
    // Configuração do Modelo
    game.settings.register("d35e-npc-generator", "apiModel", {
        name: game.i18n.localize("D35E_NPC_GEN.SettingsModelName"),
        scope: "world",
        config: true,
        type: String,
        default: "gemini-1.5-flash" // Corrigido para a versão estável atual
    });

    // Registra na global do módulo
    game.modules.get("d35e-npc-generator").api = {
        D35ENPCGenerator: D35ENPCGenerator
    };

    // Helper para transformar texto em maiúsculo (se precisar no HBS)
    Handlebars.registerHelper('upper', function (str) {
        if (typeof str !== 'string') return "";
        return str.toUpperCase();
    });
});

Hooks.on("renderActorDirectory", (app, html, data) => {
    // 1. Verificação de segurança: Só executa se for GM
    if (!game.user.isGM) return;
    // Compatibilidade V12/V13
    const $html = $(html);

    if ($html.find(".npc-gen-btn").length > 0) return;

    // O texto do botão agora vem do i18n
    const buttonText = game.i18n.localize("D35E_NPC_GEN.GenerateBtn");

    const button = $(`
        <div class="action-buttons flexrow">
            <button class="npc-gen-btn">
                <i class="fas fa-robot"></i> ${buttonText}
            </button>
        </div>
    `);

    // Injeção no header do diretório de atores
    $html.find(".directory-header .header-actions").after(button);

    button.click((ev) => {
        ev.preventDefault();
        const api = game.modules.get("d35e-npc-generator").api;
        new api.D35ENPCGenerator().render(true);
    });
});