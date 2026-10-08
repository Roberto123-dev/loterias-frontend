async function carregarConfiguracoes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("token");

  if (!usuario || !token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "/auth/login.html";
    return;
  }

  // 🔹 Dados básicos
  document.getElementById("user-nome").textContent = usuario.nome;
  document.getElementById("user-email").textContent = usuario.email;
}

document.addEventListener("DOMContentLoaded", carregarConfiguracoes);
