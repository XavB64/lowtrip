import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const EMAIL_API_SERVICE_KEY = process.env.EMAIL_API_SERVICE_KEY ?? "";
const EMAIL_API_SERVICE_URL = process.env.EMAIL_API_SERVICE_URL ?? "";
const LOWTRIP_MANAGER_EMAIL = process.env.LOWTRIP_MANAGER_EMAIL ?? "";

async function sendEmail(senderEmail: string, message: string) {
  try {
    const data = {
      sender: { name: "Lowtrip", email: "hello@lowtrip.fr" },
      to: [{ email: LOWTRIP_MANAGER_EMAIL }],
      subject: "Nouveau message depuis le formulaire de contact",
      htmlContent: `Message envoyé par ${senderEmail}:<br/><br/> ${message}`,
    };

    console.log(process.env.EMAIL_API_KEY);

    const response = await axios({
      method: "post",
      url: EMAIL_API_SERVICE_URL,
      headers: {
        "Content-Type": "application/json",
        "api-key": EMAIL_API_SERVICE_KEY,
      },
      data: data,
    });
    console.log("Email sent successfully:", response.data);
  } catch (error) {}
}

const ContactView = () => {
  const { t } = useTranslation();

  const [emailInput, setEmailInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [formHasBeenSubmitted, setFormHasBeenSubmitted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const submitForm = () => {
    setFormHasBeenSubmitted(true);
    if (emailInput === "" || messageInput === "") {
      return;
    }
    setSendingEmail(true);
    sendEmail(emailInput, messageInput).then(() => setSendingEmail(false));
  };

  return (
    <Stack
      w="100%"
      h="100%"
      alignItems="center"
      paddingInline={20}
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
          onChange={(e: any) => setEmailInput(e.target.value)}
          background={"white"}
          borderRadius="10px"
          border="1px solid lightgrey"
        />
        {formHasBeenSubmitted && emailInput === "" && (
          <FormErrorMessage>{t("contact.emailIsRequired")}</FormErrorMessage>
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
          background={"white"}
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
    </Stack>
  );
};

export default ContactView;
