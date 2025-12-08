const axios = require('axios');

// 🔐 Copie o token do header Authorization da requisição DELETE
const BEARER_TOKEN = 'Bearer TOKEN';

// 🧾 ID inicial e final dos contatos que deseja deletar
const ID_INICIAL = 16704;
const ID_FINAL = 16902;

async function deletarContato(id) {
  try {
    const response = await axios.delete(`https://nomeservidor.atenderbem.com/contacts/${id}`, {
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
