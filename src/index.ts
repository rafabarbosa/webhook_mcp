#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios, { AxiosRequestConfig, Method } from "axios";
import { z } from "zod";

// Schema para validação dos parâmetros do webhook
const WebhookRequestSchema = z.object({
  url: z.string().url("URL deve ser válida"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"], {
    errorMap: () => ({ message: "Método deve ser GET, POST, PUT, PATCH ou DELETE" })
  }),
  parameters: z.record(z.any()).optional().default({}),
  headers: z.record(z.string()).optional().default({}),
  timeout: z.number().positive().optional().default(30000),
});

// Criar o servidor MCP
const server = new McpServer({
  name: "webhooks-mcp",
  version: "1.0.0",
});

// Adicionar a ferramenta de webhook
server.tool(
  "send_webhook",
  {
    url: z.string().describe("URL do webhook (ex: https://meuwebhook.com.br)"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("Método HTTP da requisição"),
    parameters: z.record(z.any()).optional().describe("Parâmetros a serem enviados (ex: {nome: 'João', email: 'joao@email.com', telefone: '11999999999'})"),
    headers: z.record(z.string()).optional().describe("Headers HTTP adicionais (opcional)"),
    timeout: z.number().positive().optional().describe("Timeout da requisição em milissegundos (padrão: 30000)"),
  },
  async (args) => {
    try {
      // Validar argumentos
      const validatedArgs = WebhookRequestSchema.parse(args);

      // Preparar configuração da requisição
      const config: AxiosRequestConfig = {
        method: validatedArgs.method.toLowerCase() as Method,
        url: validatedArgs.url,
        timeout: validatedArgs.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WebhookMCP/1.0.0',
          ...validatedArgs.headers,
        },
      };

      // Adicionar parâmetros baseado no método HTTP
      if (['GET', 'DELETE'].includes(validatedArgs.method)) {
        // Para GET e DELETE, usar query parameters
        config.params = validatedArgs.parameters;
      } else {
        // Para POST, PUT, PATCH, usar body
        config.data = validatedArgs.parameters;
      }

      console.log(`[Webhook] Enviando ${validatedArgs.method} para ${validatedArgs.url}`);
      console.log(`[Webhook] Parâmetros:`, JSON.stringify(validatedArgs.parameters, null, 2));

      // Fazer a requisição
      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: `${duration}ms`,
        request: {
          method: validatedArgs.method,
          url: validatedArgs.url,
          parameters: validatedArgs.parameters,
          headers: validatedArgs.headers,
        },
      };

      console.log(`[Webhook] Sucesso! Status: ${response.status} (${duration}ms)`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Webhook enviado com sucesso!\n\n` +
              `**Detalhes da Requisição:**\n` +
              `- Método: ${validatedArgs.method}\n` +
              `- URL: ${validatedArgs.url}\n` +
              `- Status: ${response.status} ${response.statusText}\n` +
              `- Tempo: ${duration}ms\n\n` +
              `**Parâmetros Enviados:**\n` +
              `\`\`\`json\n${JSON.stringify(validatedArgs.parameters, null, 2)}\n\`\`\`\n\n` +
              `**Resposta:**\n` +
              `\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\``,
          },
          {
            type: "text",
            text: `Dados completos da resposta: ${JSON.stringify(result, null, 2)}`,
          },
        ],
      };

    } catch (error: unknown) {
      console.error("[Webhook] Erro:", error);

      let errorMessage = "Erro desconhecido";
      let errorDetails = {};

      if (axios.isAxiosError(error)) {
        errorMessage = `Erro HTTP: ${error.message}`;
        errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        };
      } else if (error instanceof z.ZodError) {
        errorMessage = "Erro de validação dos parâmetros";
        errorDetails = {
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        content: [
          {
            type: "text",
            text: `❌ Erro ao enviar webhook!\n\n` +
              `**Erro:** ${errorMessage}\n\n` +
              `**Detalhes:**\n` +
              `\`\`\`json\n${JSON.stringify(errorDetails, null, 2)}\n\`\`\``,
          },
        ],
        isError: true,
      };
    }
  }
);

// Conectar o servidor ao transporte stdio
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Webhook MCP Server rodando no stdio");
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on("SIGINT", async () => {
  console.error("Recebido SIGINT, encerrando servidor...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Recebido SIGTERM, encerrando servidor...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
}); 