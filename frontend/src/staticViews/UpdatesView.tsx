import { useTranslation } from "react-i18next";

import "./UpdatesView.scss";

const UpdatesView = () => {
  const { t } = useTranslation();

  return (
    <div className="updates-view">
      <h1 className="text-2xl font-bold mb-4">{t("updates.title")}</h1>

      <p>{t("updates.introduction")}</p>

      <section className="mb-6">
        <h2 className="font-semibold">{t("updates.months.april")} 2026</h2>
        <p>{t("updates.updatePage")}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold">{t("updates.months.december")} 2024</h2>
        <p>{t("updates.shareableLinkFeature")}</p>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold">
          {t("updates.months.may")} 2024 - {t("updates.applicationLaunch1")}
        </h2>
        <p>- {t("updates.applicationLaunch2")}</p>
        <p>- {t("updates.applicationLaunch3")}</p>
        <p>- {t("updates.applicationLaunch4")}</p>
        <p>- {t("updates.applicationLaunch5")}</p>
      </section>
    </div>
  );
};

export default UpdatesView;
