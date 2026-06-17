const { MercadoPagoConfig, Preference } = require('mercadopago');

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { professionalId, serviceLevel, agreedPrice,
          clientName, clientEmail, clientPhone,
          eventDate, eventDescription } = req.body;

  try {
    const preference = await new Preference(mp).create({
      body: {
        items: [{
          title: `BitaHub — Segurança ${serviceLevel}`,
          unit_price: Number(agreedPrice),
          quantity: 1,
          currency_id: 'BRL'
        }],
        payer: { name: clientName, email: clientEmail },
        back_urls: {
          success: 'https://bitahub.vercel.app/sucesso.html',
          failure: 'https://bitahub.vercel.app/erro.html',
          pending: 'https://bitahub.vercel.app/pendente.html'
        },
        auto_return: 'approved',
        notification_url: 'https://bitahub.vercel.app/api/mp-webhook',
        external_reference: `${professionalId}|${clientPhone}|${eventDate}`,
        statement_descriptor: 'BITAHUB SEGURANCA'
      }
    });

    res.status(200).json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
