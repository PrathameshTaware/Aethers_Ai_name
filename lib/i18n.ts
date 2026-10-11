import { useUi, type Lang } from '@/lib/store';

/** Selection order: English first, then Hindi. */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिन्दी' },
];

export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

// Microcopy from the design doc §8, as [English, Hindi].
const COPY = {
  hero: ['Bad air. Better day.', 'ख़राब हवा। बेहतर दिन।'],
  subline: [
    'Saans reads the GRAP order, re-plans the school day, and proves it.',
    'साँस GRAP आदेश पढ़ता है, स्कूल का दिन दोबारा बनाता है, और उसका प्रमाण देता है।',
  ],
  slider: [
    'Drag to see tomorrow at each GRAP stage',
    'हर GRAP चरण पर कल का दिन देखने के लिए खींचें',
  ],
  samePlanLow: [
    'Same plan as Stage {other} for this school. The order bans outdoor PE from Stage III.',
    'इस स्कूल के लिए योजना चरण {other} जैसी ही है। आदेश चरण III से बाहरी PE पर रोक लगाता है।',
  ],
  samePlanHigh: [
    'Same plan as Stage {other} for this school. The order already bans outdoor PE.',
    'इस स्कूल के लिए योजना चरण {other} जैसी ही है। आदेश पहले से ही बाहरी PE पर रोक लगाता है।',
  ],
  rehearsal: ['Rehearsal: nothing is sent', 'अभ्यास: कुछ भी भेजा नहीं जाता'],
  startRun: ["Start tonight's run (demo)", 'आज रात का रन शुरू करें (डेमो)'],
  approve: ['Approve this plan', 'इस योजना को मंज़ूर करें'],
  reject: ['Reject', 'अस्वीकार करें'],
  waiting: ['Waiting for the {role}.', '{role} के उत्तर की प्रतीक्षा।'],
  doNothing: [
    'If you do nothing, the vice-principal is asked in 60 seconds.',
    'यदि आप कुछ नहीं करते, तो 60 सेकंड में उप-प्रधानाचार्य से पूछा जाएगा।',
  ],
  failSafe: [
    'Nothing was sent. That is the safe answer.',
    'कुछ भी नहीं भेजा गया। यही सुरक्षित उत्तर है।',
  ],
  linkInvalid: [
    'This approval link is no longer valid: it was used, expired or never existed.',
    'यह लिंक अब मान्य नहीं है: इसका उपयोग हो चुका है, यह समाप्त हो गया है, या कभी था ही नहीं।',
  ],
  runEnded: [
    'This run has already ended. Nothing more can be approved.',
    'यह रन समाप्त हो चुका है। अब कुछ भी मंज़ूर नहीं किया जा सकता।',
  ],
  retry: [
    'Could not reach the workflow. Your link is still valid. Try again.',
    'वर्कफ़्लो तक नहीं पहुँच सके। आपका लिंक अभी मान्य है। फिर कोशिश करें।',
  ],
  verify: ['Verify in your browser', 'अपने ब्राउज़र में जाँचें'],
  verified: [
    'Verified. Every hash matches.',
    'सत्यापित। हर हैश मेल खाता है।',
  ],
  tamperHint: [
    'Change any role and watch the chain break.',
    'कोई भी भूमिका बदलें और श्रृंखला टूटते देखें।',
  ],
  noticeCheck: [
    'Paste the WhatsApp notice you received',
    'आपको मिली WhatsApp सूचना यहाँ चिपकाएँ',
  ],
  genuine: [
    "Genuine. This exact notice is in the school's record.",
    'असली। यही सूचना स्कूल के रिकॉर्ड में दर्ज है।',
  ],
  notFound: [
    "This exact text is not in the school's log.",
    'यह सटीक पाठ स्कूल के रिकॉर्ड में नहीं है।',
  ],
  provenance: [
    'Written by the static template (labelled fallback)',
    'स्थिर टेम्पलेट द्वारा लिखा गया (लेबल किया गया विकल्प)',
  ],
  provenanceRejected: [
    "The model's draft was refused by code ({reasons}), so the static template was sent",
    'मॉडल का मसौदा कोड ने अस्वीकार किया ({reasons}), इसलिए स्थिर टेम्पलेट भेजा गया',
  ],
  provenanceModel: [
    'Written by Bedrock {model} and passed the code checks',
    'Bedrock {model} द्वारा लिखा गया, कोड की जाँच में पास',
  ],
  provenanceFallbackModel: [
    'Written by the fallback model {model} because Bedrock was unavailable, and passed the code checks',
    'Bedrock उपलब्ध न होने पर वैकल्पिक मॉडल {model} द्वारा लिखा गया, कोड की जाँच में पास',
  ],
  snapshot: [
    'Offline: showing a saved copy of real responses.',
    'ऑफ़लाइन: सहेजे गए वास्तविक उत्तर दिखाए जा रहे हैं।',
  ],
  footer: [
    'Modelled, not measured. Tamper-evident, not tamper-proof.',
    'अनुमानित, मापा हुआ नहीं। छेड़छाड़ दिखाई देती है, रोकी नहीं जाती।',
  ],
  navRehearse: ['Rehearse', 'अभ्यास'],
  navToday: ['Today', 'आज'],
  navReceipt: ['Receipt', 'रसीद'],
  navHow: ['How it works', 'कैसे काम करता है'],
  nothingPushed: [
    'Nothing is pushed to phones.',
    'फ़ोन पर अपने-आप कुछ नहीं भेजा जाता।',
  ],
  share: ['Share on WhatsApp', 'WhatsApp पर साझा करें'],
} satisfies Record<string, [string, string]>;

export type CopyKey = keyof typeof COPY;

const INDEX: Record<Lang, number> = { en: 0, hi: 1 };

export function translate(lang: Lang, key: CopyKey, vars?: Record<string, string>): string {
  // English is the priority language and the fallback for anything untranslated.
  let s: string = COPY[key][INDEX[lang]] || COPY[key][0];
  for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, v);
  return s;
}

/** `t('approve')` in the current language, plus `lang` for the `lang` attribute on translated spans. */
export function useT() {
  const lang = useUi((s) => s.lang);
  return { lang, t: (key: CopyKey, vars?: Record<string, string>) => translate(lang, key, vars) };
}
