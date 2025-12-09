const XLSX = require('xlsx');
const axios = require('axios');
require('dotenv').config();

// Configuração
const arquivoOriginal = `${process.env.NOME_DO_ARQUIVO}.xlsx`;
const apiUrl = `${process.env.URL_CLIENTE}/int/addContact`;
const queueId = process.env.ID_FILA;
const apiKey = process.env.API_KEY;
const linhaInicial = process.env.LINHA_INICIAL_CONTATO_IMPORTAR; // Define a partir de qual linha começar (1 = primeira linha de dados)
const linhaFinal = process.env.LINHA_FINAL_CONTATO_IMPORTAR; // Define até qual linha processar (deixe vazio para processar até o final)

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

// Função para tratar número de celular (oferece o ddd padrão para inserir em casos em que não está preenchido)
function tratarNumero(numero, dddPadrao = '84') {
    if (!numero) return '';
    
    // Remove todos os caracteres não numéricos (traços, espaços, parênteses, etc)
    let tratado = numero.toString().replace(/\D/g, '');

    // Remove prefixos 041 ou 015 do início
    if (tratado.startsWith('041')) {
        tratado = tratado.substring(3);
    } else if (tratado.startsWith('015')) {
        tratado = tratado.substring(3);
    }
    
    // Se já tem 55 no início, retorna como está
    if (tratado.startsWith('55') && tratado.length >= 12) {
        return tratado;
    }
    
    // Se tem 11 dígitos (DDD + número com 9), adiciona 55
    if (tratado.length === 11) {
        return '55' + tratado;
    }
    
    // Se tem 10 dígitos (DDD + número sem 9), adiciona 55
    if (tratado.length === 10) {
        return '55' + tratado;
    }
    
    // Se tem 9 dígitos (número com 9, sem DDD), adiciona DDD padrão + 55
    if (tratado.length === 9) {
        return '55' + dddPadrao + tratado;
    }
    
    // Se tem 8 dígitos (número sem 9 e sem DDD), adiciona DDD padrão + 55
    if (tratado.length === 8) {
        return '55' + dddPadrao + tratado;
    }
    
    // Para outros casos, tenta adicionar 55 se não tiver
    if (!tratado.startsWith('55')) {
        tratado = '55' + tratado;
    }
    
    return tratado;
}

// Delay entre requisições
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal
async function processarPlanilha() {
    const numerosJaProcessados = new Set();

    // Ajusta o array para começar da linha especificada
    const inicio = linhaInicial - 1;
    const fim = linhaFinal ? Math.min(linhaFinal, dados.length) : dados.length;
    const dadosFiltrados = dados.slice(inicio, fim);
    
    console.log(`Processando linhas ${linhaInicial} até ${fim} (total: ${dadosFiltrados.length} registros)\n`);
    
    // Percorre as linhas da planilha pegando os dados de acordo com o nome da coluna 
    for (const [index, linha] of dadosFiltrados.entries()) {
        const linhaReal = index + parseInt(linhaInicial) + 1; // +1 por causa do cabeçalho
        // Monta o nome a partir de First Name, Last Name ou Display Name
        const firstName = linha['First Name'] || '';
        const lastName = linha['Last Name'] || '';
        const displayName = linha['Display Name'] || '';

        // Prioriza First Name + Last Name, senão usa Display Name
        let nome = firstName && lastName ? `${firstName} ${lastName}`.trim() : displayName.trim();

        const celularTratado = tratarNumero(linha['Mobile Phone'] || linha['Business Phone'] || linha['Home Phone'] || ''); // Adiciona 55 e usa coluna já tratada
        // Pega o email
        const email = linha['E-mail Address'] || '';
        // Pega outras informações opcionais
        const documento = linha['document'] || '';
        const endereco = linha['endereço'] || '';
        const numero = linha['número'] || '';
        const bairro = linha['bairro'] || '';
        const cidade = linha['cidade'] || '';
        const estado = linha['estado'] || '';
        const pais = linha['país'] || '';
        const cep = linha['cep'] || '';
        const livre1 = linha['livre1'] || '';
        const livre2 = linha['livre2'] || '';

        if (!nome || !celularTratado) {
            console.log(`Linha ${linhaReal}: Dados incompletos. Pulando.`);
            continue;
        }

        // Verifica números duplicados
        if (numerosJaProcessados.has(celularTratado)) {
            console.log(`Linha ${linhaReal}: Número duplicado (${celularTratado}). Pulando.`);
            continue;
        }

        // Adiciona o número da vez à lista de processados
        numerosJaProcessados.add(celularTratado);

        // Formata o nome antes de colocar no payload
        const nomeFormatado = formatarRazaoSocial(nome);

        const payload = {
            queueId,
            apiKey,
            name: nomeFormatado,
            number: celularTratado,
            document: documento,
            email: email,
            address: endereco,
            houseNumber: numero,
            neighborhood: bairro,
            city: cidade,
            state: estado,
            country: pais,
            postalCode: cep,
            free1: livre1,
            free2: livre2,
            tags: []
        };

        try {
            const response = await axios.post(apiUrl, payload);
            console.log(`Linha ${linhaReal}: Sucesso - ${response.status} - ${nomeFormatado} - ${celularTratado}`);
        } catch (error) {
            console.error(`Linha ${linhaReal}: Erro - ${error.message}`);
        }

        await delay(100);
    }

    console.log('Processamento concluído.');
}

// Executa
processarPlanilha();
