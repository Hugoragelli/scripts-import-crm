const XLSX = require('xlsx');
const axios = require('axios');

// Configuração
const arquivoOriginal = 'brian1.xlsx';
const apiUrl = 'https://toro.atenderbem.com/int/createOpportunity';
const queueId = 10;
const apiKey = '123';

// Mapeamento dos campos do formsdata
const formsMap = {
  "bc3edef0": "Websites",
  "c7ee0d20": "Matriz ou filial",
  "d10a8280": "Faixa de Faturamento",
  "daf851a0": "CNAE fiscal",
  "caaaaa30": "CNAEs secundários",
  "dce19920": "Socios",
  "fc507160": "Município",
  "09eb9110": "UF",
  "15c94950": "Logradouro",
  "29ac3a90": "Complemento",
  "3a477ae0": "Número",
  "4804a180": "CEP",
  "01342cd0": "CNPJ"
};

function formatarNome(texto) {
  return texto ? texto.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim() : '';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const workbook = XLSX.readFile(arquivoOriginal);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

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
