const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');

// Configuração
const arquivoOriginal = 'contatos-ewerton.csv'; // Altere aqui para o arquivo desejado
const apiUrl = 'https://gvitta.cliqcrm.com.br/int/addContact';
const queueId = 10;
const apiKey = 'Gvitta@!#10';

// Variável para armazenar os dados do CSV
const dados = [];

// Função para tratar número de celular
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

// Função para formatar nome
function formatarRazaoSocial(texto) {
    if (!texto) return '';
    return texto.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Delay entre requisições
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal
async function processarPlanilha() {
    // Lê o arquivo CSV
    await new Promise((resolve, reject) => {
        fs.createReadStream(arquivoOriginal)
            .pipe(csv())
            .on('data', (row) => dados.push(row))
            .on('end', () => {
                console.log(`Arquivo CSV carregado: ${dados.length} registros encontrados.`);
                resolve();
            })
            .on('error', reject);
    });

    for (const [index, linha] of dados.entries()) {
        // Monta o nome a partir de First Name, Last Name ou Display Name
        const firstName = linha['First Name'] || '';
        const lastName = linha['Last Name'] || '';
        const displayName = linha['Display Name'] || '';
        
        // Prioriza First Name + Last Name, senão usa Display Name
        let nome = firstName && lastName 
            ? `${firstName} ${lastName}`.trim() 
            : displayName.trim();
        
        // Pega o telefone (prioriza Mobile Phone, depois Business Phone, depois Home Phone)
        const celularOriginal = linha['Mobile Phone'] || linha['Business Phone'] || linha['Home Phone'] || '';
        
        // Pega o email
        const email = linha['E-mail Address'] || '';
        
        // Pega outras informações opcionais
        const organization = linha['Organization'] || '';
        const notes = linha['Notes'] || '';

        if (!nome || !celularOriginal) {
            console.log(`Linha ${index + 2}: Dados incompletos. Pulando.`);
            continue;
        }

        const celularTratado = tratarNumero(celularOriginal);
        const nomeFormatado = formatarRazaoSocial(nome);

        const payload = {
            queueId,
            apiKey,
            name: nomeFormatado,
            number: celularTratado
        };

        try {
            const response = await axios.post(apiUrl, payload);
            console.log(`Linha ${index + 2}: Sucesso - ${nomeFormatado} - ${celularTratado} - ${response.status}`);
        } catch (error) {
            console.error(`Linha ${index + 2}: Erro - ${error.message}`);
        }

        await delay(2000);
    }

    console.log('Processamento concluído.');
}

// Executa
processarPlanilha();
