// functions/_middleware.js
// Cloudflare Pages: ziyaretçi kaydı + IP ban + /yonetim paneli (ücretsiz)
// Gerekenler: KV binding adı "ZIYARET", gizli değişken "ADMIN_KEY"

const LOG_GUN = 7; // kayıtlar kaç gün saklansın

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") || "bilinmiyor";

  // Yönetim paneli
  if (url.pathname === "/yonetim") return yonetim(url, env);

  // Banlı mı?
  if (await env.ZIYARET.get("ban:" + ip)) {
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>Engellendi</title><h1 style='font-family:sans-serif;text-align:center;margin-top:20vh'>Erişim engellendi</h1>",
      { status: 403, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  // Sadece sayfa açılışlarını kaydet (resim/css/js değil)
  const accept = request.headers.get("accept") || "";
  if (request.method === "GET" && accept.includes("text/html")) {
    const cf = request.cf || {};
    const meta = {
      ip,
      ulke: cf.country || "",
      sehir: cf.city || "",
      yol: url.pathname.slice(0, 100),
      ref: (request.headers.get("referer") || "").slice(0, 150),
      ua: (request.headers.get("user-agent") || "").slice(0, 200),
      zaman: Date.now(),
    };
    // En yeni kayıt en üstte çıksın diye ters zaman damgası
    const anahtar =
      "log:" +
      String(9999999999999 - Date.now()).padStart(13, "0") +
      ":" +
      Math.random().toString(36).slice(2, 6);
    context.waitUntil(
      env.ZIYARET.put(anahtar, "", { metadata: meta, expirationTtl: LOG_GUN * 86400 }).catch(() => {})
    );
  }

  return next();
}

async function yonetim(url, env) {
  if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
    return new Response("Not found", { status: 404 });
  }
  const k = encodeURIComponent(env.ADMIN_KEY);
  const geri = url.origin + "/yonetim?key=" + k;

  const ban = (url.searchParams.get("ban") || "").trim();
  const kaldir = (url.searchParams.get("kaldir") || "").trim();
  if (ban) {
    await env.ZIYARET.put("ban:" + ban, "1");
    return Response.redirect(geri, 302);
  }
  if (kaldir) {
    await env.ZIYARET.delete("ban:" + kaldir);
    return Response.redirect(geri, 302);
  }

  const loglar = (await env.ZIYARET.list({ prefix: "log:", limit: 300 })).keys;
  const banlar = (await env.ZIYARET.list({ prefix: "ban:" })).keys.map((x) => x.name.slice(4));
  const banSet = new Set(banlar);

  // IP başına özet
  const ozet = {};
  for (const l of loglar) {
    const m = l.metadata || {};
    ozet[m.ip] = (ozet[m.ip] || 0) + 1;
  }

  const satirlar = loglar
    .map((l) => {
      const m = l.metadata || {};
      const tarih = new Date(m.zaman).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
      const banli = banSet.has(m.ip);
      const buton = banli
        ? `<a class="b ok" href="?key=${k}&kaldir=${encodeURIComponent(m.ip)}">Banı kaldır</a>`
        : `<a class="b" href="?key=${k}&ban=${encodeURIComponent(m.ip)}" onclick="return confirm('${esc(m.ip)} banlansın mı?')">Banla</a>`;
      return `<tr${banli ? ' class="banli"' : ""}>
        <td>${esc(tarih)}</td>
        <td><b>${esc(m.ip)}</b><br><small>${ozet[m.ip] || 0} giriş</small></td>
        <td>${esc(m.ulke)} ${esc(m.sehir)}</td>
        <td>${esc(m.yol)}${m.ref ? `<br><small>${esc(m.ref)}</small>` : ""}</td>
        <td><small>${esc(m.ua)}</small></td>
        <td>${buton}</td>
      </tr>`;
    })
    .join("");

  const banListe = banlar.length
    ? banlar
        .map((ip) => `<li>${esc(ip)} <a class="b ok" href="?key=${k}&kaldir=${encodeURIComponent(ip)}">kaldır</a></li>`)
        .join("")
    : "<li>Henüz banlı IP yok</li>";

  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ziyaretçiler</title>
<style>
body{font-family:system-ui,sans-serif;margin:12px;background:#f6f6f6;color:#222}
h2{margin:16px 0 8px}
table{border-collapse:collapse;width:100%;background:#fff;font-size:13px}
td,th{border-bottom:1px solid #ddd;padding:6px;vertical-align:top;text-align:left}
tr.banli{background:#ffe5e5}
.b{display:inline-block;padding:4px 8px;background:#d33;color:#fff;border-radius:4px;text-decoration:none;white-space:nowrap}
.b.ok{background:#2a7}
form{margin:8px 0}input{padding:6px}button{padding:6px 10px}
.kutu{overflow-x:auto}
</style></head><body>
<h2>Elle IP banla</h2>
<form><input type="hidden" name="key" value="${esc(env.ADMIN_KEY)}">
<input name="ban" placeholder="IP adresi"><button>Banla</button></form>
<h2>Banlı IP'ler</h2><ul>${banListe}</ul>
<h2>Son girişler (${loglar.length})</h2>
<div class="kutu"><table><tr><th>Zaman</th><th>IP</th><th>Yer</th><th>Sayfa</th><th>Cihaz</th><th></th></tr>${satirlar}</table></div>
</body></html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
