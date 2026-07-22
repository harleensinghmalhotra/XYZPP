// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATIONS — FR + ES for the 6 published newsroom articles.
//
// Register: professional press-release. Rules honoured:
//   • Proper nouns kept verbatim — Quarterfold Printabilities, PrintWeek,
//     Business Connect, Dun & Bradstreet, ASSOCHAM, JETRO, UNICEF, USAID, Komori,
//     Signa, people (Nilesh Dhankani, Ramu Ramanathan), and AWARD/STATUS names
//     (Power 100, Book Education Company of the Year, Export Company of the Year,
//     Star Export House, Most Emerging Company, Excellence in the Field of
//     Education, "Champion in Biz", India-Africa Trade & Investment Forum).
//   • Inter-governmental bodies use their official FR/ES names (World Bank →
//     Banque mondiale / Banco Mundial; UN → ONU); UNESCO/UNICEF/USAID keep their
//     acronyms.
//   • Dates localized (June 2026 → juin 2026 / junio de 2026). Numbers & facts
//     identical (INR 25 crore, 22 %, 2,00,000 sq ft, 4,00,000/day, etc.).
//
// Each localized `body` is rebuilt FROM `body.en` at runtime, so image asset
// refs and every `_key` are preserved 1:1 — only paragraph text and image
// captions/alt change. Captions are uniform within an article. Idempotent:
// re-running just re-sets the same FR/ES values.
//
//   Run (from studio/, AFTER migrate-i18n.mjs):
//     node --env-file=.env translate-i18n.mjs
// ─────────────────────────────────────────────────────────────────────────────
import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET
const token = process.env.SANITY_AUTH_TOKEN
if (!projectId || !dataset || !token) {
  console.error('✗ Missing env. Run:  node --env-file=.env translate-i18n.mjs')
  process.exit(1)
}
const client = createClient({projectId, dataset, token, apiVersion: '2026-07-19', useCdn: false})

