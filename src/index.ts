#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios, { AxiosRequestConfig, Method } from "axios";
import { z } from "zod";
import { URL } from 'url';

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

// Logger com níveis configuráveis
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'info';
function logger(level: string, ...args: any[]) {
  if (LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(CURRENT_LOG_LEVEL)) {
    const prefix = `[${level.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    console.log(prefix, ...args);
  }
}

// Função para validar se a URL está na whitelist
function isUrlAllowed(targetUrl: string): boolean {
  const whitelist = process.env.WHITELIST_URLS?.split(',').map(u => u.trim()).filter(Boolean) || [];
  if (whitelist.length === 0) return true; // Se não houver whitelist, permite tudo
  try {
    const urlObj = new URL(targetUrl);
    return whitelist.some(allowed => {
      // Permite por domínio ou URL exata
      return urlObj.hostname === allowed || urlObj.origin === allowed || urlObj.href.startsWith(allowed);
    });
  } catch {
    return false;
  }
}

// Função utilitária para delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para requisição com retentativas
async function requestWithRetry(config: any, maxAttempts: number, baseDelay: number, logger: typeof console.log) {
  let attempt = 0;
  let lastError;
  while (attempt < maxAttempts) {
    try {
      logger('info', `[Retry] Tentativa ${attempt + 1} de ${maxAttempts}`);
      return await axios(config);
    } catch (error: any) {
      lastError = error;
      const isRetryable = error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || (error.response && error.response.status >= 500);
      if (!isRetryable) throw error;
      attempt++;
      if (attempt < maxAttempts) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1);
        logger('warn', `[Retry] Falha temporária, aguardando ${delayMs}ms antes da próxima tentativa...`);
        await delay(delayMs);
      }
    }
  }
  throw lastError;
}

// Função para validar headers comuns
function validateHeaders(headers: Record<string, string> = {}): { valid: boolean, errors?: string[] } {
  const errors: string[] = [];
  if (headers['Authorization'] && !/^Bearer\s+\S+/.test(headers['Authorization'])) {
    errors.push('Authorization deve ser no formato: Bearer <token>');
  }
  if (headers['Content-Type'] && !/^application\/(json|x-www-form-urlencoded|xml)/.test(headers['Content-Type'])) {
    errors.push('Content-Type deve ser application/json, application/x-www-form-urlencoded ou application/xml');
  }
  return { valid: errors.length === 0, errors };
}

// Função utilitária de i18n
const messages = {
  pt: {
    webhookSuccess: '✅ Webhook enviado com sucesso!',
    details: 'Detalhes da Requisição:',
    paramsSent: 'Parâmetros Enviados:',
    response: 'Resposta:',
    error: '❌ Erro ao enviar webhook!',
    urlNotAllowed: '❌ URL não permitida pelo servidor (whitelist).\n\nConsulte o administrador para liberar o domínio ou URL desejada.',
    invalidHeaders: '❌ Header(s) inválido(s):',
    validationError: 'Erro de validação dos parâmetros',
    unknownError: 'Erro desconhecido',
  },
  en: {
    webhookSuccess: '✅ Webhook sent successfully!',
    details: 'Request Details:',
    paramsSent: 'Parameters Sent:',
    response: 'Response:',
    error: '❌ Error sending webhook!',
    urlNotAllowed: '❌ URL not allowed by server (whitelist).\n\nContact the administrator to allow the desired domain or URL.',
    invalidHeaders: '❌ Invalid header(s):',
    validationError: 'Parameter validation error',
    unknownError: 'Unknown error',
  }
};
function t(key: keyof typeof messages['pt']) {
  const lang = (process.env.LANG || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
  return messages[lang][key];
}

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

      // Validação da whitelist
      if (!isUrlAllowed(validatedArgs.url)) {
        return {
          content: [
            {
              type: "text",
              text: t('urlNotAllowed'),
            },
          ],
          isError: true,
        };
      }

      // Validação dos headers
      const headerValidation = validateHeaders(validatedArgs.headers);
      if (!headerValidation.valid) {
        return {
          content: [
            {
              type: "text",
              text: `${t('invalidHeaders')}\n\n${headerValidation.errors?.join('\n')}`,
            },
          ],
          isError: true,
        };
      }

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

      logger('info', `[Webhook] Enviando ${validatedArgs.method} para ${validatedArgs.url}`);
      logger('debug', `[Webhook] Parâmetros:`, JSON.stringify(validatedArgs.parameters, null, 2));

      // Fazer a requisição
      const startTime = Date.now();
      const maxAttempts = Number(process.env.RETRY_ATTEMPTS) || 1;
      const baseDelay = Number(process.env.RETRY_BASE_DELAY_MS) || 500;
      const response = await requestWithRetry(config, maxAttempts, baseDelay, logger);
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

      logger('info', `[Webhook] Sucesso! Status: ${response.status} (${duration}ms)`);

      return {
        content: [
          {
            type: "text",
            text: `${t('webhookSuccess')}\n\n` +
              `**${t('details')}**\n` +
              `- Método: ${validatedArgs.method}\n` +
              `- URL: ${validatedArgs.url}\n` +
              `- Status: ${response.status} ${response.statusText}\n` +
              `- Tempo: ${duration}ms\n\n` +
              `**${t('paramsSent')}**\n` +
              `\`\`\`json\n${JSON.stringify(validatedArgs.parameters, null, 2)}\n\`\`\`\n\n` +
              `**${t('response')}**\n` +
              `\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\``,
          },
          {
            type: "text",
            text: `Dados completos da resposta: ${JSON.stringify(result, null, 2)}`,
          },
        ],
      };

    } catch (error: unknown) {
      logger('error', '[Webhook] Erro:', error);

      let errorMessage = t('unknownError');
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
        errorMessage = t('validationError');
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
            text: `${t('error')}\n\n` +
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
    logger('info', 'Webhook MCP Server rodando no stdio');
  } catch (error) {
    logger('error', 'Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on("SIGINT", async () => {
  logger('warn', 'Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger('warn', 'Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

main().catch((error) => {
  logger('error', 'Erro fatal:', error);
  process.exit(1);
}); 