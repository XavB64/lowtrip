import React, { ReactNode, createContext, useContext, useState } from "react";
import { City } from "./components/form/types";

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

type ConsentContextType = {
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
};

const ConsentContext = createContext<ConsentContextType | null>(null);

export const ConsentContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [consentGiven, _setConsentGiven] = useState(false);

  const setConsentGiven = (consentGiven: boolean) => {
    _setConsentGiven(consentGiven);
  };

  return (
    <ConsentContext.Provider value={{ setConsentGiven, consentGiven }}>
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsentContext = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error(
      "useCache must be used within a ConsentContextProvider.Provider",
    );
  }
  return context;
};
