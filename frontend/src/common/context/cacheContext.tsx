import { ReactNode, createContext, useContext, useState } from "react";
import { City } from "../../views/main-view/components/form/types";

export type Cache = Record<string, City[]>;

type Context = {
  addToCache: (key: string, value: City[]) => void;
  getCacheValue: (key: string) => City[] | undefined;
  resetCache: () => void;
};

const CacheContext = createContext<Context | null>(null);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
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

  const resetCache = () => {
    setCache({});
  };

  return (
    <CacheContext.Provider value={{ addToCache, getCacheValue, resetCache }}>
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
