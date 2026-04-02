import { useState, useEffect, useMemo } from "react";

import {
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
  Spinner,
} from "@chakra-ui/react";
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

const ClearButton = ({ resetCity }: { resetCity: () => void }) => {
  const { t } = useTranslation();
  return (
    <button
      className="clear-input-button"
      aria-label="Clear input"
      title={t("form.clearInput")}
      onClick={resetCity}
    >
      ×
    </button>
  );
};

const Loader = () => {
  return (
    <div className="loader-wrapper">
      <Spinner size="sm" />
    </div>
  );
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

  return (
    <>
      <Popover isOpen={isOpen} autoFocus={false} matchWidth closeOnBlur={true}>
        <PopoverTrigger>
          <input
            type={"text"}
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
        </PopoverTrigger>
        <PopoverContent w="100%">
          {results.map((option, index) => (
            <Option
              key={option.name}
              option={option}
              onSelectOption={selectCity}
              setIsOpen={setIsOpen}
              isActive={active === index}
            />
          ))}
        </PopoverContent>
      </Popover>
      {isLoading && <Loader />}
      {value && !isLoading && <ClearButton resetCity={resetCity} />}
    </>
  );
};

const Option = ({
  option,
  onSelectOption,
  setIsOpen,
  isActive,
}: {
  option: City;
  onSelectOption: (option: City) => void;
  setIsOpen: (isOpen: boolean) => void;
  isActive: boolean;
}) => {
  const selectOption = () => {
    onSelectOption(option);
    setIsOpen(false);
  };

  const getBgColor = () => {
    if (isActive) return "gray.100";
  };

  return (
    <Box
      onClick={selectOption}
      p={1}
      bgColor={getBgColor()}
      _hover={{ bgColor: "gray.100" }}
    >
      <Text cursor={"pointer"}>{option.name}</Text>
    </Box>
  );
};

export default CityDropdown;
