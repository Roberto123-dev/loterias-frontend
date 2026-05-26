/**
 * cores-bolas.js
 * Mapa de cores das bolas por loteria.
 * Cada dezena tem: bg (fundo), text (texto), border (borda).
 *
 * Padrão de cores por último dígito (compartilhado entre loterias):
 *  1 → Vermelha   2 → Amarela   3 → Verde    4 → Marrom   5 → Azul
 *  6 → Rosa       7 → Preta     8 → Cinza    9 → Laranja  0 → Branca
 */

// Paleta base compartilhada (índice = último dígito da dezena)
const _PALETA = {
    1: { bg: "#FF0000", text: "#fff", border: "#A00000" }, // Vermelha
    2: { bg: "#FFFF00", text: "#222", border: "#B8A000" }, // Amarela
    3: { bg: "#01DF01", text: "#222", border: "#008A00" }, // Verde
    4: { bg: "#A0522D", text: "#fff", border: "#6B3519" }, // Marrom
    5: { bg: "#0074E8", text: "#fff", border: "#004DA0" }, // Azul
    6: { bg: "#FF69B4", text: "#fff", border: "#C0336E" }, // Rosa
    7: { bg: "#000000", text: "#fff", border: "#444444" }, // Preta
    8: { bg: "#C0C0C0", text: "#222", border: "#888888" }, // Cinza
    9: { bg: "#fda401", text: "#222", border: "#B87000" }, // Laranja
    0: { bg: "#FFFFFF", text: "#222", border: "#AAAAAA" }, // Branca
};

// Gera mapa { dezena: cor } para qualquer loteria que use a paleta padrão
function _gerarMapaPaleta(min, max) {
    const mapa = {};
    for (let i = min; i <= max; i++) {
        const digito = i % 10;
        mapa[i] = _PALETA[digito];
    }
    return mapa;
}

// =============================================================
const CORES_BOLAS = {
    // ── LOTOFÁCIL (1–25) ──────────────────────────────────────
    lotofacil: _gerarMapaPaleta(1, 25),

    // ── MEGA-SENA (1–60) ──────────────────────────────────────
    megasena: _gerarMapaPaleta(1, 60),

    // ── QUINA (1–80) ──────────────────────────────────────────
    quina: _gerarMapaPaleta(1, 80),

    // ── LOTOMANIA (00–99) ─────────────────────────────────────
    lotomania: _gerarMapaPaleta(0, 99),

    // ── DUPLA-SENA (1–50) ─────────────────────────────────────
    duplasena: _gerarMapaPaleta(1, 50),

    // ── TIMEMANIA (1–80) ──────────────────────────────────────
    timemania: _gerarMapaPaleta(1, 80),

    // ── DIA DE SORTE (1–31) ───────────────────────────────────
    diadasorte: _gerarMapaPaleta(1, 31),

    // ── +MILIONÁRIA (1–50) ────────────────────────────────────
    maismilionaria: _gerarMapaPaleta(1, 50),
};
