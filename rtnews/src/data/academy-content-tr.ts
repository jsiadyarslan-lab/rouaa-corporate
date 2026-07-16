// ════════════════════════════════════════════════════════════════════
// Lesson Body Content Translations — Turkish (V1042)
// ════════════════════════════════════════════════════════════════════
// 32 dersin tam Türkçe çevirileri (içerik, anahtar noktalar, pratik örnek).

import type { LessonBodyTranslation } from './academy-content-en';

export const LESSON_BODIES_TR: Record<string, LessonBodyTranslation> = {
  // ── Forex (5 ders) ──
  l1: {
    content: 'Forex piyasası veya döviz piyasası, günlük işlem hacmi 7,5 trilyon doları aşan dünyanın en büyük finansal piyasasıdır. Pazartesi sabahı Sidney oturumunun açılışından Cuma akşamı New York oturumunun kapanışına kadar haftada beş gün 24 saat çalışır. Hisse senedi piyasalarının aksine, Forex için merkezi bir borsa yoktur — işlemler bankalar, finansal kurumlar ve aracılar arasındaki küresel elektronik ağ üzerinden yapılır.\n\nForex kelimesi Foreign Exchange kısaltmasından gelir ve aynı anda bir döviz alıp diğerini sattığınız döviz çiftleri üzerinden işlem yapmayı içerir. En çok işlem gören çiftler USD içeren majörlerdir: EUR/USD, USD/JPY ve GBP/USD gibi.\n\nForex piyasası faiz oranları, enflasyon, ekonomik veriler ve jeopolitik olaylar dahil birçok ekonomik ve politik faktörden etkilenir. Bu faktörleri anlamak ve dövizler üzerindeki etkilerini analiz edebilmek başarılı işlemin temelidir.',
    keyPoints: [
      'Forex, günlük hacmi 7,5 trilyon doları aşan dünyanın en büyük finansal piyasasıdır',
      'Ardışık küresel oturumlar üzerinden haftada beş gün 24 saat çalışır',
      'İşlem, bir döviz alıp diğerini sattığınız döviz çiftleri üzerinden yapılır',
      'Ekonomik ve politik faktörler döviz fiyatlarının temel iticileridir',
    ],
    practicalExample: 'EUR/USD\'yı 1,0850\'den almak isterseniz, euro alır ve dolar satarsınız. Fiyat 1,0900\'e çıkarsa kârınız 50 piptir. Mini lot (0,01) ile her pip 0,10$ değerindedir, bu yüzden kârınız 5$ olur. Ancak fiyat 1,0800\'e düşerse 5$ kaybedersiniz.',
  },
  l2: {
    content: 'Döviz işlemi çiftler üzerinden yapılır; her çift bir temel döviz ve bir kotasyon dövizinden oluşur. Temel döviz çiftin ilk sırasındadır, kotasyon ise ikinci. Örneğin EUR/USD\'de euro temel döviz, dolar kotasyondur. Görüntülenen fiyat, temel dövizin bir birimini almak için ne kadar kotasyon dövizine ihtiyaç duyduğunu gösterir.\n\nÜç ana döviz çifti kategorisi vardır: USD içeren ve en likit, en dar spreadli majörler; EUR/GBP gibi USD içermeyen çaprazlar; ve USD/TRY gibi gelişmekte olan piyasalar dövizi içeren egzotikler.\n\nForex\'te işlem farklı emir türleri üzerinden yapılır: piyasa emri anında mevcut fiyattan gerçekleşir ve bekleyen emir fiyat belirli bir seviyeye ulaştığında gerçekleşir. İşlemleri otomatik yönetmek için zarar durdurma ve kar al emirleri de kullanabilirsiniz.',
    keyPoints: [
      'Her döviz çifti bir temel döviz (ilk) ve bir kotasyon dövizinden (ikinci) oluşur',
      'USD içeren majörler en likit ve en dar spreadli olanlardır',
      'Emir türleri piyasa emri, bekleyen emir, zarar durdurma ve kar al içerir',
      'Fiyatlar her zaman iki ondalık basamakla, standart Forex için dört basamakla gösterilir',
    ],
    practicalExample: 'GBP/USD\'yı 1,2650\'den 1,2 pip spreadle almak istiyorsunuz. Alış fiyatı 1,26512 ve satış fiyatı 1,26500. Mini lot (0,1) alıp zarar durdurmayı 1,2620\'ye, kar almayı 1,2720\'ye koyarsanız riskiniz 30 pip, ödülünüz 70 piptir. Risk-ödül oranı 1:2,3\'tür ki bu iyi bir orandır.',
  },
  l3: {
    content: 'Döviz çifti fiyatlarını okumayı anlamak her trader için ilk adımdır. Fiyat, satış fiyatı — komisyoncunun sizden almak için sunduğu fiyat — ve alış fiyatı — komisyoncunun size satmak için sunduğu fiyattan oluşur. İkisi arasındaki fark spreaddir ve komisyoncunun kâr kaynağıdır.\n\nPip, fiyat değişiminin en küçük birimidir. Çoğu Forex çiftinde pip dördüncü ondalık basamaktır, ancak JPY çiftlerinde ikincidir. Pip değeri lot büyüklüğüne göre değişir: standart lot (1,0) yaklaşık pip başına 10$ ve mikro lot (0,01) 0,10$\'dır.\n\nEUR/USD\'nın yükseleceğini beklediğinizde onu alırsınız (Long). Düşeceğini beklediğinizde satarsınız (Short). Her iki durumda da doğru yönden kâr edebilirsiniz — bu, Forex\'in geleneksel piyasalara göre bir avantajıdır.',
    keyPoints: [
      'Satış fiyatı her zaman alış fiyatından düşüktür ve fark spreaddir',
      'Pip, en küçük değişim birimidir — çoğu çiftte dördüncü ondalık basamak',
      'Pip değeri lot büyüklüğüne bağlıdır: standart lot = yaklaşık pip başına 10$',
      'Alım ve satım emirleriyle hem yükselen hem düşen piyasalardan kâr edebilirsiniz',
    ],
    practicalExample: 'USD/CHF\'den 0,5 lot 0,8850\'den alıp 0,8900\'den satarsanız fark 50 piptir. Bu çiftte bir lot için pip değeri yaklaşık 11,20$\'dır, bu yüzden kârınız = 50 × 11,20 × 0,5 = 280$\'dır. Ancak 0,8800\'den satarsanız 50 pip yani 280$ kaybedersiniz.',
  },
  l4: {
    content: 'Forex piyasası 24 saat çalışır, ancak likidite ve oynaklık oturumlar arasında önemli ölçüde değişir. Üç ana oturum vardır: Asya oturumu (Tokyo) 00:00-09:00 GMT, Avrupa oturumu (Londra) 07:00-16:00 ve Amerika oturumu (New York) 12:00-21:00.\n\nEn aktif ve likit dönemler 12:00-16:00 GMT arası Londra ve New York oturumlarının örtüştüğü zamandır; günlük Forex hacminin %50\'sinden fazlası burada işlem görür. Bu zaman aktif işlem için idealdir çünkü fiyat hareketleri daha güçlü ve desenler daha net olur.\n\nHaftanın günleri de önemlidir: Salı, Çarşamba ve Perşembe genellikle en fazla ekonomik veriyi içerdikleri için en iyi işlem günleridir. Pazartesi hafta başında sessiz olabilir ve Cuma 16:00 GMT\'den sonra hacim haftalık kapanış yaklaştıkça belirgin şekilde düşer.',
    keyPoints: [
      'Londra-New York örtüşmesi (12:00-16:00 GMT) en aktif dönemdir',
      'Asya oturumu nispeten sessizdir ve JPY ile AUD çiftleri için uygundur',
      'Salı, Çarşamba ve Perşembe hareket ve fırsat açısından en iyi işlem günleridir',
      'Yeni başlayanlar yüksek etkili haberler sırasında işlem yapmaktan kaçının',
    ],
    practicalExample: 'Körfezli bir trader, en iyi işlem zamanının yerel saatiyle 15:00-19:00 arası olduğunu ve bunun Londra-New York örtüşmesine denk geldiğini fark eder. İşlemlerini bu dört saatte açmayı planlar ve günün geri kalanında sadece piyasayı izler, bu da işlem kalitesini artırır ve rastgele işlemi azaltır.',
  },
  l5: {
    content: 'Forex\'te kâr ve zarar hesaplama üç faktöre bağlıdır: işlem büyüklüğü (lot), kazanılan veya kaybedilen pip sayısı ve pip değeri. Standart lot temel dövizin 100.000 birimine eşittir, mini lot 10.000 ve mikro lot 1.000\'dir.\n\nUSD ile biten çiftlerde (EUR/USD ve GBP/USD gibi) standart lot için pip değeri tam olarak 10 dolardır. Diğer çiftlerde pip değeri mevcut döviz kuruna göre değişir. Bu yüzden yeni başlayanlar daha basit hesaplama için USD ile biten çiftlerde pratik yapmayı tercih eder.\n\nTemel kâr formülü: Kâr = pip sayısı × pip değeri × lot büyüklüğü. Örnek: EUR/USD\'da 0,3 lotluk bir işlemde 40 pip kazanırsanız kâr = 40 × 10 × 0,3 = 120$. Net kârı hesaplamak için spread ve komisyonlar bu kârdan düşülür.',
    keyPoints: [
      'Standart lot = 100.000 birim, mini = 10.000, mikro = 1.000',
      'USD çiftlerinde standart lot için pip değeri tam olarak 10 dolardır',
      'Kâr formülü: pip sayısı × pip değeri × lot büyüklüğü',
      'Spread ve komisyonlar kârlardan düşülür ve zararlara eklenir',
    ],
    practicalExample: 'EUR/USD\'da 0,2 lotla 1,0850\'den alım açıp 1,0920\'de kapatırsınız. Kâr = 70 pip × 10$ × 0,2 = 140$. Spread 1,5 pip ise maliyet = 1,5 × 10 × 0,2 = 3$. Net kâr = 137$. İşlem alım yerine satım olsaydı 143$ (140 + 3 spread) kaybederdiniz.',
  },

  // ── Teknik Analiz (5 ders) ──
  l6: {
    content: 'Teknik analiz, gelecekteki hareketleri tahmin etmek için geçmiş fiyat hareketlerini incelemektir ve üç temel ilkeye dayanır: fiyat her şeyi yansıtır, fiyatlar trendlerde hareket eder ve tarih tekerrür eder. Teknik analist fiyat hareketinin arkasındaki temel nedenlerle değil, fiyatın kendisi ve işlem hacmiyle ilgilenir.\n\nTeknik analizin temel araçları şunları içerir: dönem için açılış, kapanış, en yüksek ve en düşük fiyatları görüntüleyen Japon mumları; fiyatın durduğu alanları belirleyen destek ve direnç seviyeleri; ve hareketli ortalamalar, RSI ve MACD gibi teknik göstergeler.\n\nZaman dilimi teknik analizde çok önemlidir. Haftalık dilimde analiz genel trendin büyük resmini verir, günlük dilim orta trend için ve saatlik dilim işlem girişleri için. Altın kural önce daha büyük zaman dilimini analiz etmek sonra daha küçüklere inmektedirir.',
    keyPoints: [
      'Teknik analiz gelecekteki hareketleri tahmin etmek için fiyat ve hacmi inceler',
      'Üç ilke: fiyat her şeyi yansıtır, fiyatlar trend yapar, tarih tekerrür eder',
      'Japon mumları ve destek/direnç seviyeleri temel araçlardır',
      'Analize daha büyük zaman diliminden başlayın sonra daha küçüklere inin',
    ],
    practicalExample: 'GBP/USD\'yı analiz etmek istiyorsunuz. Haftalık dilimle başlar ve 1,2500\'de destekle net bir yükseliş trendi fark edersiniz. Günlük dilimde, fiyatın haftalık destek yakınında 1,2550\'den döndüğünü görürsünüz. 4 saatlik dilimde yükseliş dönüş deseni fark edersiniz. Kararınız: 1,2560 yakınında alım, 1,2480 altında zarar durdurma ve 1,2750 hedefi.',
  },
  l7: {
    content: 'Japon mumları teknik analizde en yaygın kullanılan grafik türüdür; 18. yüzyılda Japonlar tarafından pirinç ticareti için icat edildi. Her mum dört bilgi görüntüler: belirtilen zaman dilimi için açılış fiyatı, kapanış fiyatı, en yüksek fiyat ve en düşük fiyat.\n\nYükseliş mumu (yeşil) kapanışı açılıştan yüksek olan, düşüş mumu (kırmızı) ise kapanışı açılıştan düşük olandır. Gövde açılış ve kapanış arasındaki mesafedir ve fitiller gövdeden en yüksek ve en düşüğe uzanır. Büyük gövdeli ve kısa fitilli mum net kontrolü, uzun fitilli mum ise tereddütü gösterir.\n\nÇekiç ve yıldız gibi tek mum desenleri önemli dönüş sinyalleri verir. Yutma ve harami gibi çoklu mum desenleri daha güçlü teyit sağlar. En güvenilir sinyaller bu desenler önemli destek/direnç seviyelerinde göründüğünde elde edilir.',
    keyPoints: [
      'Her mum dört fiyat görüntüler: açılış, kapanış, en yüksek, en düşük',
      'Yükseliş mumu: kapanış açılıştan yüksek. Düşüş: tersi',
      'Büyük gövde = güçlü kontrol. Uzun fitiller = tereddüt ve çatışma',
      'Çekiç ve yıldız gibi tek mum desenleri önemli dönüş sinyalleri verir',
    ],
    practicalExample: 'USD/JPY günlük grafiğinde sürekli bir düşüş sonra güçlü bir destek seviyesinde bir çekiç mumu görürsünüz. Çekicin uzun alt fitili ve tepede küçük gövdesi vardır; bu, satıcıların fiyatı aşağı ittiğini ama alıcıların kontrolü geri alıp açılış yakınında kapattığını gösterir. Bu, potansiyel yükseliş dönüş sinyalidir.',
  },
  l8: {
    content: 'Göreceli Güç Endeksi (RSI) 0 ile 100 arasında salınan bir momentum osilatörüdür; 1978\'de J. Welles Wilder tarafından geliştirilmiştir. RSI belirli bir dönemde (genellikle 14 gün) ortalama kazançları ortalama kayıplara karşı hesaplar. Matematiksel formül 70 üzeri okumaların aşırı alımı, 30 altındakilerin aşırı satımı göstermesini sağlar.\n\nAncak aşırı alım hemen dönüş anlamına gelmez. Güçlü bir trendde RSI fiyat yükselmeye devam ederken uzun süre 70 üzerinde kalabilir. Bu yüzden RSI sinyalleri teyit etmek için diğer göstergelerle birlikte en iyi şekilde kullanılır. En güçlü RSI sinyallerinden biri ayrışmadır: fiyat daha yüksek bir tepe kaydederken RSI daha düşük bir tepe kaydederse momentum zayıflığını ve yaklaşan dönüşü gösterir.\n\nGelişmiş kullanımlar: yükseliş ve düşüş arasındaki ayraç olarak 50 seviyesi, RSI üzerinde trend çizgileri ve trene göre ayarlanmış aşırı alım/satım bölgeleri (yükseliş trendinde destek olarak 40-50, düşüş trendinde direnç olarak 50-60).',
    keyPoints: [
      'RSI 0 ile 100 arasında salınır ve fiyat momentumunu ölçer (varsayılan 14 dönem)',
      '70 üzeri = aşırı alım. 30 altı = aşırı satım. Ama mutlaka hemen dönüş değil',
      'Fiyat ve RSI arasındaki ayrışma en güçlü dönüş sinyallerinden biridir',
      '50 seviyesi yükseliş ve düşüş momentumu arasındaki ayraç olarak çalışır',
    ],
    practicalExample: 'EUR/USD günlük grafiğinde fiyat 1,0980\'de yeni bir tepe kaydederken RSI önceki 75\'e kıyasla 68\'de daha düşük bir tepe kaydeder. Bu, yükseliş momentumunun zayıfladığını gösteren düşüş ayrışmasıdır. Sinyali teyit etmek için fiyat üzerinde yükseliş trend çizgisinin kırılmasını beklersiniz, sonra tepe üzerinde zarar durdurmaya sahip bir satım işlemi açarsınız.',
  },
  l9: {
    content: 'MACD göstergesi trend takibi ve momentum ölçme özelliklerini birleştirir ve en yaygın kullanılan göstergelerden biridir. Üç unsurdan oluşur: MACD çizgisi (12 ve 26 hareketli ortalamaları arasındaki fark), sinyal çizgisi (MACD çizgisinin 9 dönemlik hareketli ortalaması) ve histogram (MACD çizgisi ile sinyal çizgisi arasındaki fark).\n\nEn ünlü MACD sinyalleri kesişmelerdir: MACD çizgisi sinyal çizgisinin üstüne kestiğinde alım sinyali, tersi satım sinyalidir. Kesişmeler uç bölgelerde (sıfırın çok üzerinde veya altında) olduğunda daha güvenilirdir. Histogram iki çizgi arasındaki mesafeyi gösterir ve kesişmenin kendisinden önce erken uyarı verir.\n\nMACD üzerinde ayrışma kesişmelerden daha güçlüdür. Fiyat yeni bir tepeye yükselirken MACD daha düşük bir tepe kaydederse bu çelişki yaklaşan dönüşü gösterir. Tüm göstergelerde olduğu gibi MACD yatay piyasalarda yanlış sinyaller verir, bu yüzden fiyat analizi ile birlikte kullanmak en iyisidir.',
    keyPoints: [
      'MACD trend takibini ve momentum ölçümünü tek göstergede birleştirir',
      'MACD çizgisinin sinyal çizgisini yukarı kesmesi = alım. Tersi = satım',
      'Histogram kesişmeden önce erken uyarı verir',
      'MACD ayrışması en güçlü gelişmiş dönüş sinyallerinden biridir',
    ],
    practicalExample: 'GBP/JPY haftalık grafiğinde bir düşüş döneminden sonra MACD çizgisinin sinyal çizgisini yukarı kestiğini fark edersiniz. Histogram kesişmeden üç mum önce negatiften pozitife dönmeye başlamıştır. Bu erken uyarıdır. Grafikte güçlü destekle birlikte destek altında zarar durdurmaya sahip bir alım işlemi açarsınız.',
  },
  l10: {
    content: 'Grafik desenleri grafiklerde tekrarlanan ve gelecekteki fiyat hareketinin yönünü gösteren geometrik şekillerdir. İki ana kategoriye ayrılır: mevcut trendi tersine çeviren dönüş desenleri ve duraklamadan sonra trendin devamını gösteren devam desenleri.\n\nÜnlü dönüş desenleri: Omuz Baş Omuz — en güçlü dönüş sinyallerinden biri, ortadaki en yüksek olan üç tepeden oluşur; Çift Tepe — M harfine benzer, fiyatın direnci iki kez kıramadığını gösterir; ve Çift Dip — W harfine benzer.\n\nDevam desenleri: Yükselen, alçalan ve simetrik Üçgenler; güçlü bir trend içinde kısa geri çekilme dönemleri olan Bayraklar; ve üçgenlere benzeyen ancak trene karşı eğimli Kama desenleri. İşlem hacmi desenleri teyit etmede önemli bir rol oynar: omuz çizgisi kırıldığında hacim artmalıdır.',
    keyPoints: [
      'Düşüş desenleri: omuz baş omuz, çift tepeler, çift dipler',
      'Devam desenleri: üçgenler, bayraklar, kamalar',
      'İşlem hacmi özellikle omuz çizgisi kırılmasında desen geçerliliğini teyit eder',
      'Fiyat hedefi genellikle kırılma noktasından omuz çizgisi mesafesiyle hesaplanır',
    ],
    practicalExample: 'AUD/USD günlük grafiğinde omuz baş omuz deseni fark edersiniz: sol omuz 0,6650, baş 0,6700, sağ omuz 0,6640. Omuz çizgisi 0,6560\'da. Yüksek hacimle omuz çizgisi kırıldığında satım işlemi açarsınız. Hedef = baştan omuz çizgisine mesafe (140 pip) kırılma noktasından çıkarılır: 0,6560 - 0,0140 = 0,6420.',
  },

  // ── Temel Analiz (5 ders) ──
  l11: {
    content: 'Temel analiz, dövizlerin ve finansal varlıkların değerini etkileyen ekonomik, politik ve sosyal faktörleri incelemektir. Teknik analiz fiyat hareketinin kendisine odaklanırken, temel analiz bu hareketlerin arkasındaki temel nedenlere odaklanır. Amaç, bir varlığın gerçek değerini belirlemek ve piyasa fiyatıyla karşılaştırmaktır.\n\nAna temel iticiler şunları içerir: bir dövizde yatırım getirisini belirleyen faiz oranları, satın alma gücünü erozyona uğratan enflasyon, ekonomik sağlığı yansıtan işgücü piyasası verileri, ekonomik büyümenin kapsamlı bir ölçüsü olarak gayri safi yurt içi hasıla ve ani dalgalanmalara neden olan jeopolitik olaylar.\n\nEn iyi traderlar her iki analizi birleştirir: genel yönü belirlemek için temel, giriş ve çıkış noktalarını seçmek için teknik. Temel verileri anlamak fiyatın neden hareket ettiğini bilmenize yardımcı olur ve teknik analiz ne zaman işleme gireceğinizi söyler.',
    keyPoints: [
      'Temel analiz fiyat hareketlerinin arkasındaki ekonomik ve politik nedenleri inceler',
      'Faiz oranları, enflasyon ve işgücü verileri en güçlü temel iticilerdir',
      'Temel ve teknik analizi birleştirmek en iyi sonuçları verir',
      'Ekonomik takvim temel verileri takip etmek için ilk aracınızdır',
    ],
    practicalExample: 'Federal Rezerve faiz oranlarını beklenenden 0,25% artırır. Bu, daha yüksek getiriler yabancı yatırımı çektiği için USD\'yi güçlendirir. USD/JPY\'nin yükseleceğini ve EUR/USD\'nın düşeceğini beklersiniz. Piyasanın ilk tepkisinden sonra en iyi giriş noktasını belirlemek için teknik analizi kullanırsınız.',
  },
  l12: {
    content: 'İstihdam verileri, özellikle aylık NFP raporu, piyasaları en çok etkileyen verilerden biridir. Rapor her ayın ilk Cuma günü yayınlanır ve yeni iş sayısını, işsizlik oranını ve ortalama ücretleri içerir. Bu rakamlardaki herhangi bir sürpriz dakikalar içinde doları yüzlerce pip hareket ettirebilir.\n\nMantık basittir: güçlü istihdam sağlıklı bir ekonomi anlamına gelir ve bu da faiz artışlarını destekleyerek doları güçlendirir. Zayıf istihdam, faiz indirimini içerebilecek ekonomik teşvik ihtiyacı anlamına gelir ve doları zayıflatır. Ortalama ücretler de önemlidir çünkü artan ücretler faiz sıkılaştırması gerektirebilecek enflasyon baskısı anlamına gelir.\n\nNFP etkisi tüm dolar çiftlerine, altına (genellikle ters ilişki) ve hisse endekslerine uzanır. Profesyonel traderlar NFP\'den hemen önce işlem açmaktan kaçınır ve ilk tepkiyi bekler, sonra fiyat stabilize olduktan sonra trendle girer.',
    keyPoints: [
      'NFP her ayın ilk Cuma günü yayınlanır ve doları güçlü şekilde hareket ettirir',
      'Güçlü istihdam = dolar desteği. Zayıf istihdam = dolar zayıflığı',
      'Ortalama ücretler önemli bir enflasyon göstergesidir ve istihdam rakamından daha güçlü olabilir',
      'NFP\'den hemen önce işlem yapmaktan kaçının ve fiyatın stabilize olmasını bekleyin',
    ],
    practicalExample: 'NFP raporu beklenen 180.000\'e karşı 350.000 iş eklendiğini gösterir. Dolar güçlü şekilde yükselir: EUR/USD 5 dakikada 80 pip düşer. Hemen alım yapmak yerine küçük bir geri çekilme beklersiniz sonra trendle satım yaparsınız, haber öncesi tepe üzerinde zarar durdurmayla. Bu, ilk heyecan sırasında işlem yapmaktan daha güvenlidir.',
  },
  l13: {
    content: 'Faiz kararları orta ve uzun vadede döviz fiyatlarının en güçlü iticisidir. Bir merkez bankası faiz oranlarını yükselttiğinde döviz, daha yüksek getiri arayan yatırımcılar için daha çekici hale gelir ve değerini yukarı iter. Kesinti yaparken tersi geçerlidir. Bu, büyük döviz hareketlerinin arkasındaki ana nedendir.\n\nAncak piyasa kararlardan ziyade beklentiler üzerinden işlem görür. Herkes bir artış bekliyorsa ve artış olursa, haber zaten fiyata yansıdığı için fiyat çok hareket etmeyebilir. Piyasaları hareket ettiren sürprizlerdir: beklenmeyen artışlar veya piyasanın beklediğinden daha agresif sinyaller.\n\nEşlik eden bildiri ve başkanın basın toplantısı bazen kararın kendisinden daha önemlidir. "Şahin" (faiz artışına meyilli) veya "güvercin" (indirime meyilli) gibi kelimeler gelen haftalar için piyasa yönünü belirler. Haber işlemleri stratejileri beklentiler ile gerçek sonuç arasındaki boşluğa odaklanır.',
    keyPoints: [
      'Faiz artışı dövizi destekler ve kesinti zayıflatır — birincil itici',
      'Piyasa beklentileri önceden fiyatlar, bu yüzden sadece sürprizler fiyatı güçlü hareket ettirir',
      'Eşlik eden bildiri ve basın toplantısı genellikle kararın kendisinden daha önemlidir',
      'Karar öncesi piyasa beklentilerini faiz sözleşmeleri (Fed Funds Futures) üzerinden takip edin',
    ],
    practicalExample: 'Avrupa Merkez Bankası beklendiği gibi faizi 0,25% artırır, ancak Başkan "daha fazla artış geliyor" der — beklenenden daha güçlü. Euro dolara karşı güçlü şekilde yükselir. Yakın bir destek altında zarar durdurmaya sahip EUR/USD alım işlemine girersiniz ve yeni momentumdan yararlanırsınız.',
  },
  l14: {
    content: 'Tüketici Fiyat Endeksi (CPI) ana enflasyon ölçüsüdür ve çoğu büyük ülkede aylık yayınlanır. Tüketim malları ve hizmetleri sepetinin maliyetindeki değişimi ölçer. Yüksek enflasyon satın alma gücünü erozyona uğratır ve merkez bankalarını faiz artırmaya baskılarken, düşük veya deflasyonist enflasyon onları kesinti yapmaya veya teşvik araçları kullanmaya itebilir.\n\nCore CPI, enerji ve gıdanın değişken fiyatlarını hariç tutar ve gerçek enflasyon trendinin daha net bir resmini verir. Merkez bankaları onu yakından izler çünkü genel CPI\'dan daha istikrarlı ve öngörülebilirdir.\n\nCPI\'ın piyasalar üzerindeki etkisi hemen ve güçlüdür: beklenenden yüksek enflasyon dövizi destekler (çünkü faiz artışı olasılığını artırır) ve daha düşük enflasyon zayıflatır. Altın, enflasyona karşı bir koruma olarak kabul edildiği için özellikle etkilenir — yükselen CPI genellikle altını destekler.',
    keyPoints: [
      'CPI bir tüketim sepetindeki değişimi ölçer ve ana enflasyon ölçüsüdür',
      'Core CPI gıda ve enerjiyi hariç tutar ve enflasyon trendini daha iyi gösterir',
      'Beklenenden yüksek enflasyon = döviz desteği ve daha yüksek faiz artışı olasılığı',
      'Altın, enflasyon koruması olduğu için genellikle yüksek CPI ile yükselir',
    ],
    practicalExample: 'ABD CPI verileri aylık %0,5 yükseliş gösterir (beklenen %0,3). Bu, beklenenden daha yüksek enflasyon anlamına gelir ve dolar yükselir. Altın da yükselir çünkü yüksek enflasyon koruma varlıklarını destekler. Yakın bir destek altında zarar durdurmaya sahip altın alım işlemine girersiniz.',
  },
  l15: {
    content: 'Büyük ekonomik veriler gayri safi yurt içi hasıla, imalat ve hizmet göstergeleri, perakende satışlar, ticaret dengesi ve diğerlerini içerir. Her birinin önemi vardır, ancak etkisi geçerli ekonomik bağlama göre değişir. Resesyon endişesi dönemlerinde büyüme ve istihdam verileri en önemli, enflasyon dönemlerinde ise fiyat verileri en güçlü etkiye sahiptir.\n\nSır, verileri mutlak değerlerle değil beklentilere karşılaştırmaktır. Beklenenden iyi veriler dövizi destekler, kötü olan zayıflatır. Beklenti kaynakları Bloomberg ve Reuters anketleri ve vadeli endeks sözleşmelerini içerir.\n\nGelişmiş strateji: sadece ana rakamı okumayın — detaylara bakın. Örneğin NFP güçlü işler gösterebilir ama işsizlik artmış veya ücretler zayıflamış olabilir — bu çelişkiler piyasa tam resmi anladığında ilk tepki stabilize olduktan sonra fırsatlar yaratır.',
    keyPoints: [
      'Verileri sadece mutlak değerlerle değil beklentilere karşılaştırın',
      'Her verinin önemi geçerli ekonomik bağlama göre değişir',
      'Detaylar bazen ana rakamdan daha önemlidir — tam raporu okuyun',
      'Aynı rapor içindeki çelişkiler ilk tepkiden sonra fırsatlar yaratır',
    ],
    practicalExample: 'ABD GDP verileri beklenen %2,0\'a karşı %2,5 büyüme gösterir — dolar için pozitif. Ama detayda: tüketici harcaması düştü ve stoklar arttı (sürdürülebilir olmayan büyüme). Dolar başlangıçta yükselir sonra geri çekilir. USD/CHF\'de geri çekilmeden sonra satıma girersiniz ve verilerin daha derin bir okumasından yararlanırsınız.',
  },

  // ── Risk Yönetimi (4 ders) ──
  l16: {
    content: 'Risk yönetimi başarılı bir trader ile başarısız bir trader arasındaki farktır. Araştırmalar, yeni başlayan traderların %70\'inden fazlasının ilk yıl içinde sermayelerini kaybettiğini gösterir ve ana neden piyasa analiz etme yetersizliği değil risk yönetimi eksikliğidir. Risk yönetiminin amacı kaybı önlemek değil, onu uzun süre oyunda kalacak şekilde kontrol etmektir.\n\nİlk altın kural: tek bir işlemde sermayenizin %1-2\'sinden fazlasını riske atmayın. Hesabınız 10.000$ ise tek bir işlemde izin verilen maksimum kayıp 100-200$\'dır. Bu, hesabınızın yarısını kaybetmek için 50\'den fazla arka arkaya kayıp işleme ihtiyaç duyacağınızı garanti eder — disiplinli işlemle neredeyse imkansız.\n\nİkinci kural: çeşitlendirme. Tüm riskinizi tek bir varlığa veya çifte koymayın. İşlemleri yakından ilişkili olmayan farklı çiftlere dağıtın. Üçüncü kural: önceden planlama. İşlemi açmadan önce giriş noktasını, zarar durdurmayı ve kar almayı belirleyin ve bunlara sadık kalın.',
    keyPoints: [
      'Risk yönetimi piyasa analizinden daha önemlidir — hayatta kalmanızı belirler',
      'Tek bir işlemde sermayenin %1-2\'sinden fazlasını riske atmayın',
      'İşlemleri yakından ilişkili olmayan varlıklar arasında çeşitlendirin',
      'Önceden planlayın: işlemi açmadan önce girişi, zarar durdurmayı ve hedefi belirleyin',
    ],
    practicalExample: 'Hesabınız 5.000$ ve EUR/USD işlem yapmak istiyorsunuz. %1 riskle maksimum kayıp = 50$. Zarar durdurmazı 25 pip uzağa koyarsanız işlem büyüklüğü = 50 / (25 × 0,10) = 20 mikro lot (0,20 lot). Bu büyüklükle, zarar durdurma vurulursa sadece 50$ yani hesabınızın %1\'ini kaybedersiniz.',
  },
  l17: {
    content: 'Zarar Durdurma, kayıpları sınırlamak için işlemi belirtilen fiyat seviyesinde kapatan otomatik bir emirdir. Kar Al, işlemi hedef seviyede kapatan benzer bir emirdir. Bu iki emir herhangi bir işlemin ilk savunma hattı ve finansal planıdır.\n\nZarar durdurma türleri: sabit stop belirli bir fiyat seviyesine konur ve hareket etmez; iz süren stop fiyatı belirli bir mesafeden takip eder ve kârları kademeli olarak kilitler. Analiz tabanlı stop bir destek veya direnç seviyesine veya teknik bir desen altına konur ve yüzde tabanlı stop giriş fiyatının bir yüzdesine konur.\n\nYaygın hatalar: stopu çok dar koymak böylece normal bir hareketle vurulması ve sonra fiyat sizin yönünüzde devam etmesi; hiç stop koymamak ve geri sıçrama ummak; ve kaybı artırmak için stopu hareket ettirmek. Kural: istisnasız her işlemde zarar durdurma olmadan işlem açmayın.',
    keyPoints: [
      'Zarar durdurma her işlemde zorunludur — istisna yok',
      'İz süren stop trend devam ettikçe kârları kademeli olarak kilitler',
      'Stopu rastgele değil mantıklı teknik bir seviyeye yerleştirin',
      'Risk-ödül oranı her işlemde en az 1:2 olmalıdır',
    ],
    practicalExample: 'GBP/USD\'yı 1,2650\'den alır ve zarar durdurmazı güçlü bir desteğin altında 1,2590\'a (60 pip) koyarsınız. Hedefiniz dirençte 1,2770 (120 pip). Risk-ödül oranı = 60:120 = 1:2. Stop vurulursa 60 pip kaybedersiniz; hedefe ulaşılırsa 120 pip kazanırsınız. Bu oranla dengeye ulaşmak için yalnızca %34 başarı gerekir.',
  },
  l18: {
    content: 'Pozisyon büyüklüğü, giriş kararının kendisinden sonra verdiğiniz en önemli karardır. Yanlış büyüklük analitik olarak doğru bir işlemi finansal bir felakete dönüştürebilir. Amaç, potansiyel kaybın her zaman kabul edilebilir sınırlarınız içinde olması için işlem büyüklüğünü belirlemektir.\n\nPozisyon büyüklüğü formülü: lot büyüklüğü = (sermaye × risk yüzdesi) / (zarar durdurma mesafesi pip × pip değeri). Örnek: 10.000$ hesap, %2 risk, 50 pip stop ve 10$ pip değeri. Lot büyüklüğü = (10000 × 0,02) / (50 × 10) = 0,4 lot.\n\nÖnemli kurallar: tüm açık işlemler için toplam risk sermayenin %5-6\'sını geçmesin. 3 açık işleminiz varsa her biri %2 riskle, toplam risk %6\'dır ki bu maksimumdur. Kaybı telafi etmek için kayıptan sonra büyüklüğü artırmayın (buna martingale denir ve çok tehlikelidir).',
    keyPoints: [
      'Pozisyon büyüklüğü = (sermaye × risk yüzdesi) / (stop mesafesi × pip değeri)',
      'Tüm açık işlemler için toplam risk %5-6\'yı geçmemeli',
      'Kayıptan sonra büyüklüğü artırmayın — bu martingale\'dir ve felaketle sonuçlanır',
      'Kayıp serisinden sonra güven ve analizinizi geri kazanana kadar büyüklüğü azaltın',
    ],
    practicalExample: 'Kayıp serisinden sonra hesabınız 10.000$\'dan 8.000$\'a düşer. %1 riskle: maksimum kayıp = 80$. Stopunuz EUR/USD\'da 40 pip ise: büyüklük = 80 / (40 × 10) = 0,2 lot. Zor dönemlerde hesabı korumak için riski %2\'den %1\'e düşürdünüz. Bu profesyonel davranıştır.',
  },
  l19: {
    content: 'Risk-Ödül Oranı, bir işlemde potansiyel kaybı potansiyel kârla karşılaştırır. 1:2 oranı, 2 kazanmak için 1 riske attığınız anlamına gelir. Bu oran, %50\'nin altında bir başarı oranında bile kârlılığı garanti ettiği için her başarılı işlem stratejisinin temel taşıdır.\n\nHesaplama basittir: 1:2 risk-ödül oranıyla dengeye ulaşmak için yalnızca %34 başarılı işleme ihtiyaç duyarsınız. 1:3 ile sadece %25. Bu, risk-ödül oranı 1:3 ise 3 işlemden 2\'sinde kaybedebilir ve yine de kârlı olabileceğiniz anlamına gelir.\n\nYaygın hata, korkudan kazanan işlemleri erken kapatmak ve kaybedenlerin umutla düzelmesini beklemektir. Bu, oranı etkin şekilde tersine çevirir: çok riske atar ve az kazanırsınız. Çözüm: hedefi önceden belirleyin, fiyatın çalışmasına izin verin ve müdahale etmeyin.',
    keyPoints: [
      '1:2 minimum — 2 kazanmak için 1 riske atın',
      '1:3 oranıyla kârlı olmak için sadece %25 başarı gerekir',
      'Kazananları erken kapatmayın — bu gerçek oranı felaket şekilde düşürür',
      'Net destek/direnç seviyelerinde doğal olarak yüksek oranlı işlemler seçin',
    ],
    practicalExample: 'USD/CAD\'de 1,3650\'den, stop 1,3710 (60 pip kayıp) ve hedef 1,3530 (120 pip kâr) ile satışa girersiniz. Oran = 1:2. Bu işlem 10 kez tekrarlanır ve sadece 4\'ü kazanırsa: kâr = 4 × 120 = 480 pip. Kayıp = 6 × 60 = 360 pip. %40 başarı oranına rağmen net kâr = 120 pip.',
  },

  // ── Kripto (3 ders) ──
  l20: {
    content: 'Kripto paralar, işlemleri kaydetmek için blockchain teknolojisini kullanan merkezi olmayan dijital varlıklardır. Bitcoin, Satoshi Nakamoto adı altında bir kişi veya grup tarafından 2009\'da piyasaya sürülen ilk kripto paradır. Bugün toplam piyasa değeri 2 trilyon doları aşan 20.000\'den fazla farklı kripto para vardır.\n\nBlockchain, dünyadaki binlerce bilgisayara dağıtılmış bir dijital defterdir ve hacklenmesini veya değiştirilmesini neredeyse imkansız kılar. Bu, kripto paraların güvenliğinin temelidir. Her işlem, kaydedilmeden önce bir madenci veya doğrulayıcı ağı tarafından doğrulanır.\n\nKripto özellikleri: merkezi olmama (hiçbir merkezi otorite kontrol etmez), şeffaflık (tüm işlemler herkese açıktır) ve küresel erişim (dünyadaki herkese dakikalar içinde gönderin). Ancak dezavantajlar yüksek oynaklık, sınırlı düzenleme ve siber güvenlik risklerini içerir.',
    keyPoints: [
      'Blockchain temel teknolojidir — değiştirilemez, merkezi olmayan dijital defter',
      'Bitcoin, piyasa değeri bir trilyon doları aşan ilk ve en büyük kripto paradır',
      'Merkezi olmama, şeffaflık ve küresel erişim ana kripto özellikleridir',
      'Yüksek oynaklık, düzenleme riskleri ve siber riskler ana zorluklardır',
    ],
    practicalExample: '65.000$\'dan 0,01 bitcoin alırsınız (650$). Bir hafta içinde bitcoin %8 yükselir ve 70.200$ olur. Yatırımınız 702$ olur. Ancak %8 düşerse 598$ olur. Bu, yüksek oynaklığı gösterir: kısa sürede büyük kâr ve kayıplar. Bu yüzden kripto\'da risk yönetimi herhangi bir piyasadan daha önemlidir.',
  },
  l21: {
    content: 'Bitcoin ve ana kripto paraların (Ethereum, BNB, Solana) işlemi, Forex işleminden birkaç açıdan farklıdır. Piyasa durmadan 24/7 çalışır, oynaklık çok daha yüksektir ve düzenleyici haberlerin etkisi büyüktür. Ancak teknik ve temel analiz temelleri aynı kalır.\n\nBitcoin tüm piyasanın temel iticisidir. Bitcoin yükseldiğinde çoğu diğer coin onunla yükselir (genellikle daha yüksek bir yüzdeyle) ve düştüğünde hepsi düşer. Bu yakın korelasyon, bitcoin analizinin herhangi bir başka coini işlemadan önce ilk adımınız olması gerektiği anlamına gelir.\n\nKripto\'ya özgü faktörler: Bitcoin halving (her 4 yılda bir madencilik ödülü yarıya indirilir, bu da geçmişte arzı azaltıp fiyatı yukarı itmiştir), ağ güncellemeleri (Ethereum güncellemeleri gibi), hükümet düzenlemesi (SEC kararları ve Çin\'in etkisi) ve borsa riskleri (platform hackleri).',
    keyPoints: [
      'Kripto piyasası 24/7 çalışır ve oynaklık Forex\'ten çok daha yüksektir',
      'Bitcoin piyasayı yönlendirir — herhangi bir başka coini analizden önce onu analiz edin',
      'Her 4 yılda bir halving arzı azaltır ve geçmişte fiyatı yukarı itmiştir',
      'Hükümet düzenlemesi ve platform güvenliği kripto\'ya özgü risklerdir',
    ],
    practicalExample: 'Bitcoin güçlü bir yükselişten sonra 70.000$ direncini test eder. Ethereum 3.800$\'da işlem görüyor. Analiziniz bitcoin 70.000$\'ı kırarsa 80.000\$\'a ulaşacağını görüyor. Bitcoin\'i doğrudan almak yerine Ethereum alırsınız çünkü daha yüksek bir yüzdeyle hareket eder (daha yüksek beta). Bitcoin %15 yükselirse Ethereum %25 yükselebilir.',
  },
  l22: {
    content: 'Kripto piyasa analizi, geleneksel piyasalarda bulunmayan benzersiz faktörleri anlamayı gerektirir. Birincisi on-chain analiz: işlem hacmi, aktif cüzdan sayısı ve borsalara gelen ve giden coin akışı gibi blockchain verilerinin kendisini incelemek. Bu veriler yatırımcı davranışı hakkında benzersiz bir görünüm verir.\n\nİkincisi: likidite ve arz analizi. Çoğu coinin kademeli olarak yeni miktarlar serbest bırakan bir kilit açma takvimi vardır. Bu açılımlar fiyat üzerinde baskı yaratabilir. Bitcoin farklıdır çünkü arzı yalnızca 21 milyon coinle sabitlenmiştir.\n\nÜçüncüsü: kripto\'ya özgü duygu göstergeleri. Kripto Korku ve Açgözlülük Endeksi, bitcoin aramalarının sayısı ve ağ hash oranı, piyasa durumunu değerlendirmeye yardımcı olan göstergelerdir. Kripto\'da herhangi bir piyasadan daha fazla, duygular kısa vadeli fiyatları yönlendirir.',
    keyPoints: [
      'On-chain analiz doğrudan blockchain verilerini inceler — kripto\'ya özgü avantaj',
      'Coin kilit açma takvimleri fiyat üzerinde baskı yapar — bunları dikkatle izleyin',
      'Kripto Korku ve Açgözlülük Endeksi önemli bir duygusal göstergedir',
      'Duygular kripto\'da herhangi bir piyasadan daha güçlüdür — dürtüsel kararlardan kaçının',
    ],
    practicalExample: 'On-chain analiz, büyük miktarda bitcoinin soğuk cüzdanlardan borsalara taşındığını gösterir — genellikle satış niyetinin işaretidir. Aynı zamanda Korku ve Açgözlülük Endeksi 85\'tedir (aşırı açgözlülük). Long pozisyonlarınızı azaltmaya veya kârları güvence altına almak için iz süren stop koymaya karar verirsiniz.',
  },

  // ── Emtia (3 ders) ──
  l23: {
    content: 'Altın, tarihteki en eski finansal varlıktır ve kriz zamanlarında güvenli limandır. XAU/USD sembolü altından işlem görür ve benzersiz faktörlerden etkilenir: en önemlileri dolar fiyatı (genellikle ters ilişki), reel faiz oranları (faiz eksi enflasyon), jeopolitik riskler ve Hindistan ile Çin\'den fiziksel talep.\n\nDolar zayıfladığında altın, diğer para birimleriyle alıcılar için daha ucuz hale gelir ve talep ile fiyat artar. Reel faiz oranları yükseldiğinde altın, getiri sağlamadığı için daha az çekici hale gelir. Ancak kriz ve endişe zamanlarında altın, güvenli bir değer deposu olduğu için faizden bağımsız olarak yükselir.\n\nAltın, orta düzey oynaklık (kriptodan az, Forex\'ten fazla) ve yüksek likidite ile karakterizedir. 24 saat işlem görür ama en iyi zamanları Londra ve New York oturumlarıyla çakışır. Traderlar altında teknik analizi başarıyla kullanır çünkü desenleri net ve nispeten güvenilirdir.',
    keyPoints: [
      'Altın krizlerde yükselen bir güvenli limandır — genellikle dolarla ters',
      'Yüksek reel faiz oranları altını zayıflatır çünkü getiri sağlamaz',
      'Hindistan ve Çin\'den fiziksel talep orta vadeli fiyatı etkiler',
      'Orta düzey oynaklık ve yüksek likidite — tüm trader seviyeleri için uygundur',
    ],
    practicalExample: 'Jeopolitik tırmanış ve dolar zayıflar. Altını 2.350$\'dan, zarar durdurma 2.320$\'da (30$) ve hedef 2.420$ (70$) ile alırsınız. Oran 1:2,3. Kriz şiddetlenirse fiyat hedefinizi büyük ölçüde aşabilir, bu yüzden kârları kilitlemek için fiyatın 20$ ardında iz süren stop koyarsınız.',
  },
  l24: {
    content: 'Ham petrol iki ana türde işlem görür: Brent (küresel referans) ve WTI (Amerikan referansı). Petrol fiyatı, diğer herhangi bir faktörden daha çok gerçek arz ve talepten etkilenir. OPEC+ üretimin büyük bir kısmını kontrol eder ve kararları fiyatları güçlü şekilde hareket ettirir.\n\nArz faktörleri: OPEC+ üretim kararları, Amerikan şeyl petrolü üretimi ve üretim bölgelerindeki jeopolitik olaylar (Körfez, Rusya, Venezuela). Talep faktörleri: özellikle Çin\'de küresel ekonomik büyüme, yaz yolculuk ve sürüş sezonu ve uzun vadeli temiz enerjiye geçiş.\n\nHaftalık ABD petrol stok raporu (EIA) haftalık yayınlanır ve fiyatları hemen hareket ettirir. Stoklar beklenenden yüksek = düşüş baskısı ve daha düşük = yükseliş baskısı. Profesyonel traderlar ayrıca rafineri oranlarını ve benzin ve distilat stoklarını izler.',
    keyPoints: [
      'Brent ve WTI iki ana referanstır — Brent genellikle daha yüksek fiyatla işlem görür',
      'OPEC+ kararları en güçlü arz iticisidir ve fiyatları güçlü hareket ettirir',
      'Çin büyümesi küresel petrol talebinin ana iticisidir',
      'Haftalık EIA stok raporu takip edilmesi önemli bir olaydır',
    ],
    practicalExample: 'OPEC+, beklenenden günde 2 milyon varil daha fazla üretim kesintisi açıklar. Petrol bir günde %4 yükselir. Kesinti söylentileri üzerine toplantıdan önce WTI\'yı 78$\'dan almıştınız. Stopu 76$\'a koymuştunuz ve şimdi fiyat 81,12$. En azından varil başına 1$ kârı güvence altına almak için iz süren stopu 79$\'a yükseltirsiniz.',
  },
  l25: {
    content: 'ABD doları ve dolar cinsinden emtialar arasında tarihsel bir ters ilişki vardır. Dolar yükseldiğinde emtialar diğer para birimlerine sahip alıcılar için daha pahalı hale gelir, bu da talep ve fiyatı düşürür. Dolar zayıfladığında tersi olur. Bu ilişki altın, petrol ve endüstriyel metallere güçlü şekilde uygulanır.\n\nAncak ilişki her zaman mekanik değildir. Kriz zamanlarında hem dolar hem altın, ikisi de güvenli liman olarak kabul edildiği için birlikte yükselebilir. Güçlü büyü dönemlerinde hem dolar hem petrol, enerji talebi arttığı için birlikte yükselebilir.\n\nİşlem stratejisi: DXY (dolar endeksi) ve altını aynı anda izleyin. DXY yükselir ve altın düşerse normal trend budur. İkisi birden yükselirse piyasa korkusunun bir göstergesidir (risk-off). İkisi birden düşerse enflasyon risklerine işaret edebilir. Bu ilişkileri anlamak analizine önemli bir katman ekler.',
    keyPoints: [
      'Tarihsel ters ilişki: güçlü dolar = daha ucuz emtia, zayıf dolar = daha pahalı',
      'Özellikle kriz zamanlarında istisnalar olur (ikisi de güvenli liman olarak yükselir)',
      'Piyasa yönünü anlamak için DXY ve altını eşzamanlı olarak izleyin',
      'Güçlü dolar + yükselen altın = risk-off piyasa duygusu',
    ],
    practicalExample: 'DXY 106\'dan 103\'e düşer ve altın 2.300$\'dan 2.380$\'a yükselir. Ters ilişki normal şekilde çalışır. Doların sürekli zayıflığına güvenerek altın long işlemi açarsınız. Ancak aniden DXY yükselir ve altın düşmez — bu çelişki bir kriz nedeniyle altına güvenli talebi gösterebilir. Kârlarınızı korumak için iz süren stop eklersiniz.',
  },

  // ── Stratejiler (4 ders) ──
  l26: {
    content: 'Trend Takibi tarihteki en eski ve en başarılı stratejilerden biridir. İlke basittir: "trend dostunuzdur" — piyasa yükseliş trendindeyse alım, düşüş trendindeyse satım yapın. Fikir, trendlerin tersine dönmekten çok devam etme eğiliminde olmasıdır.\n\nTrend belirleme: 200 günlük hareketli ortalama standarttır. Fiyat MA200 üzerindeyse trend yükselişte, altındaysa düşüştedir. Haftalık dilimde MA50 orta trendi, günlükte MA20 kısa trendi tanımlar.\n\nGiriş noktaları: en iyi nokta, ana trendte hareketli ortalamaadan geri çekilmedir. Örneğin: fiyat MA200 üzerinde (yükseliş trendi) ve MA50\'den döner. Bir dönüş mumu veya RSI\'nin 50\'yi yukarı kesmesiyle teyit beklersiniz, sonra alım yaparsınız. Zarar durdurma son oluşan dip altında. Hedef bir sonraki dirençte veya iz süren stop kullanılarak.',
    keyPoints: [
      'Trendler devam etme eğilimindedir — onlarla işlem yapın, against değil',
      'MA200 ana trendi, MA50 orta trendi, MA20 kısa trendi tanımlar',
      'En iyi giriş noktası: ana trendte teyitle MA\'dan geri çekilme',
      'Trend devam ettikçe kârları kilitlemek için iz süren stop kullanın',
    ],
    practicalExample: 'EUR/USD günlük: fiyat MA200 üzerinde (yükseliş trendi). Fiyat 1,0820\'de MA50\'den döner. RSI 50\'ye geri dönen bir çekiç mumu oluşur. 1,0840\'dan alım yaparsınız, zarar durdurma 1,0790 (50 pip) altında ve hedef son tepe 1,0950 (110 pip). Oran 1:2,2. 30 pip mesafeli iz süren stop koyarsınız.',
  },
  l27: {
    content: 'Breakout stratejisi, yüksek işlem hacmiyle ana bir destek veya direnç seviyesi kırıldığında girmeye dayanır. Fikir, fiyat bir pivot seviyeyi kırdığında kırılma yönünde güçlü bir momentum kazanmasıdır. Breakoutlar, fiyatın bir yay gibi sıkıştığı yatay konsolidasyon dönemlerinden sonra oluşur.\n\nGeçerli bir breakout koşulları: kırılma güçlü bir mumla (seviyenin üzerinde/açık bir kapanış) olmalı, işlem hacmi en az üç kat ortalama olmalı ve tercihen seviye daha önce en az iki kez test edilmiş olmalıdır. Yanlış breakoutlar fiyat seviyeyi kırar sonra hızla geri döndüğünde oluşur — bu yüzden hacim teyidi önemlidir.\n\nGiriş noktası: ya doğrudan kırılmada (daha riskli ama daha yüksek kâr) veya kırılan seviyenin yeniden testinde (daha güvenli ama yeniden test olmayabilir). Zarar durdurma kırılan seviyenin altında/üstünde. Hedef önceki yatay aralığın büyüklüğü veya Fibonacci araçlarıyla belirlenir.',
    keyPoints: [
      'Breakout = yüksek hacim ve güçlü momentumla ana seviyeyi kırmak',
      'Hacim teyidi esastır — hacimsiz bir breakout genellikle yanlıştır',
      'Kırılmada veya yeniden testte girin (daha güvenli)',
      'Zarar durdurma kırılan seviyenin altında/üstünde, hedef önceki aralık büyüklüğüyle',
    ],
    practicalExample: 'GBP/USD iki hafta boyunca 1,2600 ve 1,2750 arasında yatay işlem görür. Aniden 1,2750\'yi güçlü bir mum ve ortalama üç kat hacimle kırar. 1,2760\'dan alım yaparsınız, zarar durdurma 1,2740 (kırılan seviyenin hemen altında). Hedef = aralık genişliği (150 pip) + kırılma noktası: 1,2750 + 0,0150 = 1,2900. 1:7 oran, birkaç işlemi kaybetmeye ve kârlı kalmaya izin verir.',
  },
  l28: {
    content: 'Swing Trading, birkaç günden birkaç haftaya kadar işlemleri tutar ve orta vadeli fiyat hareketlerini hedefler. Yorucu gün içi işlem ile yavaş uzun vadeli yatırım arasında altın orta yoldur. Ekranı bütün gün izleyemeyen traderlar için uygundur.\n\nZaman dilimleri: trendi ve giriş noktalarını belirlemek için günlük dilimde analiz, genel trendi teyit etmek için haftalık, girişi hassaslaştırmak için 4 saatlik. Kural: kararı günlükte verin, 4 saatlikte uygulayın.\n\nEn iyi swing fırsatları: göstergeli kesişmelerle (MACD veya hareketli ortalama kesişmeleri gibi) güçlü destek/direnç seviyelerinden geri çekilmeler, günlük dilimde tamamlanmış dönüş desenleri ve yatay dönemlerden sonra breakoutlar. Zarar durdurma genellikle 50-150 pip ve hedef 100-400 pip, en az 1:2 risk-ödül oranıyla.',
    keyPoints: [
      'Swing işlemleri günler ve haftalar boyunca tutar — sürekli izleme gerektirmez',
      'Karar günlükte, uygulama 4 saatlikte',
      'En iyi fırsatlar: göstergeli teyit ile güçlü seviyelerden geri çekilmeler',
      'Stop 50-150 pip ve hedef 100-400 pip, 1:2+ oranıyla',
    ],
    practicalExample: 'USD/JPY günlük dilimde: MA200 yükseliyor, yükseliş trendi. Fiyat 154,50\'de MA20\'den, MACD\'de yükseliş kesişmesiyle döner. 4 saatlik dilimde: yükseliş dönüş mumu. 154,80\'den alım yaparsınız, zarar durdurma 153,80 (100 pip) altında ve hedef 157,00 (220 pip). Oran 1:2,2. İşlem hedefe ulaşmak için bir hafta sürebilir.',
  },
  l29: {
    content: 'Scalping, hassas fiyat hareketlerinden küçük, tekrarlanan kârları hedefleyen çok hızlı bir işlemdir. Bir scalper gün içinde onlarca işlem açar ve kapatır, her işlemde 5-15 pip hedefler. Bu stil yüksek odak, hızlı uygulama ve stabil bir internet bağlantısı gerektirir.\n\nScalping gereksinimleri: çok dar spreadli bir komisyoncu (majör çiftlerde bir pipten az), slippage olmadan hızlı bir uygulama platformu ve hızlı kararlar verme ve tereddüt etmeden plana sadık kalma psikolojik yeteneği. Tereddüt eden veya psikolojik baskı yaşayan traderlar için uygun değildir.\n\nEn iyi scalping çiftleri: dar spreadleri ve yüksek likiditeleri nedeniyle EUR/USD ve GBP/USD. En iyi zamanlar: Londra oturumu ve New York ile örtüşme. Teknik araçlar: kısa hareketli ortalamalar (5, 13, 21), kısa dönem RSI (5) ve 1 dakikalık ve 5 dakikalık dilimlerde destek/direnç seviyeleri.',
    keyPoints: [
      'Scalping her işlemde 5-15 pip hedefler, aşırı hızla',
      'Çok dar spread, hızlı uygulama ve yüksek odak gerektirir',
      'En iyi çiftler: EUR/USD ve GBP/USD. En iyi zaman: Londra ve New York',
      'Yeni başlayanlar için değil — deneyim ve mükemmel psikolojik disiplin gerektirir',
    ],
    practicalExample: 'Bir scalper 1 dakikalık dilimde EUR/USD işlem yapar. Fiyat MA21\'den, RSI(5) aşırı satımdan çıkarken döner. 1,0852\'den alım yapar, zarar durdurma 1,0845 (7 pip) ve hedef 1,0865 (13 pip). Oran 1:1,9. İşlem 3-5 dakikada kapanır. Günde 50-80 pip net hedefle bunu 15-20 kez tekrarlar.',
  },

  // ── Yapay Zeka (3 ders) ──
  l30: {
    content: 'Yapay zeka, devasa veri miktarlarını şimşek hızında analiz etme ve insanlar için görünmez desenleri keşfetme yeteneği üzerinden işlem dünyasında devrim yaratıyor. İşlemdeki uygulamaları şunları içerir: haberlerden ve sosyal medyadan piyasa duygu analizi, tarihsel desenlere dayalı fiyat hareketi tahmini, otomatik işlem sinyali tespiti ve risk yönetimi optimizasyonu.\n\nKullanılan YZ türleri: tarihsel verilerden öğrenen ve zamanla performansını iyileştiren Makine Öğrenmesi, metinleri ve haberleri analiz eden Doğal Dil İşleme (NLP) ve karmaşık desenleri keşfetmek için beyin yapısını taklit eden derin sinir ağları.\n\nAnlamak önemlidir: YZ bir kristal top değildir ve kâr garanti etmez. Daha iyi kararlar almanıza yardımcı olan güçlü bir araçtır, ancak nihai karar sizindir. YZ\'nin en iyi kullanımı bir asistan olarak, bir yedek olarak değil. Analizinizi teyit etmek veya fırsatları filtrelemek için kullanın, tüm kararı vermek için değil.',
    keyPoints: [
      'YZ devasa verileri analiz eder ve insanlar için görünmez desenleri keşfeder',
      'Uygulamalar: duygu analizi, fiyat tahmini, sinyal tespiti, risk yönetimi',
      'YZ bir kristal top değildir — bir asistan, bir yedek değil',
      'En iyi kullanım: analizi teyit etmek ve fırsatları filtrelemek, tam karar verme değil',
    ],
    practicalExample: 'Rouaa platformu, 500 haber kaynağını gerçek zamanlı analiz etmek için YZ kullanır ve her döviz çifti için bir duygu değerlendirmesi yayınlar. YZ, Britanya sterlini haberlerinin %78\'inin, günlük dilimde düşüş MACD kesişmesiyle birlikte negatif olduğunu keşfeder. Bu çift sinyal (temel + teknik), GBP/USD satış kararınızdaki güveninizi artırır.',
  },
  l31: {
    content: 'YZ, üç ana kanal üzerinden finansal piyasaları okur. Birincisi: insan zihninin fark etmediği fiyat hareketi desenlerini keşfeden makine öğrenmesi algoritmaları kullanarak fiyat ve hacim analizi. YZ aynı anda yüzlerce çifti onlarca zaman diliminde işleyebilir.\n\nİkincisi: duygu analizi. YZ saatte binlerce makale, tweet ve raporu işler ve bunları pozitif, negatif veya nötr olarak sınıflandırır. Her varlık için genel bir duygu endeksi hesaplar ve bir sonraki tepkiyi tahmin etmek için onu tarihsel fiyatlarla karşılaştırır. Duygu aşırı pozitif olduğunda satma zamanı olabilir ve tersi.\n\nÜçüncüsü: korelasyon analizi. YZ, ortalama traderın fark etmediği varlıklar arasındaki ilişkileri keşfeder — örneğin, yükselen bakır fiyatlarının genellikle AUD/JPY yükselişlerini üç gün öncelediği gibi. Bu gelişmiş korelasyonlar gerçek bir rekabet avantajı sağlar.',
    keyPoints: [
      'YZ piyasaları şu yollarla okur: fiyat analizi, duygu analizi ve korelasyon analizi',
      'Aynı anda yüzlerce çift ve onlarca zaman diliminde desenler keşfeder',
      'Duygu analizi binlerce metni işler ve her varlık için bir endeks hesaplar',
      'Varlıklar arasındaki gelişmiş korelasyonlar benzersiz bir rekabet avantajı sağlar',
    ],
    practicalExample: 'Rouaa platformundaki YZ, dolar duygu endeksinin son 6 ayın en düşük seviyesi olan (15/100) aşırı karamserliğe ulaştığını keşfeder. Tarihsel olarak duygu bu seviyeye ulaştığında dolar 5 gün içinde %70 oranında geri döner. Bu YZ sinyali, DXY üzerinde çift dip deseni gören teknik analizini teyit etmeye eklenir.',
  },
  l32: {
    content: 'YZ destekli bir işlem stratejisi oluşturmak, her iki alanı da derinlemesine anlamayı gerektirir: işlem ve veri. İlk adım, problemi net bir şekilde tanımlamaktır: YZ\'nin yönü tahmin etmesini mi istiyorsunuz? Yoksa giriş ve çıkış noktalarını mı belirlemesini? Yoksa risk yönetimini mi iyileştirmesini? Her hedef farklı veriler ve algoritmalar gerektirir.\n\nİkinci adım: veri toplama. Tarihsel fiyat verilerine (OHLCV), temel verilere (ekonomik göstergeler), duygu verilerine (haberler ve tweetler) ve kripto için on-chain verilerine ihtiyacınız var. Veri kalitesi algoritma miktarından daha önemlidir — kötü veri = kötü sonuç.\n\nÜçüncü adım: model oluşturma. Basit bir modelle (doğrusal regresyon veya karar ağacı) başlayın sonra kademeli olarak karmaşıklığı artırın. Eğitimde kullanmadığı tarihsel verilerle test edin (out-of-sample test). Dördüncü adım: spread, slippage ve komisyonlara dikkatle backtesting. Beşinci adım: demo işlem sonra kademeli gerçek para işlemi.',
    keyPoints: [
      'Önce problemi tanımlayın: tahmin, giriş sinyalleri veya risk yönetimi',
      'Veri kalitesi algoritma karmaşıklığından daha önemlidir',
      'Basit bir modelle başlayın sonra her aşamada testle kademeli olarak karmaşıklığı artırın',
      'Out-of-sample verilerde test edin sonra gerçek para önce demo işlem yapın',
    ],
    practicalExample: 'EUR/USD günlük yönünü tahmin eden bir YZ modeli oluşturursunuz. OHLCV fiyatları, 10 teknik gösterge ve bir haber duygu endeksi dahil 5 yıllık veri kullanırsınız. Bir Random Forest eğitir ve test verilerinde %58 doğruluk elde edersiniz. 1:2 risk-ödül oranıyla sadece %35 başarı kârlı olmak için yeterlidir. %58 net bir avantaj anlamına gelir. Bir ay demo işlemle başlarsınız.',
  },
};
