exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { status: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.BOTWA_API_KEY;
  if (!apiKey) {
    return json(500, { status: false, error: 'BOTWA_API_KEY belum dikonfigurasi di Netlify.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { status: false, error: 'Body JSON tidak valid.' }); }

  const url = String(body.url || '').trim();
  const emojis = Array.isArray(body.emojis) ? [...new Set(body.emojis.map(String).map(s => s.trim()).filter(Boolean))] : [];
  if (!/^https?:\/\/((www\.)?whatsapp\.com|wa\.me)\/channel\//i.test(url)) {
    return json(400, { status: false, error: 'Masukkan URL WhatsApp Channel yang valid.' });
  }
  if (!emojis.length || emojis.length > 5) {
    return json(400, { status: false, error: 'Pilih 1 sampai 5 emoji per permintaan.' });
  }

  try {
    const upstream = await fetch('https://react.botwa.net/api/react', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ url, emojis })
    });
    const text = await upstream.text();
    let data; try { data = JSON.parse(text); } catch { data = { status: false, error: text || 'Respons API tidak valid.' }; }
    return json(upstream.status, data);
  } catch (error) {
    return json(502, { status: false, error: 'Gagal terhubung ke BotWA API.', detail: error.message });
  }
};
function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) };
      }
