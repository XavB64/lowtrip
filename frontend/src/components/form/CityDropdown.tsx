import { useState, useEffect } from "react";
import axios from "axios";
import {
  Input,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
} from "@chakra-ui/react";
import { useDebounce } from "../../hooks";

export type City = {
  id: number;
  name: string;
  lon: string;
  lat: string;
};

const CityDropdown = ({
  selectCity,
  stepName,
  stepIndex,
}: {
  selectCity: (city: City) => void;
  stepName?: string;
  stepIndex: number;
}) => {
  const [results, setResults] = useState<City[]>([]);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // const [active, setActive] = useState(0);

  const query = useDebounce(value, 500);

  const handleChange = async (newQuery: string) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?city=${newQuery}&format=json&limit=10`
      );
      const filteredResults = (response.data as any[]).reduce(
        (acc: City[], city: any) => {
          const cityNames = acc.map((item) => item.name);
          if (!cityNames.includes(city.display_name)) {
            acc.push({
              id: city.place_id,
              name: city.display_name,
              lon: city.lon,
              lat: city.lat,
            });
          }
          return acc;
        },
        [] as City[]
      );
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

  // const handleKeyDown = (event: any) => {
  //   const isUpKeyCode = event.keyCode === 38;
  //   const isDownKeyCode = event.keyCode === 40;
  //   const isEnterKeyCode = event.keyCode === 13;
  //   const isExitKeyCode = event.keyCode === 27;
  //   if (isUpKeyCode && active > 0) {
  //     setActive(active - 1);
  //   }
  //   if (isDownKeyCode && active < results.length - 1) {
  //     setActive(active + 1);
  //   }
  //   // if (isEnterKeyCode) {
  //   //   onChange(options[active].label);
  //   //   setIsOpen(false);
  //   // }
  //   if (isExitKeyCode) {
  //     setIsOpen(false);
  //   }
  // };

  return (
    <Popover isOpen={isOpen} autoFocus={false} matchWidth>
      <PopoverTrigger>
        <Input
          type={"text"}
          value={value}
          autoComplete="off"
          onChange={(e) => setValue(e.target.value)}
          // onKeyDown={handleKeyDown}
          isRequired={true}
          id={`dropdownId-${stepIndex}`}
          style={{
            width: "100%",
            height: "50px",
            padding: "9px",
            border: "1px solid lightgrey",
            borderRadius: "20px",
            backgroundColor: "white",
            marginBottom: 1,
            fontSize: "16px",
          }}
        />
      </PopoverTrigger>
      <PopoverContent w="500px">
        {results.map((option, index) => (
          <Option
            key={option.name}
            option={option}
            index={index}
            onSelectOption={selectCity}
            setIsOpen={setIsOpen}
            // active={active}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};

const Option = ({
  option,
  index,
  onSelectOption,
  setIsOpen,
}: // active,
{
  option: City;
  index: number;
  onSelectOption: (option: City) => void;
  setIsOpen: (isOpen: boolean) => void;
  // active: number;
}) => {
  const selectOption = () => {
    onSelectOption(option);
    setIsOpen(false);
  };

  // const getBgColor = (active: number, i: number) => {
  //   if (active === i) {
  //   if (colorMode === "light") {
  //   return "gray.50";
  //   }
  //   return "gray.500";
  //   }
  // };

  return (
    <Box
      onClick={selectOption}
      p={1}
      // bgColor={getBgColor(active, i)}
      _hover={{ bgColor: "gray.50" }}
    >
      <Text cursor={"pointer"}>{option.name}</Text>
    </Box>
  );
};

export default CityDropdown;
