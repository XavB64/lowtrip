import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    // the translations
    // (tip move them in a JSON file and import them,
    // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
    resources: {
      en: {
        translation: {
          navbar: {
            language_en: "English",
            language_fr: "French",
            methodology: "Methodology",
            settings: "Settings",
          },
          home: {
            compareTravelEmissions: "Compare your travel emissions",
            toolDescription:
              "Select departure, destination and means of transport to compare the emissions of your journeys! You can either compare several modes of transport on a specific route, or compare multi-modal routes with steps.",
          },
          form: {
            addStep: "Add step",
            tabMyTrip: "My trip",
            tabOtherTrip: "Other trip",
            compareWithThisTrip: "Compare with this trip",
            compareWith: "Compare with...",
            otherTransportMeans: "Other transport means",
            computeEmissions: "Compute emissions",
            anotherTrip: "Another trip",
            compareToAnotherTrip: "Compare to another trip",
            placeholderFrom: "From...",
            placeholderTo: "To...",
            by: "By",
            transportMeans: {
              Train: "Train",
              Plane: "Plane",
              Bus: "Bus",
              Car: "Car",
              eCar: "Electric car",
              Ferry: "Ferry",
              Bicycle: "Bicycle",
            },
            passengersNb_one: "{{count}} passenger",
            passengersNb_other: "{{count}} passengers",
            hitchHiking: "Hitch-hiking",
          },
          results: {
            vsOtherTrip: "Your trip VS Other trip",
            vsOtherMeans: "Your trip VS other means of transport",
            yourTripEmissions: "Your trip emissions",
            explanation:
              "Plane: the formation of Contrails combined with emissions of nitrogen oxides (NOx) affect the properties of the atmosphere and lead to an increase in radiative forcing. The represented connection might not be currently operated by a flight company. This mode is not displayed by default when the journey length is below 300km.",
          },
        },
      },
      fr: {
        translation: {
          navbar: {
            language_en: "Anglais",
            language_fr: "Français",
            methodology: "Méthodologie",
            settings: "Paramètres",
          },
          home: {
            compareTravelEmissions: "Compare les émissions de ton voyage",
            toolDescription:
              "Choisis un point de départ, un point d'arrivée et un moyen de transport pour comparer les émissions CO2 de ton voyage ! Tu peux soit comparer les émissions d'un même trajet mais avec différents moyens de transport, ou comparer des voyages mutlimodaux à étapes.",
          },
          form: {
            addStep: "Ajouter une étape",
            tabMyTrip: "Mon voyage",
            tabOtherTrip: "Autre voyage",
            compareWithThisTrip: "Comparer avec ce voyage",
            compareWith: "Comparer avec...",
            otherTransportMeans: "D'autres moyens de transport",
            computeEmissions: "Calculer les émissions",
            anotherTrip: "Un autre voyage",
            compareToAnotherTrip: "Comparer à un autre voyage",
            placeholderFrom: "De...",
            placeholderTo: "À...",
            by: "En",
            transportMeans: {
              Train: "Train",
              Plane: "Avion",
              Bus: "Bus",
              Car: "Voiture",
              eCar: "Voiture électrique",
              Ferry: "Ferry",
              Bicycle: "Vélo",
            },
            passengersNb_one: "{{count}} passager",
            passengersNb_other: "{{count}} passagers",
            hitchHiking: "Auto-stop",
          },
          results: {
            vsOtherTrip: "Ton voyage VS ton autre voyage",
            vsOtherMeans: "Ton voyage VS les autres moyens de transport",
            yourTripEmissions: "Les émissions de ton voyage",
            explanation:
              "Avion : la formation de traînées de condensation combinée aux émissions d'oxydes d'azote (NOx) affecte les propriétés de l'atmosphère et entraîne une augmentation du forçage radiatif. Le trajet représenté reste théorique et pourrait ne pas être exploité par une compagnie aérienne. Ce mode n'est pas affiché par défaut lorsque la distance du voyage est inférieure à 300 km.",
          },
        },
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });

export default i18n;
