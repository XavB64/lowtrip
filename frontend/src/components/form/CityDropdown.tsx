import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
} from "@chakra-ui/react";
import { useDebounce } from "../../hooks";
import { useTranslation } from "react-i18next";
import { useCache } from "../../context";

const formatCityName = (city: string) => {
  const items = city.split(",");
  return `${items[0]}, ${items[items.length - 1]}`;
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
        bottom: "1rem",
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

export type City = {
  id: number;
  name: string;
  lon: string;
  lat: string;
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
  const { getCacheValue, addToCache } = useCache();
  const [results, setResults] = useState<City[]>([]);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = useDebounce(value, 500);
  const isDeparture = stepIndex === 1;

  const handleChange = async (newQuery: string) => {
    const cachedResult = getCacheValue(newQuery);
    if (cachedResult) {
      setResults(cachedResult);
      return;
    }
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?city=${newQuery}&format=json&limit=10`
      );
      const filteredResults = (response.data as any[]).reduce(
        (acc: City[], city: any) => {
          const cityNames = acc.map((item) => item.name);
          const currentCityName = formatCityName(city.display_name);
          if (!cityNames.includes(currentCityName)) {
            acc.push({
              id: city.place_id,
              name: currentCityName,
              lon: city.lon,
              lat: city.lat,
            });
          }
          return acc;
        },
        [] as City[]
      );
      addToCache(newQuery, filteredResults);
      setResults(filteredResults);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  useEffect(() => {
    if (query) {
      handleChange(query);
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleKeyDown = (event: any) => {
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
      {value && <ClearButton resetCity={resetCity} />}
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
    console.log("hello");
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
