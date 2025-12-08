const axios = require('axios');

// Configurações
const queueId = 10;
const apiKey = '123'; // Substitua pela sua chave real
const idInicial = 12491;
const idFinal = 13064;

async function removerContatos() {
  for (let id = idInicial; id <= idFinal; id++) {
    try {
      const response = await axios.post(
        'https://toro.atenderbem.com/int/deleteContact',
        {
          queueId,
          apiKey,
          id
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`ID ${id} removido:`, response.data);
    } catch (error) {
      console.error(`Erro ao remover ID ${id}:`, error.response?.data || error.message);
    }
  }
}

removerContatos();
