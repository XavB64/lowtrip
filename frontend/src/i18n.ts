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
          contact: {
            emailIsRequired: "Email is required",
            sendEmail: "Send your message",
            sendingEmail: "Sending...",
            yourEmail: "Your email",
            yourMessage: "What do you want to tell us?",
          },
          navbar: {
            contact: "Contact",
            language_en: "English",
            language_fr: "French",
            methodology: "Methodology",
            settings: "Settings",
            theme_dark: "Dark",
            theme_light: "Light",
            about: "About",
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
            clearInput: "Clear",
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
          chart: {
            transportMeans: {
              plane: "Plane",
              car: "Car",
              ecar: "eCar",
              bus: "Bus",
              train: "Train",
              ferry: "Ferry",
              bicycle: "Bicycle",
              myTrip: "My trip",
              otherTrip: "Other trip",
            },
            paths: {
              railway: "Railway",
              road: "Road",
              bike: "Bike route",
              flight: "Flight path",
              ferry: "Ferry",
            },
            category: {
              infra: "Infrastructure",
              construction: "Production",
              fuel: "Fuel",
              kerosene: "Kerosene",
              contrails: "Contrails & NOx",
              bikeBuild: "Bike production",
            },
          },
          method: {
            introduction: {
              title: "Introduction",
              text1:
                "The work presented here is independent, not-for-profit and open source.",
              text2:
                "The aim of this web app is to present precise carbon inventories per passenger for each mode of transport and each journey. These results enable users to make informed choices in the context of reducing their greenhouse gas emissions to mitigate climate change. To put these results into context, total yearly per-capita net emissions should not exceed 2 tons CO2eq in 2050 to limit global warming below 2°C (IPCC).",
            },
            howEmissionsAreComputed: {
              title: "How the emissions are calculated?",
              text1:
                "To calculate CO2 equivalent emissions per person, we multiply the distance of a journey (km) by the corresponding emission factor (mass of CO2 equivalent per person per km) of a mean of transport. For a mutlistep journey, these emissions are summed over the different steps.",
            },
            distanceEstimation: {
              title: "Estimation of distances",
              table: {
                title_1: "Mean of Transport",
                title_2: "Distance source",
                transport_1: "Train",
                transport_2: "Car - Bus - eCar",
                transport_3: "Bike route",
                transport_4: "Plane",
                transport_5: "Ferry",
                data_openstreetmap: "OpenStreetMap network",
                data_geodesic: "Geodesic distance",
                data_approximation: "Aproximation of shortest path",
              },
            },
            emissionFactors: {
              title: "What do emission factors depend on?",
              table1: {
                title_1: "Mean of Transport",
                title_2: "Variable",
                title_3: "Why?",
                transport_1: "Train",
                transport_2: "Bus - Bike",
                transport_3: "Voiture",
                transport_4: "eCar",
                transport_5: "Plane",
                transport_6: "Ferry",
                variables_1: "Visited country",
                variables_2: "-",
                variables_3: "Number of passengers",
                variables_4: "Number of passengers & Visited countries",
                variables_5: "Travel distance",
                variables_6: "(not yet) user parameters",
              },
              table2: {
                title_1: "Mean of Transport",
                title_2: "Usage",
                title_3: "Vehicle production",
                title_4: "Infrastructure construction",
                transport_1: "Train",
                transport_2: "Bus - Car - eCar",
                transport_3: "Bicycle",
                transport_4: "Plane",
                transport_5: "Ferry",
                data_not_found: "No found",
              },
              text1:
                "Emissions factors consider usage (linked to the manufacture and use of energy to move the vehicle) as well as infrastructure and vehicle construction where these are significant. The table below summarizes the types of emissions taken into account by lowtrip. Empty cells mean that the related emissions did not contribute significantly to the result and are therefore excluded to facilitate understanding and readability for the user.",
              text2:
                "All the assumptions, data and sources used are available in the",
              text3: "methodology",
              text4: " document.",
            },
          },
        },
      },
      fr: {
        translation: {
          method: {
            introduction: {
              title: "Introduction",
              text1: "Ce travail est indépendant, gratuit et open-source.",
              text2:
                "L'objectif de cette application est de fournir des bilans carbone par passager précis pour chaque mode de transport et trajet. \n Ces résultats permmettent à l'utilisateur de faire des choix informés dans le contexte de réduction de leur empreinte carbone pour freiner les effets du réchauffement climatique. \n Pour mettre ces valeurs en contexte, l'empreinte nette annuelle et personnelle ne doit pas dépasser les 2t CO2eq en 2050 afin de rester sous 2°C de réchauffement (GIEC).",
            },
            howEmissionsAreComputed: {
              title: "Comment les émissions sont-elles calculées ?",
              text1:
                "Pour calculer les émissions de CO2eq par personne, nous multiplions la distance d'un voyage (km) par le facteur d'émission correspondant (masse de CO2 équivalent par personne par km) au moyen de transport. \n Pour un voyage à plusieurs étapes, ces émissions sont sommées sur les différentes étapes.",
            },
            distanceEstimation: {
              title: "Estimation des distances",
              table: {
                title_1: "Moyen de Transport",
                title_2: "Source de la Distance",
                row_1: "Train",
                row_2: "Voiture - Bus - VE",
                row_3: "Voie cyclable",
                row_4: "Avion",
                row_5: "Ferry",
                data_openstreetmap: "Réseau OpenStreetMap",
                data_geodesic: "Distance géodésique",
                data_approximation: "Aproximation du plus court chemin",
              },
            },
            emissionFactors: {
              title: "De quoi dépendent les facteurs d'émissions ?",
              table1: {
                title_1: "Moyen de Transport",
                title_2: "Variable",
                title_3: "Pourquoi ?",
                row_1: "Train",
                row_2: "Bus - Vélo",
                row_3: "Voiture",
                row_4: "EV",
                row_5: "Avion",
                row_6: "Ferry",
                variables_1: "Pays traversés",
                variables_2: "-",
                variables_3: "Nombre de passagers",
                variables_4: "Nombre de passagers & Pays traversés",
                variables_5: "Distance du trajet",
                variables_6: "(en cours) Paramètres utilisateur",
              },
              table2: {
                title_1: "Moyen de Transport",
                title_2: "Usage",
                title_3: "Production du véhicule",
                title_4: "Construction des infrastructures",
                transport_1: "Train",
                transport_2: "Bus - Voiture - VE",
                transport_3: "Vélo",
                transport_4: "Avion",
                transport_5: "Ferry",
                data_not_found: "Non trouvé",
              },
              text1:
                "Les facteurs d'émissions considèrent l'utilisation (en lien avec la production et l'utilisation de l'énergie pour faire avancer le véhicule) ainsi que les infrastructures et la construction du véhicule lorques ces dernières sont significatives. \n La table ci dessous résume les types d'émissions prises en compte dans lowtrip. Les cellules vides signifient que le facteur d'émission correspondant ne contribue pas significativement au résultat, et se retrouve exclu du rendu final afin de faciliter la compréhension et la lecture.",
              text2:
                "Toutes les hypothèses, données et sources sont disponibles dans le document de",
              text3: "méthodologie",
              text4: ".",
            },
          },
          contact: {
            emailIsRequired: "Email obligatoire",
            sendEmail: "Envoie ton message",
            sendingEmail: "Envoi en cours...",
            yourEmail: "Ton email",
            yourMessage: "Qu'as-tu à nous dire ?",
          },
          navbar: {
            contact: "Contact",
            language_en: "Anglais",
            language_fr: "Français",
            methodology: "Méthodologie",
            settings: "Paramètres",
            theme_dark: "Sombre",
            theme_light: "Clair",
            about: "À propos",
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
            clearInput: "Effacer",
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
          chart: {
            transportMeans: {
              plane: "Avion",
              car: "Voiture",
              ecar: "VE",
              bus: "Bus",
              train: "Train",
              ferry: "Ferry",
              bicycle: "Vélo",
              myTrip: "Mon voyage",
              otherTrip: "Autre voyage",
            },
            paths: {
              railway: "Voie ferrée",
              road: "Route",
              bike: "Piste cyclable",
              flight: "Voie aérienne",
              ferry: "Bateau",
            },
            category: {
              infra: "Infrastructure",
              construction: "Fabrication",
              fuel: "Carburant",
              kerosene: "Kérosène",
              contrails: "Trainées & NOx",
              bikeBuild: "Construction du vélo",
            },
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
