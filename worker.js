// worker.js — Medyumistik fal sitesi
// Ziyaretçi kaydı, giriş/fal kaydı, IP ban, bot ayıklama, /yonetim paneli
// Gerekenler: KV binding "ZIYARET", gizli değişken "ADMIN_KEY"

const LOG_GUN = 7; // sayfa açılışı kayıtları kaç gün saklansın
const OLAY_GUN = 30; // giriş ve fal kayıtları kaç gün saklansın
const TR_SAAT = 3 * 3600 * 1000; // Türkiye UTC+3

const VARSAYILAN_AYAR = {
  banBaslik: "Erişim Engellendi",
  banMesaj: "Bu siteye erişimin kısıtlandı.",
  banLogo: true,
  botEngel: false,
};

const ONIZLEME_BOT = /facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|vkshare|viber/i;
const BOT = /bot\b|bot\/|crawl|spider|slurp|curl|wget|python|httpclient|java\/|go-http|axios|node-fetch|undici|headless|phantom|scrapy|okhttp|libwww|monitor|uptime|lighthouse|semrush|ahrefs|bytespider|gptbot|claudebot|perplexity|dataprovider|zgrab|masscan|nmap/i;

const LOGO = "data:image/jpeg;base64,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";

export default {
  async fetch(request, env, ctx) {
    try {
      return await anaIstek(request, env, ctx);
    } catch (e) {
      // Bir hata olursa site yine de açılsın
      return env.ASSETS.fetch(request);
    }
  },
};

async function anaIstek(request, env, ctx) {
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") || "bilinmiyor";
  const ua = request.headers.get("user-agent") || "";

  if (url.pathname === "/yonetim") return yonetim(request, url, env);

  const ayar = await ayarlar(env);

  // Banlı mı?
  if (await env.ZIYARET.get("ban:" + ip)) return banSayfasi(ayar);

  // Bot mu?
  const bot = botTuru(ua);
  if (ayar.botEngel && (bot === "bot" || bot === "bos")) return banSayfasi(ayar);

  // Sayfadan gelen giriş / fal kaydı
  if (url.pathname === "/api/olay") return olayKaydet(request, url, env, ip, ua);

  // Sadece sayfa açılışlarını kaydet (resim/css/js değil)
  const accept = request.headers.get("accept") || "";
  if (request.method === "GET" && (accept.includes("text/html") || bot)) {
    const cf = request.cf || {};
    const c = cihazBilgisi(ua);
    const meta = {
      ip,
      ulke: cf.country || "",
      sehir: cf.city || "",
      yol: url.pathname.slice(0, 80),
      ref: kaynak(request.headers.get("referer") || ""),
      cihaz: c.cihaz,
      os: c.os,
      tr: c.tarayici,
      bot: bot || "",
      ua: ua.slice(0, 160),
      z: Date.now(),
    };
    ctx.waitUntil(
      env.ZIYARET.put(anahtar("log"), "", { metadata: sigdir(meta, "ua"), expirationTtl: LOG_GUN * 86400 }).catch(() => {})
    );
  }

  return env.ASSETS.fetch(request);
}

/* ---------------- Yardımcılar ---------------- */

function anahtar(onEk) {
  return onEk + ":" + String(9999999999999 - Date.now()).padStart(13, "0") + ":" + Math.random().toString(36).slice(2, 6);
}

// KV metadata en fazla 1024 bayt olabilir; uzun alanı kısalt
function sigdir(meta, alan) {
  const enc = new TextEncoder();
  while (enc.encode(JSON.stringify(meta)).length > 1000 && meta[alan]) {
    meta[alan] = meta[alan].slice(0, Math.floor(meta[alan].length * 0.8));
  }
  return meta;
}

let ayarOnbellek = { t: 0, v: null };
async function ayarlar(env, taze) {
  if (!taze && ayarOnbellek.v && Date.now() - ayarOnbellek.t < 30000) return ayarOnbellek.v;
  let v = {};
  try {
    v = JSON.parse((await env.ZIYARET.get("ayar")) || "{}");
  } catch (e) {}
  ayarOnbellek = { t: Date.now(), v: { ...VARSAYILAN_AYAR, ...v } };
  return ayarOnbellek.v;
}

