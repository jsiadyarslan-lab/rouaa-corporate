#!/usr/bin/env python3
import re
import os

# قائمة الصفحات التي تحتاج تحديث
pages_to_update = [
    'business-case.html',
    'careers.html', 
    'company.html',
    'contact.html',
    'design-reference.html',
    'developers.html',
    'index.html',
    'methodology.html',
    'trust-framework.html',
    'visual-reference.html',
    'why-rouaa.html'
]

def get_hero_content(page_name):
    """استرجاع محتوى Hero المناسب لكل صفحة"""
    heroes = {
        'index.html': '''
  <!-- ============ HERO SECTION ============ -->
  <section class="hero bg-grid-enhanced" style="position: relative; overflow: hidden;">
    <div class="glow-blue" style="top: -200px; right: -150px;"></div>
    <div class="glow-gold" style="bottom: -50px; left: -100px;"></div>
    <div class="container" style="position: relative; z-index: 1;">
      <div class="hero-split">
        <div class="hero-split-left">
          <span class="eyebrow">Financial Intelligence Platform</span>
          <h1>Transform official financial information into <span class="text-accent">investment intelligence, market intelligence, and institutional workflows.</span></h1>
          <p class="hero-split-subheadline">ROUAA converts fragmented financial sources into verified intelligence products — with complete traceability from source document to decision context.</p>
          <div class="hero-cta-row">
            <a href="#products" class="btn btn-primary">Explore Intelligence Products →</a>
            <a href="contact.html" class="btn btn-secondary">Request Briefing</a>
          </div>
          <div class="hero-trust-pills">
            <div class="hero-trust-pill">
              <div class="hero-trust-pill-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18"/></svg></div>
              <div class="hero-trust-pill-text"><span class="hero-trust-pill-label">Intelligence Products</span><span class="hero-trust-pill-sub">Investment · Market · Risk · Media</span></div>
            </div>
            <div class="hero-trust-pill">
              <div class="hero-trust-pill-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div>
              <div class="hero-trust-pill-text"><span class="hero-trust-pill-label">Verified Content</span><span class="hero-trust-pill-sub">Every output traceable to source</span></div>
            </div>
            <div class="hero-trust-pill">
              <div class="hero-trust-pill-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2L4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-5z"/></svg></div>
              <div class="hero-trust-pill-text"><span class="hero-trust-pill-label">Institutional Decisions</span><span class="hero-trust-pill-sub">Research workflows, defensible outputs</span></div>
            </div>
          </div>
        </div>
        <div class="hero-split-right">
          <div class="glass-status-card">
            <div class="status-indicator"></div>
            <div class="status-content">
              <div class="status-title">Operational Status</div>
              <div class="status-value">Live</div>
            </div>
          </div>
          <div class="platform-metrics-grid">
            <div class="metric-card">
              <div class="metric-value">5</div>
              <div class="metric-label">Intelligence Products</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">411+</div>
              <div class="metric-label">Institutional Sources</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">2.4M</div>
              <div class="metric-label">Official Documents</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">100%</div>
              <div class="metric-label">Verified Outputs</div>
            </div>
          </div>
          <div class="intelligence-flow">
            <div class="flow-step"><span class="flow-badge">Official Source</span><span class="flow-desc">Authoritative</span><span class="flow-arrow">→</span></div>
            <div class="flow-step"><span class="flow-badge">Verified Fact</span><span class="flow-desc">Extracted</span><span class="flow-arrow">→</span></div>
            <div class="flow-step"><span class="flow-badge">Intelligence Product</span><span class="flow-desc">Structured</span><span class="flow-arrow">→</span></div>
            <div class="flow-step"><span class="flow-badge">Decision Context</span><span class="flow-desc">Defensible</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>
''',
        'company.html': '''
  <!-- ============ HERO SECTION ============ -->
  <section class="hero bg-grid-enhanced" style="position: relative; overflow: hidden;">
    <div class="glow-blue" style="top: -200px; right: -150px;"></div>
    <div class="glow-gold" style="bottom: -50px; left: -100px;"></div>
    <div class="container" style="position: relative; z-index: 1;">
      <div class="hero-split">
        <div class="hero-split-left">
          <span class="eyebrow">Company</span>
          <h1>Building the trust layer <span class="text-accent">for institutional finance.</span></h1>
          <p class="hero-split-subheadline">ROUAA exists because the gap between financial information and defensible institutional decisions is where most institutions lose money — and reputation.</p>
          <div class="hero-cta-row">
            <a href="#mission" class="btn btn-primary">Our Mission →</a>
            <a href="contact.html" class="btn btn-secondary">Contact Us</a>
          </div>
        </div>
        <div class="hero-split-right">
          <div class="glass-status-card">
            <div class="status-indicator"></div>
            <div class="status-content">
              <div class="status-title">Trust Framework</div>
              <div class="status-value">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
'''
    }
    return heroes.get(page_name, heroes.get('index.html'))

def update_page(filepath, page_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # إزالة قسم page-hero القديم
    old_hero_pattern = r'<section class="page-hero">.*?</section>\s*\n'
    content = re.sub(old_hero_pattern, '', content, flags=re.DOTALL)
    
    # إضافة CSS links إذا لم تكن موجودة
    css_links = '''  <link rel="stylesheet" href="design-system/tokens.css">
  <link rel="stylesheet" href="design-system/typography.css">
  <link rel="stylesheet" href="design-system/components.css">
  <link rel="stylesheet" href="design-system/rouaa-v7.css">
  <link rel="stylesheet" href="styles.css">
'''
    if '</head>' in content and 'rouaa-v7.css' not in content:
        content = content.replace('</head>', css_links + '\n</head>')
    
    # إضافة Hero الجديد بعد نهاية الـ nav
    nav_end = content.find('</nav>')
    if nav_end != -1:
        insert_pos = nav_end + 6
        hero_html = get_hero_content(page_name)
        content = content[:insert_pos] + '\n\n' + hero_html + '\n' + content[insert_pos:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {page_name}")

# تحديث كل صفحة
for page in pages_to_update:
    filepath = os.path.join('rouaa-web', page)
    if os.path.exists(filepath):
        update_page(filepath, page)
    else:
        print(f"✗ File not found: {page}")

print("\n✅ All pages updated successfully!")
