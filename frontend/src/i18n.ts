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
            sendEmail: "Send message",
            sendingEmail: "Sending...",
            yourEmail: "Your email",
            yourMessage: "What would you like to say?",
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
            tipee: "Support us !",
          },
          home: {
            compareTravelEmissions: "Compare your travel emissions",
          },
          form: {
            addStep: "Add stop",
            adviceText: {
              compareWith: "Compare with...",
              previousFormIsInvalid: "Please fill the previous form first",
              main: "Please select {{missingParams}} and compare with...",
              mainSecondForm: "Please select {{missingParams}} and...",
              departure: "a departure",
              destination: "a destination",
              transportMean: "a means of transportation",
              and: "and",
              missingTransportMean: "the missing means of transportation",
              missingTransportMeans: "the missing means of transportation",
              missingLocation: "the missing location",
              missingLocationAndTransportMean:
                "the missing location and means of transportation",
              missingLocationAndTransportMeans:
                "the missing location and means of transportation",
              missingLocations: "the missing locations",
              missingLocationsAndTransportMean:
                "the missing locations and means of transportation",
              missingLocationsAndTransportMeans:
                "the missing locations and means of transportation",
            },
            tabMyTrip: "My trip",
            tabOtherTrip: "Other trip",
            clearInput: "Clear",
            compareWithThisTrip: "Compare with your first trip",
            otherTransportMeans: "Other means of transportation",
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
            warning:
              "Due to heavy traffic and lack of budget, we have to limit the number of requests temporarily.",
            warning_1: "Due to heavy traffic and ",
            warning_2: "lack of budget",
            warning_3: ", we have to limit the number of requests temporarily.",
          },
          about: {
            introduction_1:
              "Lowtrip is an independent, free and open-source project. The aim of this application is to provide accurate carbon footprints per passenger for each mode of transport and journey. These results enable users to make informed choices in the context of reducing their carbon footprint to curb the effects of global warming.",
            introduction_2:
              "This application has been developed by a team of four young volunteers. We welcome any feedback and suggestions for improvement, which you can send us via the contact page. Thank you in advance for your enthusiasm! :)",
            inspiringProjects: "Some inspiring projects",
            mollow_1:
              "Traveling sustainably across Europe, without relying on cars or airplanes, presents numerous challenges. The continent's train and bus networks are diverse and sometimes difficult to navigate, making it tricky to find efficient and affordable connections between countries. This is where ",
            mollow_2:
              " steps in as a comprehensive web platform designed to revolutionize your travel experience.",
            mollow_3:
              " Mollow provides a wealth of advice and tested routes to give you inspiration for your next great adventure. The platform is founded on the belief that the journey itself should be a memorable part of your holiday. By embracing this philosophy, Mollow encourages travelers to explore and appreciate the charming cities and breathtaking landscapes that unfold along the way.",
            sailcoop_1:
              "Accessing islands without relying on planes often involves taking ferries, which can also contribute significantly to carbon emissions per kilometer traveled. To offer a sustainable alternative to traditional ferry travel, Sailcoop presents a unique and eco-friendly solution: sailing with the wind between the mainland and destinations like Corsica.",
            sailcoop_2:
              "Sailcoop harnesses the power of wind to provide unforgettable journeys across the sea. By opting for sailing trips instead of ferry rides, travelers not only reduce their carbon footprint but also embark on a more immersive and environmentally conscious adventure.",
            bonpote:
              "One exemplary project that epitomizes sustainable travel is the journey undertaken by the media Bon Pote to witness the Northern Lights in the Lofoten Islands, traveling entirely by train from Paris. This initiative showcases the feasibility and beauty of overland travel, emphasizing the rewarding experiences that come with reducing reliance on carbon-intensive modes of transportation. They tested our method to estimate their associated carbon footprint.",
            shimla:
              "The documentary film 'Shimla', named after the Indian city, explores the theme of water and ecology through an ambitious journey from Paris to India and back using a combination of trains, ferries, and hitchhiking ('autostop'). This innovative approach to travel not only raises awareness about environmental issues but also showcases how diverse modes of transportation can be used to minimize carbon emissions and maximize the richness of the travel experience. Johan and Victoria, the movie makers, trusted lowtrip to estimate the associated carbon footprint of their adventure and subsequent reductions compared to usual means of transportation for such distances.",
          },
          results: {
            vsOtherTrip: "Your trip VS Other trip",
            vsOtherMeans: "Your trip VS Other means of transport",
            yourTripEmissions: "Your trip emissions",
            explanation:
              "The combustion of kerosene at high altitude produces clouds called contrails. Combined with NOx emissions, these non-CO2 effects contribute to global warming. The represented connection might not be currently operated by a flight company. This mode is not displayed by default when the journey length is below 300km.",
          },
          chart: {
            information: {
              info_1: "This trip accounts for",
              your: "of your",
              info_2: "yearly carbon budget,",
              info_3: "according to the Paris agreement",
              link: "https://en.2tonnes.org/",
            },
            help: "Details about plane ",
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
              bike: "Bicycle route",
              flight: "Flight path",
              ferry: "Ferry route",
            },
            category: {
              infra: "Infrastructure",
              construction: "Production",
              fuel: "Fuel",
              kerosene: "Kerosene",
              contrails: "Contrails & NOx",
              bikeBuild: "Bicycle production",
            },
          },
          method: {
            introduction: {
              title: "Introduction",
              text1:
                "The work presented here is independent, not-for-profit and open source.",
              text2:
                "The aim of this web app is to present precise carbon inventories per passenger for each mode of transport and each journey. These results enable users to make informed choices in the context of reducing their greenhouse gas emissions to mitigate climate change. To put these results into context, total yearly per-capita net emissions should not exceed 2 tons CO2eq in 2050 to limit global warming below +2°C.",
              text3:
                "All assumptions, data and sources used are available in this",
              text4: "methodology",
              text5: " document.",
            },
            howEmissionsAreComputed: {
              title: "How are emissions calculated?",
              text1:
                "To calculate CO2 equivalent emissions per person, we multiply the distance of a journey (km) by the corresponding emission factor (mass of CO2 equivalent per person per km) of a means of transport. For a mutlistep journey, these emissions are summed over the different steps:",
            },
            distanceEstimation: {
              title: "Estimation of distances",
              table: {
                title_1: "Means of Transport",
                title_2: "Distance source",
                transport_1: "Train",
                transport_2: "Car - Bus - eCar",
                transport_3: "Bicycle route",
                transport_4: "Plane",
                transport_5: "Ferry",
                data_openstreetmap: "OpenStreetMap network",
                data_geodesic: "Geodesic distance + average detour",
                data_approximation: "Approximation of shortest path",
              },
            },
            emissionFactors: {
              title: "What do emission factors depend on?",
              table1: {
                title_1: "Means of Transport",
                title_2: "Variable",
                title_3: "Why?",
                transport_1: "Train",
                transport_2: "Bus - Bicycle",
                transport_3: "Car",
                transport_4: "eCar",
                transport_5: "Plane",
                transport_6: "Ferry",
                variables_1: "Visited countries",
                variables_2: "-",
                variables_3: "Number of passengers",
                variables_4: "Number of passengers & Visited countries",
                variables_5: "Travel distance",
                variables_6: "(not yet) user parameters",
                why_1:
                  "≠ Electrification rate;≠ Energy carbon intensity;≠ Filling rates",
                why_2: "-",
                why_3:
                  "Personal footprint allocation;Consumption increases with weight",
                why_4: "Idem Car;≠ Energy carbon intensity",
                why_5:
                  "Higher proportion of take-off for short-haul routes;Use of generally less efficient planes",
                why_6: "-",
              },
              table2: {
                title_1: "Means of Transport",
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
                "Emission factors consider usage (linked to the manufacture and use of energy to move the vehicle) as well as infrastructure and vehicle construction where these are significant. The table below summarizes the types of emissions taken into account by lowtrip. Empty cells mean that the related emissions did not contribute significantly to the result and are therefore excluded to facilitate understanding and readability for the user.",
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
                "L'objectif de cette application est de fournir des bilans carbone par passager précis pour chaque mode de transport et trajet. Ces résultats permmettent à l'utilisateur de faire des choix informés dans le contexte de réduction de leur empreinte carbone pour freiner les effets du réchauffement climatique. Pour mettre ces valeurs en contexte, l'empreinte nette annuelle et personnelle ne doit pas dépasser les 2t CO2eq en 2050 afin de rester sous +2°C de réchauffement.",
              text3:
                "Toutes les hypothèses, données et sources sont disponibles dans ce document de",
              text4: "méthodologie",
              text5: ".",
            },
            howEmissionsAreComputed: {
              title: "Comment les émissions sont-elles calculées ?",
              text1:
                "Pour calculer les émissions de CO2eq par personne, nous multiplions la distance d'un voyage (km) par le facteur d'émission correspondant (masse de CO2 équivalent par personne par km) au moyen de transport. \n Pour un voyage à plusieurs étapes, ces émissions sont sommées sur les différentes étapes:",
            },
            distanceEstimation: {
              title: "Estimation des distances",
              table: {
                title_1: "Moyen de Transport",
                title_2: "Source de la Distance",
                transport_1: "Train",
                transport_2: "Voiture - Bus - VE",
                transport_3: "Voie cyclable",
                transport_4: "Avion",
                transport_5: "Ferry",
                data_openstreetmap: "Réseau OpenStreetMap",
                data_geodesic: "Distance géodésique + déviation moyenne",
                data_approximation: "Approximation du plus court chemin",
              },
            },
            emissionFactors: {
              title: "De quoi dépendent les facteurs d'émissions ?",
              table1: {
                title_1: "Moyen de Transport",
                title_2: "Variable",
                title_3: "Pourquoi ?",
                transport_1: "Train",
                transport_2: "Bus - Vélo",
                transport_3: "Voiture",
                transport_4: "VE",
                transport_5: "Avion",
                transport_6: "Ferry",
                variables_1: "Pays traversés",
                variables_2: "-",
                variables_3: "Nombre de passagers",
                variables_4: "Nombre de passagers & Pays traversés",
                variables_5: "Distance du trajet",
                variables_6: "(en cours) Paramètres utilisateur",
                why_1:
                  "≠ Taux d'éléctrification;≠ Intensité carbone de l'énergie;≠ Taux de remplissage",
                why_2: "-",
                why_3:
                  "Attribution de l'empreinte personnelle;Augmentation de la consommation avec le poids",
                why_4: "Idem Voiture;≠ Intensités carbone de l'énergie",
                why_5:
                  "Part plus importante du décollage pour les trajets courts;Utilisation d'appareils en général moins performants",
                why_6: "-",
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
            tipee: "Soutenez-nous !",
          },
          home: {
            compareTravelEmissions: "Compare les émissions de ton voyage",
          },
          form: {
            addStep: "Ajouter une étape",
            adviceText: {
              compareWith: "Comparez avec...",
              previousFormIsInvalid: "Complétez le premier voyage",
              main: "Renseignez {{missingParams}} puis comparez avec...",
              mainSecondForm: "Renseignez {{missingParams}} puis...",
              departure: "un point de départ",
              destination: "une destination",
              transportMean: "un moyen de transport",
              and: "et",
              missingTransportMean: "le moyen de transport manquant",
              missingTransportMeans: "les moyens de transport manquants",
              missingLocation: "le point d'étape manquant",
              missingLocationAndTransportMean:
                "le point d'étape et le moyen de transport manquants",
              missingLocationAndTransportMeans:
                "le point d'étape et les moyens de transport manquants",
              missingLocations: "les points d'étape manquants",
              missingLocationsAndTransportMean:
                "les points d'étape et le moyen de transport manquants",
              missingLocationsAndTransportMeans:
                "les points d'étapes et les moyens de tranport manquants",
            },
            tabMyTrip: "Mon voyage",
            tabOtherTrip: "Autre voyage",
            clearInput: "Effacer",
            compareWithThisTrip: "Comparez avec votre premier voyage",
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
            warning:
              "En raison du trafic important et d'un manque de budget, nous sommes contraints de limiter le nombre de requêtes temporairement.",

            warning_1: "En raison du trafic important et ",
            warning_2: "d'un manque de budget",
            warning_3:
              ", nous sommes contraints de limiter le nombre de requêtes temporairement.",
          },
          about: {
            introduction_1:
              "Lowtrip est un projet indépendant, gratuit et open-source. L'objectif de cette application est de fournir des bilans carbone par passager précis pour chaque mode de transport et trajet. Ces résultats permettent à l'utilisateur de faire des choix informés dans le contexte de réduction de leur empreinte carbone pour freiner les effets du réchauffement climatique.",
            introduction_2:
              "Cette application a été développée par une équipe de quatre jeunes bénévoles. Nous sommes preneurs de tous vos retours et propositions d'amélioration, que vous pouvez nous transmettre via la page contact. Merci d'avance pour votre enthousiasme ! :)",
            inspiringProjects: "Quelques projets inspirants",
            mollow_1:
              "Voyager de manière durable à travers l'Europe, sans avoir recours à la voiture ou à l'avion, présente de nombreux défis. Les réseaux de trains et de bus du continent sont divers et parfois difficiles à naviguer, ce qui rend difficile la recherche de connexions efficaces et abordables entre les pays. C'est là qu'intervient ",
            mollow_2:
              ", une plateforme web complète conçue pour révolutionner votre expérience de voyage.",
            mollow_3:
              "Mollow fournit une multitude de conseils et d'itinéraires testés pour vous donner de l'inspiration pour votre prochaine grande aventure. La plateforme est fondée sur la conviction que le voyage lui-même doit être une partie mémorable de vos vacances. En adoptant cette philosophie, Mollow encourage les voyageurs à explorer et à apprécier les villes charmantes et les paysages à couper le souffle qui se dévoilent en chemin.",
            sailcoop_1:
              "Pour accéder aux îles sans avoir recours à l'avion, il faut souvent emprunter des ferries, qui peuvent également contribuer de manière significative aux émissions de carbone par kilomètre parcouru. Afin d'offrir une alternative durable aux voyages en ferry traditionnels, Sailcoop propose une solution unique et écologique : naviguer au gré du vent entre le continent et des destinations telles que la Corse.",
            sailcoop_2:
              "Sailcoop exploite la puissance du vent pour offrir des voyages inoubliables à travers la mer. En optant pour des voyages en voilier plutôt qu'en ferry, les voyageurs réduisent non seulement leur empreinte carbone, mais s'embarquent également dans une aventure plus immersive et en phase avec l'environnement.",
            bonpote:
              " Un exemple de voyage durable est le voyage entrepris par le média Bon Pote pour observer les aurores boréales dans les îles Lofoten, en voyageant entièrement en train depuis Paris. Cette initiative illustre la faisabilité et la beauté des voyages terrestres, en mettant l'accent sur les expériences gratifiantes qui découlent de la réduction de la dépendance à l'égard des modes de transport à forte intensité de carbone. Ils ont testé notre méthode pour estimer leur empreinte carbone.",
            shimla:
              "Le film documentaire 'Shimla', du nom de la ville indienne, explore les thèmes de l'eau et de l'écologie à travers un voyage ambitieux de Paris à l’Inde en utilisant une combinaison de trains, de ferries et d'auto-stop. Cette approche innovante du voyage permet non seulement de sensibiliser aux questions environnementales, mais aussi de montrer comment divers modes de transport peuvent être utilisés pour minimiser les émissions de carbone et maximiser la richesse de l'expérience de voyage. Johan et Victoria, les réalisateurs du film, ont fait confiance à lowtrip pour estimer l'empreinte carbone associée à leur aventure et les réductions subséquentes par rapport aux moyens de transport habituels pour de telles distances.",
          },
          results: {
            vsOtherTrip: "Ton voyage VS Autre voyage",
            vsOtherMeans: "Ton voyage VS Autres moyens de transport",
            yourTripEmissions: "Les émissions de ton voyage",
            explanation:
              "La combustion du kérosène à haute altitude entraîne la formation de nuages appelés traînées de condensation. Combiné aux émissions de NOx, ces effets hors CO2 contribuent au réchauffement climatique. Le trajet représenté reste théorique et pourrait ne pas être exploité par une compagnie aérienne. Ce mode n'est pas affiché par défaut lorsque la distance du voyage est inférieure à 300 km.",
          },
          chart: {
            information: {
              info_1: "Ce trajet représente",
              your: "de ton",
              info_2: "budget carbone annuel",
              info_3: "selon l'accord de Paris",
              link: "https://www.2tonnes.org/post/objectif-2-tonnes-climat",
            },
            help: "Détails sur l'avion ",
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
              bike: "Voie cyclable",
              flight: "Route aérienne",
              ferry: "Voie maritime",
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
