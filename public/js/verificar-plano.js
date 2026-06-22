// Verificar plano do usuário
async function verificarPlanoUsuario() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/planos/meu-plano`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            // Salvar plano no localStorage
            localStorage.setItem("plano", data.data.plano);
            return data.data;
        }

        return { plano: "free" };
    } catch (error) {
        console.error("Erro ao verificar plano:", error);
        return { plano: "free" };
    }
}

// Verificar se tem permissão para acessar recurso
function temPermissao(recurso) {
    const plano = localStorage.getItem("plano") || "free";

    const recursos = {
        free: ["verResultados"],
        pro: ["verResultados", "conferirJogos", "mapaDezenas", "verDetalhes"],
    };

    return recursos[plano]?.includes(recurso) || false;
}

// Mostrar modal de upgrade
function mostrarModalUpgrade() {
    const modal = document.createElement("div");
    modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; padding: 40px; border-radius: 15px; max-width: 500px; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
        <h2 style="color: #333; margin-bottom: 15px;">Recurso Exclusivo PRÓ</h2>
        <p style="color: #666; margin-bottom: 30px;">
          Este recurso está disponível apenas para usuários com plano PRÓ.
        </p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">Plano PRÓ Inclui:</h3>
          <ul style="list-style: none; padding: 0; text-align: left;">
            <li style="padding: 8px 0;">✅ Conferir seus jogos</li>
            <li style="padding: 8px 0;">✅ Mapa completo das dezenas</li>
            <li style="padding: 8px 0;">✅ Ver detalhes de todos os concursos</li>
            <li style="padding: 8px 0;">✅ Consultas ilimitadas</li>
          </ul>
        </div>

        <button onclick="fazerUpgrade()" style="padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: bold; cursor: pointer; margin-right: 10px;">
          ⭐ Fazer Upgrade
        </button>
        <button onclick="fecharModal()" style="padding: 15px 40px; background: #ccc; color: #666; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: bold; cursor: pointer;">
          Cancelar
        </button>
      </div>
    </div>
  `;

    modal.id = "modal-upgrade";
    document.body.appendChild(modal);
}

function fecharModal() {
    document.getElementById("modal-upgrade")?.remove();
}
