# Copilot Instructions for SUUS Blog

## Project Overview
This is a personal blog built with **Hugo static site generator** and the **Litos theme** (custom-modified). The site is deployed via **Netlify** with automatic builds on Git commits. The blog features:
- **Content**: Markdown-based posts with YAML frontmatter (30+ articles organized by date-based slugs like `202502102258.md`)
- **Multiple content types**: Posts, Pages, Album (photo gallery), Stack (tools/hardware), Roll (social feed), Bookmarks
- **Third-party integrations**: Artalk (comments), Umami (analytics), Raindrop (bookmarks), Memos (social feed)

## Critical Build & Deployment Workflow

### Build Command
```bash
hugo --gc --minify
```
- Runs during Netlify deployment
- Hugo version pinned to `0.131.0` in `netlify.toml`
- Outputs to `public/` directory
- Includes `--gc` (garbage collection) and `--minify` for optimization

### Local Development
```bash
hugo server -D
```
- Runs on `http://localhost:1313`
- `-D` flag includes draft posts

### Configuration
- **Main config**: `hugo.toml` (TOML format, not `config.yaml`)
- **Deployment config**: `netlify.toml` (context-specific builds for production, preview, branch deploys)
- **Theme config**: Parameters in `hugo.toml` under `[params]` section

## Content Architecture

### Post/Article Structure
- **Location**: `content/posts/` (30+ files)
- **Naming convention**: Timestamp-based slugs (e.g., `202502102258.md` = Feb 10, 2025, 22:58)
- **Frontmatter template** (from `archetypes/default.md`):
  ```yaml
  ---
  title: "Article Title"
  description: "Brief summary"
  date: 2025-02-10T22:58:32+08:00
  slug: "202502102258"
  tags: [tag1, tag2]
  categories: []
  comments: true
  draft: false
  recommend: false
  image: "https://image-url.webp"
  ---
  ```
- **Key fields**:
  - `slug`: Used in permalink (configured as `/:slug/` in `hugo.toml`)
  - `tags`: For post organization and taxonomy pages
  - `image`: Featured image URL (required for homepage cards)
  - `recommend`: Triggers status badge in template rendering
  - `comments: true` enables Artalk comments section

### Page Structure
- **Location**: `content/pages/` (7 pages in Chinese)
- **Custom layouts**: Some pages use `layout: "album"` or `layout: "bookmark"` for specialized rendering
- **Examples**:
  - `相册.md` (Album) - uses `layout: "album"`, data source from `assets/album.json`
  - `书签.md` (Bookmarks) - data from `assets/roll.json` via Raindrop integration
  - `友链.md` (Friendlinks) - static page for link exchanges

### Data Files (JSON)
- **Location**: `assets/`
- **Purpose**: Populate dynamic pages without content files
- **Files**:
  - `album.json`: Photo metadata (URL, title, date, category)
  - `stack.json`: Tools/hardware list (hardware, apps sections)
  - `roll.json`: Social feed data
  - `douban/`: CSV exports from Douban (books, movies, music)

## Theme Structure (Litos)

### Template System
- **Location**: `themes/litos/layouts/`
- **Key templates**:
  - `index.html`: Homepage with hero section + recent posts (shows 2 latest posts)
  - `_default/single.html`: Post/article view (contains Artalk comments container, TOC, meta info)
  - `posts/list.html`: Posts archive page
  - `pages/`: Custom layouts for special pages
  - `partials/`: Reusable components (header, footer, comments, badges, etc.)

### Static Assets
- **Stylesheets**: `themes/litos/assets/scss/` (modular SCSS architecture)
  - `main.scss`: Primary stylesheet
  - Partial files: `_components.scss`, `_single-post.scss`, `_album.scss`, `_posts-list.scss`, etc.
  - Uses CSS custom properties for dark mode support
- **JavaScript**: `themes/litos/assets/js/`
  - Core: `theme.js` (theme toggle), `theme-toggle.js` (button logic)
  - Features: `album.js`, `post-view-image.js`, `posts-list.js`, `toc.js` (table of contents), `memos.js`, `pwa.js`
  - Third-party: Artalk comment system integration

## Integration Points

### Artalk Comments System
- **Config**: `hugo.toml` `[params.artalk]` section
  - `server`: Self-hosted server URL (`https://at.suuus.top`)
  - `site`: Site identifier (`蘇SU`)
- **Template integration**: Meta tags injected in `_default/single.html` (lines 2-5)
- **DOM target**: `<div id="artalk-container">` in post layout
- **Enhancement scripts**: `/js/artalk-enhanced.js`, `/js/artalk-avatar.js` handle collapse/avatar features
- **Static files**: Artalk CSS/JS loaded from `/dist/` directory (external CDN)

