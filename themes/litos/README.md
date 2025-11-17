# Litos Hugo Theme

A modern, minimalist Hugo theme ported from the beautiful Astro MultiLaunch template. Litos brings distinctive design elements like corner effects, thoughtful typography, and a sophisticated dark mode to the Hugo ecosystem.

![Litos Theme Preview](https://via.placeholder.com/800x400/272727/ffffff?text=Litos+Hugo+Theme)

## Features

- ✨ **Signature Corner Effects** - Distinctive hover animations on interactive elements
- 🌙 **Dark/Light Mode** - Automatic theme detection with manual toggle
- 📱 **Fully Responsive** - Beautiful on all screen sizes
- ⚡ **Performance Optimized** - Fast loading with minimal JavaScript
- 🎨 **SCSS Architecture** - Modular stylesheets for easy customization
- ♿ **Accessible** - Built with semantic HTML and ARIA support
- 🏷️ **Tag System** - Organize posts with tags
- 📄 **Multiple Layouts** - Support for posts, pages, and custom content
- 🔍 **SEO Friendly** - Optimized for search engines

## Quick Start

### 1. Install the Theme

```bash
# As a Git submodule (recommended)
git submodule add https://github.com/yourusername/litos-hugo-theme.git themes/litos

# Or clone directly
git clone https://github.com/yourusername/litos-hugo-theme.git themes/litos
```

### 2. Configure Your Site

Update your `hugo.toml`:

```toml
baseURL = 'https://yoursite.com/'
languageCode = 'en-us'
title = 'Your Site Title'
theme = 'litos'

[params]
  description = "Your site description"
  author = "Your Name"
  darkMode = true
  
  [params.header]
    [[params.header.links]]
      name = "Posts"
      url = "/posts"
    [[params.header.links]]
      name = "About"
      url = "/about"
    [[params.header.links]]
      name = "Tags"
      url = "/tags"
  
  [params.footer]
    [[params.footer.links]]
      name = "RSS"
      url = "/index.xml"
      external = false
  
  [params.posts]
    homePageSize = 5
    readMoreText = "Read more"
```

### 3. Create Content

Create your first post:

```bash
hugo new posts/my-first-post.md
```

Add front matter to your posts:

```yaml
---
title: "My First Post"
date: 2024-01-01T10:00:00Z
tags: ["hugo", "blog"]
author: "Your Name"
summary: "A brief summary of your post"
---
```

### 4. Start Writing

```bash
hugo server -D
```

Visit `http://localhost:1313` to see your site!

## Customization

### Colors and Styling

The theme uses CSS custom properties for easy customization. You can override them in your own CSS:

```css
:root {
  --color-primary: #your-color;
  --outer-container-width: 900px;
}
```

Or customize the SCSS variables by creating your own `assets/scss/custom.scss`:

```scss
// Override theme variables
$color-primary-light: #your-color;
$color-primary-dark: #your-dark-color;
$outer-container-width: 900px;

// Import the theme
@import "../../themes/litos/assets/scss/main.scss";
```

### Typography

The theme uses Open Sans and Geist Mono fonts by default. You can change them:

```css
:root {
  --font-sans: "Your Font", sans-serif;
  --font-mono: "Your Mono Font", monospace;
}
```

### Layout Width

Adjust the maximum content width:

```css
:root {
  --outer-container-width: 900px; /* Default: 780px */
}
```

## Content Types

### Posts

Create posts in `content/posts/`:

```yaml
---
title: "Post Title"
date: 2024-01-01T10:00:00Z
tags: ["tag1", "tag2"]
author: "Author Name"
summary: "Post summary"
draft: false
---

Your post content here...
```

### Pages

Create pages in `content/`:

```yaml
---
title: "Page Title"
date: 2024-01-01
---

Your page content here...
```

## Advanced Configuration

### Navigation

Customize header navigation in `hugo.toml`:

```toml
[params.header]
  [[params.header.links]]
    name = "Custom Page"
    url = "/custom"
  [[params.header.links]]
    name = "External Link"
    url = "https://example.com"
```

### Footer

Customize footer links:

```toml
[params.footer]
  [[params.footer.links]]
    name = "GitHub"
    url = "https://github.com/yourusername"
    external = true
  [[params.footer.links]]
    name = "RSS"
    url = "/index.xml"
    external = false
```

### Post Settings

Configure post behavior:

```toml
[params.posts]
  homePageSize = 5        # Posts on homepage
  postPageSize = 10       # Posts per page
  readMoreText = "Read more"
  prevPageText = "Previous"
  nextPageText = "Next"
  backToPostsText = "Back to Posts"
  nextPostText = "Next Post"
  prevPostText = "Previous Post"
```

## Development

### File Structure

```
themes/litos/
├── assets/
│   └── scss/
│       ├── main.scss          # Main stylesheet
│       ├── _variables.scss    # Theme variables
│       ├── _mixins.scss       # SCSS mixins
│       ├── _components.scss   # Component styles
│       └── _prose.scss        # Content typography
├── layouts/
│   ├── _default/
│   │   ├── baseof.html       # Base template
│   │   ├── single.html       # Single post/page
│   │   └── list.html         # List pages
│   ├── partials/
│   │   ├── header.html       # Site header
│   │   └── footer.html       # Site footer
│   ├── index.html            # Homepage
│   └── 404.html              # 404 page
└── theme.toml                # Theme metadata
```

### Building

The theme uses Hugo's built-in SCSS processing. Make sure you have Hugo Extended installed:

```bash
hugo version
# Should show "extended"
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

- Original design: [Astro MultiLaunch](https://github.com/bejamas/astro-dato-multilaunch) by Bejamas
- Fonts: [Open Sans](https://fonts.google.com/specimen/Open+Sans) and [Geist Mono](https://vercel.com/font)
- Icons: Custom SVG icons

## Support

- [Documentation](https://github.com/yourusername/litos-hugo-theme/wiki)
- [Issues](https://github.com/yourusername/litos-hugo-theme/issues)
- [Discussions](https://github.com/yourusername/litos-hugo-theme/discussions)

---

Made with ❤️ for the Hugo community