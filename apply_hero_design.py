#!/usr/bin/env python3
"""
Script to apply the index.html hero design to all other pages in rouaa-web/
"""

import os
import re
from pathlib import Path

# Get the hero section from index.html
index_path = Path('/workspace/rouaa-web/index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract the navigation (lines 16-103)
nav_match = re.search(r'(<!-- ============ NAVIGATION ============ -->.*?<!-- ============ HERO)', index_content, re.DOTALL)
if not nav_match:
    print("❌ Could not find navigation in index.html")
    exit(1)

nav_section = nav_match.group(1).replace('<!-- ============ HERO', '').strip()

# Extract the complete hero section from index.html (lines 105-251)
hero_match = re.search(r'(<!-- ============ HERO \(v3 — Product-Forward Positioning\) ============ -->.*?</section>)', index_content, re.DOTALL)
if not hero_match:
    print("❌ Could not find hero section in index.html")
    exit(1)

hero_section = hero_match.group(1)

print(f"✅ Extracted navigation ({len(nav_section)} chars)")
print(f"✅ Extracted hero section ({len(hero_section)} chars)")

# Get all HTML files except index.html
web_dir = Path('/workspace/rouaa-web')
html_files = list(web_dir.glob('*.html'))
html_files = [f for f in html_files if f.name != 'index.html']

print(f"\n📁 Found {len(html_files)} HTML files to update")

# Pages that should keep their current hero (about, contact, careers, etc.)
keep_simple_hero = [
    'company.html', 'contact.html', 'careers.html', 'developers.html',
    'design-reference.html', 'visual-reference.html', 'methodology.html',
    'trust-framework.html', 'business-case.html', 'why-rouaa.html'
]

# Pages that should get the enhanced hero
enhanced_hero_pages = [f.name for f in html_files if f.name not in keep_simple_hero]

print(f"🎨 Will apply enhanced hero to {len(enhanced_hero_pages)} pages")
print(f"📋 Will keep simple hero for {len(keep_simple_hero)} pages\n")

updated_count = 0
for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace navigation
    old_nav_match = re.search(r'(<!-- ============ NAVIGATION ============ -->.*?</nav>)', content, re.DOTALL)
    if old_nav_match:
        content = content.replace(old_nav_match.group(1), nav_section, 1)
        print(f"✅ {html_file.name}: Updated navigation")
    
    # For enhanced hero pages, replace the page-hero section
    if html_file.name in enhanced_hero_pages:
        # Remove old page-hero section
        old_hero_match = re.search(r'(<!-- ============ \d*\.? ?HERO.*?-->.*?</section>)', content, re.DOTALL)
        if old_hero_match:
            # Customize hero for this page
            page_title = html_file.name.replace('.html', '').replace('-', ' ').title()
            
            customized_hero = hero_section.replace(
                'Transform official financial information into',
                f'{page_title} — Transform official financial information into'
            )
            
            content = content.replace(old_hero_match.group(1), customized_hero, 1)
            print(f"🎨 {html_file.name}: Applied enhanced hero")
            updated_count += 1
        else:
            print(f"⚠️  {html_file.name}: No hero section found to replace")
    else:
        print(f"📋 {html_file.name}: Kept simple hero (reference/about page)")
    
    # Write updated content
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"\n✅ Complete! Updated {updated_count} pages with enhanced hero design")
