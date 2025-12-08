const axios = require('axios');

// Configurações
const queueId = ID_FILA;
const apiKey = 'API_KEY'; // Substitua pela sua chave real
const idInicial = ID_OP_INICIAL_A_SER_EXCLUIDO;
const idFinal = ID_OP_FINAL_A_SER_EXCLUIDO;

async function removerContatos() {
  for (let id = idInicial; id <= idFinal; id++) {
    try {
      const response = await axios.post(
        'https://CLIENTE.atenderbem.com/int/deleteContact',
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
