// ─── Bookmark with Folders Component ──────────────────────────────
// Enhanced bookmark system with folder organization
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIsBookmarked } from '@/stores/user-store';
import { useToast } from '@/hooks/use-toast';

interface BookmarkFolder {
  id: string;
  name: string;
  color: string;
  articleIds: string[];
}

interface BookmarkWithFoldersProps {
  articleId: string;
  articleTitle: string;
  variant?: 'default' | 'hero';
  onToggle: () => void;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

const STORAGE_KEY = 'rouaa-bookmark-folders';

function getDefaultFolders(locale?: string): BookmarkFolder[] {
  if (locale === 'es') {
    return [
      { id: 'favorites', name: 'Favoritos', color: 'var(--gold)', articleIds: [] },
      { id: 'read-later', name: 'Leer después', color: 'var(--cyan)', articleIds: [] },
      { id: 'important', name: 'Importante', color: 'var(--bear)', articleIds: [] },
    ];
  }
  if (locale === 'tr') {
    return [
      { id: 'favorites', name: 'Favoriler', color: 'var(--gold)', articleIds: [] },
      { id: 'read-later', name: 'Sonra Oku', color: 'var(--cyan)', articleIds: [] },
      { id: 'important', name: 'Önemli', color: 'var(--bear)', articleIds: [] },
    ];
  }
  if (locale === 'en') {
    return [
      { id: 'favorites', name: 'Favorites', color: 'var(--gold)', articleIds: [] },
      { id: 'read-later', name: 'Read Later', color: 'var(--cyan)', articleIds: [] },
      { id: 'important', name: 'Important', color: 'var(--bear)', articleIds: [] },
    ];
  }
  if (locale === 'fr') {
    return [
      { id: 'favorites', name: 'Favoris', color: 'var(--gold)', articleIds: [] },
      { id: 'read-later', name: 'À lire', color: 'var(--cyan)', articleIds: [] },
      { id: 'important', name: 'Important', color: 'var(--bear)', articleIds: [] },
    ];
  }
  return [
    { id: 'favorites', name: 'المفضلة', color: 'var(--gold)', articleIds: [] },
    { id: 'read-later', name: 'قراءة لاحقة', color: 'var(--cyan)', articleIds: [] },
    { id: 'important', name: 'مهم', color: 'var(--bear)', articleIds: [] },
  ];
}

function getFolders(locale?: string): BookmarkFolder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultFolders(locale);
}

function saveFolders(folders: BookmarkFolder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch {}
}

export function BookmarkWithFolders({ articleId, articleTitle, variant = 'default', onToggle, locale = 'ar' }: BookmarkWithFoldersProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const { toast } = useToast();
  const isBookmarked = useIsBookmarked(articleId);
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    setFolders(getFolders(locale));
  }, [locale]);

  const articleInFolder = folders.some(f => f.articleIds.includes(articleId));
  const articleFolders = folders.filter(f => f.articleIds.includes(articleId));

  const handleAddToFolder = useCallback((folderId: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        if (f.articleIds.includes(articleId)) {
          return { ...f, articleIds: f.articleIds.filter(id => id !== articleId) };
        }
        return { ...f, articleIds: [...f.articleIds, articleId] };
      }
      return f;
    });
    setFolders(updated);
    saveFolders(updated);
    // Also toggle main bookmark
    const folder = updated.find(f => f.id === folderId);
    if (folder?.articleIds.includes(articleId)) {
      if (!isBookmarked) onToggle();
    }
  }, [folders, articleId, isBookmarked, onToggle]);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: BookmarkFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: 'var(--purple)',
      articleIds: [],
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    saveFolders(updated);
    setNewFolderName('');
  }, [newFolderName, folders]);

  const isHero = variant === 'hero';

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setShowFolders(!showFolders); }}
        className={`flex items-center gap-1.5 ${isHero ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-lg text-[11px] font-medium transition-all ${isHero ? 'backdrop-blur-md' : 'hover:bg-[var(--bg4)]'}`}
        style={{
          border: isBookmarked
            ? `1px solid ${isHero ? 'rgba(0,201,167,0.3)' : 'rgba(0,201,167,0.25)'}`
            : `1px solid ${isHero ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
          color: isBookmarked ? 'var(--cyan)' : isHero ? 'rgba(255,255,255,0.7)' : 'var(--text3)',
          background: isBookmarked ? (isHero ? 'rgba(0,201,167,0.2)' : 'var(--cyan2)') : (isHero ? 'rgba(0,0,0,0.4)' : 'transparent'),
        }}
        aria-label={isBookmarked ? t('إزالة من المحفوظات', 'Remove from bookmarks', 'Retirer des favoris', 'Yer imlerinden kaldır', 'Eliminar de guardados') : t('إضافة إلى المحفوظات', 'Add to bookmarks', 'Ajouter aux favoris', 'Yer imlerine ekle', 'Añadir a guardados')}
      >
        {isBookmarked ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--cyan)" stroke="var(--cyan)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        )}
        {isBookmarked ? t('محفوظ', 'Saved', 'Enregistré', 'Kaydedildi', 'Guardado') : t('حفظ', 'Save', 'Enregistrer', 'Kaydet', 'Guardar')}
        {articleFolders.length > 0 && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
        )}
      </button>

      {/* Folders dropdown */}
      {showFolders && (
        <div
          className="absolute top-full mt-2 right-0 z-50 p-3 rounded-xl min-w-[220px]"
          style={{
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{t('حفظ في مجلد', 'Save to folder', 'Enregistrer dans le dossier', 'Klasöre kaydet', 'Guardar en carpeta')}</span>
          </div>

          {/* Quick bookmark toggle */}
          <button
            onClick={() => { onToggle(); setShowFolders(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium mb-2 transition-all"
            style={{
              background: isBookmarked ? 'var(--cyan2)' : 'transparent',
              color: isBookmarked ? 'var(--cyan)' : 'var(--text3)',
              border: '1px solid var(--border)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={isBookmarked ? 'var(--cyan)' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {isBookmarked ? t('إزالة من المحفوظات', 'Remove from bookmarks', 'Retirer des favoris', 'Yer imlerinden kaldır', 'Eliminar de guardados') : t('إضافة إلى المحفوظات', 'Add to bookmarks', 'Ajouter aux favoris', 'Yer imlerine ekle', 'Añadir a guardados')}
          </button>

          <div className="mb-2" style={{ borderTop: '1px solid var(--border)' }} />

          {/* Folder list */}
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => handleAddToFolder(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-[var(--bg3)]"
              style={{ color: 'var(--text2)' }}
            >
              <div className="w-3 h-3 rounded-sm" style={{ background: folder.color }} />
              <span className="flex-1 text-right">{folder.name}</span>
              {folder.articleIds.includes(articleId) && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}

          {/* Create new folder */}
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={t('مجلد جديد...', 'New folder...', 'Nouveau dossier...', 'Yeni klasör...', 'Nueva carpeta...')}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-40"
                style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
