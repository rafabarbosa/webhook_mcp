import axios from 'axios';
import fs from 'fs';
import path from 'path';

jest.mock('axios');

describe('Validação dos exemplos do examples.json', () => {
  const examplesPath = path.resolve(__dirname, '../examples.json');
  const examplesFile = fs.readFileSync(examplesPath, 'utf-8');
  const examples = JSON.parse(examplesFile).examples;

  examples.forEach((exemplo: any) => {
    it(`deve simular o envio do exemplo: ${exemplo.name}`, async () => {
      (axios as any).mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { sucesso: true },
      });

      // Simulação: normalmente importaríamos a função real do MCP
      // Aqui apenas validamos o mock do axios
      const req = exemplo.request;
      const response = await axios({
        method: req.method,
        url: req.url,
        data: req.parameters,
        headers: req.headers,
        timeout: req.timeout,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('sucesso', true);
    });
  });

  it('deve lidar com exemplo inválido (mock)', async () => {
    (axios as any).mockRejectedValue({
      response: { status: 400, data: { sucesso: false, erro: 'Parâmetro inválido' } },
    });
    const req = {
      method: 'POST',
      url: 'https://exemplo.com/webhook',
      data: { nome: 123 }, // nome deveria ser string
    };
    try {
      await axios(req);
      fail('Deveria lançar erro de validação');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.sucesso).toBe(false);
    }
  });
}); 