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
  {
    commonName: "Baumstrelitzie",
    scientificName: "Strelitzia nicolai",
    tips: [
      { category: "water", title: "Gießen", description: "Im Sommer reichlich gießen, Erde gleichmäßig feucht halten. Im Winter sparsamer, aber nie komplett austrocknen lassen. Staunässe vermeiden." },
      { category: "light", title: "Licht", description: "Sehr hell bis vollsonnig. Am besten direkt am Süd- oder Westfenster. Verträgt auch volle Sonne. Bei zu wenig Licht kein Wachstum." },
      { category: "temperature", title: "Temperatur", description: "18–30 °C. Verträgt kurzzeitig bis 5 °C. Im Sommer gerne draußen. Kühle Überwinterung (10–15 °C) möglich aber nicht nötig." },
      { category: "substrate", title: "Substrat", description: "Kräftige, nährstoffreiche Erde mit guter Drainage. Mischung aus Kompost, Lehm und Perlite ideal. Großer, stabiler Topf nötig." },
      { category: "problems", title: "Häufige Probleme", description: "Einrollende Blätter = zu wenig Wasser oder zu trockene Luft. Braune Blattränder = Luft zu trocken. Wächst schnell und braucht viel Platz." },
    ],
  },
  {
    commonName: "Birkenfeige",
    scientificName: "Ficus benjamina",
    tips: [
      { category: "water", title: "Gießen", description: "Gleichmäßig feucht halten, obere Schicht antrocknen lassen. Empfindlich gegen Ballentrockenheit und Staunässe gleichermaßen." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Buntblättrige Sorten brauchen mehr Licht. Standortwechsel vermeiden – reagiert mit Blattfall." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C ganzjährig. Keine Zugluft, keine kalten Füße (nicht direkt auf Fliesen). Luftfeuchtigkeit über 50 % ideal." },
      { category: "substrate", title: "Substrat", description: "Hochwertige Zimmerpflanzenerde, leicht sauer. Gute Drainage mit Blähton am Topfboden." },
      { category: "problems", title: "Häufige Probleme", description: "Blattfall = Standortwechsel, Zugluft oder Gießfehler. Schildläuse und Spinnmilben bei trockener Heizungsluft." },
    ],
  },
  {
    commonName: "Dieffenbachie",
    scientificName: "Dieffenbachia",
    tips: [
      { category: "water", title: "Gießen", description: "Regelmäßig gießen, Erde leicht feucht halten. Im Winter weniger. Kalkfreies, zimmerwarmes Wasser bevorzugen." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht bis Halbschatten. Keine direkte Sonne – Blätter verbrennen leicht." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C. Nicht unter 15 °C. Mag hohe Luftfeuchtigkeit, regelmäßig besprühen." },
      { category: "substrate", title: "Substrat", description: "Lockere, humose Erde mit guter Drainage. Alle 2 Jahre umtopfen." },
      { category: "problems", title: "Häufige Probleme", description: "Gelbe Blätter = Übergießen oder Kälte. Achtung: Pflanzensaft ist giftig – Handschuhe beim Umtopfen tragen." },
    ],
  },
  {
    commonName: "Gebetspflanze",
    scientificName: "Maranta leuconeura",
    tips: [
      { category: "water", title: "Gießen", description: "Gleichmäßig feucht halten, nie austrocknen. Kalkfreies Wasser verwenden (Regenwasser ideal). Im Winter etwas weniger." },
      { category: "light", title: "Licht", description: "Halbschatten bis helles indirektes Licht. Keine direkte Sonne – Blätter bleichen aus." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C. Braucht hohe Luftfeuchtigkeit (60 %+). Ideal fürs Badezimmer oder mit Luftbefeuchter." },
      { category: "substrate", title: "Substrat", description: "Lockere, humose Erde, leicht sauer. Torffreie Mischung mit Perlite und Kokosfaser." },
      { category: "problems", title: "Häufige Probleme", description: "Eingerollte/braune Blätter = Luft zu trocken. Blasse Blätter = zu viel Licht. Spinnmilben bei trockener Luft." },
    ],
  },
  {
    commonName: "Dreimasterblume",
    scientificName: "Tradescantia",
    tips: [
      { category: "water", title: "Gießen", description: "Regelmäßig gießen, Erde leicht feucht halten. Verträgt kurze Trockenphasen, aber nicht dauerhaft." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht für intensive Blattfarbe. Bei zu wenig Licht vergrünen bunte Sorten." },
      { category: "temperature", title: "Temperatur", description: "15–25 °C. Verträgt normale Raumluftfeuchtigkeit. Im Winter etwas kühler stellen." },
      { category: "substrate", title: "Substrat", description: "Normale Blumenerde. Sehr schnellwüchsig, regelmäßig zurückschneiden für buschigen Wuchs." },
      { category: "problems", title: "Häufige Probleme", description: "Kahle Triebe = zu wenig Licht, regelmäßig zurückschneiden. Stecklinge bewurzeln sehr leicht in Wasser." },
    ],
  },
  {
    commonName: "Yucca-Palme",
    scientificName: "Yucca elephantipes",
    tips: [
      { category: "water", title: "Gießen", description: "Sparsam gießen, Erde zwischen Wassergaben gut antrocknen lassen. Im Winter nur alle 2–3 Wochen. Verträgt Trockenheit besser als Nässe." },
      { category: "light", title: "Licht", description: "Volle Sonne bis helles Licht. Am besten am Südfenster. Im Sommer gerne auf Balkon oder Terrasse." },
      { category: "temperature", title: "Temperatur", description: "10–30 °C. Sehr robust, verträgt auch kühle Räume im Winter. Keine Probleme mit trockener Heizungsluft." },
      { category: "substrate", title: "Substrat", description: "Durchlässige Erde, Kakteenerde oder Mischung mit viel Sand. Schwerer Topf wegen Kopflastigkeit." },
      { category: "problems", title: "Häufige Probleme", description: "Weiche Stämme = Fäulnis durch Übergießen. Braune untere Blätter = natürlicher Abwurf. Sehr pflegeleicht." },
    ],
  },
  {
    commonName: "Glückskastanie",
    scientificName: "Pachira aquatica",
    tips: [
      { category: "water", title: "Gießen", description: "Mäßig gießen, obere Erdschicht antrocknen lassen. Stamm speichert Wasser. Staunässe führt schnell zu Stammfäule." },
      { category: "light", title: "Licht", description: "Helles indirektes Licht. Verträgt auch Halbschatten. Keine direkte Mittagssonne." },
      { category: "temperature", title: "Temperatur", description: "18–25 °C. Nicht unter 12 °C. Normale Raumluftfeuchtigkeit ist ausreichend." },
      { category: "substrate", title: "Substrat", description: "Lockere, durchlässige Erde. Drainage-Schicht am Topfboden wichtig. Alle 2–3 Jahre umtopfen." },
      { category: "problems", title: "Häufige Probleme", description: "Blattfall = Standortwechsel oder Übergießen. Weicher Stamm = Fäulnis, sofort Gießen reduzieren." },
    ],
  },
  {
    commonName: "Bananenpflanze",
    scientificName: "Musa",
    tips: [
      { category: "water", title: "Gießen", description: "Im Sommer reichlich gießen, Erde stets feucht halten. Im Winter deutlich weniger. Große Blätter verdunsten viel Wasser." },
      { category: "light", title: "Licht", description: "Volle Sonne bis sehr helles Licht. Je mehr Licht, desto besser. Am besten am Südfenster." },
      { category: "temperature", title: "Temperatur", description: "20–30 °C optimal. Nicht unter 15 °C. Hohe Luftfeuchtigkeit wichtig, regelmäßig besprühen." },
      { category: "substrate", title: "Substrat", description: "Nährstoffreiche, humose Erde mit guter Drainage. Regelmäßig düngen in der Wachstumsphase. Großer Topf nötig." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Blattränder = Luft zu trocken. Einreißende Blätter = normal bei Wind/Berührung. Sehr schnellwüchsig, braucht viel Platz." },
    ],
  },
  {
    commonName: "Kentiapalme",
    scientificName: "Howea forsteriana",
    tips: [
      { category: "water", title: "Gießen", description: "Mäßig gießen, obere Erdschicht antrocknen lassen. Im Winter sparsamer. Empfindlich gegen Staunässe." },
      { category: "light", title: "Licht", description: "Halbschatten bis helles indirektes Licht. Eine der wenigen Palmen, die mit wenig Licht zurechtkommt." },
      { category: "temperature", title: "Temperatur", description: "15–25 °C. Verträgt kühlere Räume bis 10 °C. Keine direkte Heizungsluft." },
      { category: "substrate", title: "Substrat", description: "Palmenerde oder Mischung aus Blumenerde und Sand. Umtopfen nur wenn nötig, mag es nicht gestört zu werden." },
      { category: "problems", title: "Häufige Probleme", description: "Braune Blattspitzen = zu trockene Luft oder zu viel Dünger. Wächst langsam, Geduld nötig. Spinnmilben bei trockener Luft." },
    ],
  },
  {
    commonName: "Sukkulente",
    scientificName: "Echeveria",
    tips: [
      { category: "water", title: "Gießen", description: "Erde komplett austrocknen lassen, dann gründlich gießen. Im Winter fast gar nicht. Kein Wasser auf die Rosette." },
      { category: "light", title: "Licht", description: "Volle Sonne. Braucht so viel Licht wie möglich. Ohne genug Licht werden sie lang und verlieren die Form." },
      { category: "temperature", title: "Temperatur", description: "10–30 °C. Kühle Überwinterung (5–10 °C) fördert Blüte. Verträgt trockene Luft problemlos." },
      { category: "substrate", title: "Substrat", description: "Kakteenerde oder mineralisches Substrat (Bims, Lavagranulat). Drainage essentiell. Tontopf ideal." },
      { category: "problems", title: "Häufige Probleme", description: "Gestreckter Wuchs (Etiolement) = zu wenig Licht. Matschige Blätter = Fäulnis durch zu viel Wasser." },
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

// ─── German common name aliases → scientificName in STATIC_CARE_DB ───

const GERMAN_ALIASES: Record<string, string> = {
  "efeutute": "Epipremnum aureum",
  "fensterblatt": "Monstera deliciosa",
  "baumstrelitzie": "Strelitzia nicolai",
  "schwiegermutterzunge": "Sansevieria trifasciata",
  "schwertfarn": "Chlorophytum comosum",
  "herzblattphilodendron": "Philodendron hederaceum",
  "wachsblume": "Hoya carnosa",
  "glücksfeder": "Zamioculcas zamiifolia",
  "chinesischer geldbaum": "Pilea peperomioides",
  "pfeilblatt": "Alocasia",
  "korbmarante": "Calathea",
  "drachenbaum": "Dracaena",
  "nachtfalterorchidee": "Phalaenopsis",
  "dickblatt": "Crassula ovata",
  "benjamin": "Ficus benjamina",
  "bananenbaum": "Musa",
  "bananenstaude": "Musa",
  "gebetspflanze": "Maranta leuconeura",
  "palmlilie": "Yucca elephantipes",
};

// ─── Helper: Fuzzy match against static DB ───

function findInStaticDb(species: string): Omit<PlantCareProfile, "source"> | null {
  const q = species.toLowerCase().trim();
  if (!q) return null;

  // 1. Direct substring match on scientific/common name
  for (const profile of STATIC_CARE_DB) {
    const sci = profile.scientificName.toLowerCase();
    const com = profile.commonName.toLowerCase();
    if (sci.includes(q) || q.includes(sci) || com.includes(q) || q.includes(com)) {
      return profile;
    }
  }

  // 2. German alias lookup
  const aliasTarget = GERMAN_ALIASES[q];
  if (aliasTarget) {
    for (const profile of STATIC_CARE_DB) {
      if (profile.scientificName.toLowerCase() === aliasTarget.toLowerCase()) {
        return profile;
      }
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
  } catch (err) {
    console.warn("[care-tips] DB cache lookup failed:", err instanceof Error ? err.message : err);
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
        } catch (err) {
          console.warn("[care-tips] DB cache write failed:", err instanceof Error ? err.message : err);
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
    } catch (err) {
      console.warn("[care-tips] Perenual API error:", err instanceof Error ? err.message : err);
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
    } catch (err) {
      console.warn("[care-tips] DB write for static cache failed:", err instanceof Error ? err.message : err);
    }

    return { ...staticMatch, source: "static" };
  }

  return null;
}

/** Generic care tips for plants not in any database. */
export function getGenericCareTips(): CareTip[] {
  return GENERIC_TIPS;
}
