import { NextResponse } from 'next/server';
import { getMasterTemplateJSON, validateReportStructure, MASTER_SECTIONS, INVESTOR_PROFILES } from '@/lib/report-master-template';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/master-template
 * Returns the canonical Strategic Report Master Template
 * Query params:
 *   ?validate=1&sections=<json>  — validate a report structure
 *   ?format=full                  — full template with descriptions (default)
 *   ?format=minimal               — section types and titles only
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'full';

  // Validation mode
  const validateParam = searchParams.get('validate');
  if (validateParam === '1') {
    const sectionsParam = searchParams.get('sections');
    const reportType = searchParams.get('reportType') || 'strategic';
    if (!sectionsParam) {
      return NextResponse.json({ error: 'Missing sections parameter for validation' }, { status: 400 });
    }
    try {
      const sections = JSON.parse(sectionsParam);
      const result = validateReportStructure(sections, reportType);
      return NextResponse.json({ validation: result, reportType });
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in sections parameter' }, { status: 400 });
    }
  }

  // Export mode
  const template = getMasterTemplateJSON(undefined as any);

  if (format === 'minimal') {
    return NextResponse.json({
      version: template.version,
      sections: MASTER_SECTIONS.map(s => ({
        section_type: (s as any).section_type,
        priority: s.priority,
        required: (s as any).required,
        titles: s.title,
      })),
      investorProfiles: INVESTOR_PROFILES.map(p => ({
        id: p.id,
        names: p.name,
      })),
    });
  }

  return NextResponse.json(template);
}
