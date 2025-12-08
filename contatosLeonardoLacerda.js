const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');

// Configurações
const endpoint = 'https://leonardolacerda.atenderbem.com/int/getContact';
const apiKey = '123';
const queueId = 15;

(async () => {
  const resultados = [];

  for (let id = 3; id <= 4630; id++) {
    try {
      const response = await axios.post(endpoint, {
        queueId,
        apiKey,
        id
      });

      const data = response.data;

      // Filtra se houve retorno válido com nome (ou outro campo)
      if (data && data.name) {
        console.log(`ID ${id} -> OK: ${data.name}`);
        resultados.push(data);
      } else {
        console.log(`ID ${id} -> sem dados`);
      }

    } catch (error) {
      console.error(`Erro no ID ${id}:`, error.message);
    }
  }

  if (resultados.length === 0) {
    console.log('Nenhum dado válido retornado.');
    return;
  }

  // Cria a planilha
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(resultados);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Contatos');

  const filePath = 'contatos.xlsx';
  xlsx.writeFile(workbook, filePath);

  console.log(`Planilha salva como ${filePath}`);
})();
