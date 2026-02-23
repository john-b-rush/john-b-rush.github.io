# AGENTS.md

## Local Development

This is a Jekyll site hosted on GitHub Pages with `remote_theme: b2a3e8/jekyll-theme-console`.

### Prerequisites

```
brew install ruby
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"
gem install jekyll bundler
```

### Running locally

```
bundle install
bundle exec jekyll serve --livereload
```

Open http://127.0.0.1:4000

### Config changes needed for local dev

The `_config.yml` needs two additions that GitHub Pages handles automatically but local Jekyll does not:

1. Add `jekyll-remote-theme` to the plugins list
2. Add layout defaults so the theme's layouts are applied

These are already in the checked-in config. If they get removed, add them back:

```yaml
defaults:
  - scope:
      path: ""
    values:
      layout: "default"
  - scope:
      path: "posts"
    values:
      layout: "post"

plugins:
  - jekyll-remote-theme
  - jekyll-seo-tag
```

### Sass deprecation warnings

The theme uses old `@import` syntax. The warnings during build are harmless noise from Dart Sass.

## Project Structure

- `posts/` — Blog posts as markdown files (not `_posts`, no date prefix in filename)
- `assets/` — Static assets (JS, CSS, images) served directly
- `images/` — Post header images
- Theme: `b2a3e8/jekyll-theme-console` with `style: dark`
