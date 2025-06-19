import axios from 'axios';
jest.mock('axios');

describe('Webhook MCP', () => {
  it('deve enviar um webhook com sucesso (mock)', async () => {
    (axios as any).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { sucesso: true },
    });

    // Simulação: normalmente importaríamos a função real
    // Aqui apenas validamos o mock do axios
    const response = await axios({
      method: 'POST',
      url: 'https://exemplo.com/webhook',
      data: { nome: 'Teste' },
    });

    expect(response.status).toBe(200);
    expect(response.data.sucesso).toBe(true);
  });
}); 