### Umami Analytics
- **Config**: `hugo.toml` `[params.umami]` section
  - `enable: true` toggle
  - Script URL: `https://ui.suuus.top/script.js`
  - Website ID: `7ebabcf6-c77f-4455-8ae5-2c1868e870f2`
- **Purpose**: Page view tracking and analytics
- **No template modifications needed** - tracking via script tag

### Raindrop.io Bookmarks
- **Config**: `hugo.toml` `[params.raindrop]` section
  - `api_url`: Raindrop API endpoint for fetching bookmarks
  - `token`: API token (marked as dev token in comment)
- **Data flow**: JavaScript fetches from Raindrop API to populate bookmarks page
- **Template**: `pages/书签.md` page layout

### Memos Integration
- **Purpose**: Display social feed/microblog posts
- **Data source**: Likely external API or static JSON
- **Template**: `partials/memos.html`, `assets/js/memos.js` handles rendering

## Hugo Configuration Essentials

### Permalinks
```toml
[permalinks]
  posts = "/:slug/"
  pages = "/:slug/"
```
Posts/pages accessible at root level using `slug` field (e.g., `/202502102258/`)

### Output Formats
- **Home page**: HTML, RSS, Atom
- **Sections**: HTML, RSS
- **Taxonomies** (tags, categories): HTML, RSS
- **RSS config**: Max 20 items (`[services.rss] limit = 20`)

### Markup Configuration
- **Markdown processor**: Goldmark with `unsafe = true` (allows HTML in markdown)
- **Code highlighting**: GitHub style, no line numbers by default
- **Table of Contents**: startLevel 1, endLevel 4

### Taxonomies
```toml
[taxonomies]
  tag = "tags"
  category = "categories"
```

## Naming Conventions & Patterns

### Slug Format
- Posts use timestamp-based slugs: `YYYYMMDDHHMM` format
- Example: `202502102258` = 2025-02-10 22:58
- This is BOTH the filename (without `.md`) and the `slug` frontmatter field

### CSS Class Patterns (from SCSS files)
- `.corner-effect`: Signature hover animation with corner elements
- `.recent-post-card`: Homepage post cards with featured images
- `.post-article`: Main article container
- `.status-badge`: Status indicators (e.g., "推荐" = recommended)
- BEM-like naming: `.artalk-custom-styles`, `.post-header-container`, `.recent-post-title`

### Image Format
- Website uses `.avif` format (modern, optimized)
- Static images stored in `static/` subdirectories (e.g., `static/album/`, `static/stack/`)
- Post featured images: External URLs (Cloudinary-like CDN: `i.p-i.vip`)

## Common Development Tasks

### Adding a New Post
1. Create file in `content/posts/` with timestamp-based name: `content/posts/202502262100.md`
2. Use frontmatter template from `archetypes/default.md`
3. Set `slug` field to match filename (without `.md`)
4. If including featured image, add external URL to `image` field
5. Build: `hugo --gc --minify` or let Netlify auto-build on git push

### Adding a New Page
1. Create in `content/pages/FILENAME.md` (Chinese character filenames are standard here)
2. Optionally specify custom `layout` field (e.g., `layout: "album"`)
3. For data-driven pages, reference JSON files from `assets/`

### Modifying Theme
- Edit SCSS in `themes/litos/assets/scss/` (changes auto-compile on build)
- Modify templates in `themes/litos/layouts/`
- Update partials in `themes/litos/layouts/partials/`
- Theme is a git submodule - changes should be committed separately if maintained externally

### Updating Data Files
- JSON files in `assets/` update gallery, stack, rolls without content files
- No Hugo rebuild needed for JSON changes - they're read at build time
- Update `assets/album.json` for album photos
- Update `assets/stack.json` for tools/hardware list

## Important Constraints & Quirks

1. **Timestamp slugs**: Treat the date-time in filename as canonical - don't change without updating both filename and `slug` field
2. **Image domains**: External CDN used for most images (not Hugo asset pipeline) - preserve full URLs
3. **Chinese content**: Site supports bilingual content - posts/pages often in Chinese, some UI in English
4. **Artalk server required**: Comments system requires live Artalk server at `https://at.suuus.top` - won't work in offline development
5. **Static file locations**: Third-party JS/CSS (Artalk, Umami) served from `static/` or external CDNs - not theme assets
6. **Git-aware builds**: Netlify config includes `HUGO_ENABLEGITINFO = "true"` - Git history affects build output

## File Structure Reference
- **Config**: `hugo.toml` (primary), `netlify.toml` (deployment)
- **Content**: `content/posts/`, `content/pages/`, `content/_index.md`
- **Data**: `assets/*.json`, `assets/douban/*.csv`
- **Theme**: `themes/litos/` (layouts, assets, static)
- **Static**: `static/` (images, manifests, service worker, third-party scripts)
- **Archetype**: `archetypes/default.md` (post template)
