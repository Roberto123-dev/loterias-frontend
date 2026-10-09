// ===============================
// CONFIG (IGUAL AO MAPA)
// ===============================
const LOTERIAS_CONFIG = {
    megasena: {
        nome: "Mega-Sena",
        min: 1,
        max: 60,
        endpoint: "/megasena",
        cor: "#209869",
    },
    lotofacil: {
        nome: "Lotofácil",
        min: 1,
        max: 25,
        endpoint: "/lotofacil",
        cor: "#930089",
    },
    quina: {
        nome: "Quina",
        min: 1,
        max: 80,
        endpoint: "/quina",
        cor: "#260085",
    },
    lotomania: {
        nome: "Lotomania",
        min: 0,
        max: 99,
        endpoint: "/lotomania",
        cor: "#F78100",
    },
    duplasena: {
        nome: "Dupla-Sena",
        min: 1,
        max: 50,
        endpoint: "/duplasena",
        cor: "#A61324",
        doisSorteios: true, // ⭐ FLAG ESPECIAL
    },
    timemania: {
        nome: "Timemania",
        min: 1,
        max: 80,
        endpoint: "/timemania",
        cor: "#00FF48",
    },
    diadasorte: {
        nome: "Dia de Sorte",
        min: 1,
        max: 31,
        endpoint: "/diadasorte",
        cor: "#CB852B",
    },
    maismilionaria: {
        nome: "+Milionária",
        min: 1,
        max: 50,
        endpoint: "/maismilionaria",
        cor: "#6BCCEF",
    },
};

let loteriaAtual = null;

// ===============================
// HELPERS
// ===============================
function getHeaders() {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

function pad2(n) {
    return n.toString().padStart(2, "0");
}

// ===============================
// UI
// ===============================
function mudarLoteria() {
    const select = document.getElementById("loteria-select");
    const id = select.value;
    const titulo = document.getElementById("titulo-loteria");

    if (!id) {
        document.getElementById("btn-atualizar").disabled = true;
        document.getElementById("tabela-container").style.display = "none";

        if (titulo) {
            titulo.innerHTML = `
                <i class="bi bi-fire" style="color:#667eea;"></i>
                Ciclo das Dezenas
            `;
        }

        document.documentElement.style.setProperty("--cor-loteria", "#667eea");
        return;
    }

    loteriaAtual = LOTERIAS_CONFIG[id];

    document.documentElement.style.setProperty(
        "--cor-loteria",
        loteriaAtual.cor
    );

    if (titulo) {
        titulo.innerHTML = `
            <i class="bi bi-fire" style="color:${loteriaAtual.cor};"></i>
            Ciclo das Dezenas – ${loteriaAtual.nome}
        `;
    }

    document.getElementById("btn-atualizar").disabled = false;
}


// ===============================
// CICLO
// ===============================
async function carregarCiclo() {
    if (!verificarAutenticacao()) return;

    const limit = document.getElementById("qtd-concursos").value;
    const tbody = document.getElementById("tbody-ciclo");

    document.getElementById("tabela-container").style.display = "block";
    tbody.innerHTML = "";

    const res = await fetch(
        `${API_URL}${loteriaAtual.endpoint}?limit=${limit}`,
        { headers: getHeaders() }
    );

    const json = await res.json();
    if (!json.success) return;

    const concursos = json.data.reverse(); // 🔥 antigo → recente

    const universo = Array.from(
        { length: loteriaAtual.max - loteriaAtual.min + 1 },
        (_, i) => i + loteriaAtual.min
    );

    let dezenasNoCiclo = new Set();
    let ciclo = 1;
    let concursosNoCiclo = 0;
    let ciclosQtd = [];
    let ausentesAtuais = [];

    concursos.forEach((c) => {
        concursosNoCiclo++;

        const dezenas = c.dezenas.map(Number);
        dezenas.forEach((d) => dezenasNoCiclo.add(d));

        const ausentes = universo.filter((d) => !dezenasNoCiclo.has(d));
        ausentesAtuais = ausentes;

        let textoAusentes = ausentes.map(pad2).join(" ");
        let qtdAusentes = ausentes.length;

        if (dezenasNoCiclo.size === universo.length) {
            textoAusentes = `
                <strong>Fim Ciclo</strong><br>
                Concursos: ${concursosNoCiclo}
            `;
            qtdAusentes = 0;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${c.concurso}</td>
      <td>${dezenas.map(pad2).join(" ")}</td>
      <td>${textoAusentes}</td>
      <td>${ausentes.length}</td>
      <td>${concursosNoCiclo}</td>
        `;
        tbody.appendChild(tr);

        if (dezenasNoCiclo.size === universo.length) {
            tr.classList.add("fim-ciclo");
            ciclosQtd.push(concursosNoCiclo);

            dezenasNoCiclo.clear();
            concursosNoCiclo = 0;
            ciclo++;
        }
    });

    renderizarResumo(ausentesAtuais, ciclosQtd);
}

// ===============================
// RESUMO
// ===============================
function renderizarResumo(ausentes, ciclosQtd) {
    const bolinhas = document.getElementById("bolinhas-ausentes");
    const medias = document.getElementById("medias-ciclo");

    bolinhas.innerHTML = "";
    medias.innerHTML = "";

    ausentes.forEach((d) => {
        const span = document.createElement("span");
        span.className = "bolinha ausente";
        span.textContent = pad2(d);
        bolinhas.appendChild(span);
    });

    if (!ciclosQtd.length) return;

    const menor = Math.min(...ciclosQtd);
    const maior = Math.max(...ciclosQtd);
    const media =
        (ciclosQtd.reduce((a, b) => a + b, 0) / ciclosQtd.length).toFixed(1);

    medias.innerHTML = `
    <p><strong>Menor Ciclo:</strong> ${menor} concursos</p>
    <p><strong>Maior Ciclo:</strong> ${maior} concursos</p>
    <p><strong>Ciclo Médio:</strong> ${media} concursos</p>
    <p><strong>Total de Ciclos:</strong> ${ciclosQtd.length}</p>
  `;
}

// Pré-seleciona a loteria ativa (?loteria= / última escolha)
if (window.Loterias) {
    Loterias.vincularSelect(document.getElementById("loteria-select"), mudarLoteria);
}
