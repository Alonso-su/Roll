// Example client: fetches raindrops from /api/raindrops
async function loadRaindrops() {
  try {
    const res = await fetch('/api/raindrops');
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Failed to load raindrops', e);
    return null;
  }
}

// Example usage: append titles to #raindrop-list
async function render() {
  const data = await loadRaindrops();
  const el = document.getElementById('raindrop-list');
  if (!el || !data) return;
  const items = data.items || data.items || [];
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title || item.title || '(no title)';
    el.appendChild(li);
  });
}

// Auto-run if DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
