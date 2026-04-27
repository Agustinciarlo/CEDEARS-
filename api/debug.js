export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { ticker = 'SPY' } = req.query;
  const sym = ticker.toUpperCase().trim();
  const results = {};

  // Test 1: Ambito
  try {
    const r = await fetch(`https://mercados.ambito.com/cedear/${sym}/ajax`, {
      headers: { 'Referer': 'https://www.ambito.com/', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await r.text();
    results.ambito = { status: r.status, body: text.slice(0, 500) };
  } catch(e) { results.ambito = { error: e.message }; }

  // Test 2: Rava
  try {
    const r = await fetch(`https://www.rava.com/perfil/cotizacion.php?e=${sym}&json=1`, {
      headers: { 'Referer': 'https://www.rava.com/', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await r.text();
    results.rava = { status: r.status, body: text.slice(0, 500) };
  } catch(e) { results.rava = { error: e.message }; }

  // Test 3: Bluelytics (para verificar que el proxy funciona en general)
  try {
    const r = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const text = await r.text();
    results.bluelytics = { status: r.status, body: text.slice(0, 200) };
  } catch(e) { results.bluelytics = { error: e.message }; }

  res.status(200).json(results);
}
