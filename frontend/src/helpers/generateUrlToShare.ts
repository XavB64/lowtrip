import { Step } from "../types";

export const generateUrlToShare = ({
  mainTrip,
  alternativeTrip,
}: {
  mainTrip: Step[];
  alternativeTrip?: Step[];
}) => {
  let url = `https://www.lowtrip.fr?main-trip=${JSON.stringify(mainTrip)}`;
  if (alternativeTrip) {
    url += `&alternative-trip=${JSON.stringify(alternativeTrip)}`;
  }
  navigator.clipboard.writeText(url).catch(function (error) {
    console.error("Failed to copy URL to clipboard: ", error);
  });
};
