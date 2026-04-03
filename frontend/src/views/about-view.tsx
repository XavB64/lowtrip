import { useTranslation } from "react-i18next";

import bonpote from "assets/bonpote_aurores.png";
import mollow from "assets/logo_mollow.png";
import sailcoop from "assets/logo_sailcoop.jpg";
import shimla from "assets/shimla_text.png";

import "./AboutView.scss";

const AboutView = () => {
  const { t } = useTranslation();

  return (
    <div className="about">
      <div className="introduction">
        <p>{t("about.introduction1")}</p>
        <p>{t("about.introduction2")}</p>
      </div>

      <h1 className="about__title">{t("about.inspiringProjects")}</h1>

      <div className="inspiring-projects">
        <div className="about__section reverse">
          <a href="https://www.mollow.eu/" target="_blank" rel="noreferrer">
            <img src={mollow} alt="Mollow" />
          </a>

          <div className="about__text">
            <p>
              {t("about.mollow1")}
              <a
                href="https://www.mollow.eu/"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Mollow
              </a>
              {t("about.mollow2")}
            </p>
            <p>{t("about.mollow3")}</p>
          </div>
        </div>

        <div className="about__section">
          <div className="about__text">
            <p>{t("about.sailcoop1")}</p>
            <p>{t("about.sailcoop2")}</p>
          </div>

          <div className="about__image">
            <a href="https://www.sailcoop.fr/" target="_blank" rel="noreferrer">
              <img src={sailcoop} alt="Sailcoop" />
            </a>
          </div>
        </div>

        <div className="about__section reverse">
          <a
            href="https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={bonpote} alt="Bonpote" />
          </a>

          <p className="about__text">{t("about.bonpote")}</p>
        </div>

        <div className="about__section">
          <p className="about__text">{t("about.shimla")}</p>

          <a href="https://www.shimla.fr/" target="_blank" rel="noreferrer">
            <img src={shimla} alt="Shimla" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
