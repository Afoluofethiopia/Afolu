#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT      = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "_posts");
const OUTPUT    = path.join(ROOT, "news.json");

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { attributes: {}, body: content.trim() };
  const yamlBlock = match[1];
  const body      = content.slice(match[0].length).trim();
  const attrs     = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let   val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === "true")  { attrs[key] = true;  continue; }
    if (val === "false") { attrs[key] = false; continue; }
    attrs[key] = val;
  }
  return { attributes: attrs, body };
}

if (!fs.existsSync(POSTS_DIR)) {
  fs.writeFileSync(OUTPUT, JSON.stringify({ posts: [] }, null, 2));
  console.log("No _posts dir — empty news.json written"); process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md")).sort().reverse();
const posts = [];

for (const file of files) {
  let parsed;
  try { parsed = parseFrontMatter(fs.readFileSync(path.join(POSTS_DIR, file), "utf-8")); }
  catch(e) { console.warn("Skip " + file + ": " + e.message); continue; }
  const a = parsed.attributes;
  if (a.draft === true) { console.log("Draft: " + file); continue; }
  if (!a.title || !a.date) { console.warn("Skip (no title/date): " + file); continue; }
  posts.push({
    title:   String(a.title   || "").trim(),
    date:    String(a.date    || "").substring(0, 10),
    section: String(a.section || "").trim(),
    type:    String(a.type    || "").trim(),
    author:  String(a.author  || "").trim(),
    body:    (a.body || parsed.body || "").trim().substring(0, 600),
    image:   String(a.image   || "").trim(),
    link:    String(a.link    || "").trim(),
  });
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(OUTPUT, JSON.stringify({ posts }, null, 2), "utf-8");
console.log("✅ news.json: " + posts.length + " post(s)");
posts.forEach((p, i) => console.log("  " + (i+1) + ". [" + p.date + "] " + p.title));
