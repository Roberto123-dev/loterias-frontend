/**
 * Calcula o próximo dia de sorteio de cada loteria a partir da data atual.
 * getDay(): 0 = domingo, 1 = segunda, ..., 6 = sábado
 */

const DIAS_SORTEIO_LOTERIA = {
    lotofacil: [1, 2, 3, 4, 5, 6],
    megasena: [2, 4, 6],
    quina: [1, 2, 3, 4, 5, 6],
    lotomania: [1, 3, 5],
    duplasena: [1, 3, 5],
    timemania: [2, 4, 6],
    diadasorte: [1, 2, 3, 4, 5, 6],
    maismilionaria: [3, 6],
};

const DIAS_SEMANA_NOMES = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
];

/**
 * @param {string} loteriaId
 * @param {Date} [hoje]
 * @returns {{ offset: number, texto: string, hoje: boolean } | null}
 */
function calcularProximoConcurso(loteriaId, hoje = new Date()) {
    const diasSorteio = DIAS_SORTEIO_LOTERIA[loteriaId];
    if (!diasSorteio || diasSorteio.length === 0) return null;

    const diaSemanaHoje = hoje.getDay();

    for (let offset = 0; offset <= 7; offset++) {
        const diaVerificado = (diaSemanaHoje + offset) % 7;
        if (!diasSorteio.includes(diaVerificado)) continue;

        if (offset === 0) return { offset, texto: "HOJE", hoje: true };
        if (offset === 1) return { offset, texto: "AMANHÃ", hoje: false };
        return {
            offset,
            texto: DIAS_SEMANA_NOMES[diaVerificado],
            hoje: false,
        };
    }

    return null;
}

window.calcularProximoConcurso = calcularProximoConcurso;
