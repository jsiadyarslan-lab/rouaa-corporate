// ════════════════════════════════════════════════════════════════════
// Lesson Body Content Translations — Spanish (V1042)
// ════════════════════════════════════════════════════════════════════
// Traducciones completas en español de las 32 lecciones (contenido,
// puntos clave, ejemplo práctico).

import type { LessonBodyTranslation } from './academy-content-en';

export const LESSON_BODIES_ES: Record<string, LessonBodyTranslation> = {
  // ── Forex (5 lecciones) ──
  l1: {
    content: 'El mercado Forex, o mercado de divisas, es el mercado financiero más grande del mundo con un volumen de negociación diario que supera los 7,5 billones de dólares. Opera las 24 horas del día cinco días a la semana, desde la apertura de la sesión de Sídney el lunes por la mañana hasta el cierre de la sesión de Nueva York el viernes por la noche. A diferencia de los mercados bursátiles, no existe una bolsa central para Forex — la negociación se realiza a través de una red electrónica global de bancos, instituciones financieras y brókers.\n\nLa palabra Forex proviene de la abreviatura de Foreign Exchange, e implica negociar pares de divisas donde compras una divisa y vendes otra simultáneamente. Los pares más negociados son las mayores que incluyen el dólar estadounidense, como EUR/USD, USD/JPY y GBP/USD.\n\nEl mercado Forex está influenciado por muchos factores económicos y políticos incluyendo tasas de interés, inflación, datos económicos y eventos geopolíticos. Entender estos factores y poder analizar su impacto en las divisas es la base del trading exitoso.',
    keyPoints: [
      'Forex es el mercado financiero más grande del mundo con un volumen diario que supera los 7,5 billones de dólares',
      'Opera 24 horas al día, cinco días a la semana, a través de sesiones globales consecutivas',
      'La negociación se realiza mediante pares de divisas donde compras una divisa y vendes otra',
      'Los factores económicos y políticos son los principales impulsores de los precios de las divisas',
    ],
    practicalExample: 'Si quieres comprar EUR/USD a 1,0850, estás comprando euros y vendiendo dólares. Si el precio sube a 1,0900, tu ganancia es de 50 pips. Con un mini lote (0,01), cada pip vale 0,10 $, por lo que tu ganancia sería de 5 $. Pero si el precio cae a 1,0800, perderías 5 $.',
  },
  l2: {
    content: 'La negociación de divisas se realiza a través de pares, cada uno compuesto por una divisa base y una divisa de cotización. La divisa base es la primera del par, y la de cotización es la segunda. Por ejemplo, en EUR/USD, el euro es la divisa base y el dólar es la de cotización. El precio mostrado indica cuánta divisa de cotización necesitas para comprar una unidad de la divisa base.\n\nHay tres categorías principales de pares de divisas: las mayores que incluyen el dólar estadounidense y son las más líquidas con los spreads más estrechos; los cruces que no incluyen el dólar como EUR/GBP; y los exóticos que incluyen una divisa de un mercado emergente como USD/TRY.\n\nLa negociación en Forex se realiza a través de diferentes tipos de órdenes: una orden de mercado se ejecuta inmediatamente al precio actual, y una orden pendiente se ejecuta cuando el precio alcanza un nivel especificado. También puedes usar órdenes de stop loss y take profit para gestionar las operaciones automáticamente.',
    keyPoints: [
      'Cada par de divisas se compone de una divisa base (primera) y una divisa de cotización (segunda)',
      'Las mayores con el dólar estadounidense son las más líquidas con los spreads más estrechos',
      'Los tipos de órdenes incluyen orden de mercado, orden pendiente, stop loss y take profit',
      'Los precios siempre se muestran con dos decimales, y cuatro para el Forex estándar',
    ],
    practicalExample: 'Quieres comprar GBP/USD a 1,2650 con un spread de 1,2 pips. El precio ask es 1,26512 y el bid es 1,26500. Si compras un mini lote (0,1) y colocas un stop loss en 1,2620 y un take profit en 1,2720, tu riesgo es de 30 pips y tu recompensa de 70 pips. La relación riesgo-beneficio es 1:2,3, que es una buena relación.',
  },
  l3: {
    content: 'Entender cómo leer los precios de los pares de divisas es el primer paso para cualquier trader. El precio se compone del precio bid — el precio que el bróker ofrece para comprar de ti — y el precio ask — el precio que el bróker ofrece para venderte. La diferencia entre ellos es el spread, que es la fuente de beneficio del bróker.\n\nUn pip es la unidad más pequeña de cambio de precio. En la mayoría de los pares de Forex, un pip es el cuarto decimal, pero en los pares de JPY es el segundo. El valor de un pip cambia con el tamaño del lote: un lote estándar (1,0) es aproximadamente 10 $ por pip, y un micro lote (0,01) es 0,10 $.\n\nCuando esperas que EUR/USD suba, lo compras (Long). Cuando esperas que baje, lo vendes (Short). En ambos casos, puedes beneficiarte de la dirección correcta — esta es una ventaja de Forex sobre los mercados tradicionales.',
    keyPoints: [
      'El precio bid es siempre inferior al precio ask, y la diferencia es el spread',
      'Un pip es la unidad más pequeña de cambio — el cuarto decimal en la mayoría de los pares',
      'El valor del pip depende del tamaño del lote: lote estándar = aproximadamente 10 $ por pip',
      'Puedes beneficiarte tanto de mercados alcistas como bajistas vía órdenes de compra y venta',
    ],
    practicalExample: 'Si compras 0,5 lotes de USD/CHF a 0,8850 y lo vendes a 0,8900, la diferencia es de 50 pips. El valor del pip para un lote en este par es de aproximadamente 11,20 $, por lo que tu ganancia = 50 × 11,20 × 0,5 = 280 $. Pero si lo vendes a 0,8800, perderías 50 pips, o 280 $.',
  },
  l4: {
    content: 'El mercado Forex opera las 24 horas, pero la liquidez y la volatilidad varían significativamente entre sesiones. Hay tres sesiones principales: la sesión asiática (Tokio) de 00:00 a 09:00 GMT, la sesión europea (Londres) de 07:00 a 16:00, y la sesión americana (Nueva York) de 12:00 a 21:00.\n\nLos períodos más activos y líquidos son durante el solapamiento de las sesiones de Londres y Nueva York de 12:00 a 16:00 GMT, donde se negocia más del 50 % del volumen diario de Forex. Este tiempo es ideal para trading activo porque los movimientos de precio son más fuertes y los patrones más claros.\n\nLos días de la semana también importan: martes, miércoles y jueves son generalmente los mejores días de trading porque contienen la mayor cantidad de datos económicos. El lunes puede ser tranquilo al inicio de la semana, y el viernes después de las 16:00 GMT ve una caída notable del volumen al acercarse el cierre semanal.',
    keyPoints: [
      'El solapamiento Londres-Nueva York (12:00-16:00 GMT) es el período más activo',
      'La sesión asiática es relativamente tranquila y adecuada para pares JPY y AUD',
      'Martes, miércoles y jueves son los mejores días de trading para movimiento y oportunidades',
      'Evita operar durante noticias de alto impacto si eres principiante',
    ],
    practicalExample: 'Un trader del Golfo nota que el mejor momento para operar es de 15:00 a 19:00 hora local, que corresponde al solapamiento Londres-Nueva York. Planifica abrir operaciones durante estas cuatro horas y solo monitorear el mercado el resto del día, lo que aumenta la calidad de las operaciones y reduce el trading aleatorio.',
  },
  l5: {
    content: 'El cálculo de ganancias y pérdidas en Forex depende de tres factores: el tamaño de la operación (lote), el número de pips ganados o perdidos, y el valor del pip. Un lote estándar equivale a 100.000 unidades de la divisa base, un mini lote a 10.000, y un micro lote a 1.000.\n\nEl valor del pip para un lote estándar en pares que terminan en dólar estadounidense (como EUR/USD y GBP/USD) es exactamente 10 dólares. Para otros pares, el valor del pip cambia según el tipo de cambio actual. Por lo tanto, los principiantes prefieren practicar con pares que terminan en USD para cálculos más simples.\n\nLa fórmula básica de ganancia: Ganancia = número de pips × valor del pip × tamaño del lote. Ejemplo: si ganas 40 pips en una operación de 0,3 lotes en EUR/USD, la ganancia = 40 × 10 × 0,3 = 120 $. El spread y las comisiones deben deducirse de esta ganancia para calcular la ganancia neta.',
    keyPoints: [
      'Lote estándar = 100.000 unidades, mini = 10.000, micro = 1.000',
      'El valor del pip para un lote estándar en pares USD es exactamente 10 dólares',
      'Fórmula de ganancia: número de pips × valor del pip × tamaño del lote',
      'El spread y las comisiones se deducen de las ganancias y se añaden a las pérdidas',
    ],
    practicalExample: 'Abres una operación de compra en EUR/USD con 0,2 lotes a 1,0850 y la cierras a 1,0920. Ganancia = 70 pips × 10 $ × 0,2 = 140 $. Si el spread es de 1,5 pips, el costo = 1,5 × 10 × 0,2 = 3 $. Ganancia neta = 137 $. Si la operación hubiera sido una venta en lugar de una compra, habrías perdido 143 $ (140 + 3 spread).',
  },

  // ── Análisis Técnico (5 lecciones) ──
  l6: {
    content: 'El análisis técnico es el estudio de los movimientos de precios pasados para predecir movimientos futuros, y se basa en tres principios básicos: el precio lo refleja todo, los precios se mueven en tendencias, y la historia se repite. El analista técnico no se preocupa por las razones fundamentales detrás del movimiento del precio sino por el precio mismo y el volumen de negociación.\n\nLas herramientas básicas del análisis técnico incluyen: velas japonesas que muestran los precios de apertura, cierre, máximo y mínimo para el período; niveles de soporte y resistencia que identifican zonas donde el precio se detiene; e indicadores técnicos como medias móviles, RSI y MACD.\n\nEl marco temporal es muy importante en el análisis técnico. El análisis en el marco semanal da una visión general de la tendencia, el marco diario para la tendencia media, y el marco horario para entradas de operación. La regla de oro es analizar primero el marco temporal mayor y luego bajar a los más pequeños.',
    keyPoints: [
      'El análisis técnico estudia el precio y el volumen para predecir movimientos futuros',
      'Tres principios: el precio refleja todo, los precios tienen tendencia, la historia se repite',
      'Las velas japonesas y los niveles de soporte/resistencia son las herramientas básicas',
      'Comienza el análisis desde el marco temporal mayor y luego baja a los más pequeños',
    ],
    practicalExample: 'Quieres analizar GBP/USD. Comienzas con el marco semanal y notas una tendencia alcista clara con soporte en 1,2500. En el marco diario, ves el precio rebotando desde 1,2550 cerca del soporte semanal. En el marco de 4 horas, notas un patrón de reversión alcista. Tu decisión: comprar cerca de 1,2560 con un stop loss por debajo de 1,2480 y objetivo 1,2750.',
  },
  l7: {
    content: 'Las velas japonesas son el tipo de gráfico más utilizado en análisis técnico, inventadas por los japoneses en el siglo XVIII para el comercio del arroz. Cada vela muestra cuatro piezas de información: el precio de apertura, el precio de cierre, el precio más alto y el precio más bajo durante el período especificado.\n\nUna vela alcista (verde) tiene un precio de cierre superior al de apertura, mientras que una vela bajista (roja) tiene un cierre inferior al de apertura. El cuerpo es la distancia entre apertura y cierre, y las mechas se extienden desde el cuerpo hasta el máximo y el mínimo. Una vela con un cuerpo grande y mechas cortas indica control claro, mientras que una vela con mechas largas indica vacilación.\n\nLos patrones de una sola vela como el martillo y la estrella fugaz dan importantes señales de reversión. Los patrones de múltiples velas como el envolvente y el harami proporcionan una confirmación más fuerte. Las señales más fiables aparecen cuando estos patrones se producen en niveles clave de soporte/resistencia.',
    keyPoints: [
      'Cada vela muestra cuatro precios: apertura, cierre, máximo, mínimo',
      'Vela alcista: el cierre es superior a la apertura. Bajista: lo contrario',
      'Cuerpo grande = control fuerte. Mechas largas = vacilación y conflicto',
      'Los patrones de una sola vela como el martillo y la estrella dan importantes señales de reversión',
    ],
    practicalExample: 'En el gráfico diario de USD/JPY, notas una caída continua y luego aparece una vela martillo en un fuerte nivel de soporte. El martillo tiene una mecha inferior larga y un cuerpo pequeño en la parte superior, indicando que los vendedores empujaron el precio hacia abajo pero los compradores recuperaron el control y cerraron cerca de la apertura. Esta es una potencial señal de reversión alcista.',
  },
  l8: {
    content: 'El Índice de Fuerza Relativa (RSI) es un oscilador de momentum que oscila entre 0 y 100, desarrollado por J. Welles Wilder en 1978. El RSI calcula la media de ganancias frente a la media de pérdidas durante un período especificado (generalmente 14 días). La fórmula matemática hace que lecturas por encima de 70 indiquen sobrecompra y por debajo de 30 indiquen sobreventa.\n\nSin embargo, la sobrecompra no significa reversión inmediata. En una tendencia fuerte, el RSI puede mantenerse por encima de 70 durante mucho tiempo mientras el precio continúa subiendo. Por lo tanto, el RSI se usa mejor con otros indicadores para confirmar señales. Una de las señales más fuertes del RSI es la divergencia: cuando el precio registra un máximo más alto pero el RSI registra un máximo más bajo, indicando un debilitamiento del momentum y un reversión que se acerca.\n\nUsos avanzados incluyen: el nivel 50 como divisor entre alcista y bajista, líneas de tendencia en el propio RSI, y zonas de sobrecompra/sobreventa ajustadas según la tendencia (40-50 como soporte en tendencias alcistas, 50-60 como resistencia en tendencias bajistas).',
    keyPoints: [
      'El RSI oscila entre 0 y 100 y mide el momentum del precio (período 14 por defecto)',
      'Por encima de 70 = sobrecompra. Por debajo de 30 = sobreventa. Pero no necesariamente reversión inmediata',
      'La divergencia entre el precio y el RSI es una de las señales de reversión más fuertes',
      'El nivel 50 actúa como divisor entre momentum alcista y bajista',
    ],
    practicalExample: 'En el gráfico diario de EUR/USD, el precio registra un nuevo máximo en 1,0980 mientras el RSI registra un máximo más bajo en 68 comparado con el máximo anterior en 75. Esta es una divergencia bajista que indica un debilitamiento del momentum alcista. Esperas la ruptura de una línea de tendencia alcista en el precio para confirmar la señal, luego abres una operación de venta con un stop loss por encima del máximo.',
  },
  l9: {
    content: 'El indicador MACD combina propiedades de seguimiento de tendencia y medición de momentum, y es uno de los indicadores más utilizados. Se compone de tres elementos: la línea MACD (la diferencia entre las medias móviles de 12 y 26), la línea de señal (la media móvil de 9 períodos de la línea MACD), y el histograma (la diferencia entre la línea MACD y la línea de señal).\n\nLas señales MACD más famosas son los cruces: cuando la línea MACD cruza por encima de la línea de señal, es una señal de compra, y lo contrario es una señal de venta. Los cruces son más fiables cuando ocurren en zonas extremas (muy por encima o por debajo de cero). El histograma muestra la distancia entre las dos líneas y da una alerta temprana antes del cruce mismo.\n\nLa divergencia en el MACD es más fuerte que los cruces. Cuando el precio sube a un nuevo máximo pero el MACD registra un máximo más bajo, esta contradicción indica una reversión que se acerca. Como con todos los indicadores, el MACD da señales falsas en mercados laterales, por lo que es mejor usarlo con análisis de precio.',
    keyPoints: [
      'El MACD combina el seguimiento de tendencia y la medición de momentum en un solo indicador',
      'La línea MACD cruza por encima de la línea de señal = compra. Lo contrario = venta',
      'El histograma da una alerta temprana antes del cruce',
      'La divergencia en el MACD es una de las señales de reversión avanzadas más fuertes',
    ],
    practicalExample: 'En el gráfico semanal de GBP/JPY, notas un cruce alcista de la línea MACD por encima de la línea de señal después de un período de caída. El histograma comenzó a pasar de negativo a positivo tres velas antes del cruce. Esta es una alerta temprana. Con un fuerte soporte en el gráfico, abres una operación de compra con un stop loss por debajo del soporte.',
  },
  l10: {
    content: 'Los patrones gráficos son formas geométricas que se repiten en los gráficos e indican la dirección del movimiento futuro del precio. Se dividen en dos categorías principales: patrones de reversión que invierten la tendencia actual, y patrones de continuación que indican la continuación de la tendencia después de una pausa.\n\nLos patrones de reversión famosos incluyen: Cabeza y Hombros — una de las señales de reversión más fuertes, que consiste en tres picos con el del medio más alto; Doble Techo — parecido a la letra M, indicando el fallo del precio en romper una resistencia dos veces; y Doble Suelo — parecido a la letra W.\n\nLos patrones de continuación incluyen: Triángulos (ascendentes, descendentes y simétricos), Banderas que son cortos períodos de retroceso dentro de una tendencia fuerte, y Cuñas que se parecen a los triángulos pero se inclinan contra la tendencia. El volumen de negociación juega un papel crucial en la confirmación de patrones: el volumen debe aumentar cuando se rompe la línea de cuello.',
    keyPoints: [
      'Patrones de reversión: cabeza y hombros, dobles techos, dobles suelos',
      'Patrones de continuación: triángulos, banderas, cuñas',
      'El volumen de negociación confirma la validez del patrón especialmente en la ruptura de la línea de cuello',
      'El objetivo de precio se suele calcular por la distancia de la línea de cuello desde el punto de ruptura',
    ],
    practicalExample: 'En el gráfico diario de AUD/USD, notas un patrón cabeza y hombros: hombro izquierdo en 0,6650, cabeza en 0,6700, hombro derecho en 0,6640. La línea de cuello está en 0,6560. Cuando se rompe la línea de cuello con alto volumen, abres una operación de venta. El objetivo = la distancia de la cabeza a la línea de cuello (140 pips) sustraída del punto de ruptura: 0,6560 - 0,0140 = 0,6420.',
  },

  // ── Análisis Fundamental (5 lecciones) ──
  l11: {
    content: 'El análisis fundamental es el estudio de los factores económicos, políticos y sociales que afectan el valor de las divisas y los activos financieros. Mientras que el análisis técnico se centra en el movimiento del precio mismo, el análisis fundamental se centra en las razones subyacentes detrás de estos movimientos. El objetivo es determinar el valor real de un activo y compararlo con el precio de mercado.\n\nLos principales impulsores fundamentales incluyen: las tasas de interés que determinan los rendimientos de inversión en una divisa, la inflación que erosiona el poder adquisitivo, los datos del mercado laboral que reflejan la salud económica, el producto interno bruto como medida integral del crecimiento económico, y los eventos geopolíticos que causan fluctuaciones repentinas.\n\nLos mejores traders combinan ambos análisis: fundamental para determinar la dirección general y técnico para elegir los puntos de entrada y salida. Entender los datos fundamentales te ayuda a saber por qué se mueve el precio, y el análisis técnico te dice cuándo entrar en la operación.',
    keyPoints: [
      'El análisis fundamental estudia las razones económicas y políticas detrás de los movimientos de precio',
      'Las tasas de interés, la inflación y los datos laborales son los impulsores fundamentales más fuertes',
      'Combinar el análisis fundamental y técnico da los mejores resultados',
      'El calendario económico es tu primera herramienta para seguir los datos fundamentales',
    ],
    practicalExample: 'La Reserva Federal sube las tasas de interés 0,25 % más de lo esperado. Esto fortalece el dólar estadounidense porque los rendimientos más altos atraen inversión extranjera. Esperas que USD/JPY suba y que EUR/USD baje. Usas el análisis técnico para determinar el mejor punto de entrada después de la reacción inicial del mercado.',
  },
  l12: {
    content: 'Los datos de empleo, especialmente el informe NFP mensual, están entre los datos con mayor impacto en los mercados. El informe se publica el primer viernes de cada mes e incluye el número de nuevos empleos, la tasa de desempleo y los salarios promedio. Cualquier sorpresa en estas cifras puede mover el dólar cientos de pips en minutos.\n\nLa lógica es simple: un empleo fuerte significa una economía sana, lo que apoya las subidas de tasas y fortalece el dólar. Un empleo débil significa una necesidad de estímulo económico que puede incluir recortes de tasas, debilitando el dólar. Los salarios promedio también son importantes porque los salarios crecientes significan presión inflacionaria que puede requerir un endurecimiento monetario.\n\nEl impacto del NFP se extiende a todos los pares del dólar, al oro (generalmente relación inversa), y a los índices bursátiles. Los traders profesionales evitan abrir operaciones justo antes del NFP y esperan la reacción inicial, luego entran con la tendencia después de que el precio se estabilice.',
    keyPoints: [
      'El NFP se publica el primer viernes de cada mes y mueve fuertemente el dólar',
      'Empleo fuerte = apoyo al dólar. Empleo débil = debilidad del dólar',
      'Los salarios promedio son un indicador de inflación importante y pueden ser más fuertes que el propio número de empleo',
      'Evita operar justo antes del NFP y espera a que el precio se estabilice',
    ],
    practicalExample: 'El informe NFP muestra 350.000 empleos añadidos frente a 180.000 esperados. El dólar se dispara: EUR/USD cae 80 pips en 5 minutos. En lugar de comprar inmediatamente, esperas un pequeño retroceso y luego entras en corto con la tendencia, con un stop loss por encima del máximo previo a las noticias. Este es un enfoque más seguro que operar durante el frenesí inicial.',
  },
  l13: {
    content: 'Las decisiones de tasas de interés son el impulsor más fuerte de los precios de las divisas a medio y largo plazo. Cuando un banco central sube las tasas de interés, la divisa se vuelve más atractiva para los inversores que buscan mayores rendimientos, empujando su valor al alza. Lo contrario ocurre cuando se recortan las tasas. Esta es la razón principal detrás de los grandes movimientos de divisas.\n\nSin embargo, el mercado opera con las expectativas, no con las decisiones mismas. Si todos esperan una subida y la subida ocurre, el precio puede no moverse mucho porque la noticia ya está precioada. Las sorpresas son lo que mueve los mercados: subidas inesperadas o señales más agresivas de lo que el mercado esperaba.\n\nLa declaración adjunta y la rueda de prensa del presidente son a veces más importantes que la decisión misma. Palabras como "hawkish" (inclinado a subir las tasas) o "dovish" (inclinado a bajarlas) fijan la dirección del mercado para las semanas venideras. Las estrategias de trading en noticias se centran en la brecha entre las expectativas y el resultado real.',
    keyPoints: [
      'Subir las tasas apoya la divisa y bajarlas la debilita — el impulsor principal',
      'El mercado precioa las expectativas de antemano, por lo que solo las sorpresas mueven fuertemente el precio',
      'La declaración adjunta y la rueda de prensa suelen ser más importantes que la decisión misma',
      'Sigue las expectativas del mercado vía futuros de tasas (Fed Funds Futures) antes de la decisión',
    ],
    practicalExample: 'El Banco Central Europeo sube las tasas 0,25 % como se esperaba, pero el Presidente dice "viene más subida" — más fuerte de lo esperado. El euro se dispara contra el dólar. Entras en una operación de compra en EUR/USD con un stop loss por debajo de un soporte cercano, beneficiándote del nuevo impulso.',
  },
  l14: {
    content: 'El Índice de Precios al Consumidor (CPI) es la principal medida de inflación y se publica mensualmente en la mayoría de los países importantes. Mide el cambio en el costo de una cesta de bienes y servicios de consumo. Una inflación alta erosiona el poder adquisitivo y presiona a los bancos centrales para subir las tasas, mientras que una inflación baja o deflacionaria puede empujarlos a recortar las tasas o usar herramientas de estímulo.\n\nEl CPI core excluye los precios volátiles de la energía y los alimentos y da una imagen más clara de la tendencia inflacionaria real. Los bancos centrales lo vigilan de cerca porque es más estable y predecible que el CPI general.\n\nEl impacto del CPI en los mercados es inmediato y fuerte: una inflación mayor de lo esperado apoya la divisa (porque aumenta la probabilidad de subidas de tasas), y una inflación menor la debilita. El oro se ve particularmente afectado porque se considera una cobertura contra la inflación — un CPI al alza suele apoyar el oro.',
    keyPoints: [
      'El CPI mide el cambio en una cesta de consumo y es la principal medida de inflación',
      'El CPI core excluye alimentos y energía y es más indicativo de la tendencia inflacionaria',
      'Inflación mayor de lo esperado = apoyo a la divisa y mayor probabilidad de subidas de tasas',
      'El oro suele subir con un CPI alto porque es una cobertura contra la inflación',
    ],
    practicalExample: 'Los datos del CPI de EE.UU. muestran una subida mensual del 0,5 % frente al 0,3 % esperado. Esto significa una inflación mayor de lo esperado y el dólar sube. El oro también sube porque la alta inflación apoya a los activos de cobertura. Entras en una operación de compra en oro con un stop loss por debajo de un soporte cercano.',
  },
  l15: {
    content: 'Los grandes datos económicos incluyen el producto interno bruto, los indicadores manufactureros y de servicios, las ventas minoristas, la balanza comercial, y otros. Cada uno tiene su importancia, pero su impacto varía según el contexto económico predominante. En períodos de preocupación por recesión, los datos de crecimiento y empleo son los más importantes, mientras que en períodos inflacionarios, los datos de precios tienen el impacto más fuerte.\n\nEl secreto radica en comparar los datos reales con las expectativas, no con los valores absolutos. Los datos mejores de lo esperado apoyan la divisa, y los peores la debilitan. Las fuentes de expectativas incluyen encuestas de Bloomberg y Reuters y contratos de futuros sobre índices.\n\nEstrategia avanzada: no te limites a leer el número principal — mira los detalles. Por ejemplo, el NFP puede mostrar empleos fuertes pero el desempleo subió o los salarios se debilitaron — estas contradicciones crean oportunidades de trading después de que la reacción inicial se estabilice cuando el mercado se da cuenta del panorama completo.',
    keyPoints: [
      'Compara los datos reales con las expectivas, no solo los valores absolutos',
      'La importancia de cada dato cambia según el contexto económico predominante',
      'Los detalles son a veces más importantes que el número principal — lee el informe completo',
      'Las contradicciones dentro del mismo informe crean oportunidades después de la reacción inicial',
    ],
    practicalExample: 'Los datos del PIB de EE.UU. muestran un crecimiento del 2,5 % frente al 2,0 % esperado — positivo para el dólar. Pero en detalle: el gasto del consumidor cayó y los inventarios aumentaron (crecimiento insostenible). El dólar sube inicialmente y luego retrocede. Entras en corto en USD/CHF después del retroceso, beneficiándote de una lectura más profunda de los datos.',
  },

  // ── Gestión de Riesgos (4 lecciones) ──
  l16: {
    content: 'La gestión de riesgos es la diferencia entre un trader exitoso y uno fracasado. Los estudios muestran que más del 70 % de los traders principiantes pierden su capital durante el primer año, y la razón principal no es la incapacidad de analizar el mercado sino la falta de gestión de riesgos. El objetivo de la gestión de riesgos no es prevenir la pérdida sino controlarla para que permanezcas en el juego mucho tiempo.\n\nLa primera regla de oro: no arriesgues más del 1-2 % de tu capital en una sola operación. Si tu cuenta es de 10.000 $, la pérdida máxima permitida en una sola operación es de 100-200 $. Esto asegura que necesitas más de 50 operaciones perdedoras consecutivas para perder la mitad de tu cuenta — casi imposible con un trading disciplinado.\n\nLa segunda regla: diversificación. No pongas todo tu riesgo en un solo activo o un solo par. Distribuye las operaciones entre diferentes pares que no estén estrechamente correlacionados. La tercera regla: planificación previa. Determina el punto de entrada, el stop loss y el take profit antes de abrir la operación y cúmplelos.',
    keyPoints: [
      'La gestión de riesgos es más importante que el análisis de mercado — determina tu supervivencia',
      'No arriesgues más del 1-2 % del capital en una sola operación',
      'Diversifica las operaciones entre activos que no estén estrechamente correlacionados',
      'Planifica con antelación: determina la entrada, el stop loss y el objetivo antes de abrir la operación',
    ],
    practicalExample: 'Tu cuenta es de 5.000 $ y quieres operar EUR/USD. Con un riesgo del 1 %, la pérdida máxima = 50 $. Si colocas un stop loss a 25 pips, el tamaño de la operación = 50 / (25 × 0,10) = 20 micro lotes (0,20 lote). Con este tamaño, si se toca el stop loss, pierdes solo 50 $, es decir, el 1 % de tu cuenta.',
  },
  l17: {
    content: 'El Stop Loss es una orden automática que cierra la operación a un nivel de precio especificado para limitar las pérdidas. El Take Profit es una orden similar que cierra la operación en el nivel objetivo. Estas dos órdenes son la primera línea de defensa y el plan financiero de cualquier operación.\n\nTipos de stop loss: un stop fijo se coloca en un nivel de precio especificado y no se mueve; un stop móvil sigue el precio a una distancia especificada y asegura los beneficios gradualmente. Un stop basado en análisis se coloca en un nivel de soporte o resistencia o bajo un patrón técnico, y un stop basado en porcentaje se coloca a un porcentaje del precio de entrada.\n\nErrores comunes: colocar el stop demasiado ajustado para que sea tocado por un movimiento normal y luego el precio continúe en tu dirección; no colocar un stop en absoluto y esperar un rebote; y mover el stop para aumentar la pérdida. La regla: nunca entres en una operación sin stop loss, sin excepciones.',
    keyPoints: [
      'El stop loss es obligatorio en cada operación — sin excepciones',
      'El stop móvil asegura los beneficios gradualmente a medida que la tendencia continúa',
      'Coloca el stop en un nivel técnico lógico, no aleatoriamente',
      'La relación riesgo-beneficio debería ser al menos 1:2 para cada operación',
    ],
    practicalExample: 'Compras GBP/USD a 1,2650 y colocas un stop loss en 1,2590 (60 pips) por debajo de un fuerte soporte. Tu objetivo es 1,2770 (120 pips) en la resistencia. Relación riesgo-beneficio = 60:120 = 1:2. Si se toca el stop, pierdes 60 pips; si se alcanza el objetivo, ganas 120 pips. Necesitas solo un 34 % de aciertos para alcanzar el punto de equilibrio con esta relación.',
  },
  l18: {
    content: 'El dimensionamiento de la posición es la decisión más importante que tomas después de la propia decisión de entrada. Un tamaño equivocado puede convertir una operación analíticamente correcta en un desastre financiero. El objetivo es determinar el tamaño de la operación de modo que la pérdida potencial esté siempre dentro de tus límites aceptables.\n\nFórmula de dimensionamiento: tamaño del lote = (capital × porcentaje de riesgo) / (distancia del stop loss en pips × valor del pip). Ejemplo: cuenta de 10.000 $ con 2 % de riesgo y stop de 50 pips con valor de pip de 10 $. Tamaño del lote = (10000 × 0,02) / (50 × 10) = 0,4 lote.\n\nReglas importantes: mantén el riesgo total para todas las operaciones abiertas en no más del 5-6 % del capital. Si tienes 3 operaciones abiertas cada una con 2 % de riesgo, el riesgo total es del 6 %, que es el máximo. Nunca aumentes el tamaño después de una pérdida para recuperarla (esto se llama martingala y es muy peligroso).',
    keyPoints: [
      'Tamaño de posición = (capital × porcentaje de riesgo) / (distancia del stop × valor del pip)',
      'El riesgo total para todas las operaciones abiertas no debe exceder el 5-6 %',
      'No aumentes el tamaño después de una pérdida — esto es martingala y es catastrófico',
      'Reduce el tamaño después de una serie de pérdidas hasta que recuperes tu confianza y análisis',
    ],
    practicalExample: 'Después de una serie de pérdidas, tu cuenta cae de 10.000 $ a 8.000 $. Con un riesgo del 1 %: pérdida máxima = 80 $. Si tu stop es de 40 pips en EUR/USD: tamaño = 80 / (40 × 10) = 0,2 lote. Redujiste el riesgo del 2 % al 1 % para proteger la cuenta durante los períodos difíciles. Este es un comportamiento profesional.',
  },
  l19: {
    content: 'La relación Riesgo-Beneficio compara la pérdida potencial con la ganancia potencial en una operación. Una relación de 1:2 significa que arriesgas un dólar para ganar dos. Esta relación es la piedra angular de cualquier estrategia de trading exitosa porque asegura la rentabilidad incluso con una tasa de acierto inferior al 50 %.\n\nEl cálculo es simple: con una relación riesgo-beneficio de 1:2, necesitas solo el 34 % de operaciones ganadoras para alcanzar el equilibrio. Con 1:3, necesitas solo el 25 %. Esto significa que puedes perder en 2 de cada 3 operaciones y seguir siendo rentable si la relación riesgo-beneficio es 1:3.\n\nEl error común es cerrar las operaciones ganadoras pronto por miedo y dejar correr las perdedoras esperando una mejora. Esto invierte efectivamente la relación: arriesgas mucho y ganas poco. La solución: determina el objetivo con antelación, deja que el precio trabaje, y no intervengas.',
    keyPoints: [
      '1:2 mínimo — arriesga 1 para ganar 2',
      'Con una relación 1:3 necesitas solo el 25 % de aciertos para ser rentable',
      'No cierres las ganadoras pronto — esto reduce drásticamente la relación real',
      'Elige operaciones con relaciones naturalmente altas en niveles claros de soporte/resistencia',
    ],
    practicalExample: 'Entras en corto en USD/CAD a 1,3650 con un stop en 1,3710 (60 pips de pérdida) y objetivo en 1,3530 (120 pips de ganancia). Relación = 1:2. Si esta operación se repite 10 veces y solo 4 ganan: ganancia = 4 × 120 = 480 pips. Pérdida = 6 × 60 = 360 pips. Ganancia neta = 120 pips a pesar de una tasa de acierto del 40 %.',
  },

  // ── Cripto (3 lecciones) ──
  l20: {
    content: 'Las criptomonedas son activos digitales descentralizados que utilizan tecnología blockchain para registrar transacciones. Bitcoin fue la primera criptomoneda, lanzada en 2009 por una persona o grupo bajo el nombre de Satoshi Nakamoto. Hoy existen más de 20.000 criptomonedas diferentes con una capitalización de mercado total que supera los 2 billones de dólares.\n\nLa blockchain es un libro digital distribuido entre miles de computadoras en todo el mundo, lo que hace casi imposible hackearlo o modificarlo. Esta es la base de la seguridad en las criptomonedas. Cada transacción es verificada por una red de mineros o validadores antes de ser registrada.\n\nLas características de las criptos incluyen: descentralización (ninguna autoridad central las controla), transparencia (todas las transacciones son públicas), y alcance global (envía a cualquier persona en el mundo en minutos). Pero los inconvenientes incluyen alta volatilidad, regulación limitada, y riesgos de ciberseguridad.',
    keyPoints: [
      'La blockchain es la tecnología subyacente — un libro digital descentralizado a prueba de manipulaciones',
      'Bitcoin es la primera y mayor criptomoneda con una capitalización que supera los mil mil millones de dólares',
      'La descentralización, la transparencia y el alcance global son las principales características de las criptos',
      'La alta volatilidad, los riesgos regulatorios y los riesgos cibernéticos son los principales desafíos',
    ],
    practicalExample: 'Compras 0,01 bitcoin a 65.000 $ (650 $). En una semana, bitcoin sube un 8 % a 70.200 $. Tu inversión se convierte en 702 $. Pero si cae un 8 %, se convierte en 598 $. Esto ilustra la alta volatilidad: grandes ganancias y grandes pérdidas en períodos cortos. Por eso la gestión de riesgos en cripto es más importante que en cualquier otro mercado.',
  },
  l21: {
    content: 'El trading de bitcoin y las principales criptomonedas (Ethereum, BNB, Solana) difiere del trading de Forex en varios aspectos. El mercado opera 24/7 sin parar, la volatilidad es mucho mayor, y las noticias regulatorias tienen un enorme impacto. Pero los fundamentos del análisis técnico y fundamental siguen siendo los mismos.\n\nBitcoin es el principal impulsor de todo el mercado. Cuando bitcoin sube, la mayoría de las demás monedas suben con él (generalmente por un porcentaje mayor), y cuando cae, todas caen. Esta estrecha correlación significa que analizar bitcoin debería ser tu primer paso antes de operar cualquier otra moneda.\n\nFactores específicos de las criptos: el halving de Bitcoin (cada 4 años la recompensa de minado se reduce a la mitad, lo que históricamente reduce la oferta y empuja el precio al alza), las actualizaciones de red (como las actualizaciones de Ethereum), la regulación gubernamental (decisiones de la SEC y el impacto de China), y los riesgos de intercambio (hackeos de plataformas).',
    keyPoints: [
      'El mercado cripto opera 24/7 y la volatilidad es mucho mayor que en Forex',
      'Bitcoin lidera el mercado — analízalo primero antes que cualquier otra moneda',
      'El halving cada 4 años reduce la oferta y ha empujado históricamente el precio al alza',
      'La regulación gubernamental y la seguridad de las plataformas son riesgos únicos de las criptos',
    ],
    practicalExample: 'Bitcoin prueba la resistencia en 70.000 $ tras una fuerte subida. Ethereum se negocia a 3.800 $. Tu análisis ve que si bitcoin rompe 70.000 $ alcanzará 80.000 $. En lugar de comprar bitcoin directamente, compras Ethereum porque se mueve por un porcentaje mayor (beta más alta). Si bitcoin sube un 15 %, Ethereum puede subir un 25 %.',
  },
  l22: {
    content: 'El análisis del mercado cripto requiere entender factores únicos que no se encuentran en los mercados tradicionales. El primero es el análisis on-chain: el estudio de los datos de la blockchain misma como el volumen de transacciones, el número de monederos activos, y el flujo de monedas hacia y desde los intercambios. Estos datos dan una visión única del comportamiento de los inversores.\n\nEl segundo: análisis de liquidez y oferta. Muchas monedas tienen un calendario de desbloqueo que libera gradualmente nuevas cantidades. Estos desbloqueos pueden presionar el precio. Bitcoin es diferente porque su oferta está fijada en 21 millones de monedas solamente.\n\nEl tercero: indicadores de sentimiento específicos de las criptos. El Índice de Miedo y Codicia Cripto, el número de búsquedas de bitcoin, y la tasa de hash de la red son todos indicadores que ayudan a medir el estado del mercado. En cripto más que en cualquier otro mercado, las emociones dirigen los precios a corto plazo.',
    keyPoints: [
      'El análisis on-chain estudia los datos directos de la blockchain — una ventaja única de las criptos',
      'Los calendarios de desbloqueo de monedas presionan el precio — míralos con atención',
      'El Índice de Miedo y Codilia Cripto es un indicador emocional importante',
      'Las emociones son más fuertes en cripto que en cualquier otro mercado — cuidado con las decisiones impulsivas',
    ],
    practicalExample: 'El análisis on-chain muestra que una gran cantidad de bitcoin se ha movido de monederos fríos a intercambios — generalmente una señal de intención de venta. Al mismo tiempo, el Índice de Miedo y Codicia está en 85 (codicia extrema). Decides reducir tus posiciones largas o colocar un stop móvil para asegurar los beneficios.',
  },

  // ── Materias Primas (3 lecciones) ──
  l23: {
    content: 'El oro es el activo financiero más antiguo de la historia y un refugio seguro en tiempos de crisis. Se negocia bajo el símbolo XAU/USD y se ve afectado por factores únicos, los más importantes: el precio del dólar (generalmente relación inversa), las tasas de interés reales (interés menos inflación), los riesgos geopolíticos, y la demanda física de India y China.\n\nCuando el dólar se debilita, el oro se vuelve más barato para los compradores con otras divisas, aumentando la demanda y el precio. Cuando las tasas de interés reales suben, el oro se vuelve menos atractivo porque no produce rendimiento. Pero en tiempos de crisis y preocupación, el oro sube independientemente del interés porque es un refugio seguro de valor.\n\nEl oro se caracteriza por una volatilidad moderada (menos que las criptos y más que Forex) y una alta liquidez. Se negocia las 24 horas, pero sus mejores momentos coinciden con las sesiones de Londres y Nueva York. Los traders usan el análisis técnico con éxito en el oro porque sus patrones son claros y relativamente fiables.',
    keyPoints: [
      'El oro es un refugio seguro que sube en crisis — generalmente inverso al dólar',
      'Las altas tasas de interés reales debilitan el oro porque no produce rendimiento',
      'La demanda física de India y China afecta el precio a medio plazo',
      'Volatilidad moderada y alta liquidez — adecuado para todos los niveles de traders',
    ],
    practicalExample: 'Las tensiones geopolíticas se intensifican y el dólar se debilita. Compras oro a 2.350 $ con un stop loss en 2.320 $ (30 $) y objetivo 2.420 $ (70 $). Relación 1:2,3. Si la crisis se intensifica, el precio puede superar ampliamente tu objetivo, por lo que colocas un stop móvil 20 $ detrás del precio para asegurar los beneficios.',
  },
  l24: {
    content: 'El petróleo crudo se negocia en dos tipos principales: Brent (la referencia mundial) y WTI (la referencia americana). El precio del petróleo se ve afectado por la oferta y la demanda reales más que por cualquier otro factor. La OPEP+ controla una gran parte de la producción y sus decisiones mueven los precios fuertemente.\n\nFactores de oferta: las decisiones de producción de la OPEP+, la producción americana de petróleo de esquisto, y los eventos geopolíticos en las regiones productoras (Golfo, Rusia, Venezuela). Factores de demanda: el crecimiento económico global especialmente en China, la temporada estival de viaje y conducción, y la transición a largo plazo hacia la energía limpia.\n\nEl informe semanal de inventarios de petróleo americano (EIA) se publica cada semana y mueve los precios inmediatamente. Inventarios más altos de lo esperado = presión a la baja, y más bajos = presión al alza. Los traders profesionales también vigilan las tasas de refinado y los inventarios de gasolina y destilados.',
    keyPoints: [
      'Brent y WTI son las dos principales referencias — Brent suele cotizar a un precio más alto',
      'Las decisiones de la OPEP+ son el impulsor de oferta más fuerte y mueven los precios fuertemente',
      'El crecimiento chino es el principal impulsor de la demanda mundial de petróleo',
      'El informe semanal de inventarios EIA es un evento importante a seguir',
    ],
    practicalExample: 'La OPEP+ anuncia un recorte de producción de 2 millones de barriles por día más de lo esperado. El petróleo sube un 4 % en un día. Habías comprado WTI a 78 $ antes de la reunión basándote en rumores de recorte. Colocaste un stop en 76 $ y ahora el precio está en 81,12 $. Subes el stop móvil a 79 $ para asegurar al menos 1 $ de beneficio por barril.',
  },
  l25: {
    content: 'El dólar estadounidense y las materias primas denominadas en dólares tienen una relación inversa histórica. Cuando el dólar sube, las materias primas se vuelven más caras para los compradores con otras divisas, reduciendo la demanda y el precio. Lo contrario ocurre cuando el dólar se debilita. Esta relación se aplica fuertemente al oro, al petróleo y a los metales industriales.\n\nPero la relación no siempre es mecánica. En tiempos de crisis, tanto el dólar como el oro pueden subir juntos porque ambos se consideran refugios seguros. En períodos de fuerte crecimiento, tanto el dólar como el petróleo pueden subir juntos porque la demanda de energía aumenta.\n\nEstrategia de trading: vigila el DXY (índice del dólar) y el oro al mismo tiempo. Si el DXY sube y el oro baja, es una tendencia normal. Si ambos suben, es un indicador de miedo en el mercado (risk-off). Si ambos caen, puede señalar riesgos inflacionarios. Entender estas relaciones añade una capa importante a tu análisis.',
    keyPoints: [
      'Relación inversa histórica: dólar fuerte = materias primas más baratas, dólar débil = más caras',
      'Las excepciones ocurren especialmente en tiempos de crisis (ambos suben como refugios seguros)',
      'Vigila el DXY y el oro simultáneamente para entender la dirección del mercado',
      'Dólar fuerte + oro al alza = sentimiento de mercado risk-off',
    ],
    practicalExample: 'El DXY cae de 106 a 103 y el oro sube de 2.300 $ a 2.380 $. La relación inversa funciona normalmente. Abres una operación larga en oro confiando en la debilidad continuada del dólar. Pero de repente el DXY sube y el oro no cae — esta contradicción puede indicar demanda de refugio seguro para el oro debido a alguna crisis. Añades un stop móvil para proteger tus beneficios.',
  },

  // ── Estrategias (4 lecciones) ──
  l26: {
    content: 'El Seguimiento de Tendencia es una de las estrategias más antiguas y exitosas de la historia. El principio es simple: "la tendencia es tu amiga" — compra cuando el mercado está en tendencia alcista y vende cuando está en tendencia bajista. La idea es que las tendencias tienden a continuar más que a revertirse.\n\nIdentificación de la tendencia: la media móvil de 200 días es el estándar. Si el precio está por encima de la MM200, la tendencia es alcista; si por debajo, es bajista. En el marco semanal, la MM50 define la tendencia media, y en el diario, la MM20 para la tendencia corta.\n\nPuntos de entrada: el mejor punto es un retroceso desde la media móvil en una tendencia primaria. Por ejemplo: precio por encima de la MM200 (tendencia alcista) y rebotando desde la MM50. Esperas una confirmación con una vela de reversión o un RSI cruzando por encima de 50, luego compras. Stop loss por debajo del último mínimo formado. Objetivo en la próxima resistencia o usando un stop móvil.',
    keyPoints: [
      'Las tendencias tienden a continuar — opera con ellas, no contra ellas',
      'MM200 define la tendencia primaria, MM50 la media, MM20 la corta',
      'Mejor punto de entrada: retroceso desde la MM en tendencia primaria con confirmación',
      'Usa un stop móvil para asegurar los beneficios a medida que la tendencia continúa',
    ],
    practicalExample: 'En EUR/USD diario: precio por encima de la MM200 (tendencia alcista). El precio rebota desde la MM50 en 1,0820. Se forma una vela martillo con el RSI volviendo por encima de 50. Compras a 1,0840 con un stop por debajo del mínimo en 1,0790 (50 pips) y objetivo en el último máximo 1,0950 (110 pips). Relación 1:2,2. Colocas un stop móvil a una distancia de 30 pips.',
  },
  l27: {
    content: 'La estrategia Breakout se basa en entrar cuando se rompe un nivel importante de soporte o resistencia con un alto volumen de negociación. La idea es que cuando el precio rompe un nivel pivote, gana un fuerte impulso en la dirección de la ruptura. Los breakouts ocurren después de períodos de consolidación lateral donde el precio se comprime como un resorte.\n\nCondiciones para un breakout válido: la ruptura debe ser con una vela fuerte (cierre claro por encima/debajo del nivel), el volumen de negociación al menos tres veces la media, y preferiblemente el nivel ha sido probado al menos dos veces antes. Los falsos breakouts ocurren cuando el precio rompe el nivel y luego vuelve rápidamente — por eso la confirmación por volumen es importante.\n\nPunto de entrada: o bien en la ruptura directamente (más arriesgado pero mayor beneficio) o en el retest del nivel roto (más seguro pero puede no haber retest). Stop loss por debajo/por encima del nivel roto. El objetivo se determina por el tamaño del rango lateral previo o con herramientas de Fibonacci.',
    keyPoints: [
      'Breakout = romper un nivel importante con alto volumen y fuerte impulso',
      'La confirmación por volumen es esencial — un breakout sin volumen suele ser falso',
      'Entra en la ruptura o en el retest (más seguro)',
      'Stop loss por debajo/por encima del nivel roto, objetivo por el tamaño del rango previo',
    ],
    practicalExample: 'GBP/USD opera lateralmente entre 1,2600 y 1,2750 durante dos semanas. De repente rompe 1,2750 con una vela fuerte y un volumen tres veces la media. Compras a 1,2760 con un stop en 1,2740 (justo por debajo del nivel roto). Objetivo = ancho del rango (150 pips) + punto de ruptura: 1,2750 + 0,0150 = 1,2900. La relación 1:7 permite perder varias operaciones y seguir siendo rentable.',
  },
  l28: {
    content: 'El Swing Trading mantiene las operaciones desde unos días hasta unas semanas, targeting movimientos de precio a medio plazo. Es el punto medio entre el agotador day trading y la lenta inversión a largo plazo. Adecuado para traders que no pueden vigilar la pantalla todo el día.\n\nMarcos temporales: análisis en el marco diario para determinar la tendencia y los puntos de entrada, semanal para confirmar la tendencia general, y de 4 horas para afinar la entrada. La regla: toma la decisión en el diario, ejecuta en el de 4 horas.\n\nLas mejores oportunidades de swing: retrocesos desde fuertes niveles de soporte/resistencia con cruces de indicadores (como MACD o cruces de medias móviles), patrones de reversión completados en el marco diario, y breakouts después de períodos laterales. Stop loss generalmente 50-150 pips y objetivo 100-400 pips, con una relación riesgo-beneficio de al menos 1:2.',
    keyPoints: [
      'El swing mantiene las operaciones durante días y semanas — no requiere vigilancia continua',
      'Decisión en el diario, ejecución en el de 4 horas',
      'Mejores oportunidades: retrocesos desde fuertes niveles con confirmación de indicadores',
      'Stop 50-150 pips y objetivo 100-400 pips con relación 1:2+',
    ],
    practicalExample: 'USD/JPY en el marco diario: tendencia alcista con MM200 ascendente. El precio rebota desde la MM20 en 154,50 con un cruce alcista del MACD. En el marco de 4 horas: vela de reversión alcista. Compras a 154,80 con un stop por debajo de 153,80 (100 pips) y objetivo 157,00 (220 pips). Relación 1:2,2. La operación puede tardar una semana en alcanzar el objetivo.',
  },
  l29: {
    content: 'El Scalping es un trading muy rápido que busca pequeños beneficios repetidos de movimientos de precio precisos. Un scalper abre y cierra decenas de operaciones diariamente, buscando 5-15 pips por operación. Este estilo requiere alta concentración, ejecución rápida, y una conexión a internet estable.\n\nRequisitos del scalping: un bróker con un spread muy bajo (menos de un pip en los pares mayores), una plataforma de ejecución rápida sin slippage, y la capacidad psicológica de tomar decisiones rápidas y adherirse al plan sin dudar. No apto para traders que dudan o experimentan presión psicológica.\n\nLos mejores pares de scalping: EUR/USD y GBP/USD por sus spreads estrechos y alta liquidez. Los mejores momentos: la sesión de Londres y el solapamiento con Nueva York. Herramientas técnicas: medias móviles cortas (5, 13, 21), RSI de período corto (5), y niveles de soporte/resistencia en los marcos de 1 minuto y 5 minutos.',
    keyPoints: [
      'El scalping busca 5-15 pips por operación con extrema velocidad',
      'Requiere un spread muy bajo, ejecución rápida y alta concentración',
      'Mejores pares: EUR/USD y GBP/USD. Mejor momento: Londres y Nueva York',
      'No para principiantes — requiere experiencia y excelente disciplina psicológica',
    ],
    practicalExample: 'Un scalper opera EUR/USD en el marco de 1 minuto. El precio rebota desde la MM21 con el RSI(5) saliendo de sobreventa. Compra a 1,0852 con un stop en 1,0845 (7 pips) y objetivo 1,0865 (13 pips). Relación 1:1,9. La operación se cierra en 3-5 minutos. Repite esto 15-20 veces al día buscando un neto de 50-80 pips.',
  },

  // ── IA (3 lecciones) ──
  l30: {
    content: 'La inteligencia artificial está revolucionando el mundo del trading a través de su capacidad para analizar cantidades masivas de datos a velocidad relámpago y descubrir patrones invisibles para los humanos. Sus aplicaciones en trading incluyen: análisis de sentimiento del mercado desde noticias y redes sociales, predicción de movimientos de precio basada en patrones históricos, detección automática de señales de trading, y optimización de la gestión de riesgos.\n\nLos tipos de IA utilizados: Machine Learning que aprende de datos históricos y mejora su rendimiento con el tiempo, Procesamiento de Lenguaje Natural (NLP) que analiza textos y noticias, y redes neuronales profundas que imitan la estructura del cerebro para descubrir patrones complejos.\n\nEs importante entender: la IA no es una bola de cristal y no garantiza beneficios. Es una herramienta potente que te ayuda a tomar mejores decisiones, pero la decisión final es tuya. El mejor uso de la IA es como asistente, no como reemplazo. Úsala para confirmar tu análisis o para filtrar oportunidades, no para tomar toda la decisión.',
    keyPoints: [
      'La IA analiza datos masivos y descubre patrones invisibles para los humanos',
      'Aplicaciones: análisis de sentimiento, predicción de precios, detección de señales, gestión de riesgos',
      'La IA no es una bola de cristal — es una asistente, no un reemplazo',
      'Mejor uso: confirmar el análisis y filtrar oportunidades, no la toma de decisiones completa',
    ],
    practicalExample: 'La plataforma Rouaa usa IA para analizar 500 fuentes de noticias en tiempo real y emite una calificación de sentimiento para cada par de divisas. La IA descubre que el 78 % de las noticias sobre la libra esterlina son negativas con un cruce bajista del MACD en el marco diario. Esta doble señal (fundamental + técnico) aumenta tu confianza en la decisión de venta en GBP/USD.',
  },
  l31: {
    content: 'La IA lee los mercados financieros a través de tres canales principales. El primero: análisis de precio y volumen usando algoritmos de machine learning que descubren patrones en los movimientos de precio que la mente humana no nota. La IA puede procesar cientos de pares en decenas de marcos temporales simultáneamente.\n\nEl segundo: análisis de sentimiento. La IA procesa miles de artículos, tweets e informes por hora y los clasifica como positivos, negativos o neutros. Calcula un índice de sentimiento global para cada activo y lo compara con los precios históricos para predecir la próxima reacción. Cuando el sentimiento es excesivamente positivo, puede ser hora de vender, y viceversa.\n\nEl tercero: análisis de correlación. La IA descubre relaciones entre activos que el trader medio no nota — por ejemplo, que el aumento de los precios del cobre suele preceder a las subidas de AUD/JPY en tres días. Estas correlaciones avanzadas dan una verdadera ventaja competitiva.',
    keyPoints: [
      'La IA lee los mercados vía: análisis de precios, análisis de sentimiento y análisis de correlación',
      'Descubre patrones en cientos de pares y decenas de marcos temporales simultáneamente',
      'El análisis de sentimiento procesa miles de textos y calcula un índice por activo',
      'Las correlaciones avanzadas entre activos dan una ventaja competitiva única',
    ],
    practicalExample: 'La IA en la plataforma Rouaa descubre que el índice de sentimiento del dólar ha alcanzado un pesimismo extremo (15/100), el nivel más bajo en 6 meses. Históricamente, cuando el sentimiento alcanza este nivel, el dólar rebota en 5 días en el 70 % de las veces. Esta señal de IA se añade para confirmar tu análisis técnico que ve un patrón de doble suelo en el DXY.',
  },
  l32: {
    content: 'Construir una estrategia de trading asistida por IA requiere una comprensión profunda de ambos campos: trading y datos. El primer paso es definir claramente el problema: ¿quieres que la IA prediga la dirección? ¿O que determine los puntos de entrada y salida? ¿O que mejore la gestión de riesgos? Cada objetivo requiere datos y algoritmos diferentes.\n\nEl segundo paso: recopilación de datos. Necesitas datos de precios históricos (OHLCV), datos fundamentales (indicadores económicos), datos de sentimiento (noticias y tweets), y datos on-chain para cripto. La calidad de los datos es más importante que la cantidad de algoritmos — malos datos = malos resultados.\n\nEl tercer paso: construir el modelo. Comienza con un modelo simple (regresión lineal o árbol de decisión) y luego aumenta gradualmente la complejidad. Pruébalo en datos históricos que no usó en el entrenamiento (test out-of-sample). El cuarto paso: backtesting con atención al spread, slippage y comisiones. El quinto paso: trading en demo y luego trading gradual con dinero real.',
    keyPoints: [
      'Define el problema primero: predicción, señales de entrada, o gestión de riesgos',
      'La calidad de los datos es más importante que la complejidad del algoritmo',
      'Comienza con un modelo simple y luego aumenta la complejidad gradualmente con pruebas en cada etapa',
      'Prueba en datos out-of-sample y luego haz trading en demo antes de dinero real',
    ],
    practicalExample: 'Construyes un modelo de IA para predecir la dirección diaria de EUR/USD. Usas 5 años de datos que incluyen: precios OHLCV, 10 indicadores técnicos, y un índice de sentimiento de noticias. Entrenas un Random Forest y obtienes un 58 % de precisión en los datos de prueba. Con una relación riesgo-beneficio de 1:2, necesitas solo el 35 % de aciertos para ser rentable. El 58 % significa una ventaja clara. Comienzas con un mes de trading en demo.',
  },
};
