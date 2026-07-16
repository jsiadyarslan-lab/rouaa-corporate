export default function TrFinancialDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text3)' }} dir="ltr">
        ⚠️ Gösterilen finansal içerik yatırım tavsiyesi niteliğinde değildir. Herhangi bir finansal karar almadan önce lisanslı bir finansal danışmana başvurun.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.15)' }} dir="ltr">
      <div className="flex items-center gap-2 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>Finansal Uyarı</span>
      </div>
      <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: 'var(--text2)' }}>
        <p>Rouaa platformunda sunulan tüm bilgi ve analizler yalnızca bilgilendirme ve eğitim amaçlıdır ve finansal tavsiye, yatırım önerisi veya işlem yapmaya çağrı niteliğinde değildir.</p>
        <p>Finansal piyasaların geçmiş performansı gelecek sonuçları garanti etmez. Finansal enstrümanlarda trading yüksek risk taşır ve tüm sermayenizi kaybedebilirsiniz.</p>
        <p>Yatırım kararı almadan önce kendi araştırmanızı yapmalı ve lisanslı bir finansal danışmana başvurmalısınız. Rouaa platformu, yayınlanan bilgilerin kullanımından kaynaklanan finansal kayıplardan sorumlu değildir.</p>
      </div>
    </div>
  );
}
