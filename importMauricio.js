const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');

// Configurações fixas
const API_KEY = 'Berty@goimage';
const QUEUE_ID = 22;
const TAG_ID = 21;
const PIPELINE_ID = 6;
const STAGE_ID = 30;

// Caminho do CSV
const caminhoCSV = 'Usuarios Fotogo Alto Potencial.csv';

// Função para aguardar (em milissegundos)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para processar um contato
async function processarContato({ Nome, Email, Telefone }) {
  console.log('📨 Processando:', { Nome, Email, Telefone });

  const contatoPayload = {
    queueId: QUEUE_ID,
    apiKey: API_KEY,
    name: Nome,
    number: String(Telefone),
    email: Email
  };

  try {
    const resContato = await axios.post(
      'https://goimage.atenderbem.com/int/addContact',
      contatoPayload
    );

    console.log('📦 Resposta do addContact:', resContato.data);

    const contatoId = resContato.data.contactId;
    if (!contatoId) {
      console.error(`❌ Contato ${Nome} criado, mas ID não retornado.`);
      return;
    }

    const oportunidadePayload = {
      queueId: QUEUE_ID,
      apiKey: API_KEY,
      fkPipeline: PIPELINE_ID,
      responsableid: 506,
      fkStage: STAGE_ID,
      title: `${Nome}`,
      clientid: String(contatoId),
      mainphone: String(Telefone),
      mainmail: Email,
      tags: [TAG_ID],
      contacts: [contatoId]
    };

    const resOportunidade = await axios.post(
      'https://goimage.atenderbem.com/int/CreateOpportunity',
      oportunidadePayload
    );

    if (resOportunidade.status === 200) {
      console.log(`✅ Oportunidade criada para ${Nome}`);
    } else {
      console.error(`❌ Falha ao criar oportunidade para ${Nome}`);
    }

  } catch (err) {
    console.error(`❌ Erro com ${Nome}:`, err.response?.data || err.message);
  }
}

// Lê todos os dados do CSV primeiro
const contatos = [];

fs.createReadStream(caminhoCSV)
  .pipe(csv({ separator: ';', mapHeaders: ({ header }) => header.trim() }))
  .on('data', (row) => contatos.push(row))
  .on('end', async () => {
    console.log(`📥 ${contatos.length} contatos encontrados. Iniciando importação...`);

    for (const contato of contatos) {
      await processarContato(contato);
      await delay(3000); // 3 segundos entre cada contato
    }

    console.log('✅ Importação finalizada!');
  });
