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
// HELPERS ÚTEIS:
// ============================================

// Verificar se está logado
window.isAuthenticated = function () {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const agora = Date.now() / 1000;

    if (payload.exp && payload.exp < agora) {
      console.warn("⚠️ Token expirado");
      return false;
    }

    return true;
  } catch (e) {
    console.error("❌ Token inválido:", e);
    return false;
  }
};

// Obter dados do usuário
window.getUser = function () {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      email: payload.email,
      nome: payload.nome,
      role: payload.role,
    };
  } catch (e) {
    console.error("❌ Erro ao obter usuário:", e);
    return null;
  }
};

// Fazer request autenticada (com token automático)
window.fetchAuth = async function (url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se 401 (Unauthorized), redirecionar para login
  if (response.status === 401) {
    console.warn("⚠️ Sessão expirada. Redirecionando para login...");
    const loteriaAtiva = localStorage.getItem("loteriaAtiva"); // preserva a última loteria escolhida
    localStorage.clear();
    if (loteriaAtiva) localStorage.setItem("loteriaAtiva", loteriaAtiva);
    window.location.href = "/auth/login.html";
    throw new Error("Sessão expirada");
  }

  return response;
};

// ============================================
// LIMITE DE CONSULTAS (HTTP 429)
// ============================================
// O backend limita consultas por usuário e responde 429 com tenteNovamenteEm (segundos)
// e uma message que já diz o tempo de espera.
// - Rotas de /api/auth: a resposta segue normal (as telas de login/cadastro mostram a message).
// - Demais rotas da API: mostra um aviso amigável com o tempo de espera e rejeita a chamada
//   com erro.limiteAtingido = true; os catch das páginas ignoram esse erro (aviso já mostrado).
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
    // /api/auth: a tela mostra a mensagem; /api/bancas: contador de cliques, silencioso
    if (!url.startsWith(API_URL) || url.startsWith(`${API_URL}/api/auth/`) || url.startsWith(`${API_URL}/api/bancas/`)) return resposta;

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

// Verificar autenticação (se não estiver em login)
if (
  window.location.pathname !== "/auth/login.html" &&
  window.location.pathname !== "/auth/registro.html" &&
  window.location.pathname !== "/index.html" &&
  window.location.pathname !== "/"
) {
  if (isAuthenticated()) {
    const user = getUser();
    console.log("👤 Usuário:", user?.nome || "Anônimo");
  } else {
    console.warn("⚠️ Usuário não autenticado");
  }
}
