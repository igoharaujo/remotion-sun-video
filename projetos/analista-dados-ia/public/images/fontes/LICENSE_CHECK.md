# LICENSE_CHECK — analista-dados-ia

Auditoria das imagens em `public/images/fontes/` (baixadas em 2026-10-27).
Uso pretendido: vídeo editorial/comentário no TikTok, citando a fonte na tela ("FONTE: WEF", "FONTE: GARTNER"…).

| # | Arquivo | Origem | Autor / titular | Licença | Status |
|---|---------|--------|-----------------|---------|--------|
| 1a | `01a_wef_future_of_jobs_2025_capa.png` | Capa (pág. 1) do PDF oficial — https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf | World Economic Forum | © WEF. Uso editorial com atribuição (citação de relatório público) | ✅ OK editorial — selo "FONTE: WEF" obrigatório |
| 1b | `01b_wef_future_of_jobs_2025_p19_fastest_growing_declining.png` | Pág. 19 do mesmo PDF (Figura 2.2 "Fastest-growing and fastest-declining jobs, 2025-2030") | World Economic Forum | idem | ✅ OK editorial — é a prova visual real do dado |
| 2 | `02_gartner_logo.svg` | https://commons.wikimedia.org/wiki/File:Gartner_logo.svg | Gartner, Inc. | Domínio público (logotipo só de texto), **marca registrada** | ✅ OK — uso nominativo/editorial, sem sugerir patrocínio |
| 3a | `03a_powerbi_copilot_painel.png` | Microsoft Learn, "Copilot in Power BI" — https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction | Microsoft | Docs do Microsoft Learn (repo MicrosoftDocs/powerbi-docs: conteúdo CC BY 4.0); UI e logos são marcas da Microsoft | ✅ OK com atribuição "Microsoft Learn" |
| 3b | `03b_powerbi_copilot_criar_relatorio.png` | mesma página | Microsoft | idem | ✅ OK com atribuição |
| 4 | `04_diferenca_salarial_59k.svg` | Gerado para este vídeo | próprio | próprio | ✅ OK — ver ressalva de **dado** abaixo |
| 5 | `05_codigo_tela.jpg` | https://commons.wikimedia.org/wiki/File:Code_on_computer_monitor_(Unsplash).jpg (orig. https://unsplash.com/photos/Skf7HxARcoc), redimensionada p/ 2400 px | Markus Spiske | **CC0** | ✅ OK, sem atribuição exigida (creditada mesmo assim) |

## Não usado (e por quê)
- **Página/print do press release da Gartner** (gartner.com/en/newsroom/…2026-03-11…): o site bloqueia acesso automatizado (HTTP 403) e o conteúdo é © Gartner. O card da Gartner será montado em código: logo + citação curta + data, como citação editorial.
- **Logos de agregadores** (cdnlogo, logotyp.us, brandfetch): sem licença clara → descartados em favor do Wikimedia Commons.

## Checagem dos DADOS citados no áudio (importante)
| Fala | O que a fonte diz | Situação |
|------|-------------------|----------|
| "O Fórum Econômico Mundial projeta queda de mais de 50% no trabalho operacional de dados" | No Future of Jobs 2025 (Fig. 2.2, pág. 19) **"Data Entry Clerks"** está entre as funções que mais encolhem até 2030, **mas "Data Analysts and Scientists" e "Big Data Specialists" estão entre as que mais CRESCEM**. Não localizei o número "mais de 50%" no relatório. | ⚠️ Parcial — a tendência (operacional cai) confere; o "50%" não foi encontrado |
| "A Gartner mostrou que qualquer gestor hoje gera relatórios utilizando IA" | Gartner *Predicts 2026: AI Agents, MCP and Governance Are Transforming Analytics* (nov/2025): "até 2028, 60% dos usuários de analytics self-service vão usar LLMs de uso geral para análise ad hoc". Press release "Top Predictions for D&A in 2026" (11/03/2026) existe, mas não pude ler o texto completo. | ⚠️ Paráfrase forte — direção confere, "qualquer gestor" é exagero |
| "ganha 59 mil dólares a mais por ano" | Fonte não encontrada. Números próximos publicados: PwC AI Jobs Barometer (prêmio salarial de 56%–62% para quem tem habilidade em IA); Lightcast (~US$ 18 mil a mais em vagas que pedem IA). | ❌ Sem fonte — recomendo não colocar selo de "FONTE" nesse card |
