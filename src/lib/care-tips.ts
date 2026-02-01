import { db } from "@/lib/db";
import { fetchCareDataFromPerenual } from "@/lib/perenual";

export interface CareTip {
  category: "water" | "light" | "temperature" | "substrate" | "problems";
  title: string;
  description: string;
}

export interface PlantCareProfile {
  commonName: string;
  scientificName: string;
  tips: CareTip[];
  source: "db" | "perenual" | "static";
}

// ─── Static Fallback Database (18 popular houseplants, German) ───

const STATIC_CARE_DB: Omit<PlantCareProfile, "source">[] = [
  {
    commonName: "Monstera",
    scientificName: "Monstera deliciosa",
    tips: [
      { category: "water", title: "Gießen", description: "Erst gießen, wenn die oberen 3–5 cm der Erde trocken sind. Im Winter seltener gießen. Staunässe unbedingt vermeiden." },
      { category: "light", title: "Licht", description: "Helles, indirektes Licht. Verträgt auch Halbschatten, wächst dann aber langsamer. Direkte Mittagssonne vermeiden." },
      { category: "temperature", title: "Temperatur", description: "18–27 °C ideal. Nicht unter 12 °C. Hohe Luftfeuchtigkeit (60 %+) fördert die Blattentwicklung." },
      { category: "substrate", title: "Substrat", description: "Lockere, gut durchlässige Mischung aus Blumenerde, Perlite und Rinde. Umtopfen alle 1–2 Jahre." },
      { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter = Übergießen. Braune Spitzen = zu trockene Luft. Keine Fensterung = zu wenig Licht." },
    ],
  },
  {
    commonName: "Pothos",
    scientificName: "Epipremnum aureum",
    tips: [
      { category: "water", title: "Gießen", description: "Erde zwischen den Wassergaben leicht antrocknen lassen. Sehr tolerant gegenüber unregelmäßigem Gießen." },
      { category: "light", title: "Licht", description: "Kommt mit wenig Licht zurecht, wächst am besten bei hellem indirektem Licht. Panaschierte Sorten brauchen mehr Licht." },
      { category: "temperature", title: "Temperatur", description: "18–30 °C. Keine Zugluft, nicht unter 10 °C. Normale Raumluftfeuchtigkeit reicht." },
      { category: "substrate", title: "Substrat", description: "Normale Blumenerde ist ausreichend. Drainage-Loch im Topf ist wichtig." },
      { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter = zu viel Wasser. Blasse Blätter = zu wenig Licht. Welke Blätter = zu trocken." },
    ],
  },
  {
    commonName: "Geigenfeige",
    scientificName: "Ficus lyrata",
    tips: [
      { category: "water", title: "Gießen", description: "Regelmäßig gießen, wenn die oberen 2–3 cm trocken sind. Mag keine nassen Füße und kein Austrocknen." },
      { category: "light", title: "Licht", description: "Viel helles, indirektes Licht. Am besten in der Nähe eines Ost- oder Westfensters." },
      { category: "temperature", title: "Temperatur", description: "18–24 °C. Empfindlich gegen Zugluft und Temperaturwechsel. Luftfeuchtigkeit über 40 % halten." },
      { category: "substrate", title: "Substrat", description: "Gut durchlässige Erde, leicht sauer (pH 6–7). Alle 2 Jahre umtopfen." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Flecken = Übergießen oder Sonnenbrand. Blattfall = Standortwechsel oder Zugluft." },
    ],
  },
  {
    commonName: "Gummibaum",
    scientificName: "Ficus elastica",
    tips: [
      { category: "water", title: "Gießen", description: "Mäßig gießen, Erde zwischen den Wassergaben antrocknen lassen. Im Winter deutlich weniger." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht bis Halbschatten. Dunkellaubige Sorten vertragen weniger Licht." },
      { category: "temperature", title: "Temperatur", description: "16–27 °C. Nicht unter 10 °C. Verträgt trockene Luft relativ gut." },
      { category: "substrate", title: "Substrat", description: "Normale Zimmerpflanzenerde mit Perlite für bessere Drainage." },
      { category: "problems", title: "Häufige Probleme", description: "Blattfall = zu kalt, zu dunkel oder Übergießen. Blätter mit Staub regelmäßig abwischen." },
    ],
  },
  {
    commonName: "Einblatt",
    scientificName: "Spathiphyllum",
    tips: [
      { category: "water", title: "Gießen", description: "Gleichmäßig feucht halten, aber nie nass. Lässt die Blätter hängen, wenn es Wasser braucht – erholt sich schnell." },
      { category: "light", title: "Licht", description: "Halbschatten bis Schatten ideal. Verträgt wenig Licht, blüht aber nur bei hellem indirektem Licht." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C. Mag hohe Luftfeuchtigkeit. Regelmäßig besprühen oder auf Kieselstein-Tablett stellen." },
      { category: "substrate", title: "Substrat", description: "Humusreiche, lockere Blumenerde. Alle 1–2 Jahre umtopfen." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Blattspitzen = zu trockene Luft. Gelbe Blätter = zu viel Sonne oder Übergießen." },
    ],
  },
  {
    commonName: "Bogenhanf",
    scientificName: "Sansevieria trifasciata",
    tips: [
      { category: "water", title: "Gießen", description: "Sehr sparsam gießen. Im Sommer alle 2–3 Wochen, im Winter nur alle 4–6 Wochen. Staunässe ist tödlich." },
      { category: "light", title: "Licht", description: "Sehr anpassungsfähig: von Schatten bis volle Sonne. Wächst schneller bei mehr Licht." },
      { category: "temperature", title: "Temperatur", description: "15–30 °C. Verträgt trockene Heizungsluft problemlos. Nicht unter 10 °C." },
      { category: "substrate", title: "Substrat", description: "Kakteenerde oder sehr durchlässige Mischung. Umtopfen nur wenn der Topf sprengt." },
      { category: "problems", title: "Häufige Probleme", description: "Weiche/matschige Blätter = Fäulnis durch zu viel Wasser. Ansonsten nahezu unzerstörbar." },
    ],
  },
  {
    commonName: "Grünlilie",
    scientificName: "Chlorophytum comosum",
    tips: [
      { category: "water", title: "Gießen", description: "Regelmäßig gießen, Erde leicht feucht halten. Speichert Wasser in den Wurzeln, übersteht kurze Trockenphasen." },
      { category: "light", title: "Licht", description: "Helles bis halbschattiges Licht. Direkte Sonne kann die Blätter bleichen." },
      { category: "temperature", title: "Temperatur", description: "12–25 °C. Sehr robust, verträgt auch kühlere Räume. Normale Luftfeuchtigkeit reicht." },
      { category: "substrate", title: "Substrat", description: "Normale Blumenerde. Wächst schnell, daher regelmäßig umtopfen." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Blattspitzen = zu trockene Luft oder Fluor im Leitungswasser. Abgestandenes Wasser verwenden." },
    ],
  },
  {
    commonName: "Philodendron",
    scientificName: "Philodendron hederaceum",
    tips: [
      { category: "water", title: "Gießen", description: "Obere Erdschicht antrocknen lassen, dann gründlich gießen. Keine Staunässe." },
      { category: "light", title: "Licht", description: "Mittleres bis helles indirektes Licht. Verträgt auch weniger Licht, wächst dann langsamer." },
      { category: "temperature", title: "Temperatur", description: "18–28 °C. Liebt hohe Luftfeuchtigkeit. Regelmäßiges Besprühen tut gut." },
      { category: "substrate", title: "Substrat", description: "Lockere, torffreie Erde mit Perlite und Rinde. Gute Drainage wichtig." },
      { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter = Übergießen. Lange Abstände zwischen Blättern = zu wenig Licht." },
    ],
  },
  {
    commonName: "Aloe vera",
    scientificName: "Aloe vera",
    tips: [
      { category: "water", title: "Gießen", description: "Erde komplett austrocknen lassen zwischen dem Gießen. Im Winter fast gar nicht gießen." },
      { category: "light", title: "Licht", description: "Volle Sonne bis helles Licht. Am besten am Südfenster. Im Sommer gerne draußen." },
      { category: "temperature", title: "Temperatur", description: "15–30 °C. Verträgt trockene Luft. Im Winter kühl (10–15 °C) stellen fördert Blüte." },
      { category: "substrate", title: "Substrat", description: "Kakteenerde oder sandige, sehr durchlässige Mischung. Tontopf bevorzugen." },
      { category: "problems", title: "Häufige Probleme", description: "Weiche Blätter = zu viel Wasser, Fäulnis-Gefahr. Braune Spitzen = Sonnenbrand bei plötzlichem Standortwechsel." },
    ],
  },
  {
    commonName: "Calathea",
    scientificName: "Calathea",
    tips: [
      { category: "water", title: "Gießen", description: "Gleichmäßig feucht halten, nie austrocknen lassen. Am besten mit kalkarmem oder abgestandenem Wasser." },
      { category: "light", title: "Licht", description: "Halbschatten ideal. Keine direkte Sonne, die Blätter verbrennen leicht." },
      { category: "temperature", title: "Temperatur", description: "18–24 °C. Braucht hohe Luftfeuchtigkeit (60 %+). Ideal fürs Badezimmer." },
      { category: "substrate", title: "Substrat", description: "Lockere, humose Erde, leicht sauer. Mit Perlite mischen für Drainage." },
      { category: "problems", title: "Häufige Probleme", description: "Eingerollte Blätter = zu trocken. Braune Ränder = Luft zu trocken oder Kalk im Wasser." },
    ],
  },
  {
    commonName: "Zamie",
    scientificName: "Zamioculcas zamiifolia",
    tips: [
      { category: "water", title: "Gießen", description: "Sehr sparsam gießen. Alle 2–4 Wochen reicht. Lieber zu wenig als zu viel." },
      { category: "light", title: "Licht", description: "Extrem anpassungsfähig. Von Schatten bis helles Licht. Perfekt für dunkle Ecken." },
      { category: "temperature", title: "Temperatur", description: "18–26 °C. Verträgt trockene Luft ohne Probleme. Nicht unter 12 °C." },
      { category: "substrate", title: "Substrat", description: "Kakteenerde oder sehr durchlässige Mischung. Seltenes Umtopfen nötig." },
      { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter = definitiv zu viel Wasser. Ansonsten extrem pflegeleicht und robust." },
    ],
  },
  {
    commonName: "Ufopflanze",
    scientificName: "Pilea peperomioides",
    tips: [
      { category: "water", title: "Gießen", description: "Mäßig gießen, obere Schicht antrocknen lassen. Topf nach dem Gießen drehen für gleichmäßiges Wachstum." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Keine direkte Sonne, aber genug Licht für kompaktes Wachstum." },
      { category: "temperature", title: "Temperatur", description: "15–25 °C. Verträgt kein Frieren. Normale Raumluftfeuchtigkeit ist ausreichend." },
      { category: "substrate", title: "Substrat", description: "Lockere Blumenerde mit Perlite. Gute Drainage essentiell." },
      { category: "problems", title: "Häufige Probleme", description: "Eingerollte Blätter = zu viel Sonne. Gelbe untere Blätter = natürlicher Abwurf oder Übergießen." },
    ],
  },
  {
    commonName: "Alocasia",
    scientificName: "Alocasia",
    tips: [
      { category: "water", title: "Gießen", description: "Gleichmäßig feucht halten, nie komplett austrocknen lassen. Im Winter weniger gießen." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Direkte Sonne verbrennt die Blätter." },
      { category: "temperature", title: "Temperatur", description: "18–27 °C. Braucht hohe Luftfeuchtigkeit (60 %+). Regelmäßig besprühen." },
      { category: "substrate", title: "Substrat", description: "Lockere, gut durchlässige Mischung. Orchideenerde oder Erde mit viel Perlite." },
      { category: "problems", title: "Häufige Probleme", description: "Blattfall im Winter = Ruhephase, normal. Gelbe Blätter = zu kalt oder zu nass. Spinnmilben bei trockener Luft." },
    ],
  },
  {
    commonName: "Hoya",
    scientificName: "Hoya carnosa",
    tips: [
      { category: "water", title: "Gießen", description: "Erde zwischen dem Gießen gut antrocknen lassen. Sukkulente Blätter speichern Wasser." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht für beste Blüte. Verträgt auch Halbschatten." },
      { category: "temperature", title: "Temperatur", description: "15–28 °C. Eine kühle Winterphase (12–15 °C) fördert die Blütenbildung." },
      { category: "substrate", title: "Substrat", description: "Sehr durchlässig: Orchideenerde oder Mischung aus Erde, Perlite, Rinde." },
      { category: "problems", title: "Häufige Probleme", description: "Keine Blüte = zu wenig Licht oder nie kühl überwintert. Alte Blütenstiele nicht abschneiden!" },
    ],
  },
  {
    commonName: "Paradiesvogelblume",
    scientificName: "Strelitzia reginae",
    tips: [
      { category: "water", title: "Gießen", description: "Im Sommer regelmäßig und reichlich gießen. Im Winter sparsamer, aber nicht austrocknen lassen." },
      { category: "light", title: "Licht", description: "Volle Sonne ideal. Am besten am Südfenster oder im Sommer draußen." },
      { category: "temperature", title: "Temperatur", description: "10–30 °C. Verträgt trockene Luft. Kühle Überwinterung (10–15 °C) fördert Blüte." },
      { category: "substrate", title: "Substrat", description: "Kräftige, lehmhaltige Erde mit guter Drainage. Großer Topf für kräftige Wurzeln." },
      { category: "problems", title: "Häufige Probleme", description: "Keine Blüte = zu jung (braucht 4–6 Jahre), zu wenig Licht oder nie kalt überwintert." },
    ],
  },
  {
    commonName: "Geldbaum",
    scientificName: "Crassula ovata",
    tips: [
      { category: "water", title: "Gießen", description: "Erde komplett austrocknen lassen. Im Winter nur alle 4–6 Wochen minimal gießen." },
      { category: "light", title: "Licht", description: "Volle Sonne bis helles Licht. Je mehr Sonne, desto kompakter und rötlicher die Blätter." },
      { category: "temperature", title: "Temperatur", description: "10–27 °C. Kühle Überwinterung (5–10 °C) fördert Blüte. Verträgt trockene Luft." },
      { category: "substrate", title: "Substrat", description: "Kakteenerde oder sehr sandige Mischung. Tontopf für bessere Verdunstung." },
      { category: "problems", title: "Häufige Probleme", description: "Weiche/schrumpelige Blätter = zu viel Wasser. Blattfall = zu kalt oder zu dunkel." },
    ],
  },
  {
    commonName: "Dracaena",
    scientificName: "Dracaena",
    tips: [
      { category: "water", title: "Gießen", description: "Mäßig gießen, obere Hälfte der Erde antrocknen lassen. Empfindlich gegen Fluor – abgestandenes Wasser verwenden." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Verträgt Halbschatten. Bunte Sorten brauchen mehr Licht." },
      { category: "temperature", title: "Temperatur", description: "18–27 °C. Nicht unter 12 °C. Normale Raumluftfeuchtigkeit reicht." },
      { category: "substrate", title: "Substrat", description: "Normale Blumenerde mit etwas Sand oder Perlite für Drainage." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Blattspitzen = Fluor im Wasser oder zu trockene Luft. Untere Blätter fallen natürlich ab." },
    ],
  },
  {
    commonName: "Orchidee",
    scientificName: "Phalaenopsis",
    tips: [
      { category: "water", title: "Gießen", description: "Einmal pro Woche tauchen (15 Min.), dann gut abtropfen lassen. Im Winter seltener. Kein Wasser in der Blattrosette." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Ost- oder Westfenster ideal. Keine direkte Mittagssonne." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C. Temperaturdifferenz Tag/Nacht (5 °C) fördert erneute Blüte." },
      { category: "substrate", title: "Substrat", description: "Spezielle Orchideenerde (Rinde/Moos). Durchsichtiger Topf hilft die Wurzeln zu kontrollieren." },
      { category: "problems", title: "Häufige Probleme", description: "Keine neue Blüte = zu wenig Licht oder keine Temperaturdifferenz. Faule Wurzeln = zu viel Wasser." },
    ],
  },
];

const GENERIC_TIPS: CareTip[] = [
  { category: "water", title: "Gießen", description: "Die meisten Zimmerpflanzen mögen es, wenn die obere Erdschicht zwischen dem Gießen leicht antrocknet. Staunässe vermeiden." },
  { category: "light", title: "Licht", description: "Helles indirektes Licht ist für die meisten Zimmerpflanzen ideal. Direkte Mittagssonne kann Blätter verbrennen." },
  { category: "temperature", title: "Temperatur", description: "18–24 °C ist für die meisten Zimmerpflanzen optimal. Zugluft und Heizungsluft vermeiden." },
  { category: "substrate", title: "Substrat", description: "Gute Drainage ist essentiell. Alle 1–2 Jahre umtopfen, im Frühjahr ist der beste Zeitpunkt." },
  { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter deuten oft auf Übergießen hin, braune Spitzen auf zu trockene Luft. Im Zweifel weniger gießen." },
];

// ─── Helper: Convert DB record to PlantCareProfile ───

function dbRecordToProfile(record: {
  scientificName: string;
  commonName: string;
  watering: string;
  light: string;
  temperature: string;
  substrate: string;
  problems: string;
  source: string;
}): PlantCareProfile {
  return {
    commonName: record.commonName,
    scientificName: record.scientificName,
    source: record.source === "perenual" ? "perenual" : "db",
    tips: [
      { category: "water", title: "Gießen", description: record.watering },
      { category: "light", title: "Licht", description: record.light },
      { category: "temperature", title: "Temperatur", description: record.temperature },
      { category: "substrate", title: "Substrat", description: record.substrate },
      { category: "problems", title: "Häufige Probleme", description: record.problems },
    ],
  };
}

// ─── Helper: Fuzzy match against static DB ───

function findInStaticDb(species: string): Omit<PlantCareProfile, "source"> | null {
  const q = species.toLowerCase().trim();
  if (!q) return null;

  for (const profile of STATIC_CARE_DB) {
    const sci = profile.scientificName.toLowerCase();
    const com = profile.commonName.toLowerCase();
    if (sci.includes(q) || q.includes(sci) || com.includes(q) || q.includes(com)) {
      return profile;
    }
  }
  return null;
}

/**
 * Get care tips for a species.
 *
 * Priority:
 * 1. Database (previously cached)
 * 2. Perenual API (fetches + caches in DB)
 * 3. Static fallback DB (18 popular plants)
 * 4. Generic tips
 */
export async function getCareTips(
  species: string | null | undefined
): Promise<PlantCareProfile | null> {
  if (!species) return null;
  const q = species.trim();
  if (!q) return null;

  // 1. Check DB cache (exact match on scientificName)
  try {
    const cached = await db.plantCareData.findFirst({
      where: {
        OR: [
          { scientificName: { contains: q, mode: "insensitive" } },
          { commonName: { contains: q, mode: "insensitive" } },
        ],
      },
    });
    if (cached) return dbRecordToProfile(cached);
  } catch {
    // DB not available — continue with other sources
  }

  // 2. Try Perenual API (only if env key is set)
  if (process.env.PERENUAL_API_KEY) {
    try {
      const apiData = await fetchCareDataFromPerenual(q);
      if (apiData) {
        // Cache in DB for future use
        try {
          const saved = await db.plantCareData.upsert({
            where: { scientificName: apiData.scientificName },
            create: {
              scientificName: apiData.scientificName,
              commonName: apiData.commonName,
              watering: apiData.watering,
              light: apiData.light,
              temperature: apiData.temperature,
              substrate: apiData.substrate,
              problems: apiData.problems,
              source: "perenual",
              perenualId: apiData.perenualId,
            },
            update: {
              commonName: apiData.commonName,
              watering: apiData.watering,
              light: apiData.light,
              temperature: apiData.temperature,
              substrate: apiData.substrate,
              problems: apiData.problems,
              source: "perenual",
              perenualId: apiData.perenualId,
            },
          });
          return dbRecordToProfile(saved);
        } catch {
          // DB write failed — still return the data
          return {
            commonName: apiData.commonName,
            scientificName: apiData.scientificName,
            source: "perenual",
            tips: [
              { category: "water", title: "Gießen", description: apiData.watering },
              { category: "light", title: "Licht", description: apiData.light },
              { category: "temperature", title: "Temperatur", description: apiData.temperature },
              { category: "substrate", title: "Substrat", description: apiData.substrate },
              { category: "problems", title: "Häufige Probleme", description: apiData.problems },
            ],
          };
        }
      }
    } catch {
      // API error — fall through to static
    }
  }

  // 3. Static fallback DB
  const staticMatch = findInStaticDb(q);
  if (staticMatch) {
    // Also cache this in DB for consistent future lookups
    try {
      const waterTip = staticMatch.tips.find((t) => t.category === "water");
      const lightTip = staticMatch.tips.find((t) => t.category === "light");
      const tempTip = staticMatch.tips.find((t) => t.category === "temperature");
      const subTip = staticMatch.tips.find((t) => t.category === "substrate");
      const probTip = staticMatch.tips.find((t) => t.category === "problems");

      await db.plantCareData.upsert({
        where: { scientificName: staticMatch.scientificName },
        create: {
          scientificName: staticMatch.scientificName,
          commonName: staticMatch.commonName,
          watering: waterTip?.description ?? "",
          light: lightTip?.description ?? "",
          temperature: tempTip?.description ?? "",
          substrate: subTip?.description ?? "",
          problems: probTip?.description ?? "",
          source: "static",
        },
        update: {},
      });
    } catch {
      // DB write failed — still return static data
    }

    return { ...staticMatch, source: "static" };
  }

  return null;
}

/** Generic care tips for plants not in any database. */
export function getGenericCareTips(): CareTip[] {
  return GENERIC_TIPS;
}
