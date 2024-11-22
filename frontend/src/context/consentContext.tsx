import { createContext, useState, type ReactNode, useContext } from "react";

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
      "useCache must be used within a ConsentContextProvider.Provider"
    );
  }
  return context;
};
