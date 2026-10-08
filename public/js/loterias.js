/**
 * ============================================
 * LOTERIAS — fonte única de dados e "loteria ativa"
 * ============================================
 *
 * Carregar no <head>, ANTES de qualquer CSS que use var(--cor-loteria):
 *   <script src="/js/loterias.js"></script>
 * Assim o tema é aplicado antes da primeira pintura (sem "pisca" de cor).
 *
 * Loteria ativa, em ordem de prioridade:
 *   1. ?loteria=<slug> na URL (link compartilhável) — também é salva no localStorage
 *   2. localStorage "loteriaAtiva" (última escolha)
 *   3. LOTERIA_PADRAO (lotofacil)
 *
 * Expõe apenas window.Loterias (não cria outras globais).
 */
(function () {
    "use strict";

    const LOTERIA_PADRAO = "lotofacil";
    const CHAVE_STORAGE = "loteriaAtiva";

    // Slugs alternativos aceitos na URL → slug usado pelo backend e pelo frontend
    const APELIDOS = {
        diadesorte: "diadasorte",
        "dia-de-sorte": "diadasorte",
        "mega-sena": "megasena",
        "dupla-sena": "duplasena",
        "mais-milionaria": "maismilionaria",
        "+milionaria": "maismilionaria",
    };

    // getDay(): 0 = domingo ... 6 = sábado
    // Regras: dezenaMin/dezenaMax = universo; sorteadas = dezenas por sorteio;
    // apostaMin/apostaMax = quantidade de dezenas que um jogo pode ter.
    const LOTERIAS = {
        lotofacil: {
            slug: "lotofacil",
            slugCaixa: "lotofacil",
            nome: "Lotofácil",
            icone: "/image/favicon-lf-32.png",
            cor: "#930089",
            dezenaMin: 1,
            dezenaMax: 25,
            sorteadas: 15,
            sorteios: 1,
            apostaMin: 15,
            apostaMax: 20,
            diasSorteio: [1, 2, 3, 4, 5, 6],
        },
        megasena: {
            slug: "megasena",
            slugCaixa: "megasena",
            nome: "Mega-Sena",
            icone: "/image/favicon-ms-32.png",
            cor: "#209869",
            dezenaMin: 1,
            dezenaMax: 60,
            sorteadas: 6,
            sorteios: 1,
            apostaMin: 6,
            apostaMax: 20,
            diasSorteio: [2, 4, 6],
        },
        quina: {
            slug: "quina",
            slugCaixa: "quina",
            nome: "Quina",
            icone: "/image/favicon-qu-32.png",
            cor: "#260085",
            dezenaMin: 1,
            dezenaMax: 80,
            sorteadas: 5,
            sorteios: 1,
            apostaMin: 5,
            apostaMax: 15,
            diasSorteio: [1, 2, 3, 4, 5, 6],
        },
        lotomania: {
            slug: "lotomania",
            slugCaixa: "lotomania",
            nome: "Lotomania",
            icone: "/image/favicon-lm-32.png",
            cor: "#F78100",
            dezenaMin: 0, // 00 a 99 (a Caixa devolve "00", gravado como 0)
            dezenaMax: 99,
            sorteadas: 20,
            sorteios: 1,
            apostaMin: 50,
            apostaMax: 50,
            diasSorteio: [1, 3, 5],
        },
        duplasena: {
            slug: "duplasena",
            slugCaixa: "duplasena",
            nome: "Dupla Sena",
            icone: "/image/favicon-ds-32.png",
            cor: "#A61324",
            dezenaMin: 1,
            dezenaMax: 50,
            sorteadas: 6,
            sorteios: 2, // banco: dezenas_1 e dezenas_2
            apostaMin: 6,
            apostaMax: 15,
            diasSorteio: [1, 3, 5],
        },
        timemania: {
            slug: "timemania",
            slugCaixa: "timemania",
            nome: "Timemania",
            icone: "/image/favicon-tm-32.png",
            cor: "#00FF48",
            dezenaMin: 1,
            dezenaMax: 80,
            sorteadas: 7,
            sorteios: 1,
            apostaMin: 10,
            apostaMax: 10,
            extra: { tipo: "time", rotulo: "Time do Coração", total: 80, campo: "time_coracao" },
            diasSorteio: [2, 4, 6],
        },
        diadasorte: {
            slug: "diadasorte",
            slugCaixa: "diadesorte",
            nome: "Dia de Sorte",
            icone: "/image/favicon-di-32.png",
            cor: "#CB852B",
            dezenaMin: 1,
            dezenaMax: 31,
            sorteadas: 7,
            sorteios: 1,
            apostaMin: 7,
            apostaMax: 15,
            extra: { tipo: "mes", rotulo: "Mês da Sorte", total: 12, campo: "mes_sorte" },
            diasSorteio: [1, 2, 3, 4, 5, 6],
        },
        maismilionaria: {
            slug: "maismilionaria",
            slugCaixa: "maismilionaria",
            nome: "+Milionária",
            icone: "/image/favicon-mm-32.png",
            cor: "#6BCCEF",
            dezenaMin: 1,
            dezenaMax: 50,
            sorteadas: 6,
            sorteios: 1,
            apostaMin: 6,
            apostaMax: 12,
            extra: {
                tipo: "trevos",
                rotulo: "Trevos",
                campo: "trevos",
                min: 1,
                max: 6,
                sorteados: 2,
                apostaMin: 2,
                apostaMax: 6,
            },
            diasSorteio: [3, 6],
        },
    };

    // Ordem de exibição (menu, "Todas as Loterias")
    const ORDEM = [
        "lotofacil",
        "megasena",
        "quina",
        "lotomania",
        "duplasena",
        "timemania",
        "diadasorte",
        "maismilionaria",
    ];

    // Ferramentas que dependem da loteria ativa (recebem ?loteria=<slug>)
    const FERRAMENTAS = [
        { id: "inicio", nome: "Início", icone: "bi-house-fill", url: "/index.html", pro: false },
        { id: "gerar", nome: "Gerar Jogos", icone: "bi-dice-3-fill", url: "/ferramentas/gerador-combinacoes.html", pro: true },
        { id: "conferir", nome: "Conferir Jogo", icone: "bi-check-circle-fill", url: "/analise/conferir.html", pro: true },
        { id: "ciclo", nome: "Ciclo das Dezenas", icone: "bi-fire", url: "/ferramentas/ciclo-dezenas.html", pro: true },
        { id: "mapa", nome: "Mapa das Dezenas", icone: "bi-bar-chart-fill", url: "/analise/mapa-dezenas.html", pro: true },
        { id: "estatisticas", nome: "Estatísticas", icone: "bi-calculator-fill", url: "/analise/estatisticas.html", pro: true },
        { id: "analise-dezenas", nome: "Análise de Dezenas", icone: "bi-graph-up", url: "/analise/analise-dezenas.html", pro: true },
        { id: "analise-combinacoes", nome: "Análise de Combinações", icone: "bi-bullseye", url: "/analise/analise-combinacoes.html", pro: true },
    ];

    // Itens globais do menu (não dependem da loteria ativa)
    const ITENS_GLOBAIS = [
        { id: "meus-jogos", nome: "Meus Jogos", icone: "bi-save-fill", url: "/jogos/meus-jogos.html", pro: true },
        // Até a etapa 5 (loterias/todas.html), a home atual já é a grade com as 8 loterias
        { id: "todas", nome: "Todas as Loterias", icone: "bi-grid-3x3-gap-fill", url: "/index.html", pro: false },
        { id: "configuracoes", nome: "Configurações", icone: "bi-gear-fill", url: "/auth/perfilusuario.html", pro: true },
    ];

    // Ferramentas ainda quebradas para a loteria (anotações internas).
    // Aparecem desabilitadas no menu com "Em breve para esta loteria".
    const EM_BREVE = {
        duplasena: ["conferir", "ciclo", "analise-dezenas", "analise-combinacoes"],
    };

    // ========== SLUG / ESTADO ==========

    function normalizarSlug(valor) {
        if (!valor) return null;
        const s = String(valor).trim().toLowerCase();
        const slug = APELIDOS[s] || s;
        return Object.prototype.hasOwnProperty.call(LOTERIAS, slug) ? slug : null;
    }

    function lerStorage() {
        try {
            return localStorage.getItem(CHAVE_STORAGE);
        } catch (e) {
            return null;
        }
    }

    function salvarStorage(slug) {
        try {
            localStorage.setItem(CHAVE_STORAGE, slug);
        } catch (e) {}
    }

    function lerUrl() {
        try {
            return new URLSearchParams(window.location.search).get("loteria");
        } catch (e) {
            return null;
        }
    }

    function resolverAtiva() {
        const daUrl = normalizarSlug(lerUrl());
        if (daUrl) {
            salvarStorage(daUrl);
            return daUrl;
        }
        return normalizarSlug(lerStorage()) || LOTERIA_PADRAO;
    }

    let ativaAtual = resolverAtiva();

    function ativa() {
        return ativaAtual;
    }

    /**
     * Troca a loteria ativa sem recarregar: salva, reaplica o tema, atualiza
     * ?loteria= na URL (replaceState) e dispara o evento "loteria-ativa-mudou"
     * com detail = { slug, loteria }.
     */
    function definirAtiva(valor) {
        const slug = normalizarSlug(valor);
        if (!slug) return false;

        ativaAtual = slug;
        salvarStorage(slug);
        aplicarTema(slug);

        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get("loteria") !== slug) {
                url.searchParams.set("loteria", slug);
                history.replaceState(history.state, "", url);
            }
        } catch (e) {}

        document.dispatchEvent(
            new CustomEvent("loteria-ativa-mudou", {
                detail: { slug, loteria: LOTERIAS[slug] },
            }),
        );
        return true;
    }

    function obter(valor) {
        const slug = normalizarSlug(valor);
        return slug ? LOTERIAS[slug] : null;
    }

    function lista() {
        return ORDEM.map((slug) => LOTERIAS[slug]);
    }

    // ========== FERRAMENTAS ==========

    function suporta(slug, ferramentaId) {
        const s = normalizarSlug(slug);
        if (!s) return false;
        return !(EM_BREVE[s] || []).includes(ferramentaId);
    }

    function urlComLoteria(url, slug) {
        const s = normalizarSlug(slug) || ativaAtual;
        return `${url}?loteria=${encodeURIComponent(s)}`;
    }

    function urlFerramenta(ferramentaId, slug) {
        const f = FERRAMENTAS.find((x) => x.id === ferramentaId);
        return f ? urlComLoteria(f.url, slug) : null;
    }

    // Página antiga com os últimos resultados de cada loteria
    function urlUltimosResultados(slug) {
        const s = normalizarSlug(slug) || ativaAtual;
        return `/loterias/${s}.html`;
    }

    /**
     * Liga o <select> de loteria de uma ferramenta à loteria ativa:
     * - pré-seleciona a ativa e chama aoAplicar(slug) (o handler que a página
     *   já usa no onchange), para a ferramenta já abrir carregada;
     * - quando o usuário troca o select, a escolha vira a loteria ativa
     *   (URL, localStorage, tema e menu).
     * Chamar depois que o DOM e o handler da página existirem.
     */
    function vincularSelect(select, aoAplicar) {
        if (!select) return;

        const temOpcao = Array.from(select.options).some((o) => o.value === ativaAtual);
        if (temOpcao && select.value !== ativaAtual) {
            select.value = ativaAtual;
            if (typeof aoAplicar === "function") aoAplicar(ativaAtual);
        }

        select.addEventListener("change", () => {
            if (normalizarSlug(select.value)) definirAtiva(select.value);
        });
    }

    // ========== FORMATAÇÃO ==========

    function formatarDezena(n) {
        return String(Number(n)).padStart(2, "0");
    }

    // ========== TEMA (CSS vars) ==========

    function hexParaRgb(hex) {
        const h = hex.replace("#", "");
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }

    function rgbParaHex(rgb) {
        return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    }

    // Mistura a cor com outra (peso = fração da segunda cor)
    function misturar(hex, outra, peso) {
        const a = hexParaRgb(hex);
        const b = hexParaRgb(outra);
        return rgbParaHex(a.map((v, i) => v + (b[i] - v) * peso));
    }

    // Luminância relativa (WCAG 2.x)
    function luminancia(hex) {
        const [r, g, b] = hexParaRgb(hex).map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Preto ou branco, o que tiver maior contraste com o fundo
    function corTexto(hexFundo) {
        const l = luminancia(hexFundo);
        const contrasteBranco = 1.05 / (l + 0.05);
        const contrastePreto = (l + 0.05) / 0.05;
        return contrastePreto > contrasteBranco ? "#000000" : "#ffffff";
    }

    function aplicarTema(valor) {
        const loteria = obter(valor) || LOTERIAS[LOTERIA_PADRAO];
        const raiz = document.documentElement;
        raiz.setAttribute("data-loteria", loteria.slug);
        raiz.style.setProperty("--cor-loteria", loteria.cor);
        raiz.style.setProperty("--cor-loteria-clara", misturar(loteria.cor, "#ffffff", 0.85));
        raiz.style.setProperty("--cor-loteria-escura", misturar(loteria.cor, "#000000", 0.25));
        raiz.style.setProperty("--cor-loteria-texto", corTexto(loteria.cor));
    }

    window.Loterias = {
        PADRAO: LOTERIA_PADRAO,
        CHAVE_STORAGE,
        FERRAMENTAS,
        ITENS_GLOBAIS,
        lista,
        obter,
        normalizarSlug,
        ativa,
        definirAtiva,
        suporta,
        urlFerramenta,
        urlComLoteria,
        urlUltimosResultados,
        vincularSelect,
        formatarDezena,
        corTexto,
        aplicarTema,
    };

    // Aplica já no <head>, antes da pintura
    aplicarTema(ativaAtual);
})();
