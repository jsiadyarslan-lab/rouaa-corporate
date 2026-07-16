// ─── Kullanım Koşulları Sayfası (Türkçe) ────────────────────────────────────
// Sunucu Bileşeni — Rouaa platformu için Kullanım Koşulları

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "Rouaa finansal haber ve analiz platformunun Kullanım Koşulları. Hizmetlerimizin kullanımını yöneten koşulları okuyun.",
};

export default function TrTermsPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Kullanım Koşulları
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Son güncelleme: Mart 2025
          </p>
        </div>

        {/* Intro */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Rouaa'ya hoş geldiniz. Bu Kullanım Koşulları (&quot;Koşullar&quot;), web sitemiz,
            mobil uygulamalarımız, API'miz ve tüm ilişkili hizmetlerimiz (toplu olarak
            &quot;Hizmetler&quot;) dahil olmak üzere Rouaa platformuna erişiminizi ve kullanımınızı
            yönetir. Hizmetlerimize erişerek veya kullanarak bu Koşullara bağlı olmayı
            kabul edersiniz. Bu Koşulların herhangi bir bölümüne katılmıyorsanız,
            Hizmetleri derhal kullanmayı bırakmalısınız.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Bu Koşullar, siz (&quot;Kullanıcı&quot;, &quot;siz&quot; veya &quot;sizin&quot;) ile Rouaa (&quot;biz&quot;,
            &quot;bizim&quot; veya &quot;bize&quot;) arasında yasal olarak bağlayıcı bir anlaşma oluşturur.
            Bu Koşulları istediğimiz zaman değiştirme hakkını saklı tutarız ve herhangi
            bir değişiklik sonrasında Hizmetleri kullanmaya devam etmeniz, güncellenmiş
            Koşulları kabul ettiğiniz anlamına gelir.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Uygunluk',
            content: `Hizmetlerimizi kullanmak için en az 18 yaşında olmalısınız. Hizmetleri kullanarak, en az 18 yaşında olduğunuzu ve bu Koşulları kabul etme hukuki kapasitesine sahip olduğunuzu beyan ve garanti edersiniz. Hizmetleri bir kuruluş adına kullanıyorsanız, bu kuruluşu bu Koşullara bağlama yetkiniz olduğunu beyan edersiniz. 18 yaşından küçük kullanıcıların platforma erişimi veya kullanımı kesinlikle yasaktır.`,
          },
          {
            title: '2. Hesap kaydı',
            content: `Hizmetlerin bazı özellikleri hesap oluşturulmasını gerektirebilir. Kayıt sırasında doğru, güncel ve eksiksiz bilgi sağlamayı ve gerektiğinde bu bilgileri güncellemeyi kabul edersiniz. Hesap kimlik bilgilerinizin korunmasından ve hesabınız altında gerçekleşen tüm faaliyetlerden sorumlusunuz. Hesabınızın yetkisiz kullanımını derhal bize bildirmelisiniz. Hesap güvenliğinizi koruyamamanızdan kaynaklanan herhangi bir kayıp veya hasardan sorumlu olmayacağız.`,
          },
          {
            title: '3. Kabul edilebilir kullanım',
            content: `Hizmetleri yalnızca yasal amaçlarla ve bu Koşullara uygun olarak kullanmayı kabul edersiniz. Şunları yapmamalısınız: (a) Hizmetleri geçerli yasa veya yönetmelikleri ihlal edecek şekilde kullanmak; (b) Hizmetlerin veya ilişkili sistemlerinin herhangi bir bölümüne yetkisiz erişim sağlamaya çalışmak; (c) Hizmetleri kötü amaçlı yazılım, spam veya yetkisiz içerik iletmek için kullanmak; (d) Hizmetlerin bütünlüğüne veya performansına müdahale etmek veya bozmak; (e) önceden yazılı onayımız olmadan Hizmetlerin herhangi bir bölümünü kopyalamak, değiştirmek veya dağıtmak; (f) yetkisiz olarak Hizmetlere erişmek için otomatik komut dosyaları veya botlar kullanmak.`,
          },
          {
            title: '4. Fikri mülkiyet',
            content: `Hizmetlerdeki tüm içerik, özellik ve işlevler — bunlar arasında ancak bunlarla sınırlı olmamak üzere metinler, grafikler, logolar, simgeler, görseller, ses klipleri, veri derlemeleri ve yazılımlar — Rouaa veya lisans verenlerinin münhasır mülkiyetindedir ve uluslararası telif hakkı, ticari marka, patent ve diğer fikri mülkiyet yasalarıyla korunmaktadır. Açık yazılı yetkimiz olmadan Hizmetlerdeki herhangi bir içeriği çoğaltamaz, dağıtamaz, değiştiremez, türev eserler oluşturamaz, herkese açık olarak görüntüleyemez veya ticari olarak kullanamazsınız.`,
          },
          {
            title: '5. Finansal bilgi uyarısı',
            content: `Hizmetler finansal haberler, analizler ve işlem sinyallerini yalnızca bilgilendirme amacıyla sağlar. Platformdaki hiçbir şey finansal, yatırım, hukuki veya vergi tavsiyesi oluşturmaz. Herhangi bir içeriği bir finansal enstrümanı satın alma, satma veya elde tutma tavsiyesi veya teklifi olarak yorumlamamalısınız. Tüm işlem ve yatırım kararları tamamen sizin sorumluluğunuzdadır. Geçmiş performans gelecekteki sonuçların göstergesi değildir ve herhangi bir yatırım kararı almadan önce her zaman nitelikli bir finansal danışmana başvurmalısınız.`,
          },
          {
            title: '6. Sorumluluk sınırlaması',
            content: `Yasanın izin verdiği en üst düzeye kadar, Rouaa ve yöneticileri, direktörleri, çalışanları ve acenteleri, Hizmetlerin kullanımınızdan veya bunlarla bağlantılı olarak doğan dolaylı, teselsül, özel, sonuç olarak doğan veya cezai her türlü zarardan — bunlar arasında ancak bunlarla sınırlı olmamak üzere kâr kaybı, veri kaybı veya müşteri kaybı — sorumlu olmayacaktır. Bu sınırlama, bu zararların hangi hukuki teoriye dayanıldığına bakılmaksızın, sözleşme, haksız fiil, katı sorumluluk veya başka bir şekilde talep edilip edilmediğine bakılmaksızın uygulanır.`,
          },
          {
            title: '7. Tazminat',
            content: `Rouaa'yı ve yöneticilerini, direktörlerini, çalışanlarını ve acentelerini, Hizmetlere erişiminiz veya kullanımınızdan, bu Koşulları ihlalinizden veya üçüncü bir tarafın haklarını ihlal etmenizden kaynaklanan veya bunlarla bağlantılı tüm talepler, sorumluluklar, zararlar, kayıplar ve masraflardan (makul avukatlık ücretleri dahil) tazmin etmeyi, savunmayı ve zararsız kalmayı kabul edersiniz.`,
          },
          {
            title: '8. Fesih',
            content: `Hizmetlere erişiminizi herhangi bir zamanda, sebepli veya sebepsiz ve önceden bildirimde bulunarak veya bulunmadan askıya alma veya sonlandırma hakkını saklı tutarız. Fesih durumunda, Hizmetleri kullanma hakkınız derhal sona erecektir. Bu Koşulların doğası gereği fesihten sonra da geçerli kalması gereken hükümleri — mülkiyet hükümleri, garanti reddi beyanları, tazminat ve sorumluluk sınırlamaları dahil — fesihten sonra da yürürlükte kalacaktır.`,
          },
          {
            title: '9. Uygulanacak yasa',
            content: `Bu Koşullar, Rouaa'nın faaliyet gösterdiği yetki alanının yasalarına göre yönetilecek ve yorumlanacaktır; bu yasanın hukuki çatışma hükümleri dikkate alınmaz. Bu Koşullardan kaynaklanan veya bunlarla bağlantılı herhangi bir uyuşmazlık, geçerli tahkim kurallarına göre bağlayıcı tahkim yoluyla veya ilgili yetki alanının mahkemelerinde çözülecektir.`,
          },
          {
            title: '10. İletişim',
            content: `Bu Kullanım Koşulları hakkında sorularınız varsa, lütfen İletişim sayfamız üzerinden bize ulaşın veya legal@rouaa.com adresine e-posta gönderin. Endişelerinizi hızlı ve şeffaf bir şekilde ele almayı taahhüt ediyoruz.`,
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
      </div>
    </main>
  );
}
