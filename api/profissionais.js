const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('aprovado', true)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    res.status(200).json({ profissionais: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
