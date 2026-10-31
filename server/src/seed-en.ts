// Аяллын агуулгын англи орчуулга. Slug-аар seed.ts-ийн аялалтай холбогдоно.

export interface TourTranslation {
  title: string;
  summary: string;
  description: string;
  highlights: string[];
  itinerary: { day: number; title: string; text: string }[];
  includes: string[];
}

const BASE_INCLUDES = ["Professional guide", "Transport (from Ulaanbaatar)", "Three meals a day", "Accommodation"];

export const TRANSLATIONS_EN: Record<string, TourTranslation> = {
  "khuvsgul-nuur": {
    title: "Lake Khuvsgul: The Blue Pearl",
    summary: "Ride horses, sail and visit a reindeer herding family on the shores of Mongolia's clearest lake.",
    description:
      "Lake Khuvsgul holds 0.4% of the world's fresh water and is known as Mongolia's \"Blue Pearl\". On this trip you travel through taiga forest, alpine pastures and lakeshore, staying at a tourist ger camp. You will hike along the shore, go out on the water by boat and visit local herding families.",
    highlights: ["Boat trip across the lake", "Horse riding", "Visit a reindeer herding family", "Sunset over the water"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Murun", text: "Morning flight to Murun, then drive to Khatgal village and settle in on the lakeshore." },
      { day: 2, title: "The lakeshore", text: "Hike along the western shore and share dinner around the campfire in the evening." },
      { day: 3, title: "Horse trek", text: "Ride local herders' horses up to Jankhai Pass." },
      { day: 4, title: "On the water", text: "Sail by wooden boat to Modon Khuis island." },
      { day: 5, title: "Reindeer herders", text: "Meet a reindeer herding family and learn about their traditional way of life." },
      { day: 6, title: "Return", text: "Fly from Murun back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Domestic flights", "Horse and boat hire"],
  },
  "govi-ikh-aylal": {
    title: "The Great Gobi Journey",
    summary: "Eight days of desert adventure across the Khongor dunes, Bayanzag and Yolyn Am canyon.",
    description:
      "The Gobi is not the empty desert many imagine. It has singing sand dunes, the red cliffs of Bayanzag and Yolyn Am, a gorge where the ice survives into summer. You will ride camels, walk where dinosaur fossils were found and sleep under a sky full of stars.",
    highlights: ["Camel ride at Khongor dunes", "Red cliffs of Bayanzag", "Yolyn Am ice canyon", "Gobi night sky"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Tsagaan Suvarga", text: "Head south to the white cliffs of Tsagaan Suvarga, once an ancient seabed." },
      { day: 2, title: "Yolyn Am", text: "Hike the canyon in Gobi Gurvan Saikhan National Park." },
      { day: 3, title: "Khongor dunes", text: "Reach the 180 km sand dunes and watch the sunset from the top." },
      { day: 4, title: "Camel trek", text: "Visit a local camel herding family and ride Bactrian camels." },
      { day: 5, title: "Bayanzag", text: "Explore the \"Flaming Cliffs\", where the first dinosaur eggs were discovered." },
      { day: 6, title: "Ongi Monastery", text: "Discover the monastery ruins on the banks of the Ongi River." },
      { day: 7, title: "Baga Gazriin Chuluu", text: "Hike among granite rock formations." },
      { day: 8, title: "Return", text: "Drive back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Camel trek", "National park fees"],
  },
  "terelj-amralt": {
    title: "Terelj Weekend Getaway",
    summary: "Just 70 km from the city: Turtle Rock, Aryabal Monastery and two days in a traditional ger.",
    description:
      "If you want nature after a busy week without travelling far, Gorkhi-Terelj is the place. See Turtle Rock, climb up to Aryabal meditation centre and spend the night in a traditional ger.",
    highlights: ["Turtle Rock", "Aryabal Monastery", "Overnight in a ger", "Evening by the campfire"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Terelj", text: "Leave in the morning to visit Turtle Rock and Aryabal Monastery. Enjoy a khorkhog barbecue by the fire." },
      { day: 2, title: "Horse ride and return", text: "Morning horse ride through the Terelj River valley, back to the city in the afternoon." },
    ],
    includes: BASE_INCLUDES,
  },
  "altai-tavan-bogd": {
    title: "Altai Tavan Bogd Expedition",
    summary: "Mongolia's highest peaks, Potanin Glacier and meeting Kazakh eagle hunters.",
    description:
      "In Mongolia's far west, the Tavan Bogd mountains are famous for blue glaciers and snowy summits. On this expedition you camp at the foot of Potanin Glacier, walk the shores of Khoton and Khurgan lakes and stay with a Kazakh eagle hunting family. A moderate level of fitness is recommended.",
    highlights: ["Potanin Glacier", "Kazakh eagle hunters", "Khoton and Khurgan lakes", "Snow-capped peaks"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Ulgii", text: "Fly to Bayan-Ulgii province and get to know Kazakh culture." },
      { day: 2, title: "To Tsengel", text: "Drive west and stay with a herding family." },
      { day: 3, title: "Tavan Bogd base camp", text: "Reach the base camp and pitch tents." },
      { day: 4, title: "Potanin Glacier", text: "Hike along Mongolia's longest glacier." },
      { day: 5, title: "Malchin Peak", text: "Climb to 4,000 metres with views into Russia and China." },
      { day: 6, title: "Rest day", text: "Relax at the foot of the glacier and take photos." },
      { day: 7, title: "Khurgan Lake", text: "Move to the lakeshore and go fishing." },
      { day: 8, title: "Khoton Lake", text: "Hike along the shore of the lake." },
      { day: 9, title: "Eagle hunters", text: "Learn about the hunting traditions of Kazakh eagle hunters." },
      { day: 10, title: "Return", text: "Fly from Ulgii back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Domestic flights", "Tents and sleeping gear", "Border zone permit"],
  },
  "orkhon-khondii": {
    title: "Orkhon Valley and Kharkhorum",
    summary: "The capital of the Mongol Empire, Erdene Zuu Monastery and the Ulaan Tsutgalan waterfall.",
    description:
      "Travel through the UNESCO World Heritage Orkhon Valley to Kharkhorum, the heart of Mongolian history. Visit Erdene Zuu Monastery and the 20-metre Ulaan Tsutgalan waterfall.",
    highlights: ["Erdene Zuu Monastery", "Ulaan Tsutgalan waterfall", "Kharkhorum Museum", "Naiman Nuur lakes"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Khustai", text: "See wild Przewalski's horses in Khustai National Park." },
      { day: 2, title: "Kharkhorum", text: "Visit Erdene Zuu Monastery and the Kharkhorum Museum." },
      { day: 3, title: "Orkhon waterfall", text: "Visit Ulaan Tsutgalan waterfall and camp by the river." },
      { day: 4, title: "Tuvkhun Monastery", text: "Hike up to the hilltop monastery founded by Zanabazar." },
      { day: 5, title: "Return", text: "Drive back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Museum and monastery tickets"],
  },
  "khentii-oi": {
    title: "Khentii Forest Trek",
    summary: "Four days in Chinggis Khaan's homeland: taiga forest and the banks of the Onon River.",
    description:
      "The Khentii mountains are one of Mongolia's greenest regions. Hike through pine forest, camp on the banks of the Onon River and visit places linked to the story of Chinggis Khaan.",
    highlights: ["Taiga forest", "Onon River", "Historic sites", "Camping"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Khentii", text: "Drive east and set up camp at the edge of the forest." },
      { day: 2, title: "Forest trail", text: "A 14 km hike through the pine forest." },
      { day: 3, title: "Onon River", text: "Fish by the river and visit historic sites." },
      { day: 4, title: "Return", text: "Drive back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Tents and sleeping gear"],
  },
  "goviin-oddyn-shono": {
    title: "Gobi Stargazing Nights",
    summary: "Three days of telescope stargazing under a sky free of light pollution.",
    description:
      "The Gobi has some of the darkest, clearest skies on Earth. With a professional astronomer you will observe planets and nebulae through a telescope and see the Milky Way with the naked eye.",
    highlights: ["Telescope observation", "The Milky Way", "Night photography", "Desert sunrise"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Dundgovi", text: "Head south and pitch tents at Baga Gazriin Chuluu. First observation session at night." },
      { day: 2, title: "Night of stars", text: "Rest by day, observe planets and nebulae at night. Includes a photography lesson." },
      { day: 3, title: "Return", text: "Watch the sunrise, then drive back to the city." },
    ],
    includes: [...BASE_INCLUDES, "Telescope and astronomer", "Tents and sleeping gear"],
  },
  "khuvsgul-mosnii-nadam": {
    title: "Khuvsgul Ice Festival",
    summary: "A winter trip to see ice anklebone shooting, sledge and horse-drawn sleigh races on the frozen lake.",
    description:
      "In March Lake Khuvsgul is covered by ice a metre thick. During the Ice Festival you will watch ice anklebone shooting, horse sleigh races and ice sculptures. We provide warm clothing.",
    highlights: ["Ice anklebone shooting", "Horse sleigh races", "Ice sculptures", "Reindeer sledding"],
    itinerary: [
      { day: 1, title: "Ulaanbaatar → Khatgal", text: "Fly to Murun and drive to Khatgal village." },
      { day: 2, title: "Ice Festival I", text: "Opening ceremony and ice anklebone shooting." },
      { day: 3, title: "Ice Festival II", text: "Horse sleigh races and the ice sculpture exhibition." },
      { day: 4, title: "Across the ice", text: "Drive across the frozen lake and try ice fishing." },
      { day: 5, title: "Return", text: "Fly back to Ulaanbaatar." },
    ],
    includes: [...BASE_INCLUDES, "Domestic flights", "Winter clothing"],
  },
};
