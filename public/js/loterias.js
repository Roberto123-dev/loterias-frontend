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
            artigo: "a", // "da …"
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
            artigo: "a", // "da …"
            textoBranco: true, // texto branco sobre a cor (decisão do projeto); fundo escurecido se < 3:1
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
            artigo: "a", // "da …"
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
            artigo: "a", // "da …"
            textoBranco: true, // texto branco sobre a cor (decisão do projeto); fundo escurecido se < 3:1
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
            artigo: "a", // "da …"
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
            artigo: "a", // "da …"
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
            artigo: "o", // "do …"
            textoBranco: true, // texto branco sobre a cor (decisão do projeto); fundo escurecido se < 3:1
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
            artigo: "a", // "da …"
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
        { id: "inicio", nome: "Início", icone: "bi-house-fill", url: "/index.html" },
        { id: "gerar", nome: "Gerar Jogos", icone: "bi-dice-3-fill", url: "/ferramentas/gerador-combinacoes.html" },
        { id: "conferir", nome: "Conferir Jogo", icone: "bi-check-circle-fill", url: "/analise/conferir.html" },
        { id: "ciclo", nome: "Ciclo das Dezenas", icone: "bi-fire", url: "/ferramentas/ciclo-dezenas.html" },
        { id: "mapa", nome: "Mapa das Dezenas", icone: "bi-bar-chart-fill", url: "/analise/mapa-dezenas.html" },
        { id: "estatisticas", nome: "Estatísticas", icone: "bi-calculator-fill", url: "/analise/estatisticas.html" },
        { id: "analise-dezenas", nome: "Análise de Dezenas", icone: "bi-graph-up", url: "/analise/analise-dezenas.html" },
        { id: "analise-combinacoes", nome: "Análise de Combinações", icone: "bi-bullseye", url: "/analise/analise-combinacoes.html" },
    ];

    // Itens globais do menu (não dependem da loteria ativa)
    const ITENS_GLOBAIS = [
        { id: "meus-jogos", nome: "Meus Jogos", icone: "bi-save-fill", url: "/jogos/meus-jogos.html" },
        { id: "todas", nome: "Todas as Loterias", icone: "bi-grid-3x3-gap-fill", url: "/loterias/todas.html" },
        { id: "bancas", nome: "Bancas Parceiras", icone: "bi-shop", url: "/bancas/index.html" },
        { id: "perfil", nome: "Meu perfil", icone: "bi-person-fill", url: "/auth/perfilusuario.html" },
    ];

    // Ferramentas ainda quebradas para a loteria (anotações internas).
    // Aparecem desabilitadas no menu com "Em breve para esta loteria".
    // Ex.: { duplasena: ["ciclo"] }. Vazio desde a etapa 12 (Dupla Sena corrigida).
    const EM_BREVE = {};

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
     * opcoes.atualizarUrl = false: não mexe na URL (páginas da própria loteria,
     * ex.: /loterias/quina.html).
     */
    function definirAtiva(valor, opcoes = {}) {
        const slug = normalizarSlug(valor);
        if (!slug) return false;

        ativaAtual = slug;
        salvarStorage(slug);
        aplicarTema(slug);

        try {
            if (opcoes.atualizarUrl === false) throw null;
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

    // R$ 6,0 milhões / R$ 850 mil / R$ 1.234,56; sem valor → "—"
    function formatarPremio(valor) {
        const v = Number(valor) || 0;
        if (v <= 0) return "—";
        if (v >= 1000000) {
            return `R$ ${(v / 1000000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} milhões`;
        }
        if (v >= 1000) {
            return `R$ ${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mil`;
        }
        return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    // ========== REGRAS DE PREMIAÇÃO ==========
    // Espelho de backend/src/config/loterias.js (faixaPremio) e services/conferencia.js.
    // Faixas OFICIAIS (listaRateioPremio da Caixa, conferidas em 2026-10).

    /**
     * Sorteios de um concurso: [{ sorteio, rotulo, dezenas }].
     * Dupla Sena: cada sorteio é um evento (dezenas_1 e dezenas_2 nunca se misturam).
     */
    function sorteiosDoConcurso(valor, resultado) {
        const r = resultado || {};
        if (normalizarSlug(valor) === "duplasena") {
            return [
                { sorteio: 1, rotulo: "1º sorteio", dezenas: (r.dezenas_1 || []).map(Number) },
                { sorteio: 2, rotulo: "2º sorteio", dezenas: (r.dezenas_2 || []).map(Number) },
            ];
        }
        return [{ sorteio: null, rotulo: "", dezenas: (r.dezenas || []).map(Number) }];
    }

    // Nome da faixa ("4 acertos", "5 acertos + 2 trevos") ou null se não premia
    function faixaPremio(valor, acertos, trevos = 0) {
        switch (normalizarSlug(valor)) {
            case "lotofacil": return acertos >= 11 ? `${acertos} acertos` : null;
            case "megasena": return acertos >= 4 ? `${acertos} acertos` : null;
            case "quina": return acertos >= 2 ? `${acertos} acertos` : null;
            case "lotomania": return acertos >= 15 || acertos === 0 ? `${acertos} acertos` : null;
            case "duplasena": return acertos >= 3 ? `${acertos} acertos` : null;
            case "timemania": return acertos >= 3 ? `${acertos} acertos` : null;
            case "diadasorte": return acertos >= 4 ? `${acertos} acertos` : null;
            case "maismilionaria": {
                if (acertos >= 4) return `${acertos} acertos + ${trevos === 2 ? "2 trevos" : "1 ou nenhum trevo"}`;
                if (acertos === 3 && trevos >= 1) return `3 acertos + ${trevos === 2 ? "2 trevos" : "1 trevo"}`;
                if (acertos === 2 && trevos >= 1) return `2 acertos + ${trevos === 2 ? "2 trevos" : "1 trevo"}`;
                return null;
            }
            default: return null;
        }
    }

    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // "3", "03", "Março", "MARCO", "Mar&ccedil;o" → "Março"; inválido → null
    function normalizarMes(valor) {
        if (valor === null || valor === undefined) return null;
        let t = String(valor).trim().replace(/&ccedil;/gi, "ç").replace(/&atilde;/gi, "ã");
        if (/^\d{1,2}$/.test(t)) {
            const n = Number(t);
            return n >= 1 && n <= 12 ? MESES[n - 1] : null;
        }
        t = semAcento(t).toLowerCase();
        return MESES.find((m) => semAcento(m).toLowerCase() === t) || null;
    }

    // "AMERICA      /RN" e "América RN" → "AMERICA RN"
    function normalizarTime(valor) {
        if (!valor) return "";
        return semAcento(String(valor)).toUpperCase().replace(/\//g, " ").replace(/\s+/g, " ").trim();
    }

    /**
     * Confere um jogo contra um resultado (linha da API, com dezenas / dezenas_1+2, trevos,
     * time_coracao, mes_sorte). jogo = { dezenas, trevos?, time_coracao?, mes_sorte? }.
     * → { acertos (maior entre os sorteios), premiado, porSorteio: [{ sorteio, rotulo,
     *     acertos, acertadas, faixa }], trevosAcertados, acertouTime, acertouMes }
     */
    function conferir(valor, jogo, resultado) {
        const slug = normalizarSlug(valor);
        const r = resultado || {};
        const dezenasJogo = (jogo.dezenas || []).map(Number);
        const trevosAcertados =
            slug === "maismilionaria"
                ? (jogo.trevos || []).map(Number).filter((t) => (r.trevos || []).map(Number).includes(t)).length
                : 0;

        const porSorteio = sorteiosDoConcurso(slug, r).map((s) => {
            const acertadas = dezenasJogo.filter((d) => s.dezenas.includes(d));
            return {
                sorteio: s.sorteio,
                rotulo: s.rotulo,
                acertos: acertadas.length,
                acertadas,
                faixa: faixaPremio(slug, acertadas.length, trevosAcertados),
            };
        });

        const acertouTime =
            slug === "timemania" && Boolean(jogo.time_coracao) && normalizarTime(jogo.time_coracao) === normalizarTime(r.time_coracao);
        const mesJogo = normalizarMes(jogo.mes_sorte);
        const acertouMes = slug === "diadasorte" && Boolean(mesJogo) && mesJogo === normalizarMes(r.mes_sorte);

        return {
            acertos: Math.max(...porSorteio.map((s) => s.acertos)),
            premiado: porSorteio.some((s) => s.faixa) || acertouTime || acertouMes,
            porSorteio,
            trevosAcertados,
            acertouTime,
            acertouMes,
        };
    }

    // ========== CONCURSO: STATUS E DATAS ==========
    // Campos vindos de /api/resultados/ultimos-todos. Qualquer um pode ser NULL:
    //   acumulou NULL              → "Aguardando rateio" (nunca "ACUMULOU" nem "0 ganhadores")
    //   data_sorteio NULL          → não exibir a data
    //   data_proximo_concurso NULL → reserva: próximo dia de sorteio pela grade semanal

    const DIAS_SEMANA = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
    ];
    const UM_DIA = 24 * 60 * 60 * 1000;

    // "AAAA-MM-DD" → Date local (meia-noite); inválido/NULL → null
    function lerDataISO(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
        return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
    }

    function inicioDoDia(data) {
        return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    function diaMes(data) {
        return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
    }

    // "AAAA-MM-DD" → "07/10/2026"; NULL → null (não exibir)
    function formatarData(iso) {
        const data = lerDataISO(iso);
        return data ? `${diaMes(data)}/${data.getFullYear()}` : null;
    }

    function ganhadoresFaixa1(premiacoes) {
        let lista = premiacoes;
        if (typeof lista === "string") {
            try {
                lista = JSON.parse(lista);
            } catch (e) {
                lista = null;
            }
        }
        if (!Array.isArray(lista) || lista.length === 0) return null;
        const faixa1 = lista.find((f) => f && f.faixa === 1) || lista[0];
        const n = Number(faixa1 && faixa1.numeroDeGanhadores);
        return Number.isFinite(n) ? n : null;
    }

    /**
     * { tipo: "acumulou" | "ganhadores" | "aguardando", texto, ganhadores }
     */
    function statusConcurso(resultado) {
        const acumulou = resultado ? resultado.acumulou : null;
        if (acumulou === true) return { tipo: "acumulou", texto: "ACUMULOU", ganhadores: 0 };
        if (acumulou !== false) return { tipo: "aguardando", texto: "Aguardando rateio", ganhadores: null };

        const n = ganhadoresFaixa1(resultado.premiacoes);
        return {
            tipo: "ganhadores",
            ganhadores: n,
            texto: n > 0 ? `${n} ${n === 1 ? "ganhador" : "ganhadores"}` : "Teve ganhador",
        };
    }

    // Reserva: próximo dia da grade semanal a partir de hoje (inclui hoje)
    function proximoPelaGrade(slug, hoje) {
        const loteria = obter(slug);
        if (!loteria) return null;
        for (let offset = 0; offset <= 7; offset++) {
            const data = new Date(hoje.getTime() + offset * UM_DIA);
            if (loteria.diasSorteio.includes(data.getDay())) return inicioDoDia(data);
        }
        return null;
    }

    /**
     * Próximo sorteio: usa a data oficial (data_proximo_concurso) e, se vier NULL
     * ou já tiver passado (resultado novo ainda não chegou), a grade semanal.
     * → { data, dataTexto: "11/10", dias, texto: "Hoje" | "Amanhã" | "Domingo, 11/10", ehHoje, ehAmanha, oficial }
     */
    function proximoSorteio(slug, dataProximoISO, agora) {
        const hoje = inicioDoDia(agora || new Date());
        let data = lerDataISO(dataProximoISO);
        let oficial = Boolean(data);

        if (data && data < hoje) {
            data = null;
            oficial = false;
        }
        if (!data) data = proximoPelaGrade(slug, hoje);
        if (!data) return null;

        const dias = Math.round((data - hoje) / UM_DIA);
        const texto =
            dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : `${DIAS_SEMANA[data.getDay()]}, ${diaMes(data)}`;
        return { data, dataTexto: diaMes(data), dias, texto, ehHoje: dias === 0, ehAmanha: dias === 1, oficial };
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

    function contraste(hexA, hexB) {
        const [maior, menor] = [luminancia(hexA), luminancia(hexB)].sort((a, b) => b - a);
        return (maior + 0.05) / (menor + 0.05);
    }

    // Preto ou branco, o que tiver maior contraste com o fundo
    function corTexto(hexFundo) {
        const l = luminancia(hexFundo);
        const contrasteBranco = 1.05 / (l + 0.05);
        const contrastePreto = (l + 0.05) / 0.05;
        return contrastePreto > contrasteBranco ? "#000000" : "#ffffff";
    }

    // Texto branco precisa de pelo menos 3:1 sobre o fundo (decisão do projeto)
    const CONTRASTE_MINIMO_BRANCO = 3;

    /**
     * Cores para elementos COM texto sobre a cor da loteria (cabeçalho, item ativo,
     * bolinhas, botões): { fundo, texto }. Loterias com textoBranco usam branco e, se a
     * cor original não der 3:1, o fundo é escurecido só o necessário. As demais usam
     * preto ou branco pelo maior contraste. Bordas e detalhes sem texto continuam com
     * a cor original (--cor-loteria).
     */
    function coresTexto(valor) {
        const loteria = obter(valor) || LOTERIAS[LOTERIA_PADRAO];
        if (!loteria.textoBranco) return { fundo: loteria.cor, texto: corTexto(loteria.cor) };

        let fundo = loteria.cor;
        let peso = 0;
        while (contraste(fundo, "#ffffff") < CONTRASTE_MINIMO_BRANCO && peso < 1) {
            peso = Math.round((peso + 0.01) * 100) / 100;
            fundo = misturar(loteria.cor, "#000000", peso);
        }
        return { fundo, texto: "#ffffff" };
    }

    // "da Lotofácil", "do Dia de Sorte"; com "em": "na Quina", "no Dia de Sorte"
    function comArtigo(valor, preposicao = "de") {
        const loteria = obter(valor);
        if (!loteria) return "";
        const contracao = { de: { a: "da", o: "do" }, em: { a: "na", o: "no" } }[preposicao][loteria.artigo];
        return `${contracao} ${loteria.nome}`;
    }

    function aplicarTema(valor) {
        const loteria = obter(valor) || LOTERIAS[LOTERIA_PADRAO];
        const cores = coresTexto(loteria.slug);
        const raiz = document.documentElement;
        raiz.setAttribute("data-loteria", loteria.slug);
        raiz.style.setProperty("--cor-loteria", loteria.cor);
        raiz.style.setProperty("--cor-loteria-clara", misturar(loteria.cor, "#ffffff", 0.85));
        raiz.style.setProperty("--cor-loteria-escura", misturar(loteria.cor, "#000000", 0.25));
        raiz.style.setProperty("--cor-loteria-fundo", cores.fundo);
        raiz.style.setProperty("--cor-loteria-texto", cores.texto);
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
        formatarData,
        MESES,
        sorteiosDoConcurso,
        faixaPremio,
        normalizarMes,
        normalizarTime,
        conferir,
        formatarPremio,
        statusConcurso,
        proximoSorteio,
        corTexto,
        coresTexto,
        comArtigo,
        aplicarTema,
    };

    // Aplica já no <head>, antes da pintura
    aplicarTema(ativaAtual);
})();
