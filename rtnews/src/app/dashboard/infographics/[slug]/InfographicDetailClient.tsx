'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { T } from '@/lib/unified-tokens'
import { isValidImageUrl, isPollinationsUrl } from '@/lib/image-gen-utils'
import {
  ArrowRight, Eye, Heart, Share2, Calendar, Tag, TrendingUp,
  RefreshCw, AlertTriangle, Image as ImageIcon, ExternalLink,
  Clock, Zap, ChevronRight, ArrowLeft
} from 'lucide-react'

interface InfographicSlide {
  number: number
  type: string
  title: string
  image_url?: string
  image_position?: string
  image_overlay?: number
  image_prompt?: string
  content?: any
}

interface InfographicData {
  id: string
  slug: string
  title: string
  subtitle?: string
  category?: string
  slides: InfographicSlide[]
  viewCount: number
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

export default function InfographicDetailClient() {
  const params = useParams()
  const slug = params?.slug as string

  const [data, setData] = useState<InfographicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchInfographic()
  }, [slug])

  async function fetchInfographic() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/infographics/${slug}`)
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'الإنفوغرافيك غير موجود' : 'فشل في التحميل')
      }
      const result = await res.json()
      setData(result.id ? result : result.data || result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fixImage() {
    if (!data || fixing) return
    setFixing(true)
    setFixResult(null)
    try {
      const res = await fetch('/api/infographics/auto-fix-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infographicId: data.id }),
      })
      const result = await res.json()
      if (result.success) {
        const fixed = result.results?.find((r: any) => r.id === data.id)
        if (fixed?.status === 'fixed') {
          setFixResult('تم إصلاح الصور بنجاح')
          await fetchInfographic()
        } else if (fixed?.status === 'already_valid') {
          setFixResult('الصور صالحة بالفعل')
        } else {
          setFixResult('تمت معالجة الإنفوغرافيك')
        }
      }
    } catch (err: any) {
      setFixResult(`خطأ: ${err.message}`)
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} style={{ color: T.blue, margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 13, color: T.text2, marginTop: 12 }}>جاري تحميل الإنفوغرافيك...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <div style={{ textAlign: 'center', background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: 32, maxWidth: 400 }}>
          <AlertTriangle size={36} style={{ color: T.amber, margin: '0 auto 12px' }} />
          <p style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 14, color: T.text, marginBottom: 8 }}>
            {error || 'الإنفوغرافيك غير موجود'}
          </p>
          <button
            onClick={fetchInfographic}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: T.blue, color: '#fff',
              border: 'none', fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 12,
              cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  const slides = data.slides || []
  const thumbnailUrl = slides[0]?.image_url || slides[0]?.content?.image_url
  const hasValidThumbnail = isValidImageUrl(thumbnailUrl)
  const totalImages = slides.filter(s => {
    const url = s.image_url || s.content?.image_url
    return isValidImageUrl(url)
  }).length

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)', background: T.bg, padding: '16px', direction: 'rtl', fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 11, color: T.text3 }}>
        <a href="/dashboard" style={{ color: T.text2, textDecoration: 'none' }}>الرئيسية</a>
        <ChevronRight size={12} />
        <a href="/dashboard/infographics" style={{ color: T.text2, textDecoration: 'none' }}>الإنفوغرافيك</a>
        <ChevronRight size={12} />
        <span style={{ color: T.text }}>{data.title?.substring(0, 30)}...</span>
      </div>

      {/* Main Card */}
      <div style={{
        maxWidth: 900, margin: '0 auto',
        background: T.card, border: `0.5px solid ${T.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Thumbnail Section */}
        <div style={{ position: 'relative', background: T.bgLight }}>
          {hasValidThumbnail && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={data.title}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
              width={900}
              height={400}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: 250,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${T.bgLight}, ${T.bg})`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <ImageIcon size={48} style={{ color: T.text3, opacity: 0.3 }} />
                <p style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 12, color: T.text3, marginTop: 8 }}>لا توجد صورة مصغرة</p>
              </div>
            </div>
          )}

          {/* Image Source Badge */}
          {thumbnailUrl && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              padding: '3px 10px', borderRadius: 6,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.text2,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Zap size={10} style={{ color: isPollinationsUrl(thumbnailUrl) ? T.green : T.amber }} />
              {isPollinationsUrl(thumbnailUrl) ? 'Pollinations AI' : 'R2 Storage'}
            </div>
          )}

          {/* Fix Images Button */}
          <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
            <button
              onClick={fixImage}
              disabled={fixing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: T.amber, color: '#000',
                border: 'none', fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif",
                fontSize: 11, fontWeight: 700, cursor: fixing ? 'wait' : 'pointer',
                opacity: fixing ? 0.7 : 1,
              }}
            >
              <RefreshCw size={12} className={fixing ? 'animate-spin' : ''} />
              {fixing ? 'جاري الإصلاح...' : 'إصلاح الصور'}
            </button>
          </div>
        </div>

        {/* Fix Result */}
        {fixResult && (
          <div style={{
            padding: '8px 16px', background: `${T.green}10`,
            borderBottom: `0.5px solid ${T.green}22`,
            fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 11, color: T.green,
          }}>
            {fixResult}
          </div>
        )}

        {/* Content Section */}
        <div style={{ padding: '20px 24px' }}>
          {/* Category + Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {data.category && (
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                background: `${T.accent}18`, color: T.accent,
                fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 10, fontWeight: 700,
                border: `0.5px solid ${T.accent}33`,
              }}>
                {data.category}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.text3, fontSize: 10 }}>
              <Calendar size={10} />
              {new Date(data.publishedAt || data.createdAt).toLocaleDateString('ar-SA')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.text3, fontSize: 10 }}>
              <Eye size={10} />
              {data.viewCount} مشاهدة
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.text3, fontSize: 10 }}>
              <ImageIcon size={10} />
              {totalImages}/{slides.length} شرائح بصور
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontWeight: 700,
            fontSize: 24, color: T.text, lineHeight: 1.6,
            marginBottom: 8,
          }}>
            {data.title}
          </h1>

          {data.subtitle && (
            <p style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 14, color: T.text2, marginBottom: 16 }}>
              {data.subtitle}
            </p>
          )}

          {/* Slides Summary */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>
              الشرائح ({slides.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slides.map((slide, i) => {
                const imageUrl = slide.image_url || slide.content?.image_url
                const hasImage = isValidImageUrl(imageUrl)
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: T.bgLight, borderRadius: 8,
                    border: `0.5px solid ${hasImage ? T.border : `${T.red}22`}`,
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: hasImage ? `${T.green}18` : `${T.red}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                      color: hasImage ? T.green : T.red,
                    }}>
                      {slide.number || i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 12, color: T.text }}>
                        {slide.title || slide.type}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: hasImage ? `${T.green}10` : `${T.red}10`,
                      color: hasImage ? T.green : T.red,
                      fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 9,
                    }}>
                      {hasImage ? (isPollinationsUrl(imageUrl) ? 'AI' : 'R2') : 'مفقودة'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: `0.5px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <a href={`/infographics/${data.slug}`} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              background: T.accent, color: '#fff',
              border: 'none', fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 11,
              cursor: 'pointer', textDecoration: 'none',
            }}>
              <ExternalLink size={13} />
              عرض عام
            </a>
            <button
              onClick={() => setLiked(!liked)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8,
                background: liked ? `${T.red}18` : T.bgLight,
                border: `0.5px solid ${liked ? T.red : T.border}`,
                color: liked ? T.red : T.text2,
                fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 11,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Heart size={13} fill={liked ? T.red : 'none'} />
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              background: T.bgLight, border: `0.5px solid ${T.border}`,
              color: T.text2, fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 11,
              cursor: 'pointer',
            }}>
              <Share2 size={13} />
              مشاركة
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        maxWidth: 900, margin: '16px auto 0',
        padding: '10px 16px', background: `${T.amber}06`,
        border: `0.5px solid ${T.amber}18`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertTriangle size={14} style={{ color: T.amber, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif", fontSize: 10, color: T.amber }}>
          المحتوى التحليلي لأغراض تعليمية فقط ولا يُعد نصيحة استثمارية. تداول بمسؤولية.
        </span>
      </div>
    </div>
  )
}
