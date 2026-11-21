/**
 * ============================================
 * CONFIGURAÇÃO DE API - DETECTA DEV/PROD
 * ============================================
 */

// Detectar se está em produção ou desenvolvimento
const isProduction =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

// URL DO BACKEND NO RAILWAY:
const PRODUCTION_API_URL = "https://loterias-backend-production.up.railway.app";
const DEVELOPMENT_API_URL = "http://localhost:3000";

// Escolher URL baseado no ambiente
const API_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// Exportar para uso global
window.API_URL = API_URL;

// Log para debug
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔧 CONFIGURAÇÃO:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Ambiente:", isProduction ? "PRODUÇÃO 🌐" : "DESENVOLVIMENTO 💻");
console.log("API_URL:", API_URL);
console.log("Hostname:", window.location.hostname);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ============================================
// LIMPEZA DO LOGIN ANTIGO
// ============================================
// O site não tem mais login: apaga as chaves que o login antigo gravava.
// Só estas três — as demais (loteriaAtiva, temaMapaDezenas, estatisticasMapa,
// conferencia_jogo, resultadoCombinacoes, metaCombinacoes, coresBolas_*) são das ferramentas.
["token", "usuario", "plano"].forEach((chave) => {
  try {
    localStorage.removeItem(chave);
  } catch (e) {} // armazenamento bloqueado (ex.: navegação privada): nada a limpar
});

// ============================================
// HELPERS ÚTEIS:
// ============================================

// Request para a API. O site é público: sem token.
// Content-Type JSON só quando há corpo: GET sem esse header não precisa do preflight de CORS.
window.fetchApi = async function (url, options = {}) {
  const headers = { ...options.headers };
  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// ============================================
// LIMITE DE CONSULTAS (HTTP 429)
// ============================================
// O backend limita consultas por IP e responde 429 com tenteNovamenteEm (segundos)
// e uma message que já diz o tempo de espera.
// Em qualquer rota da API: mostra um aviso amigável com o tempo de espera e rejeita a chamada
// com erro.limiteAtingido = true; os catch das páginas ignoram esse erro (aviso já mostrado).
window.formatarEspera = function (segundos) {
  const s = Math.max(1, Math.round(Number(segundos) || 60));
  if (s < 60) return `${s} segundo${s === 1 ? "" : "s"}`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m} minuto${m === 1 ? "" : "s"}`;
  const h = Math.ceil(m / 60);
  return `${h} hora${h === 1 ? "" : "s"}`;
};

window.mostrarAvisoLimite = function (mensagem) {
  let aviso = document.getElementById("aviso-limite");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "aviso-limite";
    aviso.setAttribute("role", "alert");
    aviso.style.cssText =
      "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10050;" +
      "max-width:min(92vw,520px);padding:14px 18px;border-radius:12px;" +
      "background:#fff7ed;color:#7c2d12;border:1px solid #fdba74;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.18);font:600 0.95rem/1.4 'Segoe UI',sans-serif;" +
      "display:flex;gap:10px;align-items:flex-start";
    document.body.appendChild(aviso);
  }
  aviso.textContent = "";
  const icone = document.createElement("span");
  icone.textContent = "⏳";
  const texto = document.createElement("span");
  texto.textContent = mensagem;
  aviso.append(icone, texto);
  aviso.style.display = "flex";
  clearTimeout(window.mostrarAvisoLimite._timer);
  window.mostrarAvisoLimite._timer = setTimeout(() => {
    aviso.style.display = "none";
  }, 10000);
};

(function () {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async function (recurso, opcoes) {
    const resposta = await fetchOriginal(recurso, opcoes);
    if (resposta.status !== 429) return resposta;

    const url = typeof recurso === "string" ? recurso : (recurso && recurso.url) || "";
    if (!url.startsWith(API_URL)) return resposta;

    let segundos = 60;
    try {
      const corpo = await resposta.clone().json();
      if (corpo && corpo.tenteNovamenteEm) segundos = corpo.tenteNovamenteEm;
    } catch (e) {}

    const mensagem = `Você fez muitas consultas em pouco tempo. Aguarde ${formatarEspera(segundos)} e tente novamente.`;
    mostrarAvisoLimite(mensagem);
    const erro = new Error(mensagem);
    erro.limiteAtingido = true;
    erro.tenteNovamenteEm = segundos;
    throw erro;
  };
})();

// Log inicial
console.log("✅ config.js carregado com sucesso!");
