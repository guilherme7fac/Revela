// /api/criar-pagamento.js
// Função serverless da Vercel — cria uma preferência de pagamento no Mercado Pago

export default async function handler(req, res) {
  // Permite CORS para chamadas do front-end
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { tipo, userId, email } = req.body;

    if (!tipo || !userId || !email) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Define o plano de acordo com o tipo de usuário
    const planos = {
      atleta: {
        titulo: 'Revela — Plano Atleta',
        descricao: 'Acesso completo à plataforma Revela para atletas',
        preco: 19.90
      },
      olheiro: {
        titulo: 'Revela — Plano Olheiro/Clube',
        descricao: 'Acesso completo ao banco de talentos Revela',
        preco: 300.00
      }
    };

    const plano = planos[tipo];
    if (!plano) {
      return res.status(400).json({ error: 'Tipo de plano inválido' });
    }

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    const preference = {
      items: [
        {
          title: plano.titulo,
          description: plano.descricao,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: plano.preco
        }
      ],
      payer: {
        email: email
      },
      back_urls: {
        success: `https://revela-eight.vercel.app/pagamento-sucesso.html?tipo=${tipo}`,
        failure: `https://revela-eight.vercel.app/pagamento-erro.html`,
        pending: `https://revela-eight.vercel.app/pagamento-pendente.html`
      },
      auto_return: 'approved',
      external_reference: userId,
      metadata: {
        user_id: userId,
        tipo_plano: tipo
      }
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data);
      return res.status(500).json({ error: 'Erro ao criar pagamento', details: data });
    }

    return res.status(200).json({
      init_point: data.init_point,
      preference_id: data.id
    });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
