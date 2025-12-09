const XLSX = require('xlsx');
const axios = require('axios');
require('dotenv').config();

// Configuração
const arquivoOriginal = `${process.env.NOME_DO_ARQUIVO}.xlsx`;
const apiUrl = `${process.env.URL_CLIENTE}/int/createOpportunity`;
const queueId = process.env.ID_FILA;
const apiKey = process.env.API_KEY;
const linhaInicial = process.env.LINHA_INICIAL_OPORTUNIDADE_IMPORTAR; // Define a partir de qual linha começar (1 = primeira linha de dados)
const linhaFinal = process.env.LINHA_FINAL_OPORTUNIDADE_IMPORTAR; // Define até qual linha processar (deixe vazio para processar até o final)
const responsableid = process.env.RESPONSAVEL;
const fkPipeline = process.env.FUNIL;
const fkStage = process.env.ESTAGIO

// Função para tratar número de celular (oferece o ddd padrão para inserir em casos em que não está preenchido)
function tratarNumero(numero, dddPadrao = '11') {
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

//Função para tratamento do nome de acordo com a coluna (nome, razão social, etc)
function formatarNome(texto) {
  return texto ? texto.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim() : '';
}

//Função de delay, para esperar entre uma requisição e outra
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lê a planilha
const workbook = XLSX.readFile(arquivoOriginal);
const primeiraAba = workbook.SheetNames[0];
const worksheet = workbook.Sheets[primeiraAba];
const dados = XLSX.utils.sheet_to_json(worksheet);

//Função que percorre as linhas da planilha, chama as funções de tratamento e realiza a chamada para o endpoint de criação de oportunidade
async function processarPlanilha() {
  // Ajusta o array para começar da linha especificada
  const inicio = linhaInicial - 1;
  const fim = linhaFinal ? Math.min(linhaFinal, dados.length) : dados.length;
  const dadosFiltrados = dados.slice(inicio, fim);
  
  console.log(`Processando linhas ${linhaInicial} até ${fim} (total: ${dadosFiltrados.length} registros)\n`);

  for (const [index, linha] of dadosFiltrados.entries()) {
    const linhaReal = index + parseInt(linhaInicial) + 1; // +1 por causa do cabeçalho

    // Monta o nome a partir de First Name, Last Name ou Display Name
    const firstName = linha['First Name'] || '';
    const lastName = linha['Last Name'] || '';
    const displayName = linha['Display Name'] || '';

    // Prioriza First Name + Last Name, senão usa Display Name
    let nome = firstName && lastName ? `${firstName} ${lastName}`.trim() : displayName.trim();

    const telefone = tratarNumero(linha['Telefones'] || linha['Mobile Phone'] || linha['Business Phone'] || linha['Home Phone'] || '');

    const email = linha['E-mails'] || '';
    const origem = linha['origem'] || '';
    const descricao = linha['descricao'] || '';

    const formsdata = {
      "067fb620": nome
    };

    if (!nome || !telefone) {
      console.log(`Linha ${linhaReal}: Dados incompletos. Pulando.`);
      continue;
    }

    const payload = {
      queueId,
      apiKey,
      responsableid,
      fkPipeline,
      fkStage,
      title: nome,
      mainphone: telefone,
      mainmail: email,
      origin: origem,
      description: descricao,
      tags: [],
      formsdata
    };

    try {
      const response = await axios.post(apiUrl, payload);
      console.log(`Linha ${linhaReal}: Sucesso - ${response.status} - ${nome} - ${telefone}`);
    } catch (error) {
      console.error(`Linha ${linhaReal}: Erro -`, JSON.stringify(error.response?.data || error.message, null, 2));
    }

    await delay(2000);
  }

  console.log('Processamento concluído.');
}

processarPlanilha();
