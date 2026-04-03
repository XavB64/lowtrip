// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useEffect } from "react";

import { useTranslation } from "react-i18next";

import { useConsentContext } from "../context/consentContext";
import "./CookieBanner.scss";

const CookieBanner = () => {
  const { t } = useTranslation();
  const { consentGiven, setConsentGiven } = useConsentContext();

  const handleConsent = () => {
    setConsentGiven(true);
    localStorage.setItem("cookieConsent", "true");
    const script = document.createElement("script");
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-L04SXCD38Q";
    script.async = true;
    document.head.appendChild(script);

    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];

    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }

    gtag("js", new Date());
    gtag("config", "G-L04SXCD38Q");
  };

  useEffect(() => {
    if (localStorage.getItem("cookieConsent")) {
      setConsentGiven(true);
    }
  }, []);

  if (consentGiven) {
    return null;
  }

  return (
    <div className="cookie-banner">
      <p className="cookie-banner__text">{t("cookieBanner.message")}</p>
      <button className="cookie-banner__button" onClick={handleConsent}>
        {t("cookieBanner.ok")}
      </button>
    </div>
  );
};

export default CookieBanner;
