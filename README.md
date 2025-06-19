# Webhooks MCP

![Testes Automatizados](https://img.shields.io/badge/testes-passing-brightgreen)

Um servidor MCP (Model Context Protocol) para enviar requisições HTTP para webhooks com parâmetros dinâmicos.

## Funcionalidades

- ✅ Suporte a todos os métodos HTTP: GET, POST, PUT, PATCH, DELETE
- ✅ Parâmetros dinâmicos de qualquer tipo (nome, email, telefone, etc.)
- ✅ Headers HTTP personalizados
- ✅ Timeout configurável
- ✅ Validação de entrada com Zod
- ✅ Tratamento de erros detalhado
- ✅ Logs de requisição e resposta

## Instalação

1. As dependências já estão instaladas. Para reinstalar se necessário:
```bash
cd webhooks-mcp
npm install
```

2. Compile o TypeScript:
```bash
npm run build
```

## Configuração no Claude Desktop

Adicione a seguinte configuração no arquivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webhooks": {
      "command": "node",
      "args": ["/Users/rafabarbosa/Desktop/scripts/webhooks-mcp/dist/index.js"]
    }
  }
}
```

**Localização do arquivo de configuração:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Uso

### Ferramenta Disponível

#### `send_webhook`

Envia uma requisição HTTP para um webhook com parâmetros personalizados.

**Parâmetros:**

- `url` (obrigatório): URL do webhook (ex: https://meuwebhook.com.br)
- `method` (obrigatório): Método HTTP (GET, POST, PUT, PATCH, DELETE)
- `parameters` (opcional): Objeto com parâmetros de qualquer tipo
- `headers` (opcional): Headers HTTP adicionais
- `timeout` (opcional): Timeout em milissegundos (padrão: 30000)

### Exemplos de Uso

#### 1. POST com dados de usuário
```json
{
  "url": "https://meuwebhook.com.br/usuarios",
  "method": "POST",
  "parameters": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "idade": 30,
    "ativo": true
  }
}
```

#### 2. GET com query parameters
```json
{
  "url": "https://api.exemplo.com/dados",
  "method": "GET",
  "parameters": {
    "filtro": "ativo",
    "limite": 10,
    "pagina": 1
  }
}
```

#### 3. PUT com headers personalizados
```json
{
  "url": "https://api.exemplo.com/atualizar/123",
  "method": "PUT",
  "parameters": {
    "nome": "João Santos",
    "status": "atualizado"
  },
  "headers": {
    "Authorization": "Bearer token123",
    "X-Custom-Header": "valor"
  }
}
```

#### 4. DELETE simples
```json
{
  "url": "https://api.exemplo.com/deletar/123",
  "method": "DELETE"
}
```

## Comportamento por Método HTTP

- **GET/DELETE**: Parâmetros são enviados como query parameters na URL
- **POST/PUT/PATCH**: Parâmetros são enviados no body da requisição como JSON

## Tratamento de Erros

O MCP trata diferentes tipos de erro:

- **Erros de validação**: Quando os parâmetros não estão no formato correto
- **Erros HTTP**: Quando o webhook retorna status de erro (4xx, 5xx)
- **Erros de rede**: Timeout, conexão recusada, etc.

## Desenvolvimento

### Scripts disponíveis

- `npm run build`: Compila o TypeScript
- `npm run dev`: Compila em modo watch
- `npm start`: Executa o servidor compilado

### Estrutura do projeto

```
webhooks-mcp/
├── src/
│   └── index.ts          # Servidor MCP principal
├── dist/                 # Arquivos compilados
├── examples.json         # Exemplos de uso
├── claude_desktop_config.json  # Configuração de exemplo
├── package.json
├── tsconfig.json
└── README.md
```

## Testando o Servidor

Para testar se o servidor está funcionando:

```bash
# Compilar
npm run build

# Testar execução (pressione Ctrl+C para sair)
node dist/index.js

# Rodar testes automatizados
npm test

