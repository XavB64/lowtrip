import { useState, useEffect, useMemo } from "react";

import i18n from "i18next";
import { useTranslation } from "react-i18next";

import { useCache } from "common/context/cacheContext";
import { useDebounce } from "common/hooks";
import { PHOTON_API_URL } from "config";

import { City, PhotonApiCity } from "./types";

const formatCityName = (
  duplicates: string[],
  city: PhotonApiCity["properties"],
) => {
  const cityName = `${city.name}, ${city.country}`;
  if (duplicates.includes(cityName) && city.state) {
    return `${city.name}, ${city.state}, ${city.country}`;
  }
  return cityName;
};

const formatCities = (rawCities: PhotonApiCity[]) => {
  const { duplicates } = rawCities.reduce(
    ({ cityNames, duplicates }, { properties: cityProps }) => {
      const currentCityName = `${cityProps.name}, ${cityProps.country}`;
      if (cityNames.includes(currentCityName)) {
        duplicates.push(currentCityName);
      } else {
        cityNames.push(currentCityName);
      }
      return { cityNames, duplicates };
    },
    { cityNames: [] as string[], duplicates: [] as string[] },
  );

  const { cities } = rawCities.reduce(
    ({ cityNames, cities }, city) => {
      const currentCityName = formatCityName(duplicates, city.properties);
      if (!cityNames.includes(currentCityName)) {
        cityNames.push(currentCityName);
        cities.push({
          id: city.properties.place_id,
          name: currentCityName,
          lon: city.geometry.coordinates[0].toString(),
          lat: city.geometry.coordinates[1].toString(),
        });
      }
      return { cityNames, cities };
    },
    { cityNames: [] as string[], cities: [] as City[] },
  );

  return cities;
};

const CityDropdown = ({
  selectCity,
  resetCity,
  stepName,
  stepIndex,
}: {
  selectCity: (city: City) => void;
  resetCity: () => void;
  stepName?: string;
  stepIndex: number;
}) => {
  const { t } = useTranslation();
  const { getCacheValue, addToCache, resetCache } = useCache();
  const [results, setResults] = useState<City[]>([]);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState(0);

  const query = useDebounce(value, 500);
  const isDeparture = stepIndex === 1;

  const resultLng = useMemo(() => {
    resetCache();
    switch (i18n.language) {
      case "en":
      case "fr":
      case "de":
        return i18n.language;
      default:
        return "en";
    }
  }, [i18n.language]);

  const handleChange = async (newQuery: string) => {
    const cachedResult = getCacheValue(newQuery);
    if (cachedResult) {
      setResults(cachedResult);
      return;
    }

    setIsLoading(true);

    const params = new URLSearchParams();
    params.append("q", newQuery);
    params.append("lang", resultLng);
    params.append("limit", "10");
    params.append("layer", "city");
    params.append("layer", "district");
    [
      "place:city",
      "place:village",
      "place:town",
      "place:county",
      "place:municipality",
    ].forEach((tag) => params.append("osm_tag", tag));

    const res = await fetch(`${PHOTON_API_URL}/api?${params.toString()}`);

    if (!res.ok) {
      console.error(`Error fetching cities: ${res.status} ${res.statusText}`);
    } else {
      const response = await res.json();
      const cities = formatCities(response.features as PhotonApiCity[]);
      addToCache(newQuery, cities);
      setResults(cities);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (query && query !== stepName) {
      handleChange(query);
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    setValue(stepName || "");
  }, [stepName]);

  useEffect(() => {
    if (results.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [results]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isUpKeyCode = event.keyCode === 38;
    const isDownKeyCode = event.keyCode === 40;
    const isEnterKeyCode = event.keyCode === 13;
    const isExitKeyCode = event.keyCode === 27;
    if (isUpKeyCode && active > 0) {
      setActive(active - 1);
    }
    if (isDownKeyCode && active < results.length - 1) {
      setActive(active + 1);
    }
    if (isEnterKeyCode) {
      selectCity(results[active]);
      setIsOpen(false);
    }
    if (isExitKeyCode) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (!e.target.closest(".city-dropdown")) {
        setIsOpen(false);
        setValue(stepName || "");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="city-dropdown">
      <input
        type="text"
        className="city-dropdown-input"
        value={value}
        autoComplete="off"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isDeparture ? t("form.placeholderFrom") : t("form.placeholderTo")
        }
        id={`dropdownId-${stepIndex}`}
      />

      {isOpen && (
        <div className="city-dropdown-menu">
          {results.map((option, index) => (
            <div
              key={option.name}
              className={`city-dropdown-item ${
                active === index ? "active" : ""
              }`}
              onClick={() => {
                selectCity(option);
                setIsOpen(false);
              }}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="loader-wrapper">
          <div className="spinner" />
        </div>
      )}

      {value && !isLoading && (
        <button
          className="clear-input-button"
          aria-label="Clear input"
          title={t("form.clearInput")}
          onClick={resetCity}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CityDropdown;