// blocks[] are the article's paragraph texts IN ORDER; caption applies to every
// image in that article (captions are uniform per article).
const TRANSLATIONS = {
  'printweek-power-100-2026': {
    fr: {
      title: 'Nilesh Dhankani, de Quarterfold, entre au Power 100 de PrintWeek pour 2026',
      excerpt:
        'PrintWeek India a inscrit Nilesh Dhankani, fondateur de Quarterfold, à son Power 100 pour 2026 — le palmarès des dirigeants les plus influents de l’industrie de l’impression — au terme d’une année d’investissements de montée en puissance dans les presses et la reliure de l’entreprise.',
      blocks: [
        'Nilesh Dhankani, fondateur de Quarterfold Printabilities, a été nommé au Power 100 de PrintWeek India pour 2026, la liste annuelle des dirigeants les plus influents de l’industrie de l’impression établie par le magazine.',
        'PrintWeek a présenté cette distinction comme une « montée en puissance de l’impression éducative ». Au cours de l’exercice 2026, l’entreprise a progressé d’environ 15 % et investi près de 25 crore INR dans l’impression et la reliure, Dhankani prenant par ailleurs le titre de directeur général.',
        'L’investissement a ajouté trois presses à feuilles — deux quatre couleurs et une huit couleurs à retiration — ainsi que deux tours offset à bobine, portant Quarterfold à 22 tours à bobine, aux côtés d’une ligne automatisée de blocs-livres et d’un équipement d’emboîtage. La capacité a augmenté d’environ 22 % d’une année sur l’autre pour dépasser 3 000 tonnes métriques par mois, soit environ 7 à 7,5 millions de livres.',
        'L’éducation représente désormais plus de 90 % du chiffre d’affaires, une production destinée à des éditeurs et à des ministères de l’Éducation dans 25 pays, avec un effectif de plus de 800 personnes. « La valeur ajoutée vient de ce qui se passe une fois que l’encre est sur le papier », a déclaré Dhankani au magazine.',
      ],
      caption: 'PrintWeek India, juin 2026',
    },
    es: {
      title: 'Nilesh Dhankani, de Quarterfold, entra en el Power 100 de PrintWeek para 2026',
      excerpt:
        'PrintWeek India incluyó a Nilesh Dhankani, fundador de Quarterfold, en su Power 100 para 2026 —la relación de los líderes más influyentes del sector de la impresión— tras un año de inversiones de ampliación en las prensas y la encuadernación de la compañía.',
      blocks: [
        'Nilesh Dhankani, fundador de Quarterfold Printabilities, ha sido nombrado para el Power 100 de PrintWeek India para 2026, la lista anual de la revista con los líderes más influyentes del sector de la impresión.',
        'PrintWeek describió el reconocimiento como una «ampliación de la impresión educativa». En el ejercicio 2026, la compañía creció cerca de un 15 % e invirtió cerca de 25 crore INR en impresión y encuadernación, y Dhankani asumió el cargo de director gerente.',
        'La inversión sumó tres prensas de pliego —dos de cuatro colores y una de ocho colores con retiración— y dos torres de offset de bobina, con lo que Quarterfold alcanzó las 22 torres de bobina, junto con una línea automatizada de blocs de libro y maquinaria de metido en tapa. La capacidad creció alrededor de un 22 % interanual hasta superar las 3.000 toneladas métricas al mes, o unos 7 a 7,5 millones de libros.',
        'La educación representa ya más del 90 % de la facturación, una producción destinada a editoriales y ministerios de Educación en 25 países, con una plantilla de más de 800 personas. «El valor añadido surge de lo que ocurre después de que la tinta llega al papel», declaró Dhankani a la revista.',
      ],
      caption: 'PrintWeek India, junio de 2026',
    },
  },

  'business-connect-print-industry': {
    fr: {
      title: 'Business Connect : Quarterfold Printabilities, une révolution dans l’industrie de l’impression',
      excerpt:
        'Dans son numéro de juillet 2024, Business Connect India a dressé le portrait de Quarterfold Printabilities comme une entreprise en train de révolutionner l’industrie de l’impression, retraçant le parcours de son fondateur Nilesh Dhankani, depuis une lacune repérée en Afrique jusqu’à une activité d’impression éducative et de logistique en forte croissance.',
      blocks: [
        'Dans son numéro de juillet 2024, Business Connect India a présenté Quarterfold Printabilities comme une entreprise « en train de révolutionner l’industrie de l’impression », bâtie autour de son fondateur et directeur général Nilesh Dhankani.',
        'Fondée en 2014, Quarterfold est devenue l’une des entreprises d’impression et de logistique les plus dynamiques d’Inde, associant l’impression offset, numérique et grand format à une forte spécialisation dans les livres scolaires et éducatifs.',
        'L’article fait remonter la genèse de l’entreprise aux voyages de Dhankani en Afrique, où il a vu des éditeurs aux prises avec une qualité irrégulière, des délais non tenus et des barrières linguistiques — une lacune que Quarterfold a été conçue pour combler.',
        'Il souligne les distinctions que l’entreprise a depuis accumulées, notamment le statut de Star Export House, le titre d’Export Company of the Year décerné par PrintWeek et une mention « Most Emerging Company » de Dun & Bradstreet.',
      ],
      caption: 'Business Connect India, juillet 2024',
    },
    es: {
      title: 'Business Connect: Quarterfold Printabilities, revolucionando el sector de la impresión',
      excerpt:
        'En su número de julio de 2024, Business Connect India presentó a Quarterfold Printabilities como una empresa que está revolucionando el sector de la impresión, y trazó la trayectoria de su fundador, Nilesh Dhankani, desde una carencia que detectó en África hasta un negocio de impresión educativa y logística en rápido crecimiento.',
      blocks: [
        'En su número de julio de 2024, Business Connect India presentó a Quarterfold Printabilities como una empresa «que revoluciona el sector de la impresión», construida en torno a su fundador y director ejecutivo, Nilesh Dhankani.',
        'Fundada en 2014, Quarterfold se ha convertido en una de las empresas de impresión y logística más dinámicas de la India, que combina la impresión offset, digital y de gran formato con una fuerte especialización en libros educativos y escolares.',
        'El reportaje sitúa el origen de la empresa en los viajes de Dhankani por África, donde vio a editoriales enfrentadas a una calidad irregular, plazos incumplidos y barreras idiomáticas: una carencia que Quarterfold se creó para cubrir.',
        'Señala los reconocimientos que la empresa ha reunido desde entonces, entre ellos el estatus de Star Export House, el título de Export Company of the Year de PrintWeek y una mención de «Most Emerging Company» de Dun & Bradstreet.',
      ],
      caption: 'Business Connect India, julio de 2024',
    },
  },

  'printweek-book-education-company-of-the-year': {
    fr: {
      title: 'Quarterfold remporte le titre de Book Education Company of the Year de PrintWeek',
      excerpt:
        'Quarterfold Printabilities a été désignée Book Education Company of the Year lors des PrintWeek India Awards 2024, une reconnaissance de son leadership dans la fabrication de livres éducatifs à grande échelle.',
      blocks: [
        'Quarterfold Printabilities a été désignée Book Education Company of the Year lors des PrintWeek India Awards 2024, en hommage à son leadership dans l’impression de livres éducatifs.',
        'La couverture de PrintWeek relève que l’entreprise — déjà lauréate de l’Export Company of the Year — exploite désormais une usine de 2,00,000 pieds carrés imprimant quelque 52 millions de livres, et qu’elle a expédié l’année précédente 700 conteneurs vers 18 pays.',
        'Il indique que Quarterfold exploite trois usines et un centre de traitement des commandes de 18,000 pieds carrés, et livre 800 conteneurs de livres éducatifs dans le monde entier dans le cadre d’un programme soutenu par la Banque mondiale, l’UNESCO et l’ONU.',
        'Cette distinction s’ajoute au précédent titre d’Export Company of the Year décerné par PrintWeek, confirmant un fabricant reconnu à la fois pour sa production éducative et pour ses performances à l’export.',
      ],
      caption: 'PrintWeek India Awards, 2024',
    },
    es: {
      title: 'Quarterfold gana el Book Education Company of the Year de PrintWeek',
      excerpt:
        'Quarterfold Printabilities fue nombrada Book Education Company of the Year en los PrintWeek India Awards 2024, en reconocimiento a su liderazgo en la fabricación de libros educativos a gran escala.',
      blocks: [
        'Quarterfold Printabilities fue nombrada Book Education Company of the Year en los PrintWeek India Awards 2024, en reconocimiento a su liderazgo en la impresión de libros educativos.',
        'La cobertura de PrintWeek señaló que la empresa —ya galardonada con el Export Company of the Year— opera ahora una planta de 2,00,000 pies cuadrados que imprime unos 52 millones de libros, y que el año anterior envió 700 contenedores a 18 países.',
        'Informó de que Quarterfold opera tres fábricas y un centro logístico de 18,000 pies cuadrados, y que entrega 800 contenedores de libros educativos en todo el mundo dentro de un programa respaldado por el Banco Mundial, la UNESCO y la ONU.',
        'El reconocimiento se suma al anterior título de Export Company of the Year de PrintWeek, y confirma a un fabricante valorado tanto por su producción educativa como por su capacidad de exportación.',
      ],
      caption: 'PrintWeek India Awards, 2024',
    },
  },

  'printweek-investment-2022': {
    fr: {
      title: 'PrintWeek : confiante dans l’impression, Quarterfold se lance dans une série d’investissements',
      excerpt:
        'Le reportage de PrintWeek de septembre 2022 dépeint une Quarterfold confiante dans l’impression, qui investit environ 6 millions USD dans de nouvelles presses, des équipements de finition et un centre de traitement des commandes dédié.',
      blocks: [
        'Le reportage de PrintWeek de septembre 2022, de nouveau signé Ramu Ramanathan, présente Quarterfold Printabilities comme « confiante dans l’impression » et engagée dans une nouvelle série d’investissements.',
        'Au cours des deux années précédentes, l’entreprise avait consacré environ 6 millions USD aux presses et à la finition, et ajoutait une presse à bobine 32 pages, une presse à bobine 16 pages, une presse à feuilles Komori ainsi qu’un centre d’entreposage et de traitement des commandes dédié.',
        'L’article relève une gamme de produits qui s’élargit — cahiers, ouvrages cartonnés, cartes mémoire, livres d’activités et articles de papeterie — certains titres ayant été retenus pour des projets de l’UNICEF et de l’USAID.',
        'Un encadré « en bref » situait alors Quarterfold à trois usines à Taloja, Navi Mumbai, un chiffre d’affaires de 187 crore de roupies et 260 salariés.',
      ],
      caption: 'PrintWeek India, septembre 2022',
    },
    es: {
      title: 'PrintWeek: optimista sobre la impresión, Quarterfold emprende una ronda de inversiones',
      excerpt:
        'El reportaje de PrintWeek de septiembre de 2022 describió a una Quarterfold optimista sobre la impresión, que invierte alrededor de 6 millones USD en nuevas prensas, acabados y un centro logístico específico.',
      blocks: [
        'El reportaje de PrintWeek de septiembre de 2022, de nuevo firmado por Ramu Ramanathan, describió a Quarterfold Printabilities como «optimista sobre la impresión» y embarcada en una nueva ronda de inversiones.',
        'En los dos años anteriores, la compañía había destinado alrededor de 6 millones USD a prensas y acabados, y estaba incorporando una prensa de bobina de 32 páginas, una prensa de bobina de 16 páginas, una prensa de pliego Komori y un centro específico de almacenamiento y logística.',
        'El artículo apunta a una gama de productos cada vez más amplia —cuadernos, títulos en tapa dura, tarjetas didácticas, libros de actividades y artículos de papelería—, con algunos títulos seleccionados para proyectos de UNICEF y USAID.',
        'Un recuadro «de un vistazo» situaba entonces a Quarterfold en tres fábricas en Taloja, Navi Mumbai, una facturación de 187 crore de rupias y 260 empleados.',
      ],
      caption: 'PrintWeek India, septiembre de 2022',
    },
  },

  'printweek-400000-books-a-day': {
    fr: {
      title: 'PrintWeek : comment Quarterfold produit 4,00,000 livres par jour',
      excerpt:
        'Un reportage de PrintWeek de janvier 2022 examine comment Quarterfold a atteint une production de 4,00,000 livres par jour en huit ans d’existence — l’une des imprimeries de livres les plus jeunes et les plus entreprenantes d’Inde.',
      blocks: [
        'Dans un reportage de janvier 2022 signé Ramu Ramanathan, PrintWeek examine comment Quarterfold Printabilities a atteint une production de 4,00,000 livres par jour — huit ans seulement après sa création en 2014, l’une des imprimeries de livres les plus jeunes et les plus entreprenantes d’Inde.',
        'L’article détaille la reliure que Quarterfold a bâtie pour atteindre cette échelle : une assembleuse Signa à 16 postes, des massicots en ligne et hors ligne, une relieuse sans couture à 12 pinces et quatre relieuses supplémentaires.',
        'Il attribue ce résultat à l’agilité déployée pendant la pandémie — une deuxième usine et des machines à bobine à double tour ajoutées en cinq mois, une commande de huit millions de livres livrée en 26 jours et l’expédition de 150 conteneurs en 45 à 50 jours.',
        'Les deux usines se trouvent dans la zone de Taloja MIDC, près de Mumbai, et couvrent ensemble plus de 1,2 lakh de pieds carrés, tandis que l’entreprise étendait ses activités de gestion d’impression à l’Afrique.',
      ],
      caption: 'PrintWeek India, janvier 2022',
    },
    es: {
      title: 'PrintWeek: cómo Quarterfold produce 4,00,000 libros al día',
      excerpt:
        'Un reportaje de PrintWeek de enero de 2022 analizó cómo Quarterfold alcanzó una producción de 4,00,000 libros al día en apenas ocho años desde su fundación, una de las imprentas de libros más jóvenes y emprendedoras de la India.',
      blocks: [
        'En un reportaje de enero de 2022 firmado por Ramu Ramanathan, PrintWeek analizó cómo Quarterfold Printabilities alcanzó una producción de 4,00,000 libros al día: apenas ocho años después de su fundación en 2014, una de las imprentas de libros más jóvenes y emprendedoras de la India.',
        'El artículo detalla la encuadernación que Quarterfold construyó para alcanzar esa escala: una alzadora Signa de 16 estaciones, guillotinas en línea y fuera de línea, una encuadernadora fresada de 12 pinzas y otras cuatro encuadernadoras.',
        'Lo atribuye a la agilidad de la época de la pandemia: una segunda fábrica y máquinas de bobina de doble torre incorporadas en cinco meses, un pedido de ocho millones de libros entregado en 26 días y envíos de 150 contenedores en 45 a 50 días.',
        'Ambas fábricas se ubican en Taloja MIDC, cerca de Mumbai, y suman en conjunto más de 1,2 lakh de pies cuadrados, mientras la compañía ampliaba a África su labor de gestión de impresión.',
      ],
      caption: 'PrintWeek India, enero de 2022',
    },
  },

  'assocham-excellence-in-education': {
    fr: {
      title: 'ASSOCHAM désigne Quarterfold vice-lauréate de l’Excellence in the Field of Education',
      excerpt:
        'Quarterfold a été désignée vice-lauréate de l’Excellence in the Field of Education lors des prix Indiafrica d’ASSOCHAM, remis au 4e India-Africa Trade & Investment Forum en 2017.',
      blocks: [
        'Quarterfold Printabilities a été désignée vice-lauréate de l’Excellence in the Field of Education lors des ASSOCHAM Indiafrica « Champion in Biz » Awards, remis au 4e India-Africa Trade & Investment Forum en 2017.',
        'Le forum, organisé par ASSOCHAM avec le soutien de la JETRO japonaise, distinguait les entreprises tissant des liens commerciaux entre l’Inde et l’Afrique — un marché au cœur de l’activité de livres éducatifs de Quarterfold.',
        'Reçue sur scène à New Delhi, cette distinction a marqué l’une des premières reconnaissances externes de l’orientation de l’entreprise vers l’édition éducative sur les deux continents.',
      ],
      caption: 'ASSOCHAM Indiafrica « Champion in Biz » Awards, 2017',
    },
    es: {
      title: 'ASSOCHAM nombra a Quarterfold finalista del Excellence in the Field of Education',
      excerpt:
        'Quarterfold fue nombrada finalista del Excellence in the Field of Education en los premios Indiafrica de ASSOCHAM, entregados en el 4.º India-Africa Trade & Investment Forum en 2017.',
      blocks: [
        'Quarterfold Printabilities fue nombrada finalista del Excellence in the Field of Education en los ASSOCHAM Indiafrica «Champion in Biz» Awards, entregados en el 4.º India-Africa Trade & Investment Forum en 2017.',
        'El foro, organizado por ASSOCHAM con el apoyo de la JETRO japonesa, distinguió a las empresas que tejen vínculos comerciales entre la India y África, un mercado central en la labor de libros educativos de Quarterfold.',
        'Recibido sobre el escenario en Nueva Delhi, el reconocimiento supuso uno de los primeros respaldos externos a la apuesta de la empresa por la edición educativa en los dos continentes.',
      ],
      caption: 'ASSOCHAM Indiafrica «Champion in Biz» Awards, 2017',
    },
  },
}

