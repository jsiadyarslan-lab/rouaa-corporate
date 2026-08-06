#!/usr/bin/env python3
"""
Script v2 to apply the index.html hero design to remaining pages
"""

import os
import re
from pathlib import Path

# Get the hero section from index.html
index_path = Path('/workspace/rouaa-web/index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract the complete hero section from index.html
hero_match = re.search(r'(<!-- ============ HERO \(v3 — Product-Forward Positioning\) ============ -->.*?</section>)', index_content, re.DOTALL)
if not hero_match:
    print("❌ Could not find hero section in index.html")
    exit(1)

hero_section = hero_match.group(1)
print(f"✅ Hero section ready ({len(hero_section)} chars)")

# Pages that need enhanced hero applied
pages_to_update = [
    'evidence-explorer.html',
    'platform.html',
    'product-experience.html',
    'solutions.html',
    'infrastructure-report.html',
    'financial-media.html',
    'sample-library.html',
    'enterprise.html',
    'source-explorer.html',
    'trading-platform.html',
    'research-institute.html',
    'source-registry.html',
    'financial-intelligence.html'
]

web_dir = Path('/workspace/rouaa-web')
updated_count = 0

for page_name in pages_to_update:
    html_file = web_dir / page_name
    if not html_file.exists():
        print(f"⚠️  {page_name}: File not found")
        continue
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and replace page-hero section
    old_hero_match = re.search(r'<section class="page-hero">.*?</section>', content, re.DOTALL)
    if old_hero_match:
        # Customize hero for this page
        page_title = page_name.replace('.html', '').replace('-', ' ').title()
        
        # Replace the eyebrow, h1, and subheadline while keeping structure
        customized_hero = hero_section.replace(
            '<span class="eyebrow">Financial Intelligence Platform</span>',
            f'<span class="eyebrow">{page_title}</span>'
        )
        
        customized_hero = customized_hero.replace(
            'Transform official financial information into',
            f'{page_title}'
        )
        
        content = content.replace(old_hero_match.group(0), customized_hero, 1)
        print(f"🎨 {page_name}: Applied enhanced hero")
        updated_count += 1
    else:
        print(f"⚠️  {page_name}: No page-hero section found")
    
    # Write updated content
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"\n✅ Complete! Updated {updated_count} additional pages")
