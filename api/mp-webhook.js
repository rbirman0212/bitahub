const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;
  if (type !== 'payment') return res.status(200).json({ ok: true });

  try {
    const payment = await new Payment(mp).get({ id: data.id });
    if (payment.status !== 'approved') return res.status(200).json({ ok: true });

    const ref = payment.external_reference || '';
    const [professionalId, clientPhone, eventDate] = ref.split('|');
    const gross = payment.transaction_amount;
    const fee = +(gross * 0.10).toFixed(2);
    const net = +(gross * 0.90).toFixed(2);

    await supabase.from('payments').insert({
      mp_payment_id: String(data.id),
      gross_amount: gross,
      platform_fee: fee,
      professional_net: net,
      status: 'approved',
      paid_at: new Date().toISOString(),
      raw_webhook: req.body
    });

    await supabase.from('bookings').insert({
      professional_id: professionalId,
      client_phone: clientPhone,
      event_date: eventDate,
      mp_payment_id: String(data.id),
      status: 'paid',
      agreed_price: gross
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
