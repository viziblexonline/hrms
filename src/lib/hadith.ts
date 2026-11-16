export type HadithCollection = "bukhari" | "muslim" | "riyad" | "nawawi40";

export interface HadithItem {
  id: string;
  collection: HadithCollection;
  number: string;
  topic: string;
  arabic: string;
  english: string;
  urdu: string;
  narrator: string;
}

export const HADITH_COLLECTIONS: {
  id: HadithCollection;
  label: string;
  labelUr: string;
  labelAr: string;
}[] = [
  { id: "nawawi40", label: "40 Nawawi", labelUr: "اربعین نووی", labelAr: "الأربعون النووية" },
  { id: "bukhari", label: "Bukhari", labelUr: "بخاری", labelAr: "البخاري" },
  { id: "muslim", label: "Muslim", labelUr: "مسلم", labelAr: "مسلم" },
  { id: "riyad", label: "Riyad as-Salihin", labelUr: "ریاض الصالحین", labelAr: "رياض الصالحين" },
];

/** Curated hadiths for teacher reference (Hifz / knowledge / intention). */
export const HADITHS: HadithItem[] = [
  {
    id: "n1",
    collection: "nawawi40",
    number: "1",
    topic: "Intention",
    arabic:
      "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    english:
      "Actions are judged by intentions, and every person will get what they intended.",
    urdu: "اعمال کا دارومدار نیتوں پر ہے، اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔",
    narrator: "Umar ibn al-Khattab (رضي الله عنه) — Bukhari & Muslim",
  },
  {
    id: "n2",
    collection: "nawawi40",
    number: "2",
    topic: "Islam · Iman · Ihsan",
    arabic:
      "قَالَ: يَا مُحَمَّدُ أَخْبِرْنِي عَنِ الْإِسْلَامِ… قَالَ: الْإِسْلَامُ أَنْ تَشْهَدَ…",
    english:
      "The Gabriel hadith: Islam, Iman, and Ihsan explained — worship Allah as if you see Him.",
    urdu: "حدیث جبریل: اسلام، ایمان اور احسان کی وضاحت — اللہ کی عبادت ایسے کرو گویا تم اسے دیکھ رہے ہو۔",
    narrator: "Umar ibn al-Khattab (رضي الله عنه) — Muslim",
  },
  {
    id: "b1",
    collection: "bukhari",
    number: "5027",
    topic: "Quran",
    arabic:
      "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    english: "The best among you are those who learn the Quran and teach it.",
    urdu: "تم میں بہترین وہ ہیں جو قرآن سیکھیں اور سکھائیں۔",
    narrator: "Uthman ibn Affan (رضي الله عنه) — Bukhari",
  },
  {
    id: "b2",
    collection: "bukhari",
    number: "5028",
    topic: "Quran",
    arabic:
      "مَثَلُ الَّذِي يَقْرَأُ الْقُرْآنَ وَهُوَ حَافِظٌ لَهُ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ",
    english:
      "The one who reads the Quran and memorizes it will be with the noble, righteous scribes (angels).",
    urdu: "جو قرآن پڑھے اور اسے حفظ رکھے وہ معزز نیک فرشتوں کے ساتھ ہوگا۔",
    narrator: "Aisha (رضي الله عنها) — Bukhari",
  },
  {
    id: "m1",
    collection: "muslim",
    number: "2699",
    topic: "Knowledge",
    arabic:
      "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    english:
      "Whoever travels a path seeking knowledge, Allah makes easy for him a path to Paradise.",
    urdu: "جو علم کی تلاش میں راستہ اختیار کرے، اللہ اس کے لیے جنت کا راستہ آسان فرما دیتا ہے۔",
    narrator: "Abu Huraira (رضي الله عنه) — Muslim",
  },
  {
    id: "m2",
    collection: "muslim",
    number: "804",
    topic: "Quran",
    arabic:
      "اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ",
    english:
      "Recite the Quran, for it will come as an intercessor for its companions on the Day of Resurrection.",
    urdu: "قرآن پڑھو، کیونکہ قیامت کے دن وہ اپنے ساتھیوں کی شفاعت کرے گا۔",
    narrator: "Abu Umamah (رضي الله عنه) — Muslim",
  },
  {
    id: "r1",
    collection: "riyad",
    number: "1000",
    topic: "Mercy",
    arabic:
      "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ",
    english:
      "The merciful are shown mercy by the Most Merciful. Be merciful to those on earth, and the One in the heavens will be merciful to you.",
    urdu: "رحم کرنے والوں پر رحمٰن رحم فرماتا ہے۔ زمین والوں پر رحم کرو، آسمان والا تم پر رحم کرے گا۔",
    narrator: "Abdullah ibn Amr (رضي الله عنه) — Abu Dawud / Tirmidhi",
  },
  {
    id: "r2",
    collection: "riyad",
    number: "245",
    topic: "Character",
    arabic: "إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلَاقًا",
    english:
      "The most beloved of you to me, and the closest to me on the Day of Resurrection, are those with the best character.",
    urdu: "تم میں مجھے سب سے زیادہ محبوب اور قیامت کے دن مجلس میں قریب وہ ہیں جن کے اخلاق بہترین ہیں۔",
    narrator: "Jabir (رضي الله عنه) — Tirmidhi",
  },
  {
    id: "n17",
    collection: "nawawi40",
    number: "17",
    topic: "Kindness",
    arabic: "إِنَّ اللَّهَ كَتَبَ الْإِحْسَانَ عَلَى كُلِّ شَيْءٍ",
    english: "Allah has prescribed excellence (ihsan) in all things.",
    urdu: "بے شک اللہ نے ہر چیز پر احسان فرض کیا ہے۔",
    narrator: "Shaddad ibn Aws (رضي الله عنه) — Muslim",
  },
  {
    id: "b3",
    collection: "bukhari",
    number: "73",
    topic: "Teaching",
    arabic: "إِنَّ اللَّهَ لَمْ يَبْعَثْنِي مُعَنِّتًا وَلَا مُتَعَنِّتًا وَلَكِنْ بَعَثَنِي مُعَلِّمًا مُيَسِّرًا",
    english:
      "Allah did not send me to be harsh or difficult, but as a teacher who makes things easy.",
    urdu: "اللہ نے مجھے تنگ کرنے والا بنا کر نہیں بھیجا، بلکہ آسان بنانے والا معلم بنا کر بھیجا۔",
    narrator: "Aisha (رضي الله عنها) — Muslim (meaning preserved for teachers)",
  },
];
