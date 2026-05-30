// ============================================
// GERADOR DE COMBINAÇÕES - JAVASCRIPT COMPLETO (COM GRUPOS)
// ============================================

const LOTERIAS_CONFIG = {
    megasena: {
        nome: "Mega-Sena",
        cor: "#209869",
        totalDezenas: 60,
        minDezenas: 6,
        maxDezenas: 60,
        dezenasObrigatorias: 6,
    },
    lotofacil: {
        nome: "Lotofácil",
        cor: "#930089",
        totalDezenas: 25,
        minDezenas: 15,
        maxDezenas: 25,
        dezenasObrigatorias: 15,
    },
    quina: {
        nome: "Quina",
        cor: "#260085",
        totalDezenas: 80,
        minDezenas: 5,
        maxDezenas: 80,
        dezenasObrigatorias: 5,
    },
    lotomania: {
        nome: "Lotomania",
        cor: "#F78100",
        totalDezenas: 100,
        minDezenas: 50,
        maxDezenas: 100,
        dezenasObrigatorias: 50,
    },
    duplasena: {
        nome: "Dupla-Sena",
        cor: "#A61324",
        totalDezenas: 50,
        minDezenas: 6,
        maxDezenas: 50,
        dezenasObrigatorias: 6,
    },
    timemania: {
        nome: "Timemania",
        cor: "#00FF48",
        totalDezenas: 80,
        minDezenas: 7,
        maxDezenas: 80,
        dezenasObrigatorias: 7,
    },
    diadasorte: {
        nome: "Dia de Sorte",
        cor: "#CB852B",
        totalDezenas: 31,
        minDezenas: 7,
        maxDezenas: 31,
        dezenasObrigatorias: 7,
    },
    maismilionaria: {
        nome: "+Milionária",
        cor: "#6BCCEF",
        totalDezenas: 50,
        minDezenas: 6,
        maxDezenas: 50,
        dezenasObrigatorias: 6,
    },
};

let loteriaSelecionada = null;
let dezenasSelecionadas = new Set();
let dezenasFixas = new Set();
let jogosGerados = [];
let renderIndex = 0;
let nomeGrupoSelecionado = "";
// No topo junto das outras variáveis globais
let modoSelecao = "variavel"; // 'variavel' | 'fixa'

const BATCH_SIZE = 30;
const LIMITE_JOGOS = 1000;

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    const selectLoteria = document.getElementById("select-loteria");
    const selectGrupo = document.getElementById("select-grupo");

    if (selectLoteria) {
        selectLoteria.addEventListener("change", (e) =>
            mudarLoteria(e.target.value),
        );
    }

    if (selectGrupo) {
        selectGrupo.addEventListener("change", () => {
            nomeGrupoSelecionado = selectGrupo.value || "";
            atualizarBotaoGerar();
        });
    }

    const loteriaInicial = selectLoteria?.value;
    if (loteriaInicial) mudarLoteria(loteriaInicial);
    else atualizarBotaoGerar();

    const dezenasSlider = document.getElementById("dezenas-slider");
    const jogosSlider = document.getElementById("jogos-slider");
    if (dezenasSlider)
        dezenasSlider.addEventListener("input", atualizarSlidersInteligentes);
    if (jogosSlider)
        jogosSlider.addEventListener("input", atualizarSlidersInteligentes);
});

// ============================================
// GRUPOS
// ============================================

