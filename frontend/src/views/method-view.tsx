// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.

// // You should have received a copy of the GNU General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.


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
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import katex from "katex";
import "katex/dist/katex.min.css";
import { FaCheck } from "react-icons/fa";
import i18n from "i18next";
import { useEffect } from "react";
import { checkIsOnMobile } from "../utils";

// Tried to use the language to change the text in french but I couldn't
// I think we should just write directly 2 pages and not use traduction elements

const MethodView = () => {
  const { t } = useTranslation();

  const isOnMobile = checkIsOnMobile();
  const horizontalPadding = isOnMobile ? "10%" : "20%";

  const equation =
    i18n.language === "fr"
      ? "CO_2eq = \\sum_{étape} Distance(km) \\times Facteur \\: d'émission(kgCO2eq/km)"
      : "CO_2eq = \\sum_{step} Distance(km) \\times Emission \\: rate(kgCO2eq/km)";

  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    katex.render(equation, document.getElementById("equation"));
  }, [equation]);

  return (
    <Box
      h="100%"
      w="100%"
      paddingLeft={horizontalPadding}
      paddingRight={horizontalPadding}
      marginTop={3}
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
              <Th>{t("method.distanceEstimation.table.title_1")}</Th>
              <Th>{t("method.distanceEstimation.table.title_2")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport_1")}
              </Td>
              <Td>{t("method.distanceEstimation.table.data_openstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport_2")}
              </Td>
              <Td>{t("method.distanceEstimation.table.data_openstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport_3")}
              </Td>
              <Td>{t("method.distanceEstimation.table.data_openstreetmap")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport_4")}
              </Td>
              <Td>{t("method.distanceEstimation.table.data_geodesic")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.distanceEstimation.table.transport_5")}
              </Td>
              <Td>{t("method.distanceEstimation.table.data_approximation")}</Td>
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
              <Th>{t("method.emissionFactors.table1.title_1")}</Th>
              <Th>{t("method.emissionFactors.table1.title_2")}</Th>
              <Th>{t("method.emissionFactors.table1.title_3")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_1")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_1")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_2")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_2")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_3")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_3")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_4")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_4")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_5")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_5")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table1.transport_6")}
              </Td>
              <Td>{t("method.emissionFactors.table1.variables_6")}</Td>
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
              <Th>{t("method.emissionFactors.table2.title_1")}</Th>
              <Th>{t("method.emissionFactors.table2.title_2")}</Th>
              <Th>{t("method.emissionFactors.table2.title_3")}</Th>
              <Th>{t("method.emissionFactors.table2.title_4")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport_1")}
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
                {t("method.emissionFactors.table2.transport_2")}
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
                {t("method.emissionFactors.table2.transport_3")}
              </Td>
              <Td> - </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td>{t("method.emissionFactors.table2.data_not_found")}</Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport_4")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td> - </Td>
              <Td> - </Td>
            </Tr>
            <Tr>
              <Td bg="blue.100">
                {t("method.emissionFactors.table2.transport_5")}
              </Td>
              <Td>
                <FaCheck color="green" />
              </Td>
              <Td>{t("method.emissionFactors.table2.data_not_found")}</Td>
              <Td>{t("method.emissionFactors.table2.data_not_found")}</Td>
            </Tr>
            {/* Add more rows as needed */}
          </Tbody>
        </Table>
      </TableContainer>

      <Text marginBottom={10}>
        {t("method.emissionFactors.text2")}{" "}
        <a
          href={MethodologyPdf}
          target="_blank"
          rel="noreferrer"
          style={{ color: "blue" }}
        >
          {t("method.emissionFactors.text3")}
        </a>
        {t("method.emissionFactors.text4")}
      </Text>
    </Box>
  );
};

export default MethodView;