function botTuru(ua) {
  if (!ua) return "bos";
  if (ONIZLEME_BOT.test(ua)) return "onizleme";
  if (BOT.test(ua)) return "bot";
  return null;
}

function cihazBilgisi(ua) {
  let cihaz = "Bilgisayar";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) cihaz = "Tablet";
  else if (/Mobi|iPhone|iPod|Android/i.test(ua)) cihaz = "Telefon";

  let os = "Diğer";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "Mac";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let tarayici = "Diğer";
  if (/Instagram/i.test(ua)) tarayici = "Instagram";
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) tarayici = "Facebook";
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) tarayici = "TikTok";
  else if (/Edg\//i.test(ua)) tarayici = "Edge";
  else if (/SamsungBrowser/i.test(ua)) tarayici = "Samsung";
  else if (/OPR\/|Opera/i.test(ua)) tarayici = "Opera";
  else if (/YaBrowser/i.test(ua)) tarayici = "Yandex";
  else if (/Firefox|FxiOS/i.test(ua)) tarayici = "Firefox";
  else if (/Chrome|CriOS/i.test(ua)) tarayici = "Chrome";
  else if (/Safari/i.test(ua)) tarayici = "Safari";

  return { cihaz, os, tarayici };
}

function kaynak(ref) {
  if (!ref) return "";
  try {
    return new URL(ref).hostname.replace(/^www\./, "").slice(0, 60);
  } catch (e) {
    return ref.slice(0, 60);
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function gun(z) {
  return new Date(z + TR_SAAT).toISOString().slice(0, 10);
}

function tarih(z) {
  return new Date(z).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function html(govde, durum = 200) {
  return new Response(govde, {
    status: durum,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

/* ---------------- Giriş / fal kaydı ---------------- */

async function olayKaydet(request, url, env, ip, ua) {
  if (request.method !== "POST") return new Response("", { status: 405 });
  const origin = request.headers.get("origin");
  let ayniSite = true;
  try {
    if (origin) ayniSite = new URL(origin).host === url.host;
  } catch (e) {
    ayniSite = false;
  }
  if (!ayniSite) return new Response("", { status: 403 });

  const metin = await request.text();
  if (metin.length > 4000) return new Response("", { status: 413 });
  let d;
  try {
    d = JSON.parse(metin);
  } catch (e) {
    return new Response("", { status: 400 });
  }
  if (d.tip !== "giris" && d.tip !== "fal") return new Response("", { status: 400 });

  const cf = request.cf || {};
  const c = cihazBilgisi(ua);
  const kisa = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const meta = {
    tip: d.tip,
    ad: kisa(d.ad, 60),
    dogum: kisa(d.dogum, 12),
    mod: kisa(d.mod, 24),
    acilim: kisa(d.acilim, 40),
    kartlar: kisa(d.kartlar, 400),
    ip,
    sehir: cf.city || "",
    cihaz: c.cihaz,
    os: c.os,
    z: Date.now(),
  };
  await env.ZIYARET.put(anahtar("olay"), "", { metadata: sigdir(meta, "kartlar"), expirationTtl: OLAY_GUN * 86400 });
  return new Response(null, { status: 204 });
}

/* ---------------- Ban sayfası ---------------- */

function banSayfasi(ayar) {
  const logo = ayar.banLogo ? `<img class="logo" src="${LOGO}" alt="Medyumistik">` : "";
  return html(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(ayar.banBaslik)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:ital@0;1&display=swap" rel="stylesheet">
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
background:radial-gradient(ellipse at 50% -10%,#1a120a 0%,transparent 55%),#070504;color:#f2e8d5;font-family:'EB Garamond',serif;text-align:center}
.kutu{max-width:440px;padding:40px 28px;border:1px solid rgba(201,162,75,.28);border-radius:18px;background:rgba(12,9,6,.75)}
.logo{width:110px;height:110px;border-radius:50%;border:1px solid #c9a24b;object-fit:cover;margin-bottom:18px}
h1{font-family:'Cinzel',serif;color:#e6c477;font-size:24px;letter-spacing:.06em;margin:0 0 14px}
p{font-size:19px;line-height:1.5;color:#b9a17d;margin:0;white-space:pre-line}
.cizgi{height:1px;background:linear-gradient(90deg,transparent,#c9a24b,transparent);margin:20px 0}
small{font-family:'Cinzel',serif;font-size:11px;letter-spacing:.3em;color:#8a6f36}
</style></head><body><div class="kutu">${logo}<h1>${esc(ayar.banBaslik)}</h1><p>${esc(ayar.banMesaj)}</p>
<div class="cizgi"></div><small>MEDYUMİSTİK</small></div></body></html>`,
    403
  );
}

/* ---------------- Yönetim paneli ---------------- */

async function yonetim(request, url, env) {
  if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
    return new Response("Not found", { status: 404 });
  }
  const k = encodeURIComponent(env.ADMIN_KEY);
  const sekme = url.searchParams.get("s") || "ozet";
  const adres = (s, ek = "") => `/yonetim?key=${k}&s=${s}${ek}`;
  const geri = () => Response.redirect(url.origin + adres(sekme), 302);

  // İşlemler
  const ban = (url.searchParams.get("ban") || "").trim();
  const kaldir = (url.searchParams.get("kaldir") || "").trim();
  if (ban) {
    const not = (url.searchParams.get("not") || "").slice(0, 80);
    await env.ZIYARET.put("ban:" + ban, "1", { metadata: { not, z: Date.now() } });
    return geri();
  }
  if (kaldir) {
    await env.ZIYARET.delete("ban:" + kaldir);
    return geri();
  }
  if (request.method === "POST" && sekme === "ayarlar") {
    const f = await request.formData();
    const yeni = {
      banBaslik: String(f.get("banBaslik") || VARSAYILAN_AYAR.banBaslik).slice(0, 80),
      banMesaj: String(f.get("banMesaj") || VARSAYILAN_AYAR.banMesaj).slice(0, 500),
      banLogo: f.get("banLogo") === "1",
      botEngel: f.get("botEngel") === "1",
    };
    await env.ZIYARET.put("ayar", JSON.stringify(yeni));
    await ayarlar(env, true);
    return Response.redirect(url.origin + adres("ayarlar", "&kaydedildi=1"), 302);
  }

  const ayar = await ayarlar(env, true);
  if (sekme === "onizle") return banSayfasi(ayar);

  const [logR, olayR, banR] = await Promise.all([
    env.ZIYARET.list({ prefix: "log:", limit: 1000 }),
    env.ZIYARET.list({ prefix: "olay:", limit: 1000 }),
    env.ZIYARET.list({ prefix: "ban:" }),
  ]);
  const loglar = logR.keys.map((x) => x.metadata || {}).filter((m) => m.z);
  const olaylar = olayR.keys.map((x) => x.metadata || {}).filter((m) => m.z);
  const banlar = banR.keys.map((x) => ({ ip: x.name.slice(4), ...(x.metadata || {}) }));
  const banSet = new Set(banlar.map((b) => b.ip));

  // IP → ad soyad (en son girilen)
  const adlar = {};
  for (const o of olaylar) if (o.ad && !adlar[o.ip]) adlar[o.ip] = o.ad;

  const banBtn = (ip, kucuk) =>
    banSet.has(ip)
      ? `<a class="b ok" href="${adres(sekme, "&kaldir=" + encodeURIComponent(ip))}">Banı kaldır</a>`
      : `<a class="b" href="${adres(sekme, "&ban=" + encodeURIComponent(ip) + (adlar[ip] ? "&not=" + encodeURIComponent(adlar[ip]) : ""))}" onclick="return confirm('${esc(adlar[ip] || ip).replace(/&#39;/g, "")} banlansın mı?')">Banla</a>`;

  let icerik = "";
  if (sekme === "fallar") icerik = sekmeFallar(olaylar, banSet, banBtn);
  else if (sekme === "ziyaretci") icerik = sekmeZiyaretci(loglar, adlar, banSet, banBtn, url.searchParams.get("bots") === "1", adres);
  else if (sekme === "ayarlar") icerik = sekmeAyarlar(ayar, banlar, adlar, k, adres, url.searchParams.get("kaydedildi"));
  else icerik = sekmeOzet(loglar, olaylar, banlar);

  const sekmeler = [
    ["ozet", "Özet"],
    ["fallar", "Fallar"],
    ["ziyaretci", "Ziyaretçiler"],
    ["ayarlar", "Ayarlar & Ban"],
  ]
    .map(([s, ad]) => `<a href="${adres(s)}" class="${s === sekme ? "aktif" : ""}">${ad}</a>`)
    .join("");

  return html(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Medyumistik Panel</title>
<style>
:root{--bg:#0d0a07;--kart:#16110b;--cizgi:#2e2416;--altin:#c9a24b;--altin2:#e6c477;--yazi:#efe6d6;--soluk:#9c8b70;--kirmizi:#c8453a;--yesil:#3f9a6b}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:var(--bg);color:var(--yazi);font-size:14px}
header{padding:16px;border-bottom:1px solid var(--cizgi);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
header b{color:var(--altin2);letter-spacing:.12em;font-size:15px}
nav{display:flex;gap:6px;flex-wrap:wrap}
nav a{color:var(--soluk);text-decoration:none;padding:7px 12px;border-radius:8px;border:1px solid var(--cizgi)}
nav a.aktif{background:var(--altin);color:#140e07;border-color:var(--altin);font-weight:600}
main{padding:16px;max-width:1200px;margin:0 auto}
h2{font-size:15px;color:var(--altin2);margin:22px 0 10px;font-weight:600}
.kartlar{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.kart{background:var(--kart);border:1px solid var(--cizgi);border-radius:12px;padding:14px}
.kart .s{font-size:26px;font-weight:700;color:var(--altin2)}
.kart .e{color:var(--soluk);font-size:12px;margin-top:2px}
.izgara{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.cubuk{display:grid;grid-template-columns:96px 1fr 64px;gap:8px;align-items:center;margin:6px 0;font-size:13px}
.cubuk .yol{background:#221a10;border-radius:5px;height:12px;overflow:hidden}
.cubuk .dolu{background:var(--altin);height:100%;border-radius:5px}
.cubuk .n{text-align:right;color:var(--soluk)}
.gunler{display:flex;align-items:flex-end;gap:6px;height:120px;padding-top:8px}
.gunler div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px;color:var(--soluk)}
.gunler span{display:block;width:100%;background:var(--altin);border-radius:4px 4px 0 0;min-height:2px}
.kutu{overflow-x:auto;background:var(--kart);border:1px solid var(--cizgi);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:13px}
td,th{border-bottom:1px solid var(--cizgi);padding:8px;vertical-align:top;text-align:left}
th{color:var(--soluk);font-weight:500;white-space:nowrap}
tr.banli{background:rgba(200,69,58,.12)}
tr.bot{opacity:.55}
small,.soluk{color:var(--soluk)}
.ad{color:var(--altin2);font-weight:600}
.etiket{display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;border:1px solid var(--cizgi);color:var(--soluk);margin:1px 2px 1px 0}
.etiket.t{border-color:#6a5326;color:var(--altin2)}
.etiket.k{border-color:#6b2f3a;color:#e39aa6}
.etiket.r{border-color:#7a2a24;color:#ff9b8f}
.b{display:inline-block;padding:4px 9px;background:var(--kirmizi);color:#fff;border-radius:6px;text-decoration:none;white-space:nowrap;font-size:12px}
.b.ok{background:var(--yesil)}
form.ayar label{display:block;margin:12px 0 4px;color:var(--soluk)}
input[type=text],textarea{width:100%;max-width:520px;padding:9px;border-radius:8px;border:1px solid var(--cizgi);background:#0a0805;color:var(--yazi);font:inherit}
textarea{min-height:80px}
.secim{display:flex;gap:8px;align-items:center;margin:12px 0;color:var(--yazi)}
button{padding:9px 16px;border-radius:8px;border:0;background:var(--altin);color:#140e07;font-weight:600;cursor:pointer;font:inherit}
.bilgi{background:#1c160d;border:1px solid #4a3b1e;border-radius:10px;padding:10px 12px;color:#d9c79f;margin:10px 0}
a{color:var(--altin2)}
</style></head><body>
<header><b>MEDYUMİSTİK · PANEL</b><nav>${sekmeler}</nav></header>
<main>${icerik}</main></body></html>`);
}

function cubuklar(sayac, toplam, renk) {
  const sirali = Object.entries(sayac).sort((a, b) => b[1] - a[1]);
  if (!sirali.length) return `<p class="soluk">Henüz veri yok</p>`;
  return sirali
    .map(([ad, n]) => {
      const yuzde = toplam ? Math.round((n / toplam) * 100) : 0;
      return `<div class="cubuk"><span>${esc(ad)}</span><div class="yol"><div class="dolu" style="width:${yuzde}%${renk ? ";background:" + renk : ""}"></div></div><span class="n">${n} · %${yuzde}</span></div>`;
    })
    .join("");
}

function say(dizi, alan) {
  const s = {};
  for (const x of dizi) {
    const v = x[alan] || "Bilinmiyor";
    s[v] = (s[v] || 0) + 1;
  }
  return s;
}

function sekmeOzet(loglar, olaylar, banlar) {
  const bugun = gun(Date.now());
  const insan = loglar.filter((m) => !m.bot);
  const botlar = loglar.filter((m) => m.bot);
  const bugunInsan = insan.filter((m) => gun(m.z) === bugun);
  const fallar = olaylar.filter((o) => o.tip === "fal");
  const girisler = olaylar.filter((o) => o.tip === "giris");
  const bugunFal = fallar.filter((o) => gun(o.z) === bugun);
  const bugunGiris = girisler.filter((o) => gun(o.z) === bugun);

  // Son 7 gün
  const gunSay = [];
  for (let i = 6; i >= 0; i--) {
    const g = gun(Date.now() - i * 86400000);
    gunSay.push([g, insan.filter((m) => gun(m.z) === g).length, fallar.filter((o) => gun(o.z) === g).length]);
  }
  const enCok = Math.max(1, ...gunSay.map((x) => x[1]));
  const gunlerHtml = gunSay
    .map(
      ([g, n, f]) =>
        `<div title="${n} ziyaret, ${f} fal"><small>${n}</small><span style="height:${Math.round((n / enCok) * 90)}%"></span>${g.slice(8)}.${g.slice(5, 7)}</div>`
    )
    .join("");

  // Cihaz dağılımı: her IP bir kez sayılır
  const tekil = {};
  for (const m of insan) if (!tekil[m.ip]) tekil[m.ip] = m;
  const kisiler = Object.values(tekil);

  // Fal davranışı
  const modSay = say(fallar, "mod");
  const acilimSay = say(fallar, "acilim");
  const kartSay = {};
  for (const o of fallar) {
    for (const parca of (o.kartlar || "").split("|")) {
      let ad = parca.trim().replace(/^(Geçmiş|Şimdi|Gelecek|Kart \d):\s*/, "");
      ad = ad.replace(/\s*\((Düz|Ters)\)\s*$/, "").replace(/^Katina\s*—\s*/, "").trim();
      if (ad) kartSay[ad] = (kartSay[ad] || 0) + 1;
    }
  }
  const ilkKart = Object.entries(kartSay).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const kisiFal = {};
  for (const o of fallar) {
    const ad = o.ad || o.ip;
    kisiFal[ad] = (kisiFal[ad] || 0) + 1;
  }
  const ilkKisi = Object.entries(kisiFal).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const girenKisi = new Set(girisler.map((o) => o.ip)).size;
  const falBakanKisi = new Set(fallar.map((o) => o.ip)).size;

  const kart = (s, e) => `<div class="kart"><div class="s">${s}</div><div class="e">${e}</div></div>`;

  return `
<div class="kartlar">
${kart(bugunInsan.length, "Bugün ziyaret")}
${kart(new Set(bugunInsan.map((m) => m.ip)).size, "Bugün tekil kişi")}
${kart(bugunGiris.length, "Bugün ad soyad giren")}
${kart(bugunFal.length, "Bugün bakılan fal")}
${kart(insan.length, `Son ${LOG_GUN} gün ziyaret`)}
${kart(botlar.length, `Son ${LOG_GUN} gün bot isteği`)}
${kart(banlar.length, "Banlı IP")}
</div>

<h2>Son 7 gün ziyaret</h2>
<div class="kart"><div class="gunler">${gunlerHtml}</div></div>

<h2>Cihaz dağılımı <small>(son ${LOG_GUN} gün, ${kisiler.length} tekil kişi)</small></h2>
<div class="izgara">
<div class="kart"><b>Cihaz</b>${cubuklar(say(kisiler, "cihaz"), kisiler.length)}</div>
<div class="kart"><b>İşletim sistemi</b>${cubuklar(say(kisiler, "os"), kisiler.length)}</div>
<div class="kart"><b>Tarayıcı / uygulama</b>${cubuklar(say(kisiler, "tr"), kisiler.length)}</div>
<div class="kart"><b>Nereden geldi</b>${cubuklar(say(kisiler.map((m) => ({ ref: m.ref || "Direkt link" })), "ref"), kisiler.length)}</div>
</div>

<h2>Fal davranışı <small>(son ${OLAY_GUN} gün)</small></h2>
<div class="kartlar">
${kart(girisler.length, "Ad soyad girişi")}
${kart(fallar.length, "Tamamlanan fal")}
${kart(girenKisi ? "%" + Math.round((falBakanKisi / girenKisi) * 100) : "-", "Giriş yapıp fal bakan")}
${kart(falBakanKisi ? (fallar.length / falBakanKisi).toFixed(1) : "-", "Kişi başı fal")}
</div>
<div class="izgara" style="margin-top:12px">
<div class="kart"><b>Fal türü</b>${cubuklar(modSay, fallar.length)}</div>
<div class="kart"><b>Açılım</b>${cubuklar(acilimSay, fallar.length)}</div>
<div class="kart"><b>En çok çıkan kartlar</b>${cubuklar(Object.fromEntries(ilkKart), fallar.length)}</div>
<div class="kart"><b>En çok fal bakanlar</b>${cubuklar(Object.fromEntries(ilkKisi), fallar.length)}</div>
</div>`;
}

function sekmeFallar(olaylar, banSet, banBtn) {
  if (!olaylar.length) return `<p class="soluk">Henüz giriş veya fal kaydı yok. Biri ad soyad girip fal baktığında burada görünecek.</p>`;
  const satir = olaylar
    .map((o) => {
      const tur =
        o.tip === "fal"
          ? `<span class="etiket ${/Katina/i.test(o.mod) ? "k" : "t"}">${esc(o.mod)}</span><br><small>${esc(o.acilim)}</small>`
          : `<span class="etiket">Giriş yaptı</span>`;
      const kartlar = o.tip === "fal" ? (o.kartlar || "").split("|").map((x) => `<div>${esc(x.trim())}</div>`).join("") : "";
      return `<tr${banSet.has(o.ip) ? ' class="banli"' : ""}>
<td>${esc(tarih(o.z))}</td>
<td><span class="ad">${esc(o.ad) || "<small>—</small>"}</span><br><small>${esc(o.dogum)}</small></td>
<td>${tur}</td>
<td>${kartlar}</td>
<td><small>${esc(o.cihaz)} · ${esc(o.os)}<br>${esc(o.sehir)}</small></td>
<td><small>${esc(o.ip)}</small><br>${banBtn(o.ip)}</td></tr>`;
    })
    .join("");
  return `<h2>Giriş ve fal kayıtları <small>(${olaylar.length}, son ${OLAY_GUN} gün)</small></h2>
<div class="kutu"><table><tr><th>Zaman</th><th>Ad Soyad</th><th>Tür</th><th>Kartlar</th><th>Cihaz</th><th>IP</th></tr>${satir}</table></div>`;
}

function sekmeZiyaretci(loglar, adlar, banSet, banBtn, botGoster, adres) {
  const liste = botGoster ? loglar : loglar.filter((m) => !m.bot);
  const botSayi = loglar.length - loglar.filter((m) => !m.bot).length;
  const ipSay = {};
  for (const m of loglar) ipSay[m.ip] = (ipSay[m.ip] || 0) + 1;
  const satir = liste
    .slice(0, 400)
    .map((m) => {
      const sinif = [banSet.has(m.ip) ? "banli" : "", m.bot ? "bot" : ""].join(" ").trim();
      const botEt = m.bot ? `<span class="etiket r">${m.bot === "onizleme" ? "link önizleme" : m.bot === "bos" ? "tarayıcısız" : "bot"}</span>` : "";
      return `<tr${sinif ? ` class="${sinif}"` : ""}>
<td>${esc(tarih(m.z))}</td>
<td>${adlar[m.ip] ? `<span class="ad">${esc(adlar[m.ip])}</span><br>` : ""}<small>${esc(m.ip)} · ${ipSay[m.ip]} giriş</small></td>
<td>${esc(m.ulke)} ${esc(m.sehir)}</td>
<td>${esc(m.yol)}${m.ref ? `<br><small>${esc(m.ref)}</small>` : ""}</td>
<td>${botEt}<small>${esc(m.cihaz || "")} · ${esc(m.os || "")} · ${esc(m.tr || "")}</small><br><small style="font-size:11px">${esc(m.ua)}</small></td>
<td>${banBtn(m.ip)}</td></tr>`;
    })
    .join("");
  const botLink = botGoster
    ? `<a href="${adres("ziyaretci")}">Botları gizle</a>`
    : `<a href="${adres("ziyaretci", "&bots=1")}">Botları da göster (${botSayi})</a>`;
  return `<h2>Son girişler <small>(${liste.length})</small> · ${botLink}</h2>
<div class="kutu"><table><tr><th>Zaman</th><th>Kişi / IP</th><th>Yer</th><th>Sayfa / kaynak</th><th>Cihaz</th><th></th></tr>${satir || '<tr><td colspan="6" class="soluk">Henüz kayıt yok</td></tr>'}</table></div>`;
}

function sekmeAyarlar(ayar, banlar, adlar, k, adres, kaydedildi) {
  const banListe = banlar.length
    ? banlar
        .map(
          (b) =>
            `<tr><td>${esc(b.ip)}</td><td>${esc(b.not || adlar[b.ip] || "")}</td><td><small>${b.z ? esc(tarih(b.z)) : ""}</small></td><td><a class="b ok" href="${adres("ayarlar", "&kaldir=" + encodeURIComponent(b.ip))}">Kaldır</a></td></tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="soluk">Henüz banlı IP yok</td></tr>`;
  return `${kaydedildi ? '<div class="bilgi">Ayarlar kaydedildi. Değişikliğin her yerde geçerli olması 30 saniye kadar sürebilir.</div>' : ""}
<h2>Ban sayfası</h2>
<form class="ayar" method="post" action="${adres("ayarlar")}">
<label>Başlık</label><input type="text" name="banBaslik" value="${esc(ayar.banBaslik)}" maxlength="80">
<label>Mesaj</label><textarea name="banMesaj" maxlength="500">${esc(ayar.banMesaj)}</textarea>
<div class="secim"><input type="checkbox" id="banLogo" name="banLogo" value="1"${ayar.banLogo ? " checked" : ""}><label for="banLogo" style="margin:0">Medyumistik logosunu göster</label></div>
<h2>Bot koruması</h2>
<div class="secim"><input type="checkbox" id="botEngel" name="botEngel" value="1"${ayar.botEngel ? " checked" : ""}><label for="botEngel" style="margin:0">Botları ve tarayıcısız istekleri engelle</label></div>
<p class="soluk" style="max-width:560px">Google, arama botları, site tarayıcıları ve otomatik programlar ban sayfasını görür. WhatsApp, Instagram, Facebook ve Telegram'ın link önizlemeleri engellenmez, paylaştığın link yine resimli görünür. Bu açıkken Google'da aranınca çıkma ihtimalin azalır.</p>
<button type="submit">Kaydet</button> &nbsp; <a href="${adres("onizle")}" target="_blank">Ban sayfasını önizle ↗</a>
</form>

<h2>Elle IP banla</h2>
<form class="ayar" method="get" action="/yonetim">
<input type="hidden" name="key" value="${esc(decodeURIComponent(k))}"><input type="hidden" name="s" value="ayarlar">
<input type="text" name="ban" placeholder="IP adresi" style="max-width:240px"> <input type="text" name="not" placeholder="Not (isteğe bağlı)" style="max-width:240px"> <button>Banla</button>
</form>

<h2>Banlı IP'ler <small>(${banlar.length})</small></h2>
<div class="kutu"><table><tr><th>IP</th><th>Not</th><th>Tarih</th><th></th></tr>${banListe}</table></div>`;
}
