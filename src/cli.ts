#!/usr/bin/env node
import inquirer from 'inquirer';
import axios from 'axios';
import { z } from 'zod';

const WebhookRequestSchema = z.object({
  url: z.string().url('URL deve ser válida'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  parameters: z.string().optional(),
  headers: z.string().optional(),
  timeout: z.number().positive().optional().default(30000),
});

async function main() {
  const answers = await inquirer.prompt([
    { name: 'url', message: 'URL do webhook:', type: 'input' },
    { name: 'method', message: 'Método HTTP:', type: 'list', choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { name: 'parameters', message: 'Parâmetros (JSON, opcional):', type: 'input' },
    { name: 'headers', message: 'Headers (JSON, opcional):', type: 'input' },
    { name: 'timeout', message: 'Timeout (ms, opcional):', type: 'input', default: 30000 },
  ]);

  try {
    const parsed = WebhookRequestSchema.parse({
      ...answers,
      parameters: answers.parameters ? JSON.parse(answers.parameters) : {},
      headers: answers.headers ? JSON.parse(answers.headers) : {},
      timeout: Number(answers.timeout),
    });

    const config = {
      method: parsed.method.toLowerCase(),
      url: parsed.url,
      timeout: parsed.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...parsed.headers,
      },
    };
    if (['GET', 'DELETE'].includes(parsed.method)) {
      (config as any).params = parsed.parameters;
    } else {
      (config as any).data = parsed.parameters;
    }

    console.log('Enviando webhook...');
    const response = await axios(config);
    console.log('Status:', response.status, response.statusText);
    console.log('Resposta:', response.data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      console.error('Erro de validação:', err.errors);
    } else if (err.isAxiosError) {
      console.error('Erro HTTP:', err.message);
      if (err.response) {
        console.error('Resposta:', err.response.data);
      }
    } else {
      console.error('Erro:', err.message);
    }
  }
}

main(); 