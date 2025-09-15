// /api/create-payment.js
export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições do seu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Requisição pre-flight do navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aceitar apenas o método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    console.error("ERRO GRAVE: MP_ACCESS_TOKEN não está definido no ambiente.");
    return res.status(500).json({ status: 'error', message: 'Access Token não configurado no servidor.' });
  }

  try {
    const paymentData = req.body || {};
    const customerData = paymentData.customerData || {};

    // Validação dos dados essenciais recebidos do frontend
    if (!paymentData.transaction_amount || !customerData.email || !customerData.cpf || !customerData.name) {
        return res.status(400).json({ status: 'error', message: 'Dados insuficientes para gerar o pagamento. Nome, e-mail, CPF e valor são obrigatórios.' });
    }

    // Monta o payload para a API do Mercado Pago, especificamente para PIX
    const payload = {
      transaction_amount: Number(paymentData.transaction_amount),
      description: 'Pedido ELETRO Supplier',
      payment_method_id: 'pix', // Fixo para PIX
      payer: {
        email: customerData.email,
        first_name: customerData.name.split(' ')[0],
        last_name: customerData.name.split(' ').slice(1).join(' ') || customerData.name.split(' ')[0], // Garante que não seja vazio
        identification: {
          type: 'CPF',
          number: String(customerData.cpf).replace(/\D/g, '') // Remove caracteres não numéricos do CPF
        }
      }
    };

    // Faz a chamada à API do Mercado Pago
    const MP_API_URL = 'https://api.mercadopago.com/v1/payments';
    const mpResponse = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        // Chave de idempotência para evitar pagamentos duplicados em caso de falha de rede
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(payload)
    });

    const responseData = await mpResponse.json();

    // Se a resposta do Mercado Pago não for bem-sucedida
    if (!mpResponse.ok) {
      console.error('Erro da API Mercado Pago:', responseData);
      return res.status(mpResponse.status || 400).json({ status: 'error', data: responseData });
    }

    // Sucesso: retorna os dados do pagamento, que incluem o QR Code para o frontend
    return res.status(200).json({ status: 'success', data: responseData });

  } catch (err) {
    console.error('Erro interno do servidor:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
  }
}