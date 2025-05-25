# 🚀 Instalação Rápida - Webhooks MCP

## ✅ Status Atual
- ✅ Projeto criado e configurado
- ✅ Dependências instaladas
- ✅ Código compilado com sucesso
- ✅ Servidor testado e funcionando

## 📋 Próximos Passos

### 1. Configure o Claude Desktop

Abra o arquivo de configuração do Claude Desktop:

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Se o arquivo não existir, crie-o:**
```bash
mkdir -p ~/Library/Application\ Support/Claude/
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Adicione a Configuração

Cole o seguinte conteúdo no arquivo `claude_desktop_config.json`:

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

### 3. Reinicie o Claude Desktop

Feche completamente o Claude Desktop e abra novamente para carregar a nova configuração.

### 4. Teste o MCP

No Claude Desktop, você verá um ícone de plug 🔌 indicando que o MCP está conectado.

Teste com um comando como:
```
Envie um webhook POST para https://httpbin.org/post com os parâmetros:
- nome: "João Silva"
- email: "joao@email.com"
- telefone: "11999999999"
```

## 🛠️ Comandos Úteis

```bash
# Recompilar após mudanças
cd /Users/rafabarbosa/Desktop/scripts/webhooks-mcp
npm run build

# Testar o servidor manualmente
node dist/index.js

# Ver logs em tempo real (se necessário)
tail -f ~/.claude/logs/claude.log
```

## 📚 Exemplos de Uso

### Exemplo 1: Webhook Simples
```
Envie um GET para https://httpbin.org/get com parâmetros: {"teste": "mcp", "versao": "1.0"}
```

### Exemplo 2: POST com Headers
```
Faça um POST para https://httpbin.org/post com:
- Parâmetros: {"usuario": "admin", "acao": "login"}
- Headers: {"Authorization": "Bearer abc123", "Content-Type": "application/json"}
```

### Exemplo 3: Integração Real
```
Envie dados para meu webhook de CRM em https://meucrm.com/api/leads com:
- nome: "Maria Santos"
- email: "maria@empresa.com"
- telefone: "11987654321"
- origem: "website"
```

## 🔧 Solução de Problemas

### MCP não aparece no Claude
1. Verifique se o caminho no `claude_desktop_config.json` está correto
2. Reinicie o Claude Desktop completamente
3. Verifique se o arquivo foi compilado: `ls -la dist/index.js`

### Erro de compilação
```bash
cd /Users/rafabarbosa/Desktop/scripts/webhooks-mcp
npm install
npm run build
```

### Testar conexão
```bash
# Deve mostrar "Webhook MCP Server rodando no stdio"
node dist/index.js
```

## 🎉 Pronto!

Seu MCP de webhooks está configurado e pronto para uso! Agora você pode enviar requisições HTTP para qualquer webhook diretamente do Claude Desktop com parâmetros dinâmicos. 