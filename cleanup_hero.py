#!/usr/bin/env python3
"""
Clean up duplicate hero comments and old sections
"""

import re
from pathlib import Path

web_dir = Path('/workspace/rouaa-web')
html_files = list(web_dir.glob('*.html'))

cleaned_count = 0

for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove duplicate hero comments
    content = re.sub(
        r'<!-- ============ PAGE HERO ============ -->\s*<!-- ============ HERO',
        '<!-- ============ HERO',
        content
    )
    
    # Remove any remaining old page-hero sections that might be after the new hero
    # (only if they appear AFTER the enhanced hero)
    if 'hero bg-grid-enhanced' in content:
        # Find position of enhanced hero
        enhanced_pos = content.find('hero bg-grid-enhanced')
        # Look for old page-hero after it
        old_hero_match = re.search(r'<section class="page-hero">.*?</section>', content[enhanced_pos:], re.DOTALL)
        if old_hero_match:
            content = content.replace(old_hero_match.group(0), '', 1)
            print(f"🧹 {html_file.name}: Removed duplicate old hero section")
            cleaned_count += 1
    
    if content != original_content:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"\n✅ Cleaned up {cleaned_count} files")
