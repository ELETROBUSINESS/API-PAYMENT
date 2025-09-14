// /api/webhook.js
export default async function handler(req, res) {
  // Para testes, apenas registra o body
  console.log('Webhook Mercado Pago - recebemos:', req.method, req.headers, req.body);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Aqui: verificar cabeçalhos de segurança do Mercado Pago (em produção)
  // Persistir evento em banco/planilha conforme seu fluxo
  res.status(200).json({ received: true });
}
