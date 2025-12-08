const XLSX = require('xlsx');
const axios = require('axios');

// Configuração
const arquivoOriginal = 'NOME_DO_ARQUIVO.xlsx';
const apiUrl = 'https://CLIENTE.cliqcrm.com.br/int/addContact';
const queueId = ID_FILA;
const apiKey = 'API_KEY';
const linhaInicial = LINHA_INICIAL_CONTATO_IMPORTAR; // Define a partir de qual linha começar (1 = primeira linha de dados)

// Lê a planilha
const workbook = XLSX.readFile(arquivoOriginal);
const primeiraAba = workbook.SheetNames[0];
const worksheet = workbook.Sheets[primeiraAba];
const dados = XLSX.utils.sheet_to_json(worksheet);

// Função para formatar nome
function formatarRazaoSocial(texto) {
    if (!texto) return '';
    return texto.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Função para adicionar 55 ao telefone
function adicionarCodigoPais(telefone) {
    if (!telefone) return '';
    const telefoneStr = String(telefone).trim();
    // Se já começa com 55, não adiciona novamente
    if (telefoneStr.startsWith('55')) {
        return telefoneStr;
    }
    return '55' + telefoneStr;
}

// Delay entre requisições
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal
async function processarPlanilha() {
    const numerosJaProcessados = new Set();

    // Ajusta o array para começar da linha especificada
    const dadosFiltrados = dados.slice(linhaInicial - 1);
    
    // Percorre as linhas da planilha pegando os dados de acordo com o nome da coluna 
    for (const [index, linha] of dadosFiltrados.entries()) {
        const linhaReal = index + linhaInicial + 1; // +1 por causa do cabeçalho
        const nome = linha['nome cliente']; // Pega o telefone na coluna informada
        const celularTratado = adicionarCodigoPais(linha['telefone cliente']); // Adiciona 55 e usa coluna já tratada

        if (!nome || !celularTratado) {
            console.log(`Linha ${linhaReal}: Dados incompletos. Pulando.`);
            continue;
        }

        if (numerosJaProcessados.has(celularTratado)) {
            console.log(`Linha ${linhaReal}: Número duplicado (${celularTratado}). Pulando.`);
            continue;
        }

        numerosJaProcessados.add(celularTratado);

        const nomeFormatado = formatarRazaoSocial(nome);

        const payload = {
            queueId,
            apiKey,
            name: nomeFormatado,
            number: celularTratado,
            free1: 'camapnha1'
        };

        try {
            const response = await axios.post(apiUrl, payload);
            console.log(`Linha ${linhaReal}: Sucesso - ${response.status}`);
        } catch (error) {
            console.error(`Linha ${linhaReal}: Erro - ${error.message}`);
        }

        await delay(100);
    }

    console.log('Processamento concluído.');
}

// Executa
processarPlanilha();
