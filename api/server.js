import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Carrega as variáveis do arquivo .env

const app = express();

// Middlewares
app.use(cors()); // Habilita o CORS para todas as origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

const API_URL = 'https://api.mercadopago.com/v1/payments';
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// Rota para criar o pagamento
app.post('/api/create-payment', async (req, res) => {
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ status: 'error', message: 'Access Token não configurado no servidor.' });
  }

  try {
    const paymentData = req.body;

    const payload = {
      transaction_amount: Number(paymentData.transaction_amount),
      description: 'Pedido ELETRO Supplier',
      payment_method_id: paymentData.payment_method_id,
      payer: {
        email: paymentData.payer.email
      },
      installments: Number(paymentData.installments)
    };

    // Adiciona o token somente se ele existir (para pagamentos com cartão)
    if (paymentData.token) {
      payload.token = paymentData.token;
    }

    // Adiciona o CPF a partir dos dados do cliente
    if (paymentData.customerData && paymentData.customerData.cpf) {
      payload.payer.identification = {
        type: 'CPF',
        number: String(paymentData.customerData.cpf).replace(/\D/g, '')
      };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentData.idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API Mercado Pago:', data);
      return res.status(response.status).json({ status: 'error', data });
    }

    return res.status(200).json({ status: 'success', data });

  } catch (error) {
    console.error('Erro interno do servidor:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Rota para receber webhooks do Mercado Pago
app.post('/api/webhook', (req, res) => {
  const payment = req.body;
  console.log('Webhook recebido:', payment);
  // Aqui você adicionaria a lógica para salvar no banco de dados ou planilha
  res.status(200).send('Webhook recebido');
});

// Inicia o servidor (para teste local)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;