async function carregarGruposPorLoteria(loteria) {
    const selectGrupo = document.getElementById("select-grupo");
    if (!selectGrupo) return;

    nomeGrupoSelecionado = "";
    selectGrupo.disabled = true;
    selectGrupo.innerHTML = `<option value="">Carregando grupos...</option>`;

    if (!loteria) {
        selectGrupo.innerHTML = `<option value="">📁 Nenhum grupo criado</option>`;
        atualizarBotaoGerar();
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${API_URL}/api/jogos/grupos?loteria=${loteria}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        const data = await res.json();

        if (
            !data.success ||
            !Array.isArray(data.data) ||
            data.data.length === 0
        ) {
            selectGrupo.innerHTML = `<option value="">📁 Nenhum grupo criado</option>`;
            selectGrupo.disabled = true;
            atualizarBotaoGerar();
            return;
        }

        selectGrupo.innerHTML = `
      <option value="">📁 Selecione um grupo</option>
      ${data.data.map((nome) => `<option value="${escapeHtml(nome)}">${escapeHtml(nome)}</option>`).join("")}
    `;
        selectGrupo.disabled = false;
        atualizarBotaoGerar();
    } catch (err) {
        console.error("❌ Erro ao carregar grupos:", err);
        selectGrupo.innerHTML = `<option value="">Erro ao carregar grupos</option>`;
        selectGrupo.disabled = true;
        atualizarBotaoGerar();
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ============================================
// LOTERIA
// ============================================

function mudarLoteria(loteriaId) {
    const titulo = document.getElementById("titulo-loteria");
    const selectGrupo = document.getElementById("select-grupo");

    if (!loteriaId || !LOTERIAS_CONFIG[loteriaId]) {
        loteriaSelecionada = null;
        if (titulo)
            titulo.innerHTML = `<i class="bi bi-dice-3-fill" style="color:#667eea;"></i> Gerar Jogos`;
        document.documentElement.style.setProperty("--cor-loteria", "#667eea");
        document.getElementById("dezenas-section").style.display = "none";
        if (selectGrupo) {
            selectGrupo.innerHTML = `<option value="">📁 Nenhum grupo criado</option>`;
            selectGrupo.disabled = true;
        }
        nomeGrupoSelecionado = "";
        atualizarBotaoGerar();
        return;
    }

    loteriaSelecionada = loteriaId;
    const config = LOTERIAS_CONFIG[loteriaId];

    if (titulo) {
        titulo.innerHTML = `<i class="bi bi-dice-3-fill" style="color:${config.cor};"></i> Gerar Jogos - ${config.nome}`;
    }

    document.documentElement.style.setProperty("--cor-loteria", config.cor);
    inicializarGrid(loteriaId);
    carregarGruposPorLoteria(loteriaId);
}

// ============================================
// GRID DE DEZENAS
// ============================================

function inicializarGrid(loteria) {
    const config = LOTERIAS_CONFIG[loteria];
    const grid = document.getElementById("grid-dezenas");
    const section = document.getElementById("dezenas-section");

    grid.classList.remove(
        "lotofacil",
        "megasena",
        "quina",
        "lotomania",
        "duplasena",
        "timemania",
        "diadasorte",
        "maismilionaria",
    );
    grid.classList.add(loteria);

    dezenasSelecionadas.clear();
    dezenasFixas.clear();
    grid.innerHTML = "";

    for (let i = 1; i <= config.totalDezenas; i++) {
        const num = i.toString().padStart(2, "0");
        const btn = document.createElement("div");
        btn.className = "dezena-btn";
        btn.dataset.dezena = num;
        btn.innerHTML = `
        <span class="dezena-num">${num}</span>
        <i class="dezena-icone bi bi-plus-circle"></i>
    `;

        // Clique na bolinha → seleciona / desmarca
        btn.addEventListener("click", () => toggleDezena(btn));

        // Clique no ícone → alterna variável ↔ fixa
        btn.querySelector(".dezena-icone").addEventListener("click", (e) => {
            e.stopPropagation(); // não dispara o clique da bolinha
            toggleFixaDezena(btn);
        });

        grid.appendChild(btn);
    }

    section.style.display = "block";
    atualizarContador();
    atualizarEstatisticas();
    atualizarBotaoGerar();
    atualizarSlidersInteligentes();
}

function toggleFixaDezena(btn) {
    const dezena = btn.dataset.dezena;

    // Só age se a bolinha estiver selecionada
    if (!dezenasSelecionadas.has(dezena)) return;

    if (btn.classList.contains("fixa")) {
        // Fixa → Variável
        btn.classList.remove("fixa");
        btn.classList.add("selecionada");
        dezenasFixas.delete(dezena);
    } else {
        // Variável → Fixa
        btn.classList.add("fixa");
        dezenasFixas.add(dezena);
    }

    atualizarIconeDezena(btn);
    atualizarContador();
    atualizarBotaoGerar();
    atualizarSlidersInteligentes();
}

// ============================================
// ÍCONE DE ESTADO DA DEZENA
// ============================================

/**
 * Atualiza o ícone Bootstrap Icons dentro do botão conforme o estado:
 *  - selecionada (variável) → bi-plus-circle  (anel vazio)
 *  - fixa                   → bi-pin-fill     (pin preenchido)
 *  - nenhum                 → sem ícone
 */
function atualizarIconeDezena(btn) {
    const icone = btn.querySelector(".dezena-icone");
    if (!icone) return;

    if (btn.classList.contains("fixa")) {
        icone.classList.replace("bi-plus-circle", "bi-plus-circle-fill");
    } else {
        icone.classList.replace("bi-plus-circle-fill", "bi-plus-circle");
    }
}

// ============================================
// TOGGLE DEZENA
// ============================================

// ── Alterna o modo de seleção ──
function toggleModo() {
    modoSelecao = modoSelecao === "variavel" ? "fixa" : "variavel";
    const btn = document.getElementById("btn-modo-toggle");
    const icone = btn.querySelector("i");

    if (modoSelecao === "fixa") {
        icone.className = "bi bi-plus-circle";
        btn.classList.add("ativo");
        btn.title = "Modo: Fixa (clique para Variável)";
    } else {
        icone.className = "bi bi-hand-thumbs-up-fill";
        btn.classList.remove("ativo");
        btn.title = "Modo: Variável (clique para Fixa)";
    }
}

// ── toggleDezena respeita o modo ──
function toggleDezena(btn) {
    const dezena = btn.dataset.dezena;
    const ehFixa = btn.classList.contains("fixa");
    const ehVariavel = btn.classList.contains("selecionada") && !ehFixa;
    const ehMarcada = ehFixa || ehVariavel;

    if (
        ehMarcada &&
        ((modoSelecao === "variavel" && ehVariavel) ||
            (modoSelecao === "fixa" && ehFixa))
    ) {
        // Clicou no mesmo estado → desmarca
        btn.classList.remove("selecionada", "fixa");
        dezenasSelecionadas.delete(dezena);
        dezenasFixas.delete(dezena);
    } else if (modoSelecao === "fixa") {
        // Modo fixa → marca como fixa (ou converte variável para fixa)
        btn.classList.remove("selecionada");
        btn.classList.add("fixa");
        dezenasSelecionadas.add(dezena);
        dezenasFixas.add(dezena);
    } else {
        // Modo variável → marca como variável (ou converte fixa para variável)
        btn.classList.remove("fixa");
        btn.classList.add("selecionada");
        dezenasSelecionadas.add(dezena);
        dezenasFixas.delete(dezena);
    }

    atualizarIconeDezena(btn);
    atualizarContador();
    atualizarEstatisticas();
    atualizarBotaoGerar();
    atualizarSlidersInteligentes();
}
// ============================================
// SELECIONAR / LIMPAR TODAS
// ============================================

function selecionarTodas() {
    const config = LOTERIAS_CONFIG[loteriaSelecionada];
    const botoes = document.querySelectorAll(".dezena-btn");
    const todasSelecionadas = dezenasSelecionadas.size === config.totalDezenas;

    dezenasSelecionadas.clear();
    dezenasFixas.clear();

    botoes.forEach((btn) => {
        if (todasSelecionadas) {
            btn.classList.remove("selecionada", "fixa");
        } else {
            btn.classList.add("selecionada");
            btn.classList.remove("fixa");
            dezenasSelecionadas.add(btn.dataset.dezena);
        }
        atualizarIconeDezena(btn); // ← atualiza ícone
    });

    atualizarContador();
    atualizarEstatisticas();
    atualizarBotaoGerar();
    atualizarSlidersInteligentes();
}

function limparSelecao() {
    dezenasSelecionadas.clear();
    dezenasFixas.clear();

    document.querySelectorAll(".dezena-btn").forEach((btn) => {
        btn.classList.remove("selecionada", "fixa");
        atualizarIconeDezena(btn); // ← atualiza ícone
    });

    atualizarContador();
    atualizarEstatisticas();
    atualizarBotaoGerar();
    atualizarSlidersInteligentes();
}

// ============================================
// UI
// ============================================

function atualizarContador() {
    const contador = document.getElementById("contador");
    const fixas = dezenasFixas.size;
    if (!contador) return;
    contador.textContent =
        fixas > 0
            ? `${dezenasSelecionadas.size} selecionadas (${fixas} fixas)`
            : `${dezenasSelecionadas.size} selecionadas`;
}

function atualizarBotaoGerar() {
    const config = LOTERIAS_CONFIG[loteriaSelecionada];
    const btnGerar = document.getElementById("btn-gerar");
    if (!btnGerar) return;
    btnGerar.disabled =
        !loteriaSelecionada ||
        dezenasSelecionadas.size < (config?.minDezenas ?? 1);
}

// ============================================
// SLIDERS / MODAL
// ============================================

function atualizarSlidersInteligentes() {
    if (!loteriaSelecionada) return;

    const config = LOTERIAS_CONFIG[loteriaSelecionada];
    const fixas = dezenasFixas.size;
    const total = dezenasSelecionadas.size;

    const dezenasSlider = document.getElementById("dezenas-slider");
    const jogosSlider = document.getElementById("jogos-slider");
    const dezenasDisplay = document.getElementById("dezenas-display");
    const jogosDisplay = document.getElementById("jogos-display");
    if (!dezenasSlider || !jogosSlider || !dezenasDisplay || !jogosDisplay)
        return;

    const minK = Math.max(config.minDezenas, fixas + 1);
    const maxK = Math.min(config.maxDezenas, total);

    dezenasSlider.min = minK;
    dezenasSlider.max = maxK;

    let k = parseInt(dezenasSlider.value);
    if (isNaN(k) || k < minK) k = minK;
    if (k > maxK) k = maxK;
    dezenasSlider.value = k;
    dezenasDisplay.textContent = k;

    const variaveis = total - fixas;
    const kVariavel = k - fixas;
    let totalPossiveis =
        kVariavel >= 0 && kVariavel <= variaveis
            ? combinacao(variaveis, kVariavel)
            : 1;
    if (!Number.isFinite(totalPossiveis) || totalPossiveis < 1)
        totalPossiveis = 1;

    const limiteVisivel = Math.min(totalPossiveis, LIMITE_JOGOS);
    jogosSlider.min = 1;
    jogosSlider.max = limiteVisivel;

    let jogos = parseInt(jogosSlider.value);
    if (isNaN(jogos) || jogos < 1) jogos = 1;
    if (jogos > limiteVisivel) jogos = limiteVisivel;
    jogosSlider.value = jogos;
    jogosDisplay.textContent = `${jogos} de ${limiteVisivel}`;
}

function abrirModal() {
    if (!loteriaSelecionada) return;
    const modal = document.getElementById("modal-randomico");
    const title = document.getElementById("modal-title");
    const fixas = dezenasFixas.size;
    const total = dezenasSelecionadas.size;
    if (title)
        title.textContent = `Randômico de ${total} dezenas${fixas > 0 ? ` (${fixas} fixas)` : ""}`;
    atualizarSlidersInteligentes();
    modal.classList.add("active");
}

function fecharModal() {
    document.getElementById("modal-randomico").classList.remove("active");
}

function ajustarDezenas(delta) {
    const slider = document.getElementById("dezenas-slider");
    slider.value = parseInt(slider.value) + delta;
    atualizarSlidersInteligentes();
}

function ajustarJogos(delta) {
    const slider = document.getElementById("jogos-slider");
    slider.value = parseInt(slider.value) + delta;
    atualizarSlidersInteligentes();
}

// ============================================
// MATH / ESTATÍSTICAS
// ============================================

function combinacao(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) res = (res * (n - i + 1)) / i;
    return Math.round(res);
}

function isPrimo(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
}

function atualizarEstatisticas() {
    let par = 0,
        impar = 0,
        primo = 0,
        soma = 0;
    dezenasSelecionadas.forEach((d) => {
        const n = parseInt(d, 10);
        soma += n;
        if (n % 2 === 0) par++;
        else impar++;
        if (isPrimo(n)) primo++;
    });
    const elPar = document.getElementById("stat-par");
    const elImpar = document.getElementById("stat-impar");
    const elPrimo = document.getElementById("stat-primo");
    const elSoma = document.getElementById("stat-soma");
    if (elPar) elPar.textContent = par;
    if (elImpar) elImpar.textContent = impar;
    if (elPrimo) elPrimo.textContent = primo;
    if (elSoma) elSoma.textContent = soma;
}

// ============================================
// GERAÇÃO
// ============================================

function gerarCombinacoes() {
    const k = parseInt(document.getElementById("dezenas-slider").value);
    const numJogos = parseInt(document.getElementById("jogos-slider").value);

    const fixasArray = Array.from(dezenasFixas).sort();
    const variaveisArray = Array.from(dezenasSelecionadas)
        .filter((d) => !dezenasFixas.has(d))
        .sort();
    const kVariavel = k - fixasArray.length;

    if (kVariavel < 0 || kVariavel > variaveisArray.length) {
        alert("Configuração inválida! Ajuste o número de dezenas por jogo.");
        return;
    }

    const combinacoesVariaveis = gerarCombinacoesAleatorias(
        variaveisArray,
        kVariavel,
        numJogos,
    );

    jogosGerados = combinacoesVariaveis.map((combVariavel) => {
        const dezenas = [...fixasArray, ...combVariavel].sort(
            (a, b) => parseInt(a) - parseInt(b),
        );
        return {
            tipo: "Random",
            totalDezenas: dezenasSelecionadas.size,
            totalFixas: fixasArray.length,
            dezenas,
        };
    });

    exibirJogos();
    fecharModal();
}

function gerarCombinacoesAleatorias(elementos, tamanho, quantidade) {
    const jogos = new Set();
    const maxIt = quantidade * 10;
    let it = 0;

    while (jogos.size < quantidade && it < maxIt) {
        const jogo = [];
        const temp = [...elementos];
        for (let i = 0; i < tamanho; i++) {
            const idx = Math.floor(Math.random() * temp.length);
            jogo.push(temp[idx]);
            temp.splice(idx, 1);
        }
        jogo.sort((a, b) => parseInt(a) - parseInt(b));
        jogos.add(jogo.join(" "));
        it++;
    }

    return Array.from(jogos).map((s) => s.split(" "));
}

// ============================================
// EXIBIR JOGOS
// ============================================

function exibirJogos() {
    document.getElementById("loteria-section").style.display = "none";
    document.getElementById("dezenas-section").style.display = "none";
    document.getElementById("jogos-gerados").style.display = "block";
    document.getElementById("lista-jogos").innerHTML = "";
    document.getElementById("total-jogos").textContent = jogosGerados.length;
    renderIndex = 0;
    renderizarJogosIncremental();
}

function renderizarJogosIncremental() {
    const lista = document.getElementById("lista-jogos");
    const fim = Math.min(renderIndex + BATCH_SIZE, jogosGerados.length);
    for (let i = renderIndex; i < fim; i++)
        lista.appendChild(criarCardJogo(jogosGerados[i], i));
    renderIndex = fim;
}

function criarCardJogo(jogoObj, index) {
    const card = document.createElement("div");
    card.className = "jogo-card";

    const descricao = document.createElement("div");
    descricao.className = "jogo-descricao";
    let html = `${jogoObj.tipo}: ${jogoObj.totalDezenas} dezenas`;
    if (jogoObj.totalFixas > 0)
        html += ` (<span class="fixas">${jogoObj.totalFixas} fixas</span>)`;
    html += ` · Jogo ${index + 1}`;
    descricao.innerHTML = html;

    const dezenasDiv = document.createElement("div");
    dezenasDiv.className = "jogo-dezenas";

    jogoObj.dezenas.forEach((dezena) => {
        const bolinha = document.createElement("div");
        bolinha.className = "bolinha";
        bolinha.textContent = dezena;
        if (dezenasFixas.has(dezena)) bolinha.classList.add("fixa");
        dezenasDiv.appendChild(bolinha);
    });

    card.appendChild(descricao);
    card.appendChild(dezenasDiv);
    return card;
}

// ============================================
// SALVAR
// ============================================

function salvarTodos() {
    if (jogosGerados.length === 0) {
        alert("Nenhum jogo para salvar!");
        return;
    }
    salvarJogosNoBackend();
}

function getNomeGrupoParaSalvar() {
    const select = document.getElementById("select-grupo");
    return (select?.value || "").trim() || "Meus Jogos";
}

async function salvarJogosNoBackend() {
    const token = localStorage.getItem("token");
    const jogosString = jogosGerados.map((j) => j.dezenas.join(" "));
    const labelFinal = getNomeGrupoParaSalvar();

    const response = await fetch(`${API_URL}/api/jogos/salvar-lote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            loteria: loteriaSelecionada,
            jogos: jogosString,
            label: labelFinal,
        }),
    });

    const data = await response.json();
    if (data.success) {
        alert(`✅ ${jogosGerados.length} jogos salvos em "${labelFinal}"!`);
        limparJogos();
        window.location.href = "meus-jogos.html";
    } else {
        alert(data.message || "Erro ao salvar jogos");
    }
}

// ============================================
// VOLTAR / LIMPAR
// ============================================

function voltarParaSelecao() {
    renderIndex = 0;
    document.getElementById("jogos-gerados").style.display = "none";
    document.getElementById("loteria-section").style.display = "block";
    document.getElementById("dezenas-section").style.display = "block";
}

function limparJogos() {
    jogosGerados = [];
    renderIndex = 0;
    document.getElementById("lista-jogos").innerHTML = "";
    document.getElementById("jogos-gerados").style.display = "none";
    document.getElementById("loteria-section").style.display = "block";
    document.getElementById("dezenas-section").style.display = "block";
}
