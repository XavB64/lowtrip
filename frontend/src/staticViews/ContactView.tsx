import { useState } from "react";

import { useTranslation } from "react-i18next";

import Button from "components/Button";
import Modal from "components/Modal";
import { API_URL } from "config";

import "./ContactView.scss";

async function sendEmail(
  senderEmail: string,
  subject: string,
  message: string,
) {
  return fetch(`${API_URL}/send-mail`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Access-Contol-Allow-Origin": "*",
    },
    body: JSON.stringify({
      sender_email: senderEmail,
      subject,
      message,
    }),
  });
}

const ContactView = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [formHasBeenSubmitted, setFormHasBeenSubmitted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitForm = () => {
    setFormHasBeenSubmitted(true);

    if (messageInput === "" || subjectInput === "") return;

    setSendingEmail(true);

    sendEmail(emailInput, subjectInput, messageInput)
      .then((response) => {
        setIsSuccess(response.ok);
      })
      .catch(() => {
        setIsSuccess(false);
      })
      .then(() => {
        setSendingEmail(false);
        setIsOpen(true);
      });
  };

  return (
    <div className="static-view contact-view">
      <div className="form-control">
        <label className="form-label">{t("contact.yourEmail")}</label>

        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="input"
        />
      </div>

      <div
        className={`form-control ${formHasBeenSubmitted && !subjectInput ? "error" : ""}`}
      >
        <label className="form-label">
          {t("contact.yourSubject")} <span className="red">*</span>
        </label>

        <input
          type="text"
          value={subjectInput}
          onChange={(e) => setSubjectInput(e.target.value)}
          className="input"
        />

        {formHasBeenSubmitted && !subjectInput && (
          <p className="error-message">{t("contact.subjectIsRequired")}</p>
        )}
      </div>

      <div
        className={`form-control ${formHasBeenSubmitted && !messageInput ? "error" : ""}`}
      >
        <label className="form-label">
          {t("contact.yourMessage")} <span className="red">*</span>
        </label>

        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="textarea"
        />

        {formHasBeenSubmitted && !messageInput && (
          <p className="error-message">{t("contact.messageIsRequired")}</p>
        )}
      </div>

      <Button className="submit-button" onClick={submitForm}>
        {sendingEmail ? t("contact.sendingEmail") : t("contact.sendEmail")}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        headerTitle={t(
          isSuccess
            ? "contact.messageSentTitle"
            : "contact.messageNotSentTitle",
        )}
      >
        <p>
          {t(
            isSuccess
              ? "contact.messageSentText"
              : "contact.messageNotSentText",
          )}
        </p>
      </Modal>
    </div>
  );
};

export default ContactView;
