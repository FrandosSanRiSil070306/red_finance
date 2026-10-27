
/* =====================================
   RED FINANCE - CONTROLE FINANCEIRO
   ===================================== */

// Elementos do formulário
const formulario = document.getElementById("formulario");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const tipoInput = document.getElementById("tipo");
const categoriaInput = document.getElementById("categoria");
const dataInput = document.getElementById("data");

// Elementos dos filtros
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroMes = document.getElementById("filtroMes");

// Elementos da tela
const listaMovimentacoes = document.getElementById("listaMovimentacoes");
const entradasElemento = document.getElementById("entradas");
const saidasElemento = document.getElementById("saidas");
const saldoElemento = document.getElementById("saldo");
const elementoGrafico = document.getElementById("graficoDespesas");

// Dados do sistema
let movimentacoes = [];
let graficoDespesas = null;

// Nomes das categorias
const nomesCategorias = {
    salario: "Salário",
    moradia: "Moradia",
    alimentacao: "Alimentação",
    transporte: "Transporte",
    saude: "Saúde",
    lazer: "Lazer",
    educacao: "Educação",
    trabalho: "Trabalho",
    outros: "Outros"
};

// Cores do gráfico
const coresGrafico = [
    "#e53935",
    "#ffb300",
    "#fb8c00",
    "#8e24aa",
    "#1e88e5",
    "#00897b",
    "#43a047",
    "#d81b60",
    "#757575"
];

// Formata valores em reais
function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Converte a categoria em um nome legível
function nomeCategoria(categoria) {
    return nomesCategorias[categoria] || "Outros";
}

// Salva as movimentações no navegador
function salvarMovimentacoes() {
    localStorage.setItem(
        "movimentacoes",
        JSON.stringify(movimentacoes)
    );
}

// Calcula entradas, saídas e saldo
function calcularTotais() {
    let entradas = 0;
    let saidas = 0;

    movimentacoes.forEach(function(movimentacao) {
        const valor = Number(movimentacao.valor) || 0;

        if (movimentacao.tipo === "entrada") {
            entradas += valor;
        } else if (movimentacao.tipo === "saida") {
            saidas += valor;
        }
    });

    const saldo = entradas - saidas;

    entradasElemento.textContent = formatarMoeda(entradas);
    saidasElemento.textContent = formatarMoeda(saidas);
    saldoElemento.textContent = formatarMoeda(saldo);
}

// Mostra uma movimentação na lista
function mostrarMovimentacao(movimentacao) {
    const item = document.createElement("li");

    const informacoes = document.createElement("span");

    const dataFormatada = movimentacao.data
        ? movimentacao.data.split("-").reverse().join("/")
        : "Data não informada";

    informacoes.textContent =
        `${movimentacao.descricao} | ` +
        `${formatarMoeda(movimentacao.valor)} | ` +
        `${movimentacao.tipo === "entrada" ? "Entrada" : "Saída"} | ` +
        `${nomeCategoria(movimentacao.categoria)} | ` +
        `${dataFormatada}`;

    item.appendChild(informacoes);

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";

    botaoExcluir.addEventListener("click", function() {
        const confirmar = confirm(
            "Deseja realmente excluir esta movimentação?"
        );

        if (!confirmar) {
            return;
        }

        movimentacoes = movimentacoes.filter(function(item) {
            return item.id !== movimentacao.id;
        });

        salvarMovimentacoes();
        atualizarTela();
    });

    item.appendChild(botaoExcluir);
    listaMovimentacoes.appendChild(item);
}

// Filtra a lista por categoria e mês
function filtrarMovimentacoes() {
    listaMovimentacoes.innerHTML = "";

    const categoriaSelecionada = filtroCategoria
        ? filtroCategoria.value
        : "todas";

    const mesSelecionado = filtroMes
        ? filtroMes.value
        : "";

    const listaFiltrada = movimentacoes.filter(function(movimentacao) {
        const categoria = movimentacao.categoria || "outros";

        const categoriaCorreta =
            categoriaSelecionada === "todas" ||
            categoria === categoriaSelecionada;

        const mesCorreto =
            mesSelecionado === "" ||
            (movimentacao.data &&
             movimentacao.data.startsWith(mesSelecionado));

        return categoriaCorreta && mesCorreto;
    });

    if (listaFiltrada.length === 0) {
        const itemVazio = document.createElement("li");

        itemVazio.textContent =
            "Nenhuma movimentação encontrada para esse filtro.";

        listaMovimentacoes.appendChild(itemVazio);
        return;
    }

    listaFiltrada.forEach(function(movimentacao) {
        mostrarMovimentacao(movimentacao);
    });
}

