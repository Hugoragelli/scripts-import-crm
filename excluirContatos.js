const axios = require('axios');
require('dotenv').config();

// 🔐 Copie o token do header Authorization da requisição DELETE (pegar no momento que excluir o contato através do console da página pois tem duração)
const BEARER_TOKEN = process.env.BEARER_TOKEN;

// 🧾 ID inicial e final dos contatos que deseja deletar
const ID_INICIAL = process.env.ID_INICIAL_CONTATO_EXCLUIR;
const ID_FINAL = process.env.ID_FINAL_CONTATO_EXCLUIR;

async function deletarContato(id) {
  try {
    const response = await axios.delete(`${process.env.URL_CLIENTE}/contacts/${id}`, {
      headers: {
        Authorization: BEARER_TOKEN,
        Accept: 'application/json, text/plain, */*',
      }
    });

    if (response.status === 200) {
      console.log(`✅ Contato ${id} excluído com sucesso.`);
    } else {
      console.error(`⚠️ Contato ${id} retornou status ${response.status}.`);
    }
  } catch (err) {
    console.error(`❌ Erro ao excluir contato ${id}:`, err.response?.data || err.message);
  }
}

async function executarDelecoes() {
  for (let id = ID_INICIAL; id <= ID_FINAL; id++) {
    await deletarContato(id);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay de 0.5s para não sobrecarregar o servidor
  }

  console.log('🚮 Fim do processo de exclusão.');
}

executarDelecoes();
