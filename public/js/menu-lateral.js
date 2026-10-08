/**
 * ============================================
 * MENU LATERAL COMPARTILHADO
 * ============================================
 *
 * Requer /js/loterias.js no <head> e /css/menu-lateral.css.
 * Uso (o <aside> reserva o espaço do menu antes do JS rodar):
 *   <aside class="sidebar" id="sidebar">
 *       <script src="/js/menu-lateral.js"></script>
 *   </aside>
 *
 * Páginas antigas sem layout próprio: <html class="com-menu-lateral"> (ver menu-lateral.css);
 * nelas o menu cria uma aba na borda esquerda para abri-lo no celular.
 *
 * Expõe para os botões da página: openMobileMenu(), closeMobileMenu(), toggleSidebar().
 * Sistema gratuito: o menu não tem selo, modal nem verificação de plano.
 */
(function () {
    "use strict";

    const L = window.Loterias;
    const sidebar = document.getElementById("sidebar");
    if (!L || !sidebar) return;

    const INSTAGRAM_URL = "https://www.instagram.com/roberto.loteria";
    const LOGO = "/ROBERTO%20(3).png";

    // ========== HELPERS ==========

    function temToken() {
        try {
            return Boolean(localStorage.getItem("token"));
        } catch (e) {
            return false;
        }
    }

    // "/analise/conferir.html", "/analise/conferir" (cleanUrls) → "/analise/conferir"; "/index.html" → "/"
    function normalizarCaminho(caminho) {
        let p = String(caminho || "/").replace(/\.html$/, "").replace(/\/+$/, "");
        if (p === "" || p === "/index") p = "/";
        return p;
    }

    const caminhoAtual = normalizarCaminho(window.location.pathname);

    function ehPaginaAtual(url) {
        return normalizarCaminho(url) === caminhoAtual;
    }

    // ========== RENDER ==========

    function itemFerramenta(f, slug, jaMarcouAtivo) {
        if (!L.suporta(slug, f.id)) {
            return `
            <span class="menu-item em-breve" aria-disabled="true" title="Em breve para esta loteria">
                <i class="bi ${f.icone}"></i>
                <span class="menu-texto">${f.nome}<small class="menu-dica">Em breve para esta loteria</small></span>
            </span>`;
        }
        const ativo = !jaMarcouAtivo && ehPaginaAtual(f.url);
        return `
            <a href="${L.urlFerramenta(f.id, slug)}" class="menu-item${ativo ? " active" : ""}"${ativo ? ' aria-current="page"' : ""} title="${f.nome}">
                <i class="bi ${f.icone}"></i>
                <span class="menu-texto">${f.nome}</span>
            </a>`;
    }

    function itemGlobal(g, slug, jaMarcouAtivo) {
        const ativo = !jaMarcouAtivo && ehPaginaAtual(g.url);
        // Meus Jogos já abre filtrado pela loteria ativa
        const href = g.id === "meus-jogos" ? L.urlComLoteria(g.url, slug) : g.url;
        return `
            <a href="${href}" class="menu-item${ativo ? " active" : ""}"${ativo ? ' aria-current="page"' : ""} title="${g.nome}">
                <i class="bi ${g.icone}"></i>
                <span class="menu-texto">${g.nome}</span>
            </a>`;
    }

    function render() {
        const ativa = L.obter(L.ativa());
        const slug = ativa.slug;
        let marcouAtivo = false;

        const ferramentas = L.FERRAMENTAS.map((f) => {
            const html = itemFerramenta(f, slug, marcouAtivo);
            if (html.includes('aria-current="page"')) marcouAtivo = true;
            return html;
        }).join("");

        const configuracoes = L.ITENS_GLOBAIS.find((g) => g.id === "configuracoes");
        const globais = L.ITENS_GLOBAIS.filter((g) => g.id !== "configuracoes")
            .map((g) => {
                const html = itemGlobal(g, slug, marcouAtivo);
                if (html.includes('aria-current="page"')) marcouAtivo = true;
                return html;
            })
            .join("");

        const opcoes = L.lista()
            .map((l) => {
                const sel = l.slug === slug;
                return `
                <li role="option" aria-selected="${sel}">
                    <button type="button" data-loteria="${l.slug}" style="--cor-item: ${l.cor}">
                        <img src="${l.icone}" alt="" width="28" height="28" />
                        <span>${l.nome}</span>
                        ${sel ? '<i class="bi bi-check-lg"></i>' : ""}
                    </button>
                </li>`;
            })
            .join("");

        const perfilAtivo = ehPaginaAtual(configuracoes.url);

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <a href="${L.urlFerramenta("inicio", slug)}" class="sidebar-brand">
                    <img src="${LOGO}" alt="Roberto Loterias - Sua sorte, nossa missão" class="sidebar-brand-logo" />
                </a>
                <button type="button" class="toggle-btn" data-acao="recolher" aria-label="Recolher menu">
                    <i class="bi bi-list"></i>
                </button>
            </div>

            <div class="seletor-loteria">
                <button type="button" class="seletor-atual" data-acao="seletor" aria-haspopup="listbox" aria-expanded="false" title="Trocar loteria (${ativa.nome})">
                    <img src="${ativa.icone}" alt="" width="28" height="28" />
                    <span class="seletor-nome">${ativa.nome}</span>
                    <i class="bi bi-chevron-down seletor-seta"></i>
                </button>
                <ul class="seletor-lista" role="listbox" aria-label="Escolher loteria" hidden>${opcoes}</ul>
            </div>

            <nav class="sidebar-menu" aria-label="Menu principal">
                ${ferramentas}
                <div class="menu-divider"></div>
                ${globais}
                <button type="button" class="menu-item menu-grupo" data-acao="configuracoes" aria-expanded="${perfilAtivo}" title="${configuracoes.nome}">
                    <i class="bi ${configuracoes.icone}"></i>
                    <span class="menu-texto">${configuracoes.nome}</span>
                    <i class="bi bi-chevron-down"></i>
                </button>
                <div class="submenu"${perfilAtivo ? "" : " hidden"}>
                    <a href="${configuracoes.url}" class="menu-item${perfilAtivo ? " active" : ""}" title="Meu perfil">
                        <i class="bi bi-person-fill"></i>
                        <span class="menu-texto">Meu perfil</span>
                    </a>
                    ${
                        temToken()
                            ? `<button type="button" class="menu-item" data-acao="notificacoes" title="Notificações por e-mail">
                        <i class="bi bi-bell-fill" id="icon-notificacao"></i>
                        <span class="menu-texto" id="label-notificacao">Ativar Notificações</span>
                    </button>`
                            : ""
                    }
                </div>
            </nav>

            <div class="menu-rodape">
                <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener" class="link-instagram" title="Instagram">
                    <i class="bi bi-instagram"></i>
                    <span>@roberto.loteria</span>
                </a>
            </div>`;

        atualizarBotaoNotificacao(notificacaoInscrito);
    }

    // ========== SELETOR ==========

    function seletorAberto(abrir) {
        const botao = sidebar.querySelector(".seletor-atual");
        const lista = sidebar.querySelector(".seletor-lista");
        if (!botao || !lista) return;
        botao.setAttribute("aria-expanded", String(abrir));
        lista.hidden = !abrir;
    }

    // Páginas cujo conteúdo depende da loteria: recarrega com ?loteria=
    function paginaDependeDaLoteria() {
        return (
            L.FERRAMENTAS.some((f) => f.id !== "inicio" && ehPaginaAtual(f.url)) ||
            L.ITENS_GLOBAIS.some((g) => g.id === "meus-jogos" && ehPaginaAtual(g.url))
        );
    }

    function trocarLoteria(slug) {
        seletorAberto(false);
        if (slug === L.ativa()) return;

        // Páginas antigas /loterias/<slug>.html: vai para a página da nova loteria
        if (/^\/loterias\/[a-z]+$/.test(caminhoAtual) && caminhoAtual !== "/loterias/todas") {
            L.definirAtiva(slug);
            window.location.href = L.urlUltimosResultados(slug);
            return;
        }

        L.definirAtiva(slug); // atualiza URL, tema e dispara "loteria-ativa-mudou"
        if (paginaDependeDaLoteria()) window.location.reload();
    }

    // ========== RECOLHER / MOBILE ==========

    let backdrop = document.getElementById("mobileBackdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "mobile-backdrop";
        backdrop.id = "mobileBackdrop";
        sidebar.insertAdjacentElement("afterend", backdrop);
    }
    backdrop.addEventListener("click", closeMobileMenu);

    // Só nas páginas antigas (as demais têm botão de menu no próprio topo)
    if (document.documentElement.classList.contains("com-menu-lateral")) {
        const aba = document.createElement("button");
        aba.type = "button";
        aba.className = "btn-menu-flutuante";
        aba.setAttribute("aria-label", "Abrir menu");
        aba.innerHTML = '<i class="bi bi-list"></i>';
        aba.addEventListener("click", () => openMobileMenu());
        backdrop.insertAdjacentElement("afterend", aba);
    }

    function openMobileMenu() {
        document.documentElement.classList.remove("menu-recolhido");
        sidebar.classList.add("mobile-open");
        backdrop.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        sidebar.classList.remove("mobile-open");
        backdrop.classList.remove("show");
        document.body.style.overflow = "";
        seletorAberto(false);
    }

    function toggleSidebar() {
        seletorAberto(false);
        document.documentElement.classList.toggle("menu-recolhido");
    }

    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
    window.toggleSidebar = toggleSidebar;

    // ========== NOTIFICAÇÕES POR E-MAIL ==========

    let notificacaoInscrito = false;
    let alterandoNotificacao = false;

    function atualizarBotaoNotificacao(inscrito) {
        const icon = document.getElementById("icon-notificacao");
        const label = document.getElementById("label-notificacao");
        if (!icon || !label) return;

        if (inscrito) {
            icon.className = "bi bi-bell-slash-fill";
            icon.style.color = "#ffd700";
            label.textContent = "Desativar Notificações";
        } else {
            icon.className = "bi bi-bell-fill";
            icon.style.color = "";
            label.textContent = "Ativar Notificações";
        }
    }

    async function carregarStatusNotificacao() {
        const token = localStorage.getItem("token");
        if (!token || !window.API_URL) return;

        try {
            const res = await fetch(`${window.API_URL}/api/notificacoes/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            notificacaoInscrito = Boolean(data.inscrito);
            atualizarBotaoNotificacao(notificacaoInscrito);
        } catch (err) {
            console.error("Erro ao verificar notificações:", err);
        }
    }

    async function toggleNotificacoes() {
        if (alterandoNotificacao) return;
        const token = localStorage.getItem("token");
        if (!token || !window.API_URL) return;

        const endpoint = notificacaoInscrito
            ? "/api/notificacoes/cancelar"
            : "/api/notificacoes/inscrever";

        alterandoNotificacao = true;
        try {
            const res = await fetch(`${window.API_URL}${endpoint}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data?.success) {
                notificacaoInscrito = !notificacaoInscrito;
                atualizarBotaoNotificacao(notificacaoInscrito);
                alert(
                    notificacaoInscrito
                        ? "🔔 Notificações ativadas! Você receberá avisos de novos resultados da Lotofácil."
                        : "🔕 Notificações desativadas.",
                );
            }
        } catch (err) {
            console.error("Erro ao alterar notificações:", err);
        } finally {
            alterandoNotificacao = false;
        }
    }

    // ========== EVENTOS ==========

    sidebar.addEventListener("click", (event) => {
        const alvo = event.target.closest("[data-acao], [data-loteria], a.menu-item");
        if (!alvo || !sidebar.contains(alvo)) return;

        if (alvo.dataset.loteria) {
            trocarLoteria(alvo.dataset.loteria);
            return;
        }

        switch (alvo.dataset.acao) {
            case "recolher":
                toggleSidebar();
                return;
            case "seletor": {
                // Recolhido: expande o menu antes de abrir a lista
                if (document.documentElement.classList.contains("menu-recolhido")) {
                    document.documentElement.classList.remove("menu-recolhido");
                }
                const aberto = alvo.getAttribute("aria-expanded") === "true";
                seletorAberto(!aberto);
                return;
            }
            case "configuracoes": {
                const submenu = alvo.nextElementSibling;
                const aberto = alvo.getAttribute("aria-expanded") === "true";
                alvo.setAttribute("aria-expanded", String(!aberto));
                if (submenu) submenu.hidden = aberto;
                return;
            }
            case "notificacoes":
                toggleNotificacoes();
                return;
        }

        closeMobileMenu();
    });

    // Fecha a lista de loterias ao clicar fora ou apertar Esc
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".seletor-loteria")) seletorAberto(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            seletorAberto(false);
            closeMobileMenu();
        }
    });

    // A loteria pode ser trocada também pela própria página (ex.: <select> da ferramenta)
    document.addEventListener("loteria-ativa-mudou", render);

    render();
    carregarStatusNotificacao();
})();
