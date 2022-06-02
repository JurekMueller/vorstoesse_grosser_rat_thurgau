# Zusammenarbeit der Grossrät:innen im Kanton Thurgau

Die Visualisierung zeigt die Aktivitäten und Zusammenarbeit von Mitgliedern des Grossen Rats von Thurgau (Kantonsparlament) im Rahmen von parlamentarischen Vorstössen. Diese werden als Netzwerkansicht dargestellt, mit den Grossrät:innen als Knoten und den gemeinsam eingereichten Vorstössen als Verbindungen. Die dargestellten Daten decken den Zeitraum von 2012 bis 2021 ab.

Die Grösse der Knoten entspricht der Anzahl der persönlich eingereichten Vorstösse. Die Farbe der Knoten signalisiert eine von drei wählbaren persönlichen Eigenschaften (Partei, Geschlecht, Dienstjahre seit 2012). Grossrät:innen ohne eingereichten Vorstoss werden im äussersten Ring dargestellt.

Die Breite der Verbindung zwischen zwei Grossrät:innen zeigt an, wie viele Vorstösse gemeinsam eingereicht wurden. Um eine bessere Übersicht zu gewährleisten, kann frei gewählt werden ab wie vielen gemeinsamen Vorstössen eine Verbindung angezeigt werden soll (standardmässig ab 3).

Die für die Visualisierung berücksichtigten Vorstösse können nach Art und Thema gefiltert werden. Um einen Einstieg in die Mehrdimensionalität der dargestellten Informationen zu ermöglichen, sind weiter unten einige mögliche Fragestellungen und Beobachtungen beschrieben, die durch Links auf der Visualisierung sichtbar gemacht werden können. 

## Erläuterung Daten

### Dateninhalt

Die hier verwendeten Daten bestehen aus zwei Teilen. Der erste Datensatz beinhaltet Informationen über die Grossrät:innen des Kantons Thurgau aus dem Zeitraum 2008-2021. Dieser Datensatz ist das Ergebnis einer Zusammenführung von jährlichen Mitgliederlisten, weshalb es für jede:n Grosrät:in einen separaten Eintrag pro Dienstjahr gibt.
Der zweite Datensatz enthält Informationen über die im Grossen Rat eingereichten Vorstösse aus dem Zeitraum 2012-2021. Teil der enthaltenen Informationen sind die Namen der Vorstösser:innen, die zur Verknüpfung der beiden Datensätze genutzt wurden.
Vorsicht: Generell gibt es für Vorstösse einen Kreis von Unterstützer:innen der deutlich über den der Vorstösser:innen hinausgeht und die ihre Unterstützung durch Mitunterzeichnung Ausdruck geben. Informationen über Mitunterzeichner:innen sind nicht im Datensatz enthalten und wurden bei der Erstellung der Netzwerkvisualisierung nicht mitberücksichtigt. 

### Datenquelle

Die Originaldaten zu den Grossrät:innen und den Vorstössen wurden von Daniela Koller aus der OGD-Koordinationsstelle des Kantons Thurgau zur Verfügung gestellt. Der Datensatz zu den Vorstössen ist auch auf der OGD-Plattform des Kantons Thurgau verfügbar, allerdings ohne die Themenzuordnung. Zusätzliche detaillierte Informationen zu den einzelnen Vorstössen lassen sich über die elektronische Geschäftsdatenbank des Kantons Thurgau abfragen. 

### Datenbereinigung

Die originalen Daten wurden nach eigenem Ermessen aufgeräumt und gereinigt, um ein eindeutiges Matching zwischen den Namen in der Mitgliederliste und in der Liste der Vorstösse zu ermöglichen. Insbesondere wurden folgende Änderungen vorgenommen:

- Parteiname glp einheitliche kleingeschrieben
- Entfernung aller Zeilenumbrüche, Anführungszeichen und führende/folgende Leerzeichen
- Ersetzen von Spitznamen durch Vornamen
- Bei Doppelnamen: Einheitliche Schreibweise mit beiden Namen
- Entfernung/Änderung von fehlerhaften oder doppelten Einträgen in der Mitgliederliste (bspw. bei falscher Partei)

Die so bereinigten Datensätze für die Grossrät:innen und die Vorstösse können über die diese Repository bezogen werden.

### Datenbereinigung

Nach der Datenbereinigung wurden die für die Netzwerkvisualisierung relevanten Daten aus dem Zeitraum 2012-2021 in ein Netzwerk JSON-Format (bestehend aus Knoten und Verbindungen) umstrukturiert.
Bei Grossrät:innen, die innerhalb dieser Periode die Partei gewechselt haben, wurde die aktuellste Parteizugehörigkeit übernommen.
Die Anzahl der Dienstjahre eine:r Grosrät:in seit 2012 wurde über die Anzahl der jährlichen Einträge in der Mitgliederliste bestimmt. 

## Erläuterung Code

Die interaktive Visualisierung wurde hauptsächlich mit der Javaskript Bibliothek D3.js gebaut. Darüber hinaus wurde D3-legend.js verwendet, um die Legenden zu erstellen, jQuery für einzelne Komfortfunktionen und Bootstrap beim Design der Webseite.
Die initiale Codebasis für die Visualisierung wurde von einem Minimalbeispiel für ein gefiltertes Netzwerk übernommen.
