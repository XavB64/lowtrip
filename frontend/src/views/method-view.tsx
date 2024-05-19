// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
  Box,
  Text,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Link,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import katex from "katex";
import "katex/dist/katex.min.css";
import { FaCheck } from "react-icons/fa";
import i18n from "i18next";
import { useEffect } from "react";

// Tried to use the language to change the text in french but I couldn't
// I think we should just write directly 2 pages and not use traduction elements

const MethodView = () => {
  const { t } = useTranslation();

  const equation =
    i18n.language === "fr"
      ? "CO_2eq = \\sum_{étape} Distance(km) \\times Facteur \\: d'Émission(kgCO2eq/km)"
      : "CO_2eq = \\sum_{step} Distance(km) \\times Emission \\: Factor(kgCO2eq/km)";

  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    katex.render(equation, document.getElementById("equation"));
  }, [equation]);

  return (
    <Box
      h="100%"
      w="100%"
      overflowX="hidden"
      paddingLeft="10%"
      paddingRight="10%"
      paddingY={[3, 16]}
      color="#595959"
      fontSize={["small", "large"]}
      textAlign="left"
      justifyContent="center"
    >
      <Heading
        as="h1"
        color="blue.500"
        fontWeight="bold"
        fontSize={"3xl"}
        marginBottom={3}
      >
        {t("method.introduction.title")}
      </Heading>
      <Text marginBottom={3}>{t("method.introduction.text1")}</Text>
      <Text marginBottom={3}>{t("method.introduction.text2")}</Text>
      <Text marginBottom={10}>
        {t("method.introduction.text3")}{" "}
        <Link
          href={MethodologyPdf}
          target="_blank"
          rel="noreferrer"
          color="blue.400"
        >
          {t("method.introduction.text4")}
        </Link>
        {t("method.introduction.text5")}
      </Text>

      <Heading
        as="h2"
        color="blue.500"
        fontWeight="bold"
        fontSize={"2xl"}
        marginBottom={3}
        marginTop={10}
      >
        {t("method.howEmissionsAreComputed.title")}
      </Heading>
      <Text marginBottom={3}>{t("method.howEmissionsAreComputed.text1")}</Text>
      <div id="equation" />

      <Heading
        as="h2"
        color="blue.500"
        fontWeight="bold"
        fontSize={"2xl"}
        marginBottom={3}
        marginTop={10}
      >
        {t("method.distanceEstimation.title")}
      </Heading>
      <TableContainer>
        <Table variant="simple" fontSize={14} marginBottom={3} overflow="auto">
          <Thead>
            <Tr>
              <Th>{t("method.distanceEstimation.table.title1")}</Th>
              <Th>{t("method.distanceEstimation.table.title2")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport1")}
              </Td>
              <Td>{t("method.distanceEstimation.table.dataOpenstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport2")}
              </Td>
              <Td>{t("method.distanceEstimation.table.dataOpenstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport3")}
              </Td>
              <Td>{t("method.distanceEstimation.table.dataOpenstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport4")}
              </Td>
              <Td>{t("method.distanceEstimation.table.dataGeodesic")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport5")}
              </Td>
              <Td>{t("method.distanceEstimation.table.dataApproximation")}</Td>
            </Tr>
            {/* Add more rows as needed */}
          </Tbody>
        </Table>
      </TableContainer>

      <Heading
        as="h2"
        color="blue.500"
        fontWeight="bold"
        fontSize={"2xl"}
        marginBottom={3}
        marginTop={10}
      >
        {t("method.emissionFactors.title")}
      </Heading>
      <TableContainer>
        <Table variant="simple" fontSize={14} marginBottom={3} overflow="auto">
          <Thead>
            <Tr>
              <Th>{t("method.emissionFactors.table1.title1")}</Th>
              <Th>{t("method.emissionFactors.table1.title2")}</Th>
              <Th>{t("method.emissionFactors.table1.title3")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport1")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables1")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why1")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport2")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables2")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why2")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport3")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables3")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why3")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport4")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables4")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why4")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport5")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables5")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why5")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport6")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables6")}</Td>
              <Td>
                {t("method.emissionFactors.table1.why6")
                  .split(";")
                  .map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
              </Td>
            </Tr>
            {/* Add more rows as needed */}
          </Tbody>
        </Table>
      </TableContainer>
      <Text marginBottom={3}>{t("method.emissionFactors.text1")}</Text>
      <TableContainer>
        <Table variant="simple" fontSize={14} marginBottom={3} overflow="auto">
          <Thead>
            <Tr>
              <Th>{t("method.emissionFactors.table2.title1")}</Th>
              <Th>{t("method.emissionFactors.table2.title2")}</Th>
              <Th>{t("method.emissionFactors.table2.title3")}</Th>
              <Th>{t("method.emissionFactors.table2.title4")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport1")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td> - </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport2")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td> - </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport3")}
              </Td>
              <Td> - </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td>{t("method.emissionFactors.table2.dataNotFound")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport4")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td> - </Td>
              <Td> - </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport5")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td> - </Td>
              <Td>{t("method.emissionFactors.table2.dataNotFound")}</Td>
            </Tr>
            {/* Add more rows as needed */}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MethodView;
