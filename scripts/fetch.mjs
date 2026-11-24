import fs from "node:fs";
const TM = process.env.TMDB_KEY, RW = process.env.RAWG_KEY, F = "data/library.json";
const old = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, "utf8")) : { items: [] };
const week = Math.floor(Date.now() / 6048e5), today = new Date().toISOString().slice(0, 10);
const get = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(r.status + " " + u.split("?")[0]); return r.json(); };
const alive = async (u) => { try { const r = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(8000) }); return r.ok; } catch { return false; } };

async function anime() {
  const q = `query($p:Int){Page(page:$p,perPage:30){characters(sort:FAVOURITES_DESC){id name{full} siteUrl image{large} media(perPage:1){nodes{title{romaji}}}}}}`;
  const d = await get("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q, variables: { p: (week % 40) + 1 } }) });
  return d.data.Page.characters.filter(c => c.image?.large).map(c => ({ id: "al" + c.id, kind: "anime", name: c.name.full, work: c.media.nodes[0]?.title.romaji || "", source: "AniList", sourceUrl: c.siteUrl, images: [{ thumb: c.image.large, full: c.image.large, w: 230, h: 345 }] }));
}
async function tmdb(kind) {
  const p = kind === "movie" ? "movie" : "tv", B = "https://image.tmdb.org/t/p/";
  const l = await get(`https://api.themoviedb.org/3/trending/${p}/week?api_key=${TM}&page=${(week % 5) + 1}`);
  const out = [];
  for (const m of l.results.slice(0, 15)) {
    const im = await get(`https://api.themoviedb.org/3/${p}/${m.id}/images?api_key=${TM}&include_image_language=null`);
    const imgs = [...im.backdrops.slice(0, 8), ...im.posters.slice(0, 3)].map(x => ({ thumb: B + (x.aspect_ratio > 1 ? "w780" : "w342") + x.file_path, full: B + "original" + x.file_path, w: x.width, h: x.height }));
    if (imgs.length) out.push({ id: `tm${p}${m.id}`, kind, name: m.title || m.name, work: m.title || m.name, source: "TMDB", sourceUrl: `https://www.themoviedb.org/${p}/${m.id}`, images: imgs });
  }
  return out;
}
async function games() {
  const d = await get(`https://api.rawg.io/api/games?key=${RW}&ordering=-added&page_size=15&page=${(week % 20) + 1}`);
  return d.results.filter(g => g.background_image).map(g => ({ id: "rw" + g.id, kind: "game", name: g.name, work: g.name, source: "RAWG", sourceUrl: "https://rawg.io/games/" + g.slug, images: [g.background_image, ...g.short_screenshots.map(s => s.image)].filter((u, i, a) => u && a.indexOf(u) === i).map(u => ({ thumb: u, full: u, w: 1280, h: 720 })) }));
}
const sources = { anime, movie: () => TM ? tmdb("movie") : Promise.reject(new Error("TMDB_KEY غير مضاف")), tv: () => TM ? tmdb("tv") : Promise.reject(new Error("TMDB_KEY غير مضاف")), game: () => RW ? games() : Promise.reject(new Error("RAWG_KEY غير مضاف")) };
const status = {}, found = [];
for (const [k, fn] of Object.entries(sources)) {
  try {
    const items = await fn();
    for (const it of items) {
      const ok = await Promise.all(it.images.map(i => alive(i.thumb)));
      it.images = it.images.filter((_, n) => ok[n]);
    }
    const good = items.filter(i => i.images.length);
    found.push(...good); status[k] = { ok: true, count: good.length };
  } catch (e) { status[k] = { ok: false, error: String(e.message) }; }
}
const map = new Map(old.items.map(i => [i.id, i]));
for (const it of found) map.set(it.id, { ...it, added: map.get(it.id)?.added || today });
const anyOk = Object.values(status).some(s => s.ok);
const out = { updated: anyOk ? new Date().toISOString() : old.updated || null, status, items: [...map.values()].slice(-800) };
fs.mkdirSync("data", { recursive: true }); fs.writeFileSync(F, JSON.stringify(out));
console.log(JSON.stringify(status)); if (!anyOk) process.exit(1);
