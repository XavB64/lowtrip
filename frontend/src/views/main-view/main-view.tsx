import { Box, IconButton, Stack } from "@chakra-ui/react";
import { BiChevronUp } from "react-icons/bi";

import { LeftPanel } from "./components/left-panel";
import Map from "./components/map";
import { checkIsOnMobile } from "../../common/utils";
import { useConsentContext } from "../../common/context/consentContext";
import { CacheProvider } from "../../common/context/cacheContext";

const MainView = ({
  isDarkTheme,
  withLogo,
}: {
  isDarkTheme: boolean;
  withLogo?: boolean;
}) => {
  const { consentGiven } = useConsentContext();

  const isOnMobile = checkIsOnMobile();

  return (
    <CacheProvider>
      <Stack direction={["column", "row"]} width="100%">
        <LeftPanel withLogo={withLogo} />
        <Box
          w="100%"
          height="100%"
          minHeight={["calc(100vh - 64px)", "none"]}
          position="relative"
        >
          <Map isDarkTheme={isDarkTheme} />
        </Box>
        {isOnMobile && (
          <IconButton
            aria-label="scroll-to-top"
            icon={<BiChevronUp />}
            onClick={() => {
              const mainBody = document.getElementById("main-body");
              if (mainBody)
                mainBody.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }}
            zIndex={2}
            position="fixed"
            bottom={consentGiven ? 3 : "20%"}
            left={3}
            colorScheme="blue"
            isRound
            display={["flex", "none"]}
          />
        )}
      </Stack>
    </CacheProvider>
  );
};

export default MainView;
