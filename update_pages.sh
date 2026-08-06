#!/bin/bash

# قائمة الصفحات التي تحتاج تحديث
pages=(
    "business-case.html"
    "careers.html"
    "company.html"
    "contact.html"
    "design-reference.html"
    "developers.html"
    "methodology.html"
    "platform.html"
    "trust-framework.html"
    "visual-reference.html"
    "why-rouaa.html"
)

cd /workspace/rouaa-web

for page in "${pages[@]}"; do
    if [ -f "$page" ]; then
        echo "Processing $page..."
        
        # إنشاء نسخة احتياطية
        cp "$page" "${page}.backup"
        
        echo "✓ Backed up $page"
    else
        echo "⚠️ File $page not found"
    fi
done

echo "Backup complete!"
