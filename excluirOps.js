const axios = require('axios');
require('dotenv').config();

// Configurações
const queueId = process.env.ID_FILA;
const apiKey = process.env.API_KEY; // Substitua pela sua chave real
const idInicial = process.env.ID_OP_INICIAL_A_SER_EXCLUIDO;
const idFinal = process.env.ID_OP_FINAL_A_SER_EXCLUIDO;

async function removerOps() {
  for (let id = idInicial; id <= idFinal; id++) {
    try {
      const response = await axios.post(
        `${process.env.URL_CLIENTE}/int/removeOpportunity`,
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

removerOps();