// Rebuild a localized body array FROM the English body, preserving _key + asset
// refs; swap only paragraph text (blocks, in order) and image caption/alt.
function localizeBody(bodyEn, t, slug, lang) {
  let bi = 0
  const out = bodyEn.map((el) => {
    if (el._type === 'block') {
      const text = t.blocks[bi++]
      if (text == null) throw new Error(`${slug}/${lang}: not enough block translations (need >${bi})`)
      const spanKey = el.children?.[0]?._key || `${el._key}s`
      return {
        _type: 'block',
        _key: el._key,
        style: el.style || 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: spanKey, text, marks: []}],
      }
    }
    // image / videoFile — keep asset + _key, localize caption (+ alt if present)
    return {
      ...el,
      ...(el.caption !== undefined ? {caption: t.caption} : {}),
      ...(el.alt !== undefined ? {alt: t.caption} : {}),
    }
  })
  if (bi !== t.blocks.length) {
    throw new Error(`${slug}/${lang}: ${t.blocks.length} translations but ${bi} blocks consumed — mismatch`)
  }
  return out
}

const slugs = Object.keys(TRANSLATIONS)
console.log(`\nTranslating ${slugs.length} published posts → FR + ES\n`)

for (const slug of slugs) {
  const doc = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{_id, "bodyEn": body.en}`, {slug})
  if (!doc?._id) {
    console.warn(`   ⚠ ${slug} — not found, skipped`)
    continue
  }
  if (!Array.isArray(doc.bodyEn)) {
    console.warn(`   ⚠ ${slug} — body.en missing (run migrate-i18n.mjs first), skipped`)
    continue
  }
  const set = {}
  for (const lang of ['fr', 'es']) {
    const t = TRANSLATIONS[slug][lang]
    set[`title.${lang}`] = t.title
    set[`excerpt.${lang}`] = t.excerpt
    set[`body.${lang}`] = localizeBody(doc.bodyEn, t, slug, lang)
  }
  await client.patch(doc._id).set(set).commit()
  console.log(`   ✓ ${slug} — FR + ES set (title, excerpt, body)`)
}

console.log('\nDone.')
