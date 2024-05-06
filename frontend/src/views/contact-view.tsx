import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  EMAIL_API_SERVICE_KEY,
  EMAIL_API_SERVICE_URL,
  LOWTRIP_MANAGER_EMAIL,
} from "../config";
import Modal from "../components/modal";

async function sendEmail(
  senderEmail: string,
  subject: string,
  message: string,
) {
  try {
    const data = {
      sender: { name: senderEmail, email: senderEmail },
      to: [{ email: LOWTRIP_MANAGER_EMAIL }],
      subject,
      htmlContent: `Message envoyé par ${senderEmail}:<br/><br/> ${message}`,
    };

    return axios({
      method: "post",
      url: EMAIL_API_SERVICE_URL,
      headers: {
        "Content-Type": "application/json",
        "api-key": EMAIL_API_SERVICE_KEY,
      },
      data: data,
    });
  } catch (error) {
    console.error("Error sending email", error);
  }
}

const ContactView = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen: openModal, onClose } = useDisclosure();

  const [emailInput, setEmailInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [formHasBeenSubmitted, setFormHasBeenSubmitted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitForm = () => {
    setFormHasBeenSubmitted(true);
    if (emailInput === "" || messageInput === "" || subjectInput === "") {
      return;
    }
    setSendingEmail(true);
    sendEmail(emailInput, subjectInput, messageInput)
      .then(() => {
        setIsSuccess(true);
      })
      .catch(() => {
        setIsSuccess(false);
      })
      .then(() => {
        setSendingEmail(false);
        openModal();
      });
  };

  return (
    <Stack
      w="100%"
      h={"calc(100vh - 64px)"}
      alignItems="center"
      paddingInline={[10, 20]}
      paddingBlock={8}
      backgroundColor="#efefef"
    >
      <FormControl
        isInvalid={formHasBeenSubmitted && emailInput === ""}
        isRequired
      >
        <FormLabel>{t("contact.yourEmail")}</FormLabel>
        <Input
          type="email"
          value={emailInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmailInput(e.target.value)
          }
          background="white"
          borderRadius="10px"
          border="1px solid lightgrey"
        />
        {formHasBeenSubmitted && emailInput === "" && (
          <FormErrorMessage>{t("contact.emailIsRequired")}</FormErrorMessage>
        )}
      </FormControl>
      <FormControl
        isInvalid={formHasBeenSubmitted && subjectInput === ""}
        isRequired
      >
        <FormLabel>{t("contact.yourSubject")}</FormLabel>
        <Input
          type="text"
          value={subjectInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSubjectInput(e.target.value)
          }
          background="white"
          borderRadius="10px"
          border="1px solid lightgrey"
        />
        {formHasBeenSubmitted && subjectInput === "" && (
          <FormErrorMessage>{t("contact.subjectIsRequired")}</FormErrorMessage>
        )}
      </FormControl>
      <FormControl
        isInvalid={formHasBeenSubmitted && messageInput === ""}
        isRequired
        marginBlock={4}
      >
        <FormLabel>{t("contact.yourMessage")}</FormLabel>
        <Textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          minHeight="200px"
          size="sm"
          background="white"
          borderRadius="10px"
          border="1px solid lightgrey"
        />
      </FormControl>
      <Button
        isLoading={sendingEmail}
        loadingText={t("contact.sendingEmail")}
        colorScheme="teal"
        variant="solid"
        onClick={submitForm}
      >
        {t("contact.sendEmail")}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
        headerTitle={t(
          isSuccess
            ? "contact.messageSentTitle"
            : "contact.messageNotSentTitle",
        )}
        mainText={t(
          isSuccess ? "contact.messageSentText" : "contact.messageNotSentText",
        )}
      />
    </Stack>
  );
};

export default ContactView;