// Atualiza o gráfico de despesas por categoria
function atualizarGrafico() {
    if (!elementoGrafico || typeof Chart === "undefined") {
        return;
    }

    const despesasPorCategoria = {};

    movimentacoes.forEach(function(movimentacao) {
        if (movimentacao.tipo !== "saida") {
            return;
        }

        // O gráfico acompanha o mês selecionado, se houver.
        if (
            filtroMes &&
            filtroMes.value &&
            (!movimentacao.data ||
             !movimentacao.data.startsWith(filtroMes.value))
        ) {
            return;
        }

        const categoria = movimentacao.categoria || "outros";

        despesasPorCategoria[categoria] =
            (despesasPorCategoria[categoria] || 0) +
            (Number(movimentacao.valor) || 0);
    });

    const categorias = Object.keys(despesasPorCategoria);
    const valores = categorias.map(function(categoria) {
        return despesasPorCategoria[categoria];
    });

    const nomes = categorias.map(function(categoria) {
        return nomeCategoria(categoria);
    });

    if (graficoDespesas) {
        graficoDespesas.destroy();
    }

    graficoDespesas = new Chart(elementoGrafico, {
        type: "doughnut",

        data: {
            labels: nomes,

            datasets: [{
                data: valores,
                backgroundColor: categorias.map(function(categoria) {
                    const indice = Object.keys(nomesCategorias)
                        .indexOf(categoria);

                    return coresGrafico[
                        indice >= 0 ? indice : coresGrafico.length - 1
                    ];
                }),
                borderColor: "#171717",
                borderWidth: 3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#ffffff"
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ": " +
                                formatarMoeda(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Atualiza a tela
function atualizarTela() {
    filtrarMovimentacoes();
    calcularTotais();
    atualizarGrafico();
}

// Carrega os dados salvos
function carregarMovimentacoes() {
    const dadosSalvos = localStorage.getItem("movimentacoes");

    if (dadosSalvos) {
        try {
            const dados = JSON.parse(dadosSalvos);

            if (Array.isArray(dados)) {
                movimentacoes = dados
                    .filter(function(item) {
                        return (
                            item &&
                            typeof item.descricao === "string" &&
                            Number.isFinite(Number(item.valor)) &&
                            Number(item.valor) > 0 &&
                            ["entrada", "saida"].includes(item.tipo)
                        );
                    })
                    .map(function(item) {
                        return {
                            id: item.id || (
                                Date.now().toString() +
                                Math.random().toString(36).slice(2)
                            ),
                            descricao: item.descricao,
                            valor: Number(item.valor),
                            tipo: item.tipo,
                            categoria: item.categoria || "outros",
                            data: item.data || ""
                        };
                    });

                salvarMovimentacoes();
            }
        } catch (erro) {
            console.error("Não foi possível carregar os dados:", erro);
            movimentacoes = [];
        }
    }

    atualizarTela();
}

// Cadastra uma nova movimentação
formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const descricao = descricaoInput.value.trim();
    const valor = Number(valorInput.value);
    const tipo = tipoInput.value;
    const categoria = categoriaInput.value || "outros";
    const data = dataInput.value;

    if (!descricao || !Number.isFinite(valor) || valor <= 0) {
        alert("Informe uma descrição e um valor válido.");
        return;
    }

    if (!["entrada", "saida"].includes(tipo)) {
        alert("Selecione o tipo de movimentação.");
        return;
    }

    if (!data) {
        alert("Selecione a data da movimentação.");
        return;
    }

    const movimentacao = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2),
        descricao: descricao,
        valor: valor,
        tipo: tipo,
        categoria: categoria,
        data: data
    };

    movimentacoes.push(movimentacao);

    salvarMovimentacoes();
    atualizarTela();

    formulario.reset();
});

// Atualiza a lista quando os filtros mudam
if (filtroCategoria) {
    filtroCategoria.addEventListener("change", atualizarTela);
}

if (filtroMes) {
    filtroMes.addEventListener("change", atualizarTela);
}

// Define a data de hoje como padrão no formulário
if (dataInput) {
    dataInput.value = new Date().toLocaleDateString("en-CA");
}

// Inicia o sistema
carregarMovimentacoes();
