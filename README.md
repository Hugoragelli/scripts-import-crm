# Scripts CRM - Importação e Exclusão

Scripts Node.js para importar e excluir contatos e oportunidades em sistemas CRM.

## 📋 Pré-requisitos

- Node.js instalado (versão 14 ou superior)
- NPM (geralmente vem com Node.js)

## 🚀 Instalação

1. Clone ou baixe este repositório
2. No terminal, navegue até a pasta do projeto
3. Instale as dependências:

```bash
npm install
```

Isso vai instalar:
- `axios` - Para fazer requisições HTTP
- `csv-parser` - Para ler arquivos CSV
- `dotenv` - Para gerenciar variáveis de ambiente
- `xlsx` - Para ler arquivos Excel

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas configurações reais

## 📄 Arquivos Disponíveis

### 1. `importarContatos-xlsx.js`
**Importa contatos de um arquivo Excel (.xlsx)**

**Como usar:**
1. Coloque seu arquivo Excel na pasta do projeto
2. Configure no `.env`:
   - `NOME_DO_ARQUIVO` - Nome do arquivo sem extensão
   - `LINHA_INICIAL_CONTATO_IMPORTAR` - Linha inicial (1 = primeira linha de dados)
   - `LINHA_FINAL_CONTATO_IMPORTAR` - Linha final (deixe vazio para processar tudo)

3. Execute:
```bash
node importarContatos-xlsx.js
```

**Colunas esperadas no Excel:**
- `First Name` / `Last Name` / `Display Name` - Nome do contato
- `Mobile Phone` / `Business Phone` / `Home Phone` - Telefone
- `E-mail Address` - Email
- Campos opcionais: `document`, `endereço`, `número`, `bairro`, `cidade`, `estado`, `país`, `cep`, `livre1`, `livre2`

---

### 2. `ImportarContatos-csv.js`
**Importa contatos de um arquivo CSV**

**Como usar:**
1. Coloque seu arquivo CSV na pasta do projeto
2. Configure no `.env` (mesmas variáveis do xlsx)
3. Execute:
```bash
node ImportarContatos-csv.js
```

**Mesmas colunas do arquivo Excel**

---

### 3. `ImportarOportunidades-xlsx.js`
**Importa oportunidades de um arquivo Excel (.xlsx)**

**Como usar:**
1. Coloque seu arquivo Excel na pasta do projeto
2. Configure no `.env`:
   - `NOME_DO_ARQUIVO` - Nome do arquivo sem extensão
   - `LINHA_INICIAL_OPORTUNIDADE_IMPORTAR` - Linha inicial
   - `LINHA_FINAL_OPORTUNIDADE_IMPORTAR` - Linha final (vazio = processar tudo)
   - `RESPONSAVEL` - ID do responsável
   - `FUNIL` - ID do funil
   - `ESTAGIO` - ID do estágio

3. No arquivo `.js`, ajuste as constantes:
   - `responsableid`, `fkPipeline`, `fkStage` (linhas 11-13)

4. Execute:
```bash
node ImportarOportunidades-xlsx.js
```

**Colunas esperadas no Excel:**
- `Nome Fantasia` / `Razão Social` - Nome da oportunidade
- `Telefones` / `Mobile Phone` / `Business Phone` / `Home Phone` - Telefone
- `E-mails` - Email
- `formsdata` - Campos personalizados (formato que você definir)

---

### 4. `excluirContatos.js`
**Exclui contatos por faixa de IDs**

**Como usar:**
1. **IMPORTANTE:** Obtenha o Bearer Token:
   - Acesse o CRM pelo navegador
   - Abra o Console de Desenvolvedor (F12)
   - Vá na aba "Network"
   - Exclua um contato manualmente
   - Localize a requisição DELETE e copie o token do header `Authorization`

2. Configure no `.env`:
   - `BEARER_TOKEN` - Token copiado (tem duração limitada!)
   - `ID_INICIAL_CONTATO_EXCLUIR` - ID inicial
   - `ID_FINAL_CONTATO_EXCLUIR` - ID final

3. Execute:
```bash
node excluirContatos.js
```

⚠️ **ATENÇÃO:** O Bearer Token expira! Se der erro de autenticação, obtenha um novo token.

---

### 5. `excluirOps.js`
**Exclui oportunidades por faixa de IDs**

**Como usar:**
1. Configure no `.env`:
   - `ID_OP_INICIAL_A_SER_EXCLUIDO` - ID inicial
   - `ID_OP_FINAL_A_SER_EXCLUIDO` - ID final

2. Execute:
```bash
node excluirOps.js
```

---

## 🔧 Tratamento de Números

Todos os scripts de importação aplicam tratamento automático nos números de telefone:
- Remove caracteres não numéricos
- Remove prefixos 041 e 015
- Adiciona código do país (55)
- Adiciona DDD padrão (84) quando necessário
- Normaliza para o formato: `55DDNNNNNNNNN`

## 📊 Delay entre Requisições

- **Importações:** 100ms (contatos) / 2000ms (oportunidades)
- **Exclusões:** 500ms (contatos) / sem delay (oportunidades)

Isso evita sobrecarregar o servidor.

## 🐛 Tratamento de Erros

Todos os scripts:
- Validam dados obrigatórios antes de enviar
- Mostram mensagens claras de erro no console
- Pulam registros com dados incompletos
- Continuam processando mesmo se houver erros individuais

## 📝 Logs

Os scripts mostram no console:
- Número da linha sendo processada
- Status de sucesso/erro
- Dados processados (nome, telefone)
- Total de registros ao final

## ⚠️ Dicas Importantes

1. Sempre teste com poucas linhas primeiro (configure `LINHA_FINAL`)
2. Verifique se as colunas do Excel/CSV correspondem aos nomes esperados
3. O Bearer Token para exclusão de contatos expira rapidamente
4. Faça backup antes de executar exclusões em massa
5. Confira os dados no `.env` antes de executar

## 🤝 Suporte

Se encontrar problemas:
1. Verifique se o `.env` está configurado corretamente
2. Confira se as colunas do arquivo correspondem aos nomes esperados
3. Veja os logs de erro no console para mais detalhes
