// ════════════════════════════════════════════════════════════════════
// Lesson Body Content Translations — French (V1042)
// ════════════════════════════════════════════════════════════════════
// Traductions françaises complètes des 32 leçons (contenu, points clés,
// exemple pratique). La source canonique est l'arabe dans mock-data.ts.

import type { LessonBodyTranslation } from './academy-content-en';

export const LESSON_BODIES_FR: Record<string, LessonBodyTranslation> = {
  // ── Forex (5 leçons) ──
  l1: {
    content: 'Le marché des changes (Forex), ou marché des devises, est le plus grand marché financier au monde avec un volume de transactions quotidien dépassant 7,5 billions de dollars. Il fonctionne 24h/24 cinq jours par semaine, depuis l\'ouverture de la session de Sydney lundi matin jusqu\'à la clôture de la session de New York vendredi soir. Contrairement aux marchés boursiers, il n\'existe pas de bourse centrale pour le Forex — les transactions se font via un réseau électronique mondial de banques, d\'institutions financières et de courtiers.\n\nLe mot Forex vient de l\'abréviation Foreign Exchange, et implique le trading de paires de devises où vous achetez une devise et en vendez une autre simultanément. Les paires les plus échangées sont les majors qui incluent le dollar américain, comme EUR/USD, USD/JPY et GBP/USD.\n\nLe marché Forex est influencé par de nombreux facteurs économiques et politiques, notamment les taux d\'intérêt, l\'inflation, les données économiques et les événements géopolitiques. Comprendre ces facteurs et savoir analyser leur impact sur les devises est la base du trading réussi.',
    keyPoints: [
      'Le Forex est le plus grand marché financier mondial avec un volume quotidien dépassant 7,5 billions de dollars',
      'Fonctionne 24h/24, cinq jours par semaine, via des sessions mondiales consécutives',
      'Le trading se fait par paires de devises où vous achetez une devise et en vendez une autre',
      'Les facteurs économiques et politiques sont les principaux moteurs des prix des devises',
    ],
    practicalExample: 'Si vous voulez acheter EUR/USD à 1,0850, vous achetez des euros et vendez des dollars. Si le prix monte à 1,0900, votre profit est de 50 pips. Avec un mini-lot (0,01), chaque pip vaut 0,10 $, donc votre profit serait de 5 $. Mais si le prix baisse à 1,0800, vous perdriez 5 $.',
  },
  l2: {
    content: 'Le trading de devises se fait par paires, chacune composée d\'une devise de base et d\'une devise de cotation. La devise de base est la première dans la paire, et la cotation est la seconde. Par exemple, dans EUR/USD, l\'euro est la devise de base et le dollar est la cotation. Le prix affiché montre combien de devise de cotation vous avez besoin pour acheter une unité de la devise de base.\n\nIl y a trois catégories principales de paires : les majors qui incluent le dollar américain et sont les plus liquides avec les spreads les plus serrés ; les crosses sans dollar comme EUR/GBP ; et les exotiques qui incluent une devise d\'un marché émergent comme USD/TRY.\n\nLe trading Forex se fait via différents types d\'ordres : un ordre au marché s\'exécute immédiatement au prix actuel, et un ordre en attente s\'exécute quand le prix atteint un niveau spécifié. Vous pouvez aussi utiliser des ordres stop loss et take profit pour gérer les transactions automatiquement.',
    keyPoints: [
      'Chaque paire de devises se compose d\'une devise de base (première) et d\'une devise de cotation (seconde)',
      'Les majors avec le dollar américain sont les plus liquides avec les spreads les plus serrés',
      'Les types d\'ordres incluent ordre au marché, ordre en attente, stop loss et take profit',
      'Les prix sont toujours affichés avec deux décimales, et quatre pour le Forex standard',
    ],
    practicalExample: 'Vous voulez acheter GBP/USD à 1,2650 avec un spread de 1,2 pip. Le prix ask est 1,26512 et le bid est 1,26500. Si vous achetez un mini-lot (0,1) et placez un stop loss à 1,2620 et un take profit à 1,2720, votre risque est de 30 pips et votre récompense de 70 pips. Le ratio risque-récompense est de 1:2,3, ce qui est un bon ratio.',
  },
  l3: {
    content: 'Comprendre comment lire les prix des paires de devises est la première étape pour tout trader. Le prix se compose du prix bid — le prix que le courtier offre pour acheter chez vous — et du prix ask — le prix que le courtier offre pour vous vendre. La différence entre les deux est le spread, qui est la source de profit du courtier.\n\nUn pip est la plus petite unité de variation de prix. Dans la plupart des paires Forex, un pip est la quatrième décimale, mais dans les paires JPY c\'est la seconde. La valeur d\'un pip change avec la taille du lot : un lot standard (1,0) représente environ 10 $ par pip, et un micro-lot (0,01) représente 0,10 $.\n\nQuand vous attendez qu\'EUR/USD monte, vous l\'achetez (Long). Quand vous attendez qu\'il baisse, vous le vendez (Short). Dans les deux cas, vous pouvez profiter de la bonne direction — c\'est un avantage du Forex sur les marchés traditionnels.',
    keyPoints: [
      'Le prix bid est toujours inférieur au prix ask, et la différence est le spread',
      'Un pip est la plus petite unité de variation — la quatrième décimale dans la plupart des paires',
      'La valeur du pip dépend de la taille du lot : lot standard = environ 10 $ par pip',
      'Vous pouvez profiter des marchés haussiers et baissiers via des ordres d\'achat et de vente',
    ],
    practicalExample: 'Si vous achetez 0,5 lot de USD/CHF à 0,8850 et le vendez à 0,8900, la différence est de 50 pips. La valeur du pip pour un lot dans cette paire est d\'environ 11,20 $, donc votre profit = 50 × 11,20 × 0,5 = 280 $. Mais si vous le vendez à 0,8800, vous perdriez 50 pips, soit 280 $.',
  },
  l4: {
    content: 'Le marché Forex fonctionne 24h/24, mais la liquidité et la volatilité varient considérablement entre les sessions. Il y a trois sessions principales : la session asiatique (Tokyo) de 00h00 à 09h00 GMT, la session européenne (Londres) de 07h00 à 16h00, et la session américaine (New York) de 12h00 à 21h00.\n\nLes périodes les plus actives et liquides sont pendant le chevauchement des sessions de Londres et New York de 12h00 à 16h00 GMT, où plus de 50 % du volume quotidien du Forex est échangé. Cette période est idéale pour le trading actif car les mouvements de prix sont plus forts et les motifs plus clairs.\n\nLes jours de la semaine comptent aussi : mardi, mercredi et jeudi sont généralement les meilleurs jours de trading car ils contiennent le plus de données économiques. Lundi peut être calme en début de semaine, et vendredi après 16h00 GMT voit une baisse notable du volume à l\'approche de la clôture hebdomadaire.',
    keyPoints: [
      'Le chevauchement Londres-New York (12h00-16h00 GMT) est la période la plus active',
      'La session asiatique est relativement calme et convient aux paires JPY et AUD',
      'Mardi, mercredi et jeudi sont les meilleurs jours de trading pour le mouvement et les opportunités',
      'Évitez de trader pendant les nouvelles à fort impact si vous êtes débutant',
    ],
    practicalExample: 'Un trader du Golfe remarque que le meilleur moment pour trader est de 15h00 à 19h00 heure locale, ce qui correspond au chevauchement Londres-New York. Il prévoit d\'ouvrir des transactions pendant ces quatre heures et seulement surveiller le marché le reste de la journée, ce qui augmente la qualité des transactions et réduit le trading aléatoire.',
  },
  l5: {
    content: 'Le calcul du profit et de la perte en Forex dépend de trois facteurs : la taille de la transaction (lot), le nombre de pips gagnés ou perdus, et la valeur du pip. Un lot standard équivaut à 100 000 unités de la devise de base, un mini-lot à 10 000, et un micro-lot à 1 000.\n\nLa valeur du pip pour un lot standard dans les paires se terminant par le dollar américain (comme EUR/USD et GBP/USD) est d\'exactement 10 dollars. Pour les autres paires, la valeur du pip change selon le taux de change actuel. C\'est pourquoi les débutants préfèrent s\'exercer sur les paires se terminant par USD pour des calculs plus simples.\n\nLa formule de base du profit : Profit = nombre de pips × valeur du pip × taille du lot. Exemple : si vous gagnez 40 pips sur une transaction de 0,3 lot sur EUR/USD, le profit = 40 × 10 × 0,3 = 120 $. Le spread et les commissions doivent être déduits de ce profit pour calculer le profit net.',
    keyPoints: [
      'Lot standard = 100 000 unités, mini = 10 000, micro = 1 000',
      'La valeur du pip pour un lot standard dans les paires USD est d\'exactement 10 dollars',
      'Formule du profit : nombre de pips × valeur du pip × taille du lot',
      'Le spread et les commissions sont déduits des profits et ajoutés aux pertes',
    ],
    practicalExample: 'Vous ouvrez une transaction d\'achat sur EUR/USD avec 0,2 lot à 1,0850 et la fermez à 1,0920. Profit = 70 pips × 10 $ × 0,2 = 140 $. Si le spread est de 1,5 pip, le coût = 1,5 × 10 × 0,2 = 3 $. Profit net = 137 $. Si la transaction avait été une vente au lieu d\'un achat, vous auriez perdu 143 $ (140 + 3 spread).',
  },

  // ── Analyse Technique (5 leçons) ──
  l6: {
    content: 'L\'analyse technique est l\'étude des mouvements de prix passés pour prédire les mouvements futurs, et repose sur trois principes fondamentaux : le prix reflète tout, les prix évoluent en tendances, et l\'histoire se répète. L\'analyste technique ne se préoccupe pas des raisons fondamentales derrière le mouvement des prix mais du prix lui-même et du volume de transactions.\n\nLes outils de base de l\'analyse technique incluent : les bougies japonaises qui affichent les prix d\'ouverture, de clôture, haut et bas pour la période ; les niveaux de support et de résistance qui identifient les zones où le prix stagne ; et les indicateurs techniques comme les moyennes mobiles, le RSI et le MACD.\n\nL\'unité de temps est très importante en analyse technique. L\'analyse sur l\'unité hebdomadaire donne une vue d\'ensemble de la tendance générale, l\'unité quotidienne pour la tendance moyenne, et l\'unité horaire pour les entrées en transaction. La règle d\'or est d\'analyser d\'abord l\'unité de temps supérieure puis de descendre vers les inférieures.',
    keyPoints: [
      'L\'analyse technique étudie le prix et le volume pour prédire les mouvements futurs',
      'Trois principes : le prix reflète tout, les prix tendanciellement, l\'histoire se répète',
      'Les bougies japonaises et les niveaux de support/résistance sont les outils de base',
      'Commencez l\'analyse par l\'unité de temps supérieure puis descendez vers les inférieures',
    ],
    practicalExample: 'Vous voulez analyser GBP/USD. Vous commencez par l\'unité hebdomadaire et remarquez une tendance haussière claire avec un support à 1,2500. Sur l\'unité quotidienne, vous voyez le prix rebondir de 1,2550 près du support hebdomadaire. Sur l\'unité 4 heures, vous remarquez un motif de retournement haussier. Votre décision : acheter près de 1,2560 avec un stop loss sous 1,2480 et cibler 1,2750.',
  },
  l7: {
    content: 'Les bougies japonaises sont le type de graphique le plus utilisé en analyse technique, inventées par les Japonais au 18e siècle pour le commerce du riz. Chaque bougie affiche quatre informations : le prix d\'ouverture, le prix de clôture, le prix le plus haut et le prix le plus bas pendant la période spécifiée.\n\nUne bougie haussière (verte) a un prix de clôture supérieur à son ouverture, tandis qu\'une bougie baissière (rouge) a une clôture inférieure à son ouverture. Le corps est la distance entre l\'ouverture et la clôture, et les mèches s\'étendent du corps au plus haut et au plus bas. Une bougie à grand corps et mèches courtes indique un contrôle clair, tandis qu\'une bougie à mèches longues indique une hésitation.\n\nLes motifs de bougie unique comme le marteau et l\'étoile filante donnent d\'importants signaux de retournement. Les motifs à plusieurs bougies comme l\'engulfing et le harami fournissent une confirmation plus forte. Les signaux les plus fiables apparaissent quand ces motifs se produisent à des niveaux clés de support/résistance.',
    keyPoints: [
      'Chaque bougie affiche quatre prix : ouverture, clôture, plus haut, plus bas',
      'Bougie haussière : clôture supérieure à l\'ouverture. Baissière : l\'inverse',
      'Grand corps = fort contrôle. Longues mèches = hésitation et conflit',
      'Les motifs de bougie unique comme le marteau et l\'étoile donnent d\'importants signaux de retournement',
    ],
    practicalExample: 'Sur le graphique quotidien USD/JPY, vous remarquez une baisse continue puis une bougie marteau apparaît à un fort niveau de support. Le marteau a une longue mèche inférieure et un petit corps en haut, indiquant que les vendeurs ont poussé le prix à la baisse mais que les acheteurs ont repris le contrôle et clôturé près de l\'ouverture. C\'est un signal potentiel de retournement haussier.',
  },
  l8: {
    content: 'L\'indice de force relative (RSI) est un oscillateur de momentum oscillant entre 0 et 100, développé par J. Welles Wilder en 1978. Le RSI calcule la moyenne des gains par rapport à la moyenne des pertes sur une période spécifiée (généralement 14 jours). La formule mathématique fait que les lectures au-dessus de 70 indiquent une surachat et en dessous de 30 indiquent une survente.\n\nCependant, la surachat ne signifie pas un retournement immédiat. Dans une forte tendance, le RSI peut rester au-dessus de 70 longtemps pendant que le prix continue de monter. Par conséquent, le RSI est mieux utilisé avec d\'autres indicateurs pour confirmer les signaux. Un des signaux RSI les plus forts est la divergence : quand le prix enregistre un plus haut mais que le RSI enregistre un plus haut inférieur, indiquant un affaiblissement du momentum et un retournement approchant.\n\nLes utilisations avancées incluent : le niveau 50 comme séparateur entre haussier et baissier, les lignes de tendance sur le RSI lui-même, et les zones de surachat/survente ajustées selon la tendance (40-50 comme support en tendance haussière, 50-60 comme résistance en tendance baissière).',
    keyPoints: [
      'Le RSI oscille entre 0 et 100 et mesure le momentum du prix (période 14 par défaut)',
      'Au-dessus de 70 = surachat. En dessous de 30 = survente. Mais pas nécessairement un retournement immédiat',
      'La divergence entre le prix et le RSI est un des signaux de retournement les plus forts',
      'Le niveau 50 agit comme séparateur entre momentum haussier et baissier',
    ],
    practicalExample: 'Sur le graphique quotidien EUR/USD, le prix enregistre un nouveau plus haut à 1,0980 tandis que le RSI enregistre un plus haut inférieur à 68 par rapport au précédent à 75. C\'est une divergence baissière indiquant un affaiblissement du momentum haussier. Vous attendez la cassure d\'une ligne de tendance haussière sur le prix pour confirmer le signal, puis ouvrez une transaction de vente avec un stop loss au-dessus du plus haut.',
  },
  l9: {
    content: 'L\'indicateur MACD combine les propriétés de suivi de tendance et de mesure du momentum, et c\'est l\'un des indicateurs les plus utilisés. Il se compose de trois éléments : la ligne MACD (la différence entre les moyennes mobiles 12 et 26), la ligne de signal (la moyenne mobile 9 de la ligne MACD), et l\'histogramme (la différence entre la ligne MACD et la ligne de signal).\n\nLes signaux MACD les plus célèbres sont les croisements : quand la ligne MACD croise au-dessus de la ligne de signal, c\'est un signal d\'achat, et l\'inverse est un signal de vente. Les croisements sont plus fiables quand ils se produisent dans des zones extrêmes (loin au-dessus ou en dessous de zéro). L\'histogramme montre la distance entre les deux lignes et donne une alerte précoce avant le croisement lui-même.\n\nLa divergence sur le MACD est plus forte que les croisements. Quand le prix monte à un nouveau plus haut mais que le MACD enregistre un plus haut inférieur, cette contradiction indique un retournement approchant. Comme pour tous les indicateurs, le MACD donne de faux signaux dans les marchés latéraux, il est donc préférable de l\'utiliser avec l\'analyse des prix.',
    keyPoints: [
      'Le MACD combine le suivi de tendance et la mesure du momentum en un seul indicateur',
      'La ligne MACD croisant au-dessus de la ligne de signal = achat. L\'inverse = vente',
      'L\'histogramme donne une alerte précoce avant le croisement',
      'La divergence sur le MACD est un des signaux avancés de retournement les plus forts',
    ],
    practicalExample: 'Sur le graphique hebdomadaire GBP/JPY, vous remarquez un croisement haussier de la ligne MACD au-dessus de la ligne de signal après une période de baisse. L\'histogramme a commencé à passer de négatif à positif trois bougies avant le croisement. C\'est une alerte précoce. Avec un fort support sur le graphique, vous ouvrez une transaction d\'achat avec un stop loss sous le support.',
  },
  l10: {
    content: 'Les motifs graphiques sont des formes géométriques qui se répètent sur les graphiques et indiquent la direction du mouvement futur des prix. Ils se divisent en deux catégories principales : les motifs de retournement qui inversent la tendance actuelle, et les motifs de continuation qui indiquent la poursuite de la tendance après une pause.\n\nLes motifs de retournement célèbres incluent : la Tête et Épaules — l\'un des signaux de retournement les plus forts, composé de trois sommets dont le milieu est le plus haut ; le Double Sommet — ressemblant à la lettre M, indiquant l\'échec du prix à casser une résistance deux fois ; et le Double Bottom — ressemblant à la lettre W.\n\nLes motifs de continuation incluent : les Triangles (ascendants, descendants et symétriques), les Drapeaux qui sont de courtes périodes de retracement dans une forte tendance, et les Biseaux qui ressemblent aux triangles mais penchent contre la tendance. Le volume de transactions joue un rôle crucial dans la confirmation des motifs : le volume doit augmenter à la cassure de la ligne de cou.',
    keyPoints: [
      'Motifs de retournement : tête et épaules, doubles sommets, doubles bottoms',
      'Motifs de continuation : triangles, drapeaux, biseaux',
      'Le volume de transactions confirme la validité du motif surtout à la cassure de la ligne de cou',
      'L\'objectif de prix est généralement calculé par la distance de la ligne de cou depuis le point de cassure',
    ],
    practicalExample: 'Sur le graphique quotidien AUD/USD, vous remarquez un motif tête et épaules : épaule gauche à 0,6650, tête à 0,6700, épaule droite à 0,6640. La ligne de cou est à 0,6560. À la cassure de la ligne de cou avec un volume élevé, vous ouvrez une transaction de vente. L\'objectif = la distance de la tête à la ligne de cou (140 pips) soustraite du point de cassure : 0,6560 - 0,0140 = 0,6420.',
  },

  // ── Analyse Fondamentale (5 leçons) ──
  l11: {
    content: 'L\'analyse fondamentale est l\'étude des facteurs économiques, politiques et sociaux qui affectent la valeur des devises et des actifs financiers. Tandis que l\'analyse technique se concentre sur le mouvement des prix lui-même, l\'analyse fondamentale se concentre sur les raisons sous-jacentes derrière ces mouvements. L\'objectif est de déterminer la vraie valeur d\'un actif et de la comparer au prix du marché.\n\nLes principaux moteurs fondamentaux incluent : les taux d\'intérêt qui déterminent les rendements des investissements dans une devise, l\'inflation qui érode le pouvoir d\'achat, les données du marché du travail qui reflètent la santé économique, le produit intérieur brut comme mesure globale de la croissance économique, et les événements géopolitiques qui provoquent des fluctuations soudaines.\n\nLes meilleurs traders combinent les deux analyses : fondamentale pour déterminer la direction générale et technique pour choisir les points d\'entrée et de sortie. Comprendre les données fondamentales vous aide à savoir pourquoi le prix bouge, et l\'analyse technique vous dit quand entrer dans la transaction.',
    keyPoints: [
      'L\'analyse fondamentale étudie les raisons économiques et politiques derrière les mouvements de prix',
      'Les taux d\'intérêt, l\'inflation et les données du marché du travail sont les moteurs fondamentaux les plus forts',
      'Combiner l\'analyse fondamentale et technique donne les meilleurs résultats',
      'Le calendrier économique est votre premier outil pour suivre les données fondamentales',
    ],
    practicalExample: 'La Réserve Fédérale augmente les taux d\'intérêt de 0,25 % plus que prévu. Cela renforce le dollar américain car des rendements plus élevés attirent les investissements étrangers. Vous vous attendez à une hausse de USD/JPY et à une baisse d\'EUR/USD. Vous utilisez l\'analyse technique pour déterminer le meilleur point d\'entrée après la réaction initiale du marché.',
  },
  l12: {
    content: 'Les données d\'emploi, particulièrement le rapport NFP mensuel, sont parmi les données les plus impactantes sur les marchés. Le rapport est publié le premier vendredi de chaque mois et inclut le nombre de nouveaux emplois, le taux de chômage et les salaires moyens. Toute surprise dans ces chiffres peut faire bouger le dollar de centaines de pips en quelques minutes.\n\nLa logique est simple : un emploi fort signifie une économie saine, ce qui soutient les hausses de taux et renforce le dollar. Un emploi faible signifie un besoin de stimulation économique qui peut inclure des baisses de taux, affaiblissant le dollar. Les salaires moyens sont aussi importants car des salaires en hausse signifient une pression inflationniste qui peut nécessiter un resserrement monétaire.\n\nL\'impact du NFP s\'étend à toutes les paires du dollar, à l\'or (généralement une relation inverse), et aux indices boursiers. Les traders professionnels évitent d\'ouvrir des transactions juste avant le NFP et attendent la réaction initiale, puis entrent dans la tendance après que le prix se stabilise.',
    keyPoints: [
      'Le NFP est publié le premier vendredi de chaque mois et fait fortement bouger le dollar',
      'Un emploi fort = soutien au dollar. Un emploi faible = faiblesse du dollar',
      'Les salaires moyens sont un indicateur d\'inflation important et peuvent être plus forts que le chiffre de l\'emploi lui-même',
      'Évitez de trader juste avant le NFP et attendez que le prix se stabilise',
    ],
    practicalExample: 'Le rapport NFP montre 350 000 emplois ajoutés contre 180 000 attendus. Le dollar bondit : EUR/USD chute de 80 pips en 5 minutes. Au lieu d\'acheter immédiatement, vous attendez un petit retracement puis entrez à la vente dans la tendance, avec un stop loss au-dessus du plus haut pré-nouvelles. C\'est une approche plus sûre que de trader pendant la frénésie initiale.',
  },
  l13: {
    content: 'Les décisions de taux d\'intérêt sont le moteur le plus fort des prix des devises à moyen et long terme. Quand une banque centrale augmente ses taux, la devise devient plus attractive pour les investisseurs cherchant des rendements plus élevés, ce qui pousse sa valeur à la hausse. L\'inverse est vrai lors d\'une baisse des taux. C\'est la raison principale derrière les grands mouvements de devises.\n\nCependant, le marché trade sur les attentes, pas sur les décisions elles-mêmes. Si tout le monde s\'attend à une hausse et que la hausse se produit, le prix peut peu bouger car la nouvelle est déjà prixée. Les surprises sont ce qui fait bouger les marchés : hausses inattendues ou signaux plus agressifs que ce que le marché attendait.\n\nLa déclaration accompagnante et la conférence de presse du président sont parfois plus importantes que la décision elle-même. Des mots comme "hawkish" (penché vers la hausse des taux) ou "dovish" (penché vers la baisse) fixent la direction du marché pour les semaines à venir. Les stratégies de trading sur nouvelles se concentrent sur l\'écart entre les attentes et le résultat réel.',
    keyPoints: [
      'Augmenter les taux soutient la devise et les baisser l\'affaiblit — le moteur principal',
      'Le marché prix les attentes à l\'avance, donc seules les surprises font fortement bouger le prix',
      'La déclaration accompagnante et la conférence de presse sont souvent plus importantes que la décision elle-même',
      'Suivez les attentes du marché via les contrats à terme sur les taux (Fed Funds Futures) avant la décision',
    ],
    practicalExample: 'La Banque Centrale Européenne augmente les taux de 0,25 % comme prévu, mais le Président dit "d\'autres hausses sont à venir" — plus fort que prévu. L\'euro bondit contre le dollar. Vous entrez dans une transaction d\'achat sur EUR/USD avec un stop loss sous un support proche, bénéficiant du nouvel élan.',
  },
  l14: {
    content: 'L\'indice des prix à la consommation (CPI) est la principale mesure de l\'inflation et est publié mensuellement dans la plupart des grands pays. Il mesure le changement du coût d\'un panier de biens et services de consommation. Une inflation élevée érode le pouvoir d\'achat et pousse les banques centrales à augmenter les taux, tandis qu\'une inflation faible ou déflationniste peut les pousser à baisser les taux ou utiliser des outils de stimulation.\n\nLe CPI core exclut les prix volatils de l\'énergie et de l\'alimentation et donne une image plus claire de la tendance inflationniste réelle. Les banques centrales le surveillent de près car il est plus stable et prévisible que le CPI général.\n\nL\'impact du CPI sur les marchés est immédiat et fort : une inflation plus élevée que prévu soutient la devise (car elle augmente la probabilité de hausses de taux), et une inflation plus basse l\'affaiblit. L\'or est particulièrement affecté car il est considéré comme une couverture contre l\'inflation — un CPI en hausse soutient généralement l\'or.',
    keyPoints: [
      'Le CPI mesure le changement dans un panier de consommation et est la principale mesure de l\'inflation',
      'Le CPI core exclut l\'alimentation et l\'énergie et est plus indicatif de la tendance inflationniste',
      'Une inflation plus élevée que prévu = soutien à la devise et plus forte probabilité de hausses de taux',
      'L\'or augmente généralement avec un CPI élevé car il est une couverture contre l\'inflation',
    ],
    practicalExample: 'Les données CPI américaines montrent une hausse mensuelle de 0,5 % contre 0,3 % prévu. Cela signifie une inflation plus élevée que prévu et le dollar monte. L\'or aussi monte car l\'inflation élevée soutient les actifs de couverture. Vous entrez dans une transaction d\'achat sur l\'or avec un stop loss sous un support proche.',
  },
  l15: {
    content: 'Les grandes données économiques incluent le produit intérieur brut, les indicateurs manufacturiers et des services, les ventes au détail, la balance commerciale, et autres. Chacune a son importance, mais leur impact varie selon le contexte économique prévalent. En périodes de crainte de récession, les données de croissance et d\'emploi sont les plus importantes, tandis qu\'en périodes inflationnistes, les données de prix ont l\'impact le plus fort.\n\nLe secret réside dans la comparaison des données réelles aux attentes, pas aux valeurs absolues. Les données meilleures que prévu soutiennent la devise, et les pires l\'affaiblissent. Les sources d\'attentes incluent les sondages Bloomberg et Reuters et les contrats à terme sur indices.\n\nStratégie avancée : ne vous contentez pas de lire le chiffre principal, regardez les détails. Par exemple, le NFP peut montrer des emplois forts mais le chômage a augmenté ou les salaires ont faibli — ces contradictions créent des opportunités de trading après que la réaction initiale se stabilise quand le marché réalise l\'image complète.',
    keyPoints: [
      'Comparez les données réelles aux attentes, pas seulement aux valeurs absolues',
      'L\'importance de chaque donnée change selon le contexte économique prévalent',
      'Les détails sont parfois plus importants que le chiffre principal — lisez le rapport complet',
      'Les contradictions au sein du même rapport créent des opportunités après la réaction initiale',
    ],
    practicalExample: 'Les données PIB américaines montrent une croissance de 2,5 % contre 2,0 % prévu — positif pour le dollar. Mais en détail : la dépense de consommation a baissé et les stocks ont augmenté (croissance non durable). Le dollar monte initialement puis recule. Vous entrez à la vente sur USD/CHF après le recul, bénéficiant d\'une lecture plus approfondie des données.',
  },

  // ── Gestion des Risques (4 leçons) ──
  l16: {
    content: 'La gestion des risques est la différence entre un trader réussi et un trader échoué. Les études montrent que plus de 70 % des traders débutants perdent leur capital la première année, et la raison principale n\'est pas l\'incapacité à analyser le marché mais le manque de gestion des risques. L\'objectif de la gestion des risques n\'est pas d\'empêcher la perte mais de la contrôler afin que vous restiez dans le jeu longtemps.\n\nLa première règle d\'or : ne risquez pas plus de 1-2 % de votre capital dans une seule transaction. Si votre compte est de 10 000 $, la perte maximale autorisée dans une seule transaction est de 100-200 $. Cela garantit que vous avez besoin de plus de 50 transactions perdantes consécutives pour perdre la moitié de votre compte — presque impossible avec un trading discipliné.\n\nLa seconde règle : la diversification. Ne mettez pas tout votre risque dans un seul actif ou une seule paire. Distribuez les transactions sur différentes paires qui ne sont pas étroitement corrélées. La troisième règle : la planification préalable. Déterminez le point d\'entrée, le stop loss et le take profit avant d\'ouvrir la transaction et tenez-vous-y.',
    keyPoints: [
      'La gestion des risques est plus importante que l\'analyse de marché — elle détermine votre survie',
      'Ne risquez pas plus de 1-2 % du capital dans une seule transaction',
      'Diversifiez les transactions sur des actifs non étroitement corrélés',
      'Planifiez à l\'avance : déterminez l\'entrée, le stop loss et la cible avant d\'ouvrir la transaction',
    ],
    practicalExample: 'Votre compte est de 5 000 $ et vous voulez trader EUR/USD. Avec un risque de 1 %, la perte maximale = 50 $. Si vous placez un stop loss à 25 pips, la taille de la transaction = 50 / (25 × 0,10) = 20 micro-lots (0,20 lot). Avec cette taille, si le stop loss est touché, vous perdez seulement 50 $, soit 1 % de votre compte.',
  },
  l17: {
    content: 'Le Stop Loss est un ordre automatique qui ferme la transaction à un niveau de prix spécifié pour limiter les pertes. Le Take Profit est un ordre similaire qui ferme la transaction au niveau cible. Ces deux ordres sont la première ligne de défense et le plan financier de toute transaction.\n\nTypes de stop loss : un stop fixe est placé à un niveau de prix spécifié et ne bouge pas ; un stop suiveur suit le prix à une distance spécifiée et verrouille les profits progressivement. Un stop basé sur l\'analyse est placé à un niveau de support ou de résistance ou sous un motif technique, et un stop basé sur le pourcentage est placé à un pourcentage du prix d\'entrée.\n\nErreurs courantes : placer le stop trop serré pour qu\'il soit touché par un mouvement normal puis le prix continue dans votre direction ; ne pas placer de stop du tout en espérant un rebond ; et déplacer le stop pour augmenter la perte. La règle : n\'entrez jamais dans une transaction sans stop loss, sans exception.',
    keyPoints: [
      'Le stop loss est obligatoire dans chaque transaction — sans exception',
      'Le stop suiveur verrouille les profits progressivement à mesure que la tendance continue',
      'Placez le stop à un niveau technique logique, pas au hasard',
      'Le ratio risque-récompense devrait être d\'au moins 1:2 pour chaque transaction',
    ],
    practicalExample: 'Vous achetez GBP/USD à 1,2650 et placez un stop loss à 1,2590 (60 pips) sous un fort support. Votre cible est 1,2770 (120 pips) à la résistance. Ratio risque-récompense = 60:120 = 1:2. Si le stop est touché, vous perdez 60 pips ; si la cible est atteinte, vous gagnez 120 pips. Vous n\'avez besoin que de 34 % de réussite pour atteindre l\'équilibre avec ce ratio.',
  },
  l18: {
    content: 'Le dimensionnement de la position est la décision la plus importante que vous prenez après la décision d\'entrée elle-même. Une mauvaise taille peut transformer une transaction juste analytiquement en désastre financier. L\'objectif est de déterminer la taille de la transaction afin que la perte potentielle soit toujours dans vos limites acceptables.\n\nFormule de dimensionnement : taille du lot = (capital × pourcentage de risque) / (distance du stop loss en pips × valeur du pip). Exemple : compte de 10 000 $ avec 2 % de risque et stop de 50 pips avec une valeur de pip de 10 $. Taille du lot = (10000 × 0,02) / (50 × 10) = 0,4 lot.\n\nRègles importantes : maintenez le risque total pour toutes les transactions ouvertes à pas plus de 5-6 % du capital. Si vous avez 3 transactions ouvertes chacune avec 2 % de risque, le risque total est de 6 %, ce qui est le maximum. N\'augmentez jamais la taille après une perte pour la récupérer (cela s\'appelle la martingale et c\'est très dangereux).',
    keyPoints: [
      'Taille de position = (capital × pourcentage de risque) / (distance du stop × valeur du pip)',
      'Le risque total pour toutes les transactions ouvertes ne doit pas dépasser 5-6 %',
      'N\'augmentez pas la taille après une perte — c\'est la martingale et c\'est catastrophique',
      'Réduisez la taille après une série de pertes jusqu\'à ce que vous retrouviez votre confiance et votre analyse',
    ],
    practicalExample: 'Après une série de pertes, votre compte chute de 10 000 $ à 8 000 $. Avec un risque de 1 % : perte maximale = 80 $. Si votre stop est de 40 pips sur EUR/USD : taille = 80 / (40 × 10) = 0,2 lot. Vous avez réduit le risque de 2 % à 1 % pour protéger le compte pendant les périodes difficiles. C\'est un comportement professionnel.',
  },
  l19: {
    content: 'Le ratio Risque-Récompense compare la perte potentielle au profit potentiel dans une transaction. Un ratio de 1:2 signifie que vous risquez un dollar pour en gagner deux. Ce ratio est la pierre angulaire de toute stratégie de trading réussie car il garantit la rentabilité même avec un taux de réussite inférieur à 50 %.\n\nLe calcul est simple : avec un ratio risque-récompense de 1:2, vous n\'avez besoin que de 34 % de transactions gagnantes pour atteindre l\'équilibre. Avec 1:3, vous n\'avez besoin que de 25 %. Cela signifie que vous pouvez perdre dans 2 transactions sur 3 et rester rentable si le ratio risque-récompense est de 1:3.\n\nL\'erreur courante est de fermer les transactions gagnantes tôt par peur et de laisser les perdantes courir en espérant une amélioration. Cela inverse effectivement le ratio : vous risquez beaucoup et gagnez peu. La solution : déterminez la cible à l\'avance, laissez le prix travailler, et n\'intervenez pas.',
    keyPoints: [
      '1:2 minimum — risquez 1 pour gagner 2',
      'Avec un ratio de 1:3 vous n\'avez besoin que de 25 % de réussite pour être rentable',
      'Ne fermez pas les gagnantes tôt — cela réduit considérablement le ratio réel',
      'Choisissez des transactions avec des ratios naturellement élevés à des niveaux de support/résistance clairs',
    ],
    practicalExample: 'Vous entrez à la vente sur USD/CAD à 1,3650 avec un stop à 1,3710 (60 pips de perte) et cible à 1,3530 (120 pips de profit). Ratio = 1:2. Si cette transaction se répète 10 fois et que seulement 4 gagnent : profit = 4 × 120 = 480 pips. Perte = 6 × 60 = 360 pips. Profit net = 120 pips malgré un taux de réussite de 40 %.',
  },

  // ── Crypto (3 leçons) ──
  l20: {
    content: 'Les cryptomonnaies sont des actifs numériques décentralisés qui utilisent la technologie blockchain pour enregistrer les transactions. Le Bitcoin a été la première cryptomonnaie, lancée en 2009 par une personne ou un groupe sous le nom de Satoshi Nakamoto. Aujourd\'hui il existe plus de 20 000 cryptomonnaies différentes avec une capitalisation boursière totale dépassant 2 billions de dollars.\n\nLa blockchain est un registre numérique distribué sur des milliers d\'ordinateurs à travers le monde, ce qui le rend presque impossible à pirater ou modifier. C\'est la base de la sécurité des cryptomonnaies. Chaque transaction est vérifiée par un réseau de mineurs ou de validateurs avant d\'être enregistrée.\n\nLes caractéristiques des cryptos incluent : la décentralisation (aucune autorité centrale ne les contrôle), la transparence (toutes les transactions sont publiques), et la portée mondiale (envoyez à n\'importe qui dans le monde en quelques minutes). Mais les inconvénients incluent une forte volatilité, une réglementation limitée, et des risques de cyberséscurité.',
    keyPoints: [
      'La blockchain est la technologie sous-jacente — un registre numérique décentralisé inviolable',
      'Le Bitcoin est la première et plus grande cryptomonnaie avec une capitalisation dépassant mille milliards de dollars',
      'La décentralisation, la transparence et la portée mondiale sont les principales caractéristiques des cryptos',
      'La forte volatilité, les risques réglementaires et les risques cyber sont les principaux défis',
    ],
    practicalExample: 'Vous achetez 0,01 bitcoin à 65 000 $ (650 $). En une semaine, le bitcoin monte de 8 % à 70 200 $. Votre investissement devient 702 $. Mais s\'il baisse de 8 %, il devient 598 $. Cela illustre la forte volatilité : de grands profits et des grandes pertes en peu de temps. C\'est pourquoi la gestion des risques en crypto est plus importante que dans tout autre marché.',
  },
  l21: {
    content: 'Le trading du bitcoin et des principales cryptomonnaies (Ethereum, BNB, Solana) diffère du trading Forex sur plusieurs aspects. Le marché fonctionne 24/7 sans interruption, la volatilité est bien plus élevée, et les nouvelles réglementaires ont un impact énorme. Mais les bases de l\'analyse technique et fondamentale restent les mêmes.\n\nLe Bitcoin est le moteur principal de tout le marché. Quand le bitcoin monte, la plupart des autres cryptos montent avec (généralement par un pourcentage plus important), et quand il baisse, elles baissent toutes. Cette corrélation étroite signifie que l\'analyse du bitcoin devrait être votre première étape avant de trader toute autre crypto.\n\nLes facteurs spécifiques aux cryptos : le halving du Bitcoin (tous les 4 ans la récompense de minage est réduite de moitié, ce qui historiquement réduit l\'offre et pousse le prix à la hausse), les mises à jour du réseau (comme les mises à jour d\'Ethereum), la réglementation gouvernementale (décisions SEC et impact de la Chine), et les risques d\'échange (piratages de plateformes).',
    keyPoints: [
      'Le marché crypto fonctionne 24/7 et la volatilité est bien plus élevée que le Forex',
      'Le Bitcoin mène le marché — analysez-le d\'abord avant toute autre crypto',
      'Le halving tous les 4 ans réduit l\'offre et a historiquement poussé le prix à la hausse',
      'La réglementation gouvernementale et la sécurité des plateformes sont des risques uniques aux cryptos',
    ],
    practicalExample: 'Le Bitcoin teste la résistance à 70 000 $ après une forte hausse. Ethereum se trade à 3 800 $. Votre analyse voit que si le bitcoin casse 70 000 $, il atteindra 80 000 $. Au lieu d\'acheter le bitcoin directement, vous achetez Ethereum car il se déplace d\'un pourcentage plus important (bêta plus élevé). Si le bitcoin monte de 15 %, Ethereum peut monter de 25 %.',
  },
  l22: {
    content: 'L\'analyse du marché crypto nécessite de comprendre des facteurs uniques non présents sur les marchés traditionnels. Le premier est l\'analyse on-chain : l\'étude des données de la blockchain elle-même comme le volume des transactions, le nombre de portefeuilles actifs, et le flux de cryptos vers et depuis les plateformes d\'échange. Ces données donnent une vue unique du comportement des investisseurs.\n\nLe second : l\'analyse de la liquidité et de l\'offre. Beaucoup de cryptos ont un calendrier de déblocage qui libère progressivement de nouvelles quantités. Ces déblocages peuvent exercer une pression sur le prix. Le Bitcoin est différent car son offre est fixée à 21 millions de pièces seulement.\n\nLe troisième : les indicateurs de sentiment spécifiques aux cryptos. L\'indice de peur et d\'avidité crypto, le nombre de recherches sur le bitcoin, et le taux de hachage du réseau sont tous des indicateurs qui aident à évaluer l\'état du marché. En crypto plus que dans tout autre marché, les émotions dirigent les prix à court terme.',
    keyPoints: [
      'L\'analyse on-chain étudie les données directes de la blockchain — un avantage unique des cryptos',
      'Les calendriers de déblocage des cryptos exercent une pression sur le prix — surveillez-les attentivement',
      'L\'indice de peur et d\'avidité crypto est un indicateur émotionnel important',
      'Les émotions sont plus fortes en crypto que dans tout autre marché — méfiez-vous des décisions impulsives',
    ],
    practicalExample: 'L\'analyse on-chain montre qu\'une grande quantité de bitcoin a été transférée des portefeuilles froids vers les plateformes d\'échange — généralement un signe d\'intention de vente. En même temps, l\'indice de peur et d\'avidité est à 85 (avidité extrême). Vous décidez de réduire vos positions longues ou de placer un stop suiveur pour sécuriser les profits.',
  },

  // ── Matières Premières (3 leçons) ──
  l23: {
    content: 'L\'or est le plus vieux actif financier de l\'histoire et une valeur refuge en temps de crise. Il se trade sous le symbole XAU/USD et est affecté par des facteurs uniques, notamment : le prix du dollar (généralement une relation inverse), les taux d\'intérêt réels (intérêt moins inflation), les risques géopolitiques, et la demande physique de l\'Inde et de la Chine.\n\nQuand le dollar s\'affaiblit, l\'or devient moins cher pour les acheteurs avec d\'autres devises, augmentant la demande et le prix. Quand les taux d\'intérêt réels montent, l\'or devient moins attractif car il ne rapporte pas de rendement. Mais en temps de crise et d\'inquiétude, l\'or monte indépendamment des taux car c\'est une réserve de valeur sûre.\n\nL\'or est caractérisé par une volatilité modérée (moins que la crypto et plus que le Forex) et une haute liquidité. Il se trade 24h/24, mais ses meilleurs moments coïncident avec les sessions de Londres et New York. Les traders utilisent l\'analyse technique avec succès sur l\'or car ses motifs sont clairs et relativement fiables.',
    keyPoints: [
      'L\'or est une valeur refuge qui monte en crise — généralement inverse au dollar',
      'Des taux d\'intérêt réels élevés affaiblissent l\'or car il ne rapporte pas de rendement',
      'La demande physique de l\'Inde et de la Chine affecte le prix à moyen terme',
      'Volatilité modérée et haute liquidité — convenable pour tous les niveaux de traders',
    ],
    practicalExample: 'Les tensions géopolitiques s\'intensifient et le dollar s\'affaiblit. Vous achetez l\'or à 2 350 $ avec un stop loss à 2 320 $ (30 $) et cible 2 420 $ (70 $). Ratio 1:2,3. Si la crise s\'intensifie, le prix peut dépasser largement votre cible, donc vous placez un stop suiveur à 20 $ derrière le prix pour verrouiller les profits.',
  },
  l24: {
    content: 'Le pétrole brut se trade en deux types principaux : le Brent (la référence mondiale) et le WTI (la référence américaine). Le prix du pétrole est affecté par l\'offre et la demande réelles plus que par tout autre facteur. L\'OPEP+ contrôle une grande partie de la production et ses décisions font fortement bouger les prix.\n\nLes facteurs d\'offre : les décisions de production de l\'OPEP+, la production américaine de pétrole de schiste, et les événements géopolitiques dans les régions productrices (Golfe, Russie, Venezuela). Les facteurs de demande : la croissance économique mondiale surtout en Chine, la saison estivale de voyage et de conduite, et la transition à long terme vers les énergies propres.\n\nLe rapport hebdomadaire des stocks de pétrole américains (EIA) est publié chaque semaine et fait bouger les prix immédiatement. Stocks plus élevés que prévu = pression à la baisse, et plus bas = pression à la hausse. Les traders professionnels surveillent aussi les taux de raffinage et les stocks d\'essence et de distillats.',
    keyPoints: [
      'Brent et WTI sont les deux principales références — le Brent se trade généralement à un prix plus élevé',
      'Les décisions de l\'OPEP+ sont le moteur d\'offre le plus fort et font fortement bouger les prix',
      'La croissance chinoise est le moteur principal de la demande mondiale de pétrole',
      'Le rapport hebdomadaire des stocks EIA est un événement important à suivre',
    ],
    practicalExample: 'L\'OPEP+ annonce une baisse de production de 2 millions de barils par jour plus que prévu. Le pétrole monte de 4 % en un jour. Vous aviez acheté du WTI à 78 $ avant la réunion sur la base de rumeurs de baisse. Vous avez placé un stop à 76 $ et maintenant le prix est à 81,12 $. Vous levez le stop suiveur à 79 $ pour sécuriser au moins 1 $ de profit par baril.',
  },
  l25: {
    content: 'Le dollar américain et les matières premières libellées en dollars ont une relation inverse historique. Quand le dollar monte, les matières premières deviennent plus chères pour les acheteurs avec d\'autres devises, réduisant la demande et le prix. L\'inverse se produit quand le dollar s\'affaiblit. Cette relation s\'applique fortement à l\'or, au pétrole et aux métaux industriels.\n\nMais la relation n\'est pas toujours mécanique. En temps de crise, le dollar et l\'or peuvent monter ensemble car les deux sont considérés comme des valeurs refuges. En périodes de forte croissance, le dollar et le pétrole peuvent monter ensemble car la demande d\'énergie augmente.\n\nStratégie de trading : surveillez le DXY (indice du dollar) et l\'or en même temps. Si le DXY monte et l\'or baisse, c\'est une tendance normale. Si les deux montent, c\'est un indicateur de crainte sur le marché (risk-off). Si les deux baissent, cela peut signaler des risques inflationnistes. Comprendre ces relations ajoute une couche importante à votre analyse.',
    keyPoints: [
      'Relation inverse historique : dollar fort = matières premières moins chères, dollar faible = plus chères',
      'Les exceptions se produisent surtout en temps de crise (les deux montent comme valeurs refuges)',
      'Surveillez le DXY et l\'or simultanément pour comprendre la direction du marché',
      'Dollar fort + or en hausse = sentiment de marché risk-off',
    ],
    practicalExample: 'Le DXY chute de 106 à 103 et l\'or monte de 2 300 $ à 2 380 $. La relation inverse fonctionne normalement. Vous ouvrez une transaction longue sur l\'or en vous fiant à la faiblesse continue du dollar. Mais soudain le DXY monte et l\'or ne baisse pas — cette contradiction peut indiquer une demande de sécurité pour l\'or due à une crise. Vous ajoutez un stop suiveur pour protéger vos profits.',
  },

  // ── Stratégies (4 leçons) ──
  l26: {
    content: 'Le Trend Following est l\'une des stratégies les plus anciennes et les plus réussies de l\'histoire. Le principe est simple : "la tendance est votre amie" — achetez quand le marché est dans une tendance haussière et vendez quand il est dans une tendance baissière. L\'idée est que les tendances ont tendance à continuer plus qu\'à s\'inverser.\n\nIdentification de la tendance : la moyenne mobile 200 jours est la référence. Si le prix est au-dessus de la MM200, la tendance est haussière ; si en dessous, baissière. Sur l\'unité hebdomadaire, la MM50 définit la tendance moyenne, et sur l\'unité quotidienne, la MM20 pour la tendance courte.\n\nPoints d\'entrée : le meilleur point est un retracement depuis la moyenne mobile dans une tendance primaire. Par exemple : prix au-dessus de la MM200 (tendance haussière) et rebond depuis la MM50. Vous attendez une confirmation avec une bougie de retournement ou un RSI passant au-dessus de 50, puis vous achetez. Stop loss sous le dernier plus bas formé. Cible à la prochaine résistance ou avec un stop suiveur.',
    keyPoints: [
      'Les tendances ont tendance à continuer — tradez avec elles, pas contre',
      'MM200 définit la tendance primaire, MM50 la moyenne, MM20 la courte',
      'Meilleur point d\'entrée : retracement depuis la MM dans une tendance primaire avec confirmation',
      'Utilisez un stop suiveur pour verrouiller les profits à mesure que la tendance continue',
    ],
    practicalExample: 'Sur EUR/USD quotidien : prix au-dessus de la MM200 (tendance haussière). Le prix rebondit de la MM50 à 1,0820. Une bougie marteau se forme avec le RSI revenant au-dessus de 50. Vous achetez à 1,0840 avec un stop sous le plus bas à 1,0790 (50 pips) et cible le dernier plus haut à 1,0950 (110 pips). Ratio 1:2,2. Vous placez un stop suiveur à une distance de 30 pips.',
  },
  l27: {
    content: 'La stratégie Breakout repose sur l\'entrée lors de la cassure d\'un niveau majeur de support ou de résistance avec un volume de transactions élevé. L\'idée est que quand le prix casse un niveau pivot, il gagne un fort élan dans la direction de la cassure. Les breakouts se produisent après des périodes de consolidation latérale où le prix se comprime comme un ressort.\n\nConditions d\'un breakout valide : la cassure doit se faire avec une bougie forte (clôture claire au-dessus/en dessous du niveau), le volume de transactions au moins trois fois la moyenne, et de préférence le niveau a été testé au moins deux fois auparavant. Les faux breakouts se produisent quand le prix casse le niveau puis revient rapidement — c\'est pourquoi la confirmation par le volume est importante.\n\nPoint d\'entrée : soit à la cassure directement (plus risqué mais profit plus élevé) ou au retest du niveau cassé (plus sûr mais un retest peut ne pas se produire). Stop loss sous/au-dessus du niveau cassé. La cible est déterminée par la taille de la range latérale précédente ou avec les outils de Fibonacci.',
    keyPoints: [
      'Breakout = cassure d\'un niveau majeur avec volume élevé et fort élan',
      'La confirmation par le volume est essentielle — un breakout sans volume est généralement faux',
      'Entrez à la cassure ou au retest (plus sûr)',
      'Stop loss sous/au-dessus du niveau cassé, cible par la taille de la range précédente',
    ],
    practicalExample: 'GBP/USD trade latéralement entre 1,2600 et 1,2750 pendant deux semaines. Soudain il casse 1,2750 avec une bougie forte et un volume trois fois la moyenne. Vous achetez à 1,2760 avec un stop à 1,2740 (juste sous le niveau cassé). Cible = largeur de la range (150 pips) + point de cassure : 1,2750 + 0,0150 = 1,2900. Le ratio 1:7 permet de perdre plusieurs transactions et rester rentable.',
  },
  l28: {
    content: 'Le Swing Trading maintient les transactions de quelques jours à quelques semaines, ciblant des mouvements de prix à moyen terme. C\'est le juste milieu entre le day trading épuisant et l\'investissement long terme lent. Convenable aux traders qui ne peuvent pas surveiller l\'écran toute la journée.\n\nUnités de temps : analyse sur l\'unité quotidienne pour déterminer la tendance et les points d\'entrée, hebdomadaire pour confirmer la tendance générale, et 4 heures pour affiner l\'entrée. La règle : prenez la décision sur le quotidien, exécutez sur le 4 heures.\n\nLes meilleures opportunités de swing : les retracements depuis de forts niveaux de support/résistance avec des croisements d\'indicateurs (comme MACD ou croisements de moyennes mobiles), les motifs de retournement complétés sur l\'unité quotidienne, et les breakouts après des périodes latérales. Stop loss généralement 50-150 pips et cible 100-400 pips, avec un ratio risque-récompense d\'au moins 1:2.',
    keyPoints: [
      'Le swing maintient les transactions des jours et des semaines — ne nécessite pas de surveillance continue',
      'Décision sur le quotidien, exécution sur le 4 heures',
      'Meilleures opportunités : retracements depuis de forts niveaux avec confirmation d\'indicateurs',
      'Stop 50-150 pips et cible 100-400 pips avec ratio 1:2+',
    ],
    practicalExample: 'USD/JPY sur l\'unité quotidienne : tendance haussière avec MM200 ascendante. Le prix rebondit de la MM20 à 154,50 avec un croisement haussier du MACD. Sur l\'unité 4 heures : bougie de retournement haussière. Vous achetez à 154,80 avec un stop sous 153,80 (100 pips) et cible 157,00 (220 pips). Ratio 1:2,2. La transaction peut prendre une semaine pour atteindre la cible.',
  },
  l29: {
    content: 'Le Scalping est un trading très rapide qui cible de petits profits répétés depuis des mouvements de prix précis. Un scalpeur ouvre et ferme des dizaines de transactions quotidiennement, ciblant 5-15 pips par transaction. Ce style nécessite une haute concentration, une exécution rapide, et une connexion internet stable.\n\nLes exigences du scalping : un courtier avec un spread très bas (moins d\'un pip sur les paires majors), une plateforme d\'exécution rapide sans slippage, et la capacité psychologique à prendre des décisions rapides et à s\'en tenir au plan sans hésitation. Non convenable aux traders qui hésitent ou subissent une pression psychologique.\n\nLes meilleures paires de scalping : EUR/USD et GBP/USD pour leurs spreads serrés et leur haute liquidité. Les meilleurs moments : la session de Londres et le chevauchement avec New York. Les outils techniques : moyennes mobiles courtes (5, 13, 21), RSI à période courte (5), et niveaux de support/résistance sur les unités 1 minute et 5 minutes.',
    keyPoints: [
      'Le scalping cible 5-15 pips par transaction avec une vitesse extrême',
      'Nécessite un spread très bas, une exécution rapide et une haute concentration',
      'Meilleures paires : EUR/USD et GBP/USD. Meilleur moment : Londres et New York',
      'Pas pour les débutants — nécessite de l\'expérience et une excellente discipline psychologique',
    ],
    practicalExample: 'Un scalpeur trade EUR/USD sur l\'unité 1 minute. Le prix rebondit de la MM21 avec le RSI(5) sortant de la survente. Il achète à 1,0852 avec un stop à 1,0845 (7 pips) et cible 1,0865 (13 pips). Ratio 1:1,9. La transaction se ferme en 3-5 minutes. Il répète cela 15-20 fois par jour en ciblant un net de 50-80 pips.',
  },

  // ── IA (3 leçons) ──
  l30: {
    content: 'L\'intelligence artificielle révolutionne le monde du trading à travers sa capacité à analyser des quantités massives de données à une vitesse fulgurante et à découvrir des motifs invisibles pour les humains. Ses applications en trading incluent : l\'analyse de sentiment du marché depuis les actualités et les médias sociaux, la prédiction des mouvements de prix basée sur les motifs historiques, la détection automatique de signaux de trading, et l\'optimisation de la gestion des risques.\n\nLes types d\'IA utilisés : le Machine Learning qui apprend des données historiques et améliore ses performances avec le temps, le traitement du langage naturel (NLP) qui analyse les textes et actualités, et les réseaux de neurones profonds qui imitent la structure du cerveau pour découvrir des motifs complexes.\n\nIl est important de comprendre : l\'IA n\'est pas une boule de cristal et ne garantit pas les profits. C\'est un outil puissant qui vous aide à prendre de meilleures décisions, mais la décision finale vous appartient. Le meilleur usage de l\'IA est comme assistant, pas comme remplaçant. Utilisez-la pour confirmer votre analyse ou pour filtrer les opportunités, pas pour prendre toute la décision.',
    keyPoints: [
      'L\'IA analyse des données massives et découvre des motifs invisibles pour les humains',
      'Applications : analyse de sentiment, prédiction des prix, détection de signaux, gestion des risques',
      'L\'IA n\'est pas une boule de cristal — c\'est un assistant, pas un remplaçant',
      'Meilleur usage : confirmer l\'analyse et filtrer les opportunités, pas la prise de décision complète',
    ],
    practicalExample: 'La plateforme Rouaa utilise l\'IA pour analyser 500 sources d\'actualités en temps réel et émet une évaluation de sentiment pour chaque paire de devises. L\'IA découvre que 78 % des actualités sur la livre britannique sont négatives avec un croisement baissier du MACD sur l\'unité quotidienne. Ce double signal (fondamental + technique) augmente votre confiance dans la décision de vente sur GBP/USD.',
  },
  l31: {
    content: 'L\'IA lit les marchés financiers à travers trois canaux principaux. Le premier : l\'analyse des prix et des volumes utilisant des algorithmes de machine learning qui découvrent des motifs dans les mouvements de prix que l\'esprit humain ne remarque pas. L\'IA peut traiter des centaines de paires sur des dizaines d\'unités de temps simultanément.\n\nLe second : l\'analyse de sentiment. L\'IA traite des milliers d\'articles, tweets et rapports par heure et les classifie comme positifs, négatifs ou neutres. Elle calcule un indice de sentiment global pour chaque actif et le compare aux prix historiques pour prédire la prochaine réaction. Quand le sentiment est excessivement positif, il peut être temps de vendre, et vice versa.\n\nLe troisième : l\'analyse de corrélation. L\'IA découvre des relations entre des actifs que le trader moyen ne remarque pas — par exemple, que la hausse des prix du cuivre précède généralement les hausses d\'AUD/JPY de trois jours. Ces corrélations avancées donnent un véritable avantage compétitif.',
    keyPoints: [
      'L\'IA lit les marchés via : analyse des prix, analyse de sentiment, et analyse de corrélation',
      'Découvre des motifs sur des centaines de paires et des dizaines d\'unités de temps simultanément',
      'L\'analyse de sentiment traite des milliers de textes et calcule un indice par actif',
      'Les corrélations avancées entre actifs donnent un avantage compétitif unique',
    ],
    practicalExample: 'L\'IA dans la plateforme Rouaa découvre que l\'indice de sentiment du dollar a atteint un pessimisme extrême (15/100), le niveau le plus bas en 6 mois. Historiquement, quand le sentiment atteint ce niveau, le dollar rebondit dans les 5 jours à 70 %. Ce signal d\'IA s\'ajoute à la confirmation de votre analyse technique qui voit un motif de double bottom sur le DXY.',
  },
  l32: {
    content: 'Construire une stratégie de trading assistée par IA nécessite une compréhension profonde des deux domaines : le trading et les données. La première étape est de définir clairement le problème : voulez-vous que l\'IA prédise la direction ? Ou détermine les points d\'entrée et de sortie ? Ou améliore la gestion des risques ? Chaque objectif nécessite des données et des algorithmes différents.\n\nLa seconde étape : la collecte de données. Vous avez besoin de données de prix historiques (OHLCV), de données fondamentales (indicateurs économiques), de données de sentiment (actualités et tweets), et de données on-chain pour la crypto. La qualité des données est plus importante que la quantité d\'algorithmes — mauvaises données = mauvais résultats.\n\nLa troisième étape : construire le modèle. Commencez avec un modèle simple (régression linéaire ou arbre de décision) puis augmentez progressivement la complexité. Testez-le sur des données historiques qu\'il n\'a pas utilisées pour l\'entraînement (test out-of-sample). La quatrième étape : le backtesting avec attention au spread, au slippage et aux commissions. La cinquième étape : le trading démo puis le trading progressif avec argent réel.',
    keyPoints: [
      'Définissez le problème d\'abord : prédiction, signaux d\'entrée, ou gestion des risques',
      'La qualité des données est plus importante que la complexité de l\'algorithme',
      'Commencez avec un modèle simple puis augmentez la complexité graduellement avec tests à chaque étape',
      'Testez sur des données out-of-sample puis tradez en démo avant l\'argent réel',
    ],
    practicalExample: 'Vous construisez un modèle d\'IA pour prédire la direction quotidienne d\'EUR/USD. Vous utilisez 5 ans de données incluant : prix OHLCV, 10 indicateurs techniques, et un indice de sentiment des actualités. Vous entraînez un Random Forest et obtenez 58 % de précision sur les données de test. Avec un ratio risque-récompense de 1:2, vous n\'avez besoin que de 35 % de réussite pour être rentable. 58 % signifie un avantage clair. Vous commencez avec un mois de trading démo.',
  },
};
