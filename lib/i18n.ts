import { useUi, type Lang } from '@/lib/store';

/** Selection order: English first, then Hindi, then Tamil. */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
];

export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

// Microcopy from the design doc §8, as [English, Hindi, Tamil].
// The Hindi and Tamil are drafts and need a native-speaker review.
const COPY = {
  hero: ['Bad air. Better day.', 'ख़राब हवा। बेहतर दिन।', 'மோசமான காற்று. சிறந்த நாள்.'],
  subline: [
    'Saans reads the GRAP order, re-plans the school day, and proves it.',
    'साँस GRAP आदेश पढ़ता है, स्कूल का दिन दोबारा बनाता है, और उसका प्रमाण देता है।',
    'சான்ஸ் GRAP உத்தரவைப் படித்து, பள்ளி நாளை மறுதிட்டமிட்டு, அதை நிரூபிக்கிறது.',
  ],
  slider: [
    'Drag to see tomorrow at each GRAP stage',
    'हर GRAP चरण पर कल का दिन देखने के लिए खींचें',
    'ஒவ்வொரு GRAP நிலையிலும் நாளைய நாளைக் காண இழுக்கவும்',
  ],
  samePlanLow: [
    'Same plan as Stage {other} for this school. The order bans outdoor PE from Stage III.',
    'इस स्कूल के लिए योजना चरण {other} जैसी ही है। आदेश चरण III से बाहरी PE पर रोक लगाता है।',
    'இந்தப் பள்ளிக்கு நிலை {other} போன்ற அதே திட்டம். நிலை III முதல் வெளிப்புற PE-ஐ உத்தரவு தடை செய்கிறது.',
  ],
  samePlanHigh: [
    'Same plan as Stage {other} for this school. The order already bans outdoor PE.',
    'इस स्कूल के लिए योजना चरण {other} जैसी ही है। आदेश पहले से ही बाहरी PE पर रोक लगाता है।',
    'இந்தப் பள்ளிக்கு நிலை {other} போன்ற அதே திட்டம். உத்தரவு ஏற்கனவே வெளிப்புற PE-ஐத் தடை செய்துள்ளது.',
  ],
  rehearsal: ['Rehearsal: nothing is sent', 'अभ्यास: कुछ भी भेजा नहीं जाता', 'ஒத்திகை: எதுவும் அனுப்பப்படாது'],
  startRun: ["Start tonight's run (demo)", 'आज रात का रन शुरू करें (डेमो)', 'இன்றிரவு ஓட்டத்தைத் தொடங்கு (டெமோ)'],
  approve: ['Approve this plan', 'इस योजना को मंज़ूर करें', 'இந்தத் திட்டத்தை அங்கீகரி'],
  reject: ['Reject', 'अस्वीकार करें', 'நிராகரி'],
  waiting: ['Waiting for the {role}.', '{role} के उत्तर की प्रतीक्षा।', '{role} பதிலுக்காகக் காத்திருக்கிறது.'],
  doNothing: [
    'If you do nothing, the vice-principal is asked in 60 seconds.',
    'यदि आप कुछ नहीं करते, तो 60 सेकंड में उप-प्रधानाचार्य से पूछा जाएगा।',
    'நீங்கள் எதுவும் செய்யாவிட்டால், 60 வினாடிகளில் துணை முதல்வரிடம் கேட்கப்படும்.',
  ],
  failSafe: [
    'Nothing was sent. That is the safe answer.',
    'कुछ भी नहीं भेजा गया। यही सुरक्षित उत्तर है।',
    'எதுவும் அனுப்பப்படவில்லை. அதுவே பாதுகாப்பான பதில்.',
  ],
  linkInvalid: [
    'This approval link is no longer valid: it was used, expired or never existed.',
    'यह लिंक अब मान्य नहीं है: इसका उपयोग हो चुका है, यह समाप्त हो गया है, या कभी था ही नहीं।',
    'இந்த ஒப்புதல் இணைப்பு இனி செல்லாது: அது பயன்படுத்தப்பட்டது, காலாவதியானது, அல்லது ஒருபோதும் இருந்ததில்லை.',
  ],
  runEnded: [
    'This run has already ended. Nothing more can be approved.',
    'यह रन समाप्त हो चुका है। अब कुछ भी मंज़ूर नहीं किया जा सकता।',
    'இந்த ஓட்டம் ஏற்கனவே முடிந்துவிட்டது. இனி எதையும் அங்கீகரிக்க முடியாது.',
  ],
  retry: [
    'Could not reach the workflow. Your link is still valid. Try again.',
    'वर्कफ़्लो तक नहीं पहुँच सके। आपका लिंक अभी मान्य है। फिर कोशिश करें।',
    'பணிப்பாய்வை அணுக முடியவில்லை. உங்கள் இணைப்பு இன்னும் செல்லுபடியாகும். மீண்டும் முயற்சிக்கவும்.',
  ],
  verify: ['Verify in your browser', 'अपने ब्राउज़र में जाँचें', 'உங்கள் உலாவியில் சரிபார்க்கவும்'],
  verified: [
    'Verified. Every hash matches.',
    'सत्यापित। हर हैश मेल खाता है।',
    'சரிபார்க்கப்பட்டது. ஒவ்வொரு ஹாஷும் பொருந்துகிறது.',
  ],
  tamperHint: [
    'Change any role and watch the chain break.',
    'कोई भी भूमिका बदलें और श्रृंखला टूटते देखें।',
    'ஏதேனும் ஒரு பொறுப்பை மாற்றி, சங்கிலி உடைவதைப் பாருங்கள்.',
  ],
  noticeCheck: [
    'Paste the WhatsApp notice you received',
    'आपको मिली WhatsApp सूचना यहाँ चिपकाएँ',
    'நீங்கள் பெற்ற WhatsApp அறிவிப்பை இங்கே ஒட்டவும்',
  ],
  genuine: [
    "Genuine. This exact notice is in the school's record.",
    'असली। यही सूचना स्कूल के रिकॉर्ड में दर्ज है।',
    'உண்மையானது. இதே அறிவிப்பு பள்ளியின் பதிவில் உள்ளது.',
  ],
  notFound: [
    "This exact text is not in the school's log.",
    'यह सटीक पाठ स्कूल के रिकॉर्ड में नहीं है।',
    'இந்தச் சரியான உரை பள்ளியின் பதிவில் இல்லை.',
  ],
  provenance: [
    'Written by the static template (labelled fallback)',
    'स्थिर टेम्पलेट द्वारा लिखा गया (लेबल किया गया विकल्प)',
    'நிலையான வார்ப்புருவால் எழுதப்பட்டது (குறிக்கப்பட்ட மாற்று வழி)',
  ],
  snapshot: [
    'Offline: showing a saved copy of real responses.',
    'ऑफ़लाइन: सहेजे गए वास्तविक उत्तर दिखाए जा रहे हैं।',
    'ஆஃப்லைன்: சேமிக்கப்பட்ட உண்மையான பதில்கள் காட்டப்படுகின்றன.',
  ],
  footer: [
    'Modelled, not measured. Tamper-evident, not tamper-proof.',
    'अनुमानित, मापा हुआ नहीं। छेड़छाड़ दिखाई देती है, रोकी नहीं जाती।',
    'மாதிரிக் கணிப்பு, அளவிடப்பட்டது அல்ல. மாற்றம் தெரியும், ஆனால் தடுக்கப்படாது.',
  ],
  navRehearse: ['Rehearse', 'अभ्यास', 'ஒத்திகை'],
  navToday: ['Today', 'आज', 'இன்று'],
  navReceipt: ['Receipt', 'रसीद', 'ரசீது'],
  navHow: ['How it works', 'कैसे काम करता है', 'செயல்முறை'],
  nothingPushed: [
    'Nothing is pushed to phones.',
    'फ़ोन पर अपने-आप कुछ नहीं भेजा जाता।',
    'தொலைபேசிகளுக்கு எதுவும் தானாக அனுப்பப்படாது.',
  ],
  share: ['Share on WhatsApp', 'WhatsApp पर साझा करें', 'WhatsApp-இல் பகிர்'],
} satisfies Record<string, [string, string, string]>;

export type CopyKey = keyof typeof COPY;

const INDEX: Record<Lang, number> = { en: 0, hi: 1, ta: 2 };

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