# Os exemplos do arquivo examples.json são validados automaticamente por testes automatizados.
```

## Logs

O servidor gera logs detalhados:

- Requisições enviadas (método, URL, parâmetros)
- Respostas recebidas (status, tempo de resposta)
- Erros detalhados com contexto

## Segurança

- Validação rigorosa de entrada com Zod
- Headers de User-Agent identificando o MCP
- Timeout configurável para evitar requisições infinitas
- Tratamento seguro de erros sem exposição de dados sensíveis
- **Whitelist de URLs/domínios**: configure a variável de ambiente `WHITELIST_URLS` (separada por vírgula) para restringir os destinos permitidos. Exemplo:

```bash
export WHITELIST_URLS="api.exemplo.com,meuwebhook.com.br,https://hooks.slack.com"
```

Se não configurada, qualquer URL será permitida.

- **Níveis de log configuráveis**: defina a variável de ambiente `LOG_LEVEL` para controlar a verbosidade dos logs (`debug`, `info`, `warn`, `error`). Exemplo:

```bash
export LOG_LEVEL="debug"
```

- **Retentativas automáticas**: defina as variáveis de ambiente `RETRY_ATTEMPTS` (número de tentativas, padrão 1) e `RETRY_BASE_DELAY_MS` (delay inicial em ms, padrão 500) para habilitar retentativas automáticas com backoff exponencial em falhas temporárias.

```bash
export RETRY_ATTEMPTS=3
export RETRY_BASE_DELAY_MS=1000
```

- **Internacionalização (i18n)**: defina a variável de ambiente `LANG` como `pt` (padrão) ou `en` para receber mensagens em português ou inglês.

```bash
export LANG=en
```

## Exemplos de Respostas de Erro

- **Erro de validação de parâmetros:**

```
{
  "content": [
    {
      "type": "text",
      "text": "❌ Erro ao enviar webhook!\n\n**Erro:** Erro de validação dos parâmetros\n\n**Detalhes:**\n{...}"
    }
  ],
  "isError": true
}
```

- **Erro HTTP (exemplo 500):**

```
{
  "content": [
    {
      "type": "text",
      "text": "❌ Erro ao enviar webhook!\n\n**Erro:** Erro HTTP: Request failed with status code 500\n\n**Detalhes:**\n{...}"
    }
  ],
  "isError": true
}
```

- **URL não permitida (whitelist):**

```
{
  "content": [
    {
      "type": "text",
      "text": "❌ URL não permitida pelo servidor (whitelist).\n\nConsulte o administrador para liberar o domínio ou URL desejada."
    }
  ],
  "isError": true
}
```

## Validação de Headers HTTP

Alguns headers são validados automaticamente:

- `Authorization`: deve ser no formato `Bearer <token>`
- `Content-Type`: deve ser `application/json`, `application/x-www-form-urlencoded` ou `application/xml`

**Exemplo de header válido:**

```json
{
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  }
}
```

**Exemplo de header inválido:**

```json
{
  "headers": {
    "Authorization": "Token 123",
    "Content-Type": "text/plain"
  }
}
```

## FAQ

**Como configuro domínios permitidos?**

Defina a variável de ambiente `WHITELIST_URLS` com uma lista separada por vírgula dos domínios ou URLs permitidos.

**Como habilito logs mais detalhados?**

Defina `LOG_LEVEL=debug` para ver logs detalhados.

**Como habilito retentativas automáticas?**

Defina `RETRY_ATTEMPTS` e `RETRY_BASE_DELAY_MS` conforme desejado.

**Como executo os testes automatizados?**

Basta rodar `npm test` na raiz do projeto.

**Como reportar um bug ou sugerir melhoria?**

Abra uma issue no repositório do GitHub.

## Próximos Passos

1. **Configure o Claude Desktop**: Adicione a configuração no arquivo `claude_desktop_config.json`
2. **Reinicie o Claude Desktop**: Para carregar a nova configuração
3. **Teste o MCP**: Use o Claude para enviar webhooks com diferentes parâmetros

## Exemplos Práticos

Veja o arquivo `examples.json` para exemplos detalhados de como usar o MCP em diferentes cenários:
- Cadastro de usuários
- Integrações com CRM
- Notificações Slack
- Processamento de pagamentos
- E muito mais!

## Deploy com Docker

Você pode rodar o MCP facilmente usando Docker:

```bash
docker build -t webhook-mcp .
docker run --rm -p 3000:3000 \
  -e WHITELIST_URLS="api.exemplo.com" \
  -e LOG_LEVEL=info \
  -e RETRY_ATTEMPTS=3 \
  webhook-mcp
```

Adapte as variáveis de ambiente conforme necessário.

## CLI Interativa

Você pode testar webhooks manualmente pelo terminal:

```bash
npx ts-node src/cli.ts
```

Siga os prompts para informar URL, método, parâmetros e headers.

## Whitelist de URLs/Domínios Permitidos

Para aumentar a segurança em produção, defina a variável de ambiente `WHITELIST_URLS` com uma lista separada por vírgula dos domínios ou URLs permitidos. O servidor só aceitará requisições para URLs presentes nessa lista.

**Exemplo de uso:**

```bash
export WHITELIST_URLS="api.exemplo.com,meuwebhook.com.br,https://hooks.slack.com"
```

- Se a variável não estiver definida, qualquer URL será permitida (modo aberto).
- Para bloquear tudo exceto domínios/URLs específicos, defina a lista conforme desejado.

**Exemplo de erro ao tentar enviar para URL não permitida:**

```
❌ URL não permitida pelo servidor (whitelist).

Consulte o administrador para liberar o domínio ou URL desejada.
``` 