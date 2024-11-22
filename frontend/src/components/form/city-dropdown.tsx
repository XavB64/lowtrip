import axios from "axios";
import i18n from "i18next";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { PHOTON_API_URL } from "../../config";
import { useCache } from "../../context/cacheContext";
import { useDebounce } from "../../hooks";
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
      style={{
        position: "absolute",
        right: "0.5rem",
        bottom: "0.80rem",
        justifyContent: "center",
        alignItems: "center",
        width: "1.5rem",
        height: "1.5rem",
        appearance: "none",
        border: "none",
        borderRadius: "50%",
        background: "gray",
        margin: 0,
        padding: "2px",
        color: "white",
        fontSize: "1.5rem",
        display: "flex",
      }}
    >
      ×
    </button>
  );
};

const Loader = () => {
  return (
    <div
      style={{
        position: "absolute",
        right: "0.5rem",
        bottom: "0.80rem",
        justifyContent: "center",
        alignItems: "center",
        width: "1.5rem",
        height: "1.5rem",
        display: "flex",
      }}
    >
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
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${PHOTON_API_URL}/api?q=${newQuery}&osm_tag=place:city&&osm_tag=place:village&osm_tag=place:town&layer=city&layer=district&limit=10&lang=${resultLng}`,
      );
      const cities = formatCities(response.data.features as PhotonApiCity[]);
      addToCache(newQuery, cities);
      setResults(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query && query !== stepName) {
      handleChange(query);
    } else {
      setResults([]);
    }
    // eslint-disable-next-line
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
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDeparture ? t("form.placeholderFrom") : t("form.placeholderTo")
            }
            // onBlur={() => setIsOpen(false)}
            id={`dropdownId-${stepIndex}`}
            style={{
              width: "100%",
              height: "50px",
              padding: "9px",
              border: "1px solid lightgrey",
              borderRadius: "20px",
              backgroundColor: "white",
              fontSize: "16px",
            }}
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
