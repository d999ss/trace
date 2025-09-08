#!/bin/bash

# Fix all HTML pages with performance optimizations and SF Pro fonts

PAGES=("about.html" "agbr.html" "vwfndr.html" "japanese-gradients-for-ui.html" "contact.html" "store.html")

for page in "${PAGES[@]}"; do
    echo "Fixing $page..."
    
    # Add performance preconnects and logo CSS
    if ! grep -q "logo-text-replacement.css" "$page"; then
        sed -i '' 's|<link rel="preconnect" href="https://images.squarespace-cdn.com">|<link rel="preconnect" href="https://images.squarespace-cdn.com">\
<link rel="preconnect" href="https://assets.squarespace.com">\
<link rel="preconnect" href="https://static1.squarespace.com">\
<link rel="dns-prefetch" href="//assets.squarespace.com">\
<link rel="dns-prefetch" href="//static1.squarespace.com">\
<link rel="stylesheet" href="logo-text-replacement.css" fetchpriority="high">|' "$page"
    fi
    
    # Replace broken font CSS with SF Pro
    sed -i '' 's|<style>/\* IBM Plex Mono Font Override for PrintMyRide \*/.*</style>|<style>/* San Francisco Pro Font Override for PrintMyRide */\
* { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif !important; }\
.light { font-weight: 300 !important; }\
.regular { font-weight: 400 !important; }\
.medium { font-weight: 500 !important; }\
.semibold { font-weight: 600 !important; }\
.bold { font-weight: 700 !important; }\
.header, .header-nav, .site-branding { visibility: visible !important; opacity: 1 !important; }\
@keyframes fonts-loading { 0%, 99% { color: transparent; } }\
html.wf-loading * { animation: fonts-loading 0.2s; }\
</style>|g' "$page"
    
    echo "Fixed $page"
done

echo "All pages fixed!"