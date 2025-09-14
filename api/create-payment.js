// /api/create-payment.js
export default async function handler(req, res) {
  // Permitir CORS simples (ajuste para produção)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ status: 'error', message: 'Access Token não configurado no servidor.' });
  }

  try {
    const paymentData = req.body || {};

    // Monta payload para a API do Mercado Pago
    const payload = {
      transaction_amount: Number(paymentData.transaction_amount || 0),
      description: 'Pedido ELETRO Supplier',
      payment_method_id: paymentData.payment_method_id || undefined,
      payer: {
        email: paymentData.payer?.email || paymentData.customerData?.email || 'no-email@example.com',
      },
      installments: Number(paymentData.installments || 1)
    };

    // token (cartão) se existir
    if (paymentData.token) payload.token = paymentData.token;

    // cpf -> payer.identification
    if (paymentData.customerData && paymentData.customerData.cpf) {
      payload.payer.identification = {
        type: 'CPF',
        number: String(paymentData.customerData.cpf).replace(/\D/g, '')
      };
    }

    // Faz a chamada à API do Mercado Pago
    const MP_API = 'https://api.mercadopago.com/v1/payments';
    const mpResp = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentData.idempotencyKey || ''
      },
      body: JSON.stringify(payload)
    });

    const data = await mpResp.json();

    if (!mpResp.ok) {
      console.error('Erro da API Mercado Pago:', data);
      return res.status(mpResp.status || 400).json({ status: 'error', data });
    }

    // Sucesso
    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    console.error('Erro interno do servidor:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
  }
}
