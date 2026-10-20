<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles: none.
- Modified sections: Entwicklungsprozess und Qualitätssicherung; Governance.
- Added sections: none.
- Removed sections: none.
- Follow-up TODOs: TODO(RATIFICATION_DATE) requires the original adoption date.
-->

# ReStyle Constitution

## Core Principles

### I. MVP zuerst und klarer Produktumfang
ReStyle MUST im MVP ausschließlich die digitale Garderobe, manuelle
Merkmalerfassung, Filter, den 3-Layer-Swiper zur Outfit-Kombination und das
Speichern von Outfits liefern. KI-Erkennung, Empfehlungen, Wetter, Anlass,
Nachhaltigkeit, Social- und Shopping-Funktionen dürfen erst nach dem MVP und
nur auf Grundlage einer eigenen User Story umgesetzt werden. Jede User Story
MUST prüfbare Akzeptanzkriterien enthalten. Diese Begrenzung schützt den
Liefertermin und verhindert, dass optionale Funktionen die Kernnutzung
verzögern.

### II. Typisierte Architektur und sichere Datenhoheit
Das Frontend MUST Ionic und Angular verwenden; das Backend MUST Supabase mit
Postgres, Auth und Storage verwenden. Der Datenzugriff MUST ausschließlich
über typisierte Angular-Services erfolgen. Änderungen am Datenbankschema
MÜSSEN über versionierte Migrationen eingebracht werden. Jede
nutzerbezogene Tabelle und jeder nutzerbezogene Zugriff MUST durch Row Level
Security auf den jeweiligen User begrenzt sein. Diese Regeln halten
Schnittstellen nachvollziehbar und schützen private Kleidungs- und Outfitdaten.

### III. Strikte, wartbare Codequalität
TypeScript MUST im Strict-Modus laufen. Neue UI-Funktionalität MUST in kleinen
Standalone-Komponenten umgesetzt werden. ESLint und Prettier sind
verpflichtende Qualitätsprüfungen und dürfen nicht umgangen werden. Die
Regeln reduzieren Fehler, halten Komponenten testbar und sichern ein
einheitliches Codebild.

### IV. Nachweisbare Tests und Akzeptanz
Services und Datenlogik MÜSSEN durch Unit-Tests abgedeckt sein. Jede
User Story MUST prüfbare Akzeptanzkriterien besitzen, und die CI MUSS vor
jedem Merge erfolgreich durchlaufen. Änderungen dürfen nicht als fertig
gelten, wenn ihre relevanten Tests oder Qualitätsprüfungen fehlschlagen.
Dadurch bleiben fachliche Anforderungen und technische Integrität
nachvollziehbar.

### V. Mobile-first und veröffentlichbare Plattform
Die Benutzeroberfläche MUST mobile-first gestaltet werden und für zentrale
Interaktionen Ionic-Komponenten statt eigener UI-Ersatzkomponenten verwenden.
Die Anwendung MUST über Capacitor auf iOS und Android lauffähig sein. Das
Projektziel ist die Veröffentlichung in mindestens einem App Store bis zum
2027-01-19. Diese Vorgaben richten technische Entscheidungen auf reale mobile
Nutzung und das verbindliche Veröffentlichungsziel aus.

### VI. Deutschsprachige Spec-Kit-Dokumentation
Alle Spec-Kit-Dokumente MÜSSEN auf Deutsch verfasst werden. Dazu gehören
insbesondere Spezifikationen, Pläne, Aufgabenlisten und weitere durch
Spec-Kit erzeugte Projektartefakte. Eine einheitliche Dokumentationssprache
verbessert die gemeinsame Prüfung von Anforderungen und Entscheidungen.

## Produktumfang und Priorisierung

Der MVP-Funktionsumfang ist verbindlich und hat Vorrang vor jeder Erweiterung.
Neue Funktionen außerhalb des MVP benötigen eine eigene User Story,
akzeptierte Kriterien und eine bewusste Priorisierung nach dem MVP. Die
Priorisierung darf keine Pflichtfunktion des MVP verdrängen, solange deren
Akzeptanzkriterien nicht erfüllt und durch CI verifiziert sind.

## Architektur und Datenschutz

Die Systemgrenzen zwischen Ionic/Angular und Supabase sind über typisierte
Services zu dokumentieren und einzuhalten. Datenbankänderungen ohne
versionierte Migration sind unzulässig. Row Level Security MUSS für jeden
Zugriff geprüft werden, der Daten einem User oder dessen privaten Inhalten
zuordnet. Authentifizierung, Speicherung und Datenzugriff dürfen keine
Umgehung dieser Regeln einführen.

## Entwicklungsprozess und Qualitätssicherung

Arbeit MUSS auf Feature-Branches stattfinden. Jeder Branch MUSS genau einem
Arbeitsbereich zugeordnet sein: `frontend` oder `backend`. Agents dürfen auf
einem Frontend-Branch ausschließlich Frontend-Arbeiten und auf einem
Backend-Branch ausschließlich Backend-Arbeiten durchführen. Ein Branch darf
keine Änderungen aus beiden Bereichen vermischen; bereichsübergreifende
Arbeit MUSS in getrennten Branches und Pull Requests erfolgen. Diese Trennung
reduziert Konflikte, macht Verantwortlichkeiten nachvollziehbar und hält die
Architekturgrenzen zwischen Frontend und Backend durchsetzbar.

Änderungen an `main` MÜSSEN über einen Pull Request mit mindestens einem
Review und erfolgreich durchlaufener CI integriert werden. Reviews MÜSSEN
mindestens Umfang, Akzeptanzkriterien, Tests, Typisierung,
Linting/Formatierung und betroffene Migrationen beziehungsweise RLS-Regeln
prüfen. Der Releaseprozess MUSS die iOS-/Android-Lauffähigkeit und die für
die App-Store-Veröffentlichung erforderlichen Nachweise berücksichtigen.

## Governance

Diese Constitution ist die maßgebliche Governance für das Projekt. Bei
Konflikten haben ihre Regeln Vorrang vor lokalen Konventionen und
unbegründeten Abkürzungen. Änderungen werden in einem Pull Request
dokumentiert, reviewed und mit einem Sync Impact Report versehen. Der
Pull-Request-Beschreibung MUSS die betroffenen Prinzipien, Auswirkungen auf
Tests und gegebenenfalls notwendige Migrationen benennen.

Die Versionsnummer folgt Semantic Versioning: MAJOR für rückwärtsinkompatible
Entfernungen oder Neudefinitionen von Governance-Regeln, MINOR für neue oder
wesentlich erweiterte Prinzipien und PATCH für Klarstellungen ohne
semantische Änderung. Jede Änderung aktualisiert das Änderungsdatum. Die
Verfassung wird bei jedem relevanten Pull Request auf Einhaltung geprüft;
CI und Review sind verbindliche Qualitätstore vor dem Merge.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): ursprüngliches
Annahmedatum ermitteln | **Last Amended**: 2026-10-20
