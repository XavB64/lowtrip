import React, { createContext, useContext, useState } from "react";
import { City } from "./components/form/CityDropdown";

export type Cache = Record<string, City[]>;

type Context = {
  addToCache: (key: string, value: City[]) => void;
  getCacheValue: (key: string) => City[] | undefined;
};

const CacheContext = createContext<Context | null>(null);

export const CacheProvider = ({ children }: { children: any }) => {
  const [cache, setCache] = useState<Cache>({});

  const addToCache = (key: string, value: City[]) => {
    setCache((prevCache) => ({
      ...prevCache,
      [key]: value,
    }));
  };

  const getCacheValue = (key: string) => {
    return cache[key];
  };

  return (
    <CacheContext.Provider value={{ addToCache, getCacheValue }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheContext.Provider");
  }
  return context;
};
