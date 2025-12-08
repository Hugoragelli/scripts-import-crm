const XLSX = require('xlsx');
const axios = require('axios');

// Configuração
const arquivoXLSX = 'Carteira Renato.xlsx';
const apiUrl = 'https://goimage.atenderbem.com/int/addContact';
const queueId = 15;
const apiKey = '123';

// Lê a planilha a partir da linha correta
const workbook = XLSX.readFile(arquivoXLSX);
const aba = workbook.SheetNames[0];
const dados = XLSX.utils.sheet_to_json(workbook.Sheets[aba], { range: 2 }); // começa na linha 3

function tratarNumero(numero) {
    if (!numero) return '';

    let tratado = numero.toString().replace(/\D/g, '');

    if (!tratado.startsWith('55') && tratado.length > 11) return '';

    if (tratado.startsWith('55') && (tratado.length === 12 || tratado.length === 13)) return tratado;

    if (tratado.length === 10 || tratado.length === 11) return '55' + tratado;

    if (tratado.length === 8 || tratado.length === 9) return '5554' + tratado;

    return '';
}

function formatarNome(nome) {
    return nome.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processarContatos() {
    const numerosJaEnviados = new Set();

    for (const [index, linha] of dados.entries()) {
        const nomeOriginal = linha['Parceiro'] || '';
        const celular = linha['Celular'] || '';
        const telefone = linha['Telefone'] || '';
        const cidade = linha['Cidade'] || '';
        const codigo = linha['Cod. Parceiro'] || '';
        const tipo = linha['Tipo'] || '';
        const documento = linha['CPF/CNPJ'] || '';
        const estado = linha['UF'] || '';
        const email = linha['E-mail'] || '';


        const nome = formatarNome(nomeOriginal);
        const numeroBruto = celular || telefone;
        const telefoneTratado = tratarNumero(numeroBruto);

        console.log(`Linha ${index + 3}: Nome: "${nome}" | Telefone tratado: "${telefoneTratado}"`);

        if (!nome || !telefoneTratado) {
            console.log(`Linha ${index + 3}: Dados incompletos. Pulando.`);
            continue;
        }

        if (numerosJaEnviados.has(telefoneTratado)) {
            console.log(`Linha ${index + 3}: Número duplicado. Pulando.`);
            continue;
        }

        numerosJaEnviados.add(telefoneTratado);

        const payload = {
            queueId,
            apiKey,
            name: nome,
            document: documento,
            number: telefoneTratado,
            city: cidade,
            email: email,
            state: estado,
            tags: [13],
            free1: codigo,
            free2: tipo
        };

        try {
            const response = await axios.post(apiUrl, payload);
            console.log(`Linha ${index + 3}: Sucesso - ${response.status}`);
        } catch (error) {
            console.error(`Linha ${index + 3}: Erro - ${error.message}`);
        }

        await delay(2000);
    }

    console.log('Processamento concluído.');
}

// Executa
processarContatos();
