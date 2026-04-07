# D35E NPC Generator - Foundry VTT 🎲🤖

Um módulo robusto para **Foundry VTT** projetado para o sistema **D&D 3.5E**. Este projeto utiliza a API do **Google Gemini AI** para gerar NPCs detalhados, com atributos mecânicos e background narrativo, integrando inteligência artificial diretamente no fluxo de preparação do Mestre.

---

## 🚀 Funcionalidades

- **Geração Inteligente:** Cria NPCs baseados em categorias (Bandido, Guarda, Mercador, etc.) e Nível de Desafio (CR).
- **Integração Nativa D35E:** Preenche automaticamente as habilidades (STR, DEX, CON, INT, WIS, CHA) e o alinhamento na ficha do Actor.
- **Background Rico:** Gera automaticamente biografia, equipamentos sugeridos e ganchos de aventura em HTML formatado.
- **Customização de IA:** Configuração via interface do Foundry para escolher o modelo (ex: Gemini 1.5 Flash, 2.0 Flash) e gerenciar a API Key.
- **Arquitetura Resiliente:** Utiliza sistema de parsing via Regex e tags para garantir que falhas de sintaxe da IA não quebrem a criação do ator.

---

## 🛠️ Tecnologias Utilizadas

- **JavaScript (ES6+):** Lógica modular e manipulação de classes.
- **Foundry VTT API:** Hooks, FormApplication e criação dinâmica de Actors.
- **Google Gemini API:** Processamento de linguagem natural para geração de conteúdo.
- **HTML5/CSS3:** Templates Handlebars (.hbs) para a interface do gerador.

---

## 📦 Instalação

1. No seu Foundry VTT, vá na aba **Add-on Modules**.
2. Clique em **Install Module**.
3. No campo **Manifest URL**, cole o link do seu `module.json` no GitHub:
   `https://github.com/paulojamel22/d35e-npc-generator/raw/main/module.json`
4. Após instalar, ative o módulo em seu mundo e insira sua API Key nas configurações.

---

## 🖥️ Como Usar

1. Abra a aba de **Actors** no Foundry.
2. Clique no botão **Gerar NPC IA** no cabeçalho.
3. Escolha a categoria e o nível do NPC.
4. Clique em **Gerar** e aguarde o "oráculo" responder.
5. A ficha do novo NPC abrirá automaticamente com os dados preenchidos na aba de Notas/Biografia.

---

## 📝 Autor

Desenvolvido por **Paulo** - Parte do projeto **Portal DMPlace**.
Focado em automação de sistemas de RPG e ferramentas sistêmicas.

---

> **Nota Técnica:** Este módulo foi desenvolvido como parte de um portfólio profissional, demonstrando competência em integração de APIs de terceiros, manipulação de dados assíncronos e desenvolvimento de extensões para plataformas complexas.