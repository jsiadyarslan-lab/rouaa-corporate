// ─── Finansal Uyarı Sayfası (Türkçe) ─────────────────────────────────────────
// Sunucu Bileşeni — Rouaa platformu için Finansal Uyarı

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finansal Uyarı',
  description:
    "Rouaa platformu için Finansal Uyarı. Yatırım riskleri ve finansal içeriğimizin sınırlamaları hakkında önemli bilgiler.",
};

export default function TrDisclaimerPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Finansal Uyarı
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Son güncelleme: Mart 2025
          </p>
        </div>

        {/* Critical Warning Banner */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(255,77,106,0.06)',
            border: '1px solid rgba(255,77,106,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff4d6a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: '2px' }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#ff4d6a' }}>
                Önemli risk uyarısı
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
                Finansal piyasalarda işlem yapmak önemli kayıp riski taşır ve
                tüm yatırımcılar için uygun değildir. Yatırımların değeri düşebileceği gibi
                yükselebilir ve ilk yatırımınızdan daha fazlasını kaybedebilirsiniz.
                Kaybetmeyi göze alamayacağınız parayla asla işlem yapmayın.
              </p>
            </div>
          </div>
        </div>

        {/* Not Financial Advice */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <h2
            className="text-base font-bold mb-3"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Finansal tavsiye değildir
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Rouaa platformunda sunulan tüm içerik — bunlar arasında ancak bunlarla sınırlı olmamak
            üzere haber makaleleri, analitik raporlar, işlem sinyalleri, piyasa yorumları,
            infografikler ve ekonomik takvim verileri — yalnızca bilgilendirme ve eğitim amaçlıdır.
            Bu platformdaki hiçbir şey finansal, yatırım, hukuki, vergi veya başka bir profesyonel
            tavsiye oluşturmaz ve olarak değerlendirilmemelidir.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Sunulan bilgiler bir tavsiye, satın alma veya satma teklifi veya finansal enstrümanlar
            — bunlar arasında ancak bunlarla sınırlı olmamak üzere hisse senetleri, tahviller,
            forex, kripto paralar, emtialar veya türev ürünler — için bir teklif oluşturmaz.
            Herhangi bir yatırım kararı almadan önce her zaman nitelikli bir finansal danışmana
            başvurmalısınız.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: 'İşlem sinyalleri uyarısı',
            content: `Yapay zeka algoritmalarımız tarafından oluşturulan işlem sinyalleri, geçmiş veri modellerine, teknik göstergelere ve piyasa duyarlılık analizine dayanmaktadır. Bu sinyaller gelecekteki sonuçları garanti etmez ve kesin alım veya satım önerisi olarak değerlendirilmemelidir. Sinyaller, kendi analiziniz ve bağımsız karar süreciniz için olası girdilerden biri olarak sunulmaktadır. Bir sinyal üzerinde harekete geçip geçmemeyi belirlemekten yalnızca siz sorumlusunuz ve işlem kararlarınızın sonuçlarının tüm sorumluluğunu üstlenirsiniz.`,
          },
          {
            title: 'Kayıp riski',
            content: `İşlem ve finansal yatırım, yatırılan sermayenizin bir kısmını veya tamamını kaybetme olasılığı dahil olmak üzere doğal riskler taşır. Risk derecesi farklı varlık sınıflarına ve piyasa koşullarına göre değişir. Forex, CFD'ler ve vadeli sözleşmeler gibi kaldıraçlı ürünler yüksek risk düzeyi taşır ve tüm yatırımcılar için uygun olmayabilir. Herhangi bir işlem faaliyetine girmeden önce mali durumunuzu, yatırım deneyiminizi ve risk toleransınızı dikkatle değerlendirmelisiniz. Geçmiş performans — simüle edilmiş veya gerçek olsun — gelecekteki sonuçların göstergesi değildir.`,
          },
          {
            title: 'Bilgilerin doğruluğu',
            content: `Doğru, zamanında ve güvenilir bilgi sağlamak için çaba göstersek de, Rouaa, platformda yer alan bilgilerin, ürünlerin, hizmetlerin veya ilişkili grafiklerin tamlığı, doğruluğu, güvenilirliği, uygunluğu veya kullanılabilirliği konusunda açık veya zımni hiçbir beyan veya garanti vermez. Piyasa verileri gecikmeli olabilir ve fiyatlar gerçek piyasa fiyatlarından farklılık gösterebilir. Bu nedenle bu bilgilere duyduğunuz güven tamamen kendi riskinizdedir.`,
          },
          {
            title: 'Yapay zeka tarafından oluşturulan içerik',
            content: `Bu platformdaki içeriğin bir kısmı yapay zeka sistemleri tarafından oluşturulmakta veya desteklenmektedir. Kalite kontrolleri ve editoryal denetim uyguluyor olsak da, yapay zeka tarafından oluşturulan içerik zaman zaman yanlışlıklar, eksiklikler veya yanlış yorumlamalar içerebilir. Yatırım kararlarınız için yalnızca yapay zeka tarafından oluşturulan analize güvenmemelisiniz. Bu platformda bulunan herhangi bir içerik üzerine hareket etmeden önce kritik bilgileri her zaman bağımsız kaynaklardan ve profesyonel danışmanlardan doğrulayın.`,
          },
          {
            title: 'Kâr garantisi yoktur',
            content: `Rouaa, platformumuzun veya hizmetlerimizin kullanımından belirli bir sonuç, getiri veya kâr garanti etmez. Sunulan tüm projeksiyonlar, tahminler veya tahminler varsayımsal niteliktedir ve gerçek piyasa koşullarını yansıtmayabilecek varsayımlara dayanmaktadır. Belirli bir strateji, sinyal veya analizin kâr sağlayacağı veya kayıpları önleyeceği konusunda hiçbir garanti yoktur. Finansal piyasalar doğası gereği öngörülemezdir ve en gelişmiş modeller bile kayıp riskini ortadan kaldıramaz.`,
          },
          {
            title: 'Üçüncü taraf içeriği',
            content: `Platform, haber ajansları, veri sağlayıcıları ve sosyal medya platformları dahil olmak üzere üçüncü taraf kaynaklardan bağlantılar veya içerik barındırabilir. Rouaa, herhangi bir üçüncü taraf materyalin doğruluğu, yasallığı veya içeriği konusunda onay vermez, doğrulamaz ve hiçbir sorumluluk kabul etmez. Üçüncü taraf içeriğin dahil edilmesi onay veya tavsiye anlamına gelmez. Üçüncü taraf içeriğe kendi riskinizle erişirsiniz.`,
          },
          {
            title: 'Yetki kısıtlamaları',
            content: `Rouaa tarafından sağlanan Hizmetler tüm yetki alanlarında mevcut veya uygun olmayabilir. Platformun kullanımının tüm geçerli yerel, ulusal ve uluslararası yasa ve yönetmeliklere uygun olmasını sağlamak sizin sorumluluğunuzdadır. Rouaa, içeriğin veya hizmetlerin tüm yerlerde kullanım için uygun veya mevcut olduğunu beyan etmez. Finansal işlemlerin veya finansal bilgi sağlanmasının kısıtlandığı bir yetki alanından platforma erişirseniz, bunu kendi riskinizle yaparsınız ve yerel yasalara uyumdan tek başına sorumlusunuz.`,
          },
          {
            title: 'Sorumluluk sınırlaması',
            content: `Geçerli yasaların izin verdiği en üst düzeye kadar, Rouaa, yöneticileri, çalışanları, ortakları, acenteleri, tedarikçileri ve bağlı kuruluşları, platforma erişmenizden veya kullanmanızdan (veya erişememenizden veya kullanamamanızdan), platformdan elde edilen herhangi bir içerikten veya platformdaki herhangi bir üçüncü tarafın davranış veya içeriğinden kaynaklanan dolaylı, teselsül, özel, sonuç olarak doğan veya cezai her türlü zarardan, kâr kaybı, veri kaybı veya diğer maddi olmayan kayıplar dahil olmak üzere sorumlu tutulamaz.`,
          },
        ].map(section => (
          <div
            key={section.title}
            className="rounded-2xl p-6 mb-4"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              {section.title}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              {section.content}
            </p>
          </div>
        ))}

        {/* Bottom warning */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(212,175,55,0.04)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--gold, #d4af37)' }}>
            Sorumlu şekilde işlem yapın
          </p>
          <p className="text-xs leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Her zaman kendi araştırmanızı yapın ve yatırım kararları almadan önce
            lisanslı bir finansal danışmana başvurun. Kaybetmeyi göze alamayacağınızdan
            fazlasını asla yatırmayın.
          </p>
        </div>
      </div>
    </main>
  );
}
