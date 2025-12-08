const XLSX = require('xlsx');
const axios = require('axios');

// Configuração
const arquivoOriginal = 'NOME_DO_ARQUIVO.xlsx';
const apiUrl = 'https://CLIENTE.atenderbem.com/int/createOpportunity';
const queueId = ID_FILA;
const apiKey = 'API_KEY';

// Mapeamento dos campos do formsdata (Campos personalizados dos formulários criados)
const formsMap = {
  "bc3edef0": "Websites"
};

//Função para tratamento do nome de acordo com a coluna
function formatarNome(texto) {
  return texto ? texto.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim() : '';
}

//Função de delay, para esperar entre uma requisição e outra
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const workbook = XLSX.readFile(arquivoOriginal);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

//Função que percorre as linhas da planilha, chama as funções de tratamento e realiza a chamada para o endpoint de criação de oportunidade
async function processarPlanilha() {
  for (const [index, linha] of dados.entries()) {
    if (index < 0) continue;

    const nome = linha['Nome Fantasia'] || linha['Razão Social'];
    const email = linha['E-mails'] || '';
    const telefonesRaw = linha['Telefones'] || '';
    const numeros = telefonesRaw.split(';').map(n => n.replace(/\D/g, '')).filter(n => n);
    const telefone = numeros[0] ? (numeros[0].startsWith('55') ? numeros[0] : '55' + numeros[0]) : '';
    const descricaoExtras = numeros.length > 1 ? `Outros números: ${numeros.slice(1).join(', ')}` : '';
    const tipoEndereco = linha['Tipo de endereço'] || '';

    if (!nome || !telefone || telefone.length < 10) {
      console.warn(`Linha ${index + 2}: Dados incompletos. Pulando.`);
      continue;
    }

    // Verifica CNAE fiscal para definir a tag
    const cnae = (linha['CNAE fiscal'] || '').toLowerCase();
    let tag = 2; // padrão: Fabricação
    if (cnae.includes('comércio')) {
      tag = 4;
    }

    const formsdata = {};
    for (const [id, coluna] of Object.entries(formsMap)) {
      if (id === "15c94950") {
        const valor = `${tipoEndereco} ${linha['Logradouro'] || ''}`.trim();
        if (valor) {
          formsdata[id] = valor;
        }
      } else {
        const valor = linha[coluna];
        if (valor !== undefined && valor !== null && valor !== '') {
          formsdata[id] = valor.toString();
        }
      }
    }

    const payload = {
      queueId,
      apiKey,
      responsableid: 502,
      fkPipeline: 1,
      fkStage: 1,
      title: formatarNome(nome),
      mainphone: telefone,
      mainmail: email,
      description: descricaoExtras,
      tags: [tag],
      formsdata
    };

    try {
      const response = await axios.post(apiUrl, payload);
      console.log(`Linha ${index + 2}: Sucesso - ${response.status}`);
    } catch (error) {
      console.error(`Linha ${index + 2}: Erro -`, JSON.stringify(error.response?.data || error.message, null, 2));
    }

    await delay(2000);
  }

  console.log('✅ Processamento concluído.');
}

processarPlanilha();
