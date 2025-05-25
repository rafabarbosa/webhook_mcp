# Webhooks MCP

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