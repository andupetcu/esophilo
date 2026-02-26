export interface Tradition {
  slug: string;
  name: string;
  icon: string;
  description: string;
  textCount: number;
}

export const traditions: Tradition[] = [
  {
    slug: "hermetic-alchemical",
    name: "Hermetic & Alchemical",
    icon: "\u2697\uFE0F",
    description:
      "The ancient art of transformation, rooted in the teachings attributed to Hermes Trismegistus. Hermeticism explores the correspondence between macrocosm and microcosm, while alchemy seeks the transmutation of base matter\u2014and the soul\u2014into gold.",
    textCount: 0,
  },
  {
    slug: "gnostic",
    name: "Gnostic",
    icon: "\u2728",
    description:
      "Traditions centered on direct experiential knowledge of the divine. Gnosticism teaches that spiritual liberation comes through gnosis\u2014an inner knowing that transcends faith and reveals the true nature of the self and the cosmos.",
    textCount: 0,
  },
  {
    slug: "kabbalistic",
    name: "Kabbalistic",
    icon: "\uD83D\uDD4E",
    description:
      "The esoteric heart of Jewish wisdom, exploring the hidden dimensions of Torah and the nature of God through the Tree of Life. Kabbalah maps the divine emanations and offers a mystical path to understanding creation and the soul's purpose.",
    textCount: 0,
  },
  {
    slug: "buddhist-zen",
    name: "Buddhist & Zen",
    icon: "\u2638\uFE0F",
    description:
      "Teachings on the nature of mind, suffering, and awakening drawn from the Buddha's discourses and the Zen tradition. These texts point toward direct insight into reality, the dissolution of the ego, and the liberation found in present awareness.",
    textCount: 0,
  },
  {
    slug: "hindu-vedic",
    name: "Hindu & Vedic",
    icon: "\uD83D\uDD49\uFE0F",
    description:
      "The vast spiritual literature of India, encompassing the Vedas, Upanishads, Bhagavad Gita, and Yoga traditions. These texts explore the nature of Brahman, the path of self-realization, and the unity of Atman with the cosmic whole.",
    textCount: 0,
  },
  {
    slug: "sufi",
    name: "Sufi & Islamic Mysticism",
    icon: "\uD83C\uDF39",
    description:
      "The mystical dimension of Islam, expressed through poetry, ecstatic devotion, and the quest for union with the Beloved. Sufi masters like Rumi, Hafiz, and Ibn Arabi illuminate the path of divine love and the annihilation of the self in God.",
    textCount: 0,
  },
  {
    slug: "taoist",
    name: "Taoist",
    icon: "\u262F\uFE0F",
    description:
      "The ancient Chinese philosophy of the Way\u2014the nameless, formless source of all things. Taoism teaches harmony with nature, the art of effortless action (wu wei), and the balance of yin and yang as the foundation of a life well-lived.",
    textCount: 0,
  },
  {
    slug: "greek-philosophy",
    name: "Greek Philosophy",
    icon: "\uD83C\uDFDB\uFE0F",
    description:
      "The foundational tradition of Western thought, from the pre-Socratics to Plato and Aristotle. Greek philosophy asks the deepest questions about reality, virtue, knowledge, and the good life, establishing frameworks that continue to shape human understanding.",
    textCount: 0,
  },
  {
    slug: "neoplatonic-stoic",
    name: "Neoplatonic & Stoic",
    icon: "\uD83C\uDF1F",
    description:
      "The philosophical traditions of Plotinus, Marcus Aurelius, Epictetus, and Seneca. Neoplatonism charts the soul's ascent toward the One, while Stoicism teaches inner freedom through virtue, reason, and acceptance of the natural order.",
    textCount: 0,
  },
  {
    slug: "medieval-scholastic",
    name: "Medieval & Scholastic",
    icon: "\uD83D\uDCDC",
    description:
      "The great synthesis of faith and reason in the medieval world, from Boethius and Aquinas to Maimonides and Meister Eckhart. These thinkers wrestled with the nature of God, free will, and the relationship between philosophy and revelation.",
    textCount: 0,
  },
  {
    slug: "renaissance",
    name: "Renaissance",
    icon: "\uD83C\uDFA8",
    description:
      "The rebirth of classical learning fused with esoteric Christianity and Hermetic thought. Figures like Marsilio Ficino, Giordano Bruno, and Pico della Mirandola championed the dignity of humanity and the unity of all knowledge.",
    textCount: 0,
  },
  {
    slug: "theosophical",
    name: "Theosophical",
    icon: "\uD83D\uDC41\uFE0F",
    description:
      "The modern synthesis of Eastern and Western esoteric traditions, pioneered by Helena Blavatsky, Annie Besant, and Rudolf Steiner. Theosophy seeks the universal truths underlying all religions and explores hidden dimensions of human evolution.",
    textCount: 0,
  },
  {
    slug: "western-occultism",
    name: "Western Occultism",
    icon: "\uD83D\uDD2E",
    description:
      "The practical and ceremonial traditions of Western esotericism, from Eliphas Levi and the Hermetic Order of the Golden Dawn to Aleister Crowley. These texts explore ritual magic, the Tarot, astral work, and the disciplined development of the will.",
    textCount: 0,
  },
  {
    slug: "spiritualism-mysticism",
    name: "Spiritualism & Mysticism",
    icon: "\uD83D\uDD4A\uFE0F",
    description:
      "Traditions exploring communication with the spirit world and direct mystical experience of the divine. From Swedenborg's visionary cosmology to Kardec's systematic spiritism, these works map the unseen realms and the soul's journey beyond death.",
    textCount: 0,
  },
  {
    slug: "modern-philosophy",
    name: "Modern Philosophy",
    icon: "\uD83D\uDCAD",
    description:
      "The continuation of the philosophical tradition into the modern era, encompassing existentialism, phenomenology, and contemporary thought. These thinkers grapple with meaning, consciousness, and the human condition in an age of science and uncertainty.",
    textCount: 0,
  },
];

export function getTraditionBySlug(slug: string): Tradition | undefined {
  return traditions.find((t) => t.slug === slug);
}
