// ─── Infographic Slug Debug API ─────────────────────────────
// GET /api/infographics/debug-slug?slug=<slug>
// Diagnoses why a slug lookup fails by comparing Unicode bytes

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'slug parameter required' }, { status: 400 });
  }

  const results: any = {
    inputSlug: slug,
    inputSlugLength: slug.length,
    inputSlugHex: Buffer.from(slug).toString('hex'),
    inputSlugNFC: slug.normalize('NFC'),
    inputSlugNFD: slug.normalize('NFD'),
  };

  // 1. Exact match — V314: use findFirst since slug alone is not unique (@@unique([slug, locale]))
  const exact = await db.infographic.findFirst({ where: { slug } });
  results.exactMatch = exact ? { id: exact.id, title: exact.title, slug: exact.slug } : null;

  // 2. NFC normalized match
  const nfcMatch = await db.infographic.findFirst({ where: { slug: slug.normalize('NFC') } });
  results.nfcMatch = nfcMatch ? { id: nfcMatch.id, title: nfcMatch.title, slug: nfcMatch.slug } : null;

  // 3. NFD normalized match
  const nfdMatch = await db.infographic.findFirst({ where: { slug: slug.normalize('NFD') } });
  results.nfdMatch = nfdMatch ? { id: nfdMatch.id, title: nfdMatch.title, slug: nfdMatch.slug } : null;

  // 4. Suffix match
  const slugSuffix = slug.split('-').pop();
  if (slugSuffix && slugSuffix.length <= 5) {
    const suffixMatch = await db.infographic.findFirst({
      where: { slug: { endsWith: slugSuffix } },
    });
    results.suffixMatch = suffixMatch
      ? {
          id: suffixMatch.id,
          title: suffixMatch.title,
          slug: suffixMatch.slug,
          slugHex: Buffer.from(suffixMatch.slug).toString('hex'),
          slugLength: suffixMatch.slug.length,
        }
      : null;
  }

  // 5. All infographics with their slugs
  const allInfographics = await db.infographic.findMany({
    select: { id: true, slug: true, title: true },
    take: 10,
  });
  results.allSlugs = allInfographics.map(ig => ({
    id: ig.id,
    slug: ig.slug,
    slugLength: ig.slug.length,
    slugHex: Buffer.from(ig.slug).toString('hex').slice(0, 80),
    title: ig.title,
  }));

  // 6. Character-by-character comparison with each stored slug
  if (!exact) {
    results.comparisons = allInfographics.map(ig => {
      const dbSlug = ig.slug;
      const maxLen = Math.max(slug.length, dbSlug.length);
      const diffs: number[] = [];
      for (let i = 0; i < maxLen; i++) {
        if (slug.charCodeAt(i) !== dbSlug.charCodeAt(i)) {
          diffs.push(i);
        }
      }
      return {
        dbSlug,
        dbSlugLength: dbSlug.length,
        inputSlugLength: slug.length,
        lengthMatch: slug.length === dbSlug.length,
        diffCount: diffs.length,
        diffPositions: diffs.slice(0, 10),
        firstDiffChar: diffs.length > 0 ? {
          position: diffs[0],
          inputChar: `U+${slug.charCodeAt(diffs[0]).toString(16).toUpperCase()} (${slug[diffs[0]]})`,
          dbChar: `U+${dbSlug.charCodeAt(diffs[0]).toString(16).toUpperCase()} (${dbSlug[diffs[0]]})`,
        } : null,
      };
    });
  }

  return NextResponse.json(results, { status: 200 });
}
