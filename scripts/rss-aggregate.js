// Aggregates RSS feeds from assets/roll.json and writes assets/rss_friends.json
const fs = require('fs');
const path = require('path');

async function main() {
  const root = process.cwd();
  const rollPath = path.join(root, 'assets', 'roll.json');
  const outPath = path.join(root, 'assets', 'rss_friends.json');

  let roll;
  try {
    const raw = fs.readFileSync(rollPath, 'utf8');
    roll = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read assets/roll.json:', e.message);
    process.exit(1);
  }

  const friends = Array.isArray(roll.friends)
    ? roll.friends.find(g => (g.id_name || '').toLowerCase() === 'friends')
    : null;

  const linkList = friends && Array.isArray(friends.link_list) ? friends.link_list : [];
  const list = [];

  const Parser = require('rss-parser');
  const parser = new Parser({ timeout: 15000 });

  for (const f of linkList) {
    if (!f.rss) continue;
    const entry = { name: f.name || f.link || 'Unknown', rss: f.rss, items: [] };
    try {
      const feed = await parser.parseURL(f.rss);
      const items = (feed.items || []).slice(0, 5).map(it => ({
        title: it.title || '',
        link: it.link || it.guid || f.rss,
        pubDate: it.pubDate || it.isoDate || ''
      }));
      entry.items = items;
      console.log(`Fetched: ${entry.name} (${items.length} items)`);
    } catch (e) {
      console.warn(`Failed to fetch RSS for ${entry.name}: ${e.message}`);
    }
    list.push(entry);
  }

  const payload = { updatedAt: new Date().toISOString(), list };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
