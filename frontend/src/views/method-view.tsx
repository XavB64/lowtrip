import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
  useDisclosure,
  Text,
  Table, Thead, Tbody, Tr, Th, Td, Heading
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import katex from "katex";
import 'katex/dist/katex.min.css';
import { FaCheck } from 'react-icons/fa';
import i18n from "i18next";

const lang = String(i18n.language);
// Tried to use the language to change the text in french but I couldn't
// I think we should just write directly 2 pages and not use traduction elements

const MethodView = () => {

  useEffect(() => {
    // Render the LaTeX equation using KaTeX after the component has mounted
  katex.render('CO_2eq = \\sum_{step} Distance(km) \\times Emission \\: rate(kgCO2eq/km)', document.getElementById('equation'));
  }, []); // Empty dependency array ensures this effect runs only once after mounting

  return (

    <Box h="100%" 
    w="100%" 
    marginLeft={"20%"} 
    marginRight={"20%"}
    marginTop={3}
    color="#595959"
        fontSize={["small", "large"]}
        textAlign="left"
        justifyContent="center"
    >
       <Heading as="h1" color="blue.500" fontWeight="bold" fontSize={"3xl"}
       marginBottom={3}>
        Introduction
        </Heading>

        <Text marginBottom={3}>
        The work presented here is independent and not-for-profit. 
        </Text>
        <Text marginBottom={3}>
        The aim of this web app is to present precise carbon inventories per passenger for each mode of transport and each journey. These results enable users to make informed choices in the context of reducing their greenhouse gas emissions to mitigate climate change. To put these results into context, total yearly per-capita emissions should not exceed 2 tons CO2eq in 2050 to limit global warming below 2°C (IPCC).
        </Text>

        <Heading as="h2" color="blue.500" fontWeight="bold"  
        fontSize={"2xl"}
        marginBottom={3}>
        How the emissions are calculated?
          </Heading>


        <Text marginBottom={3}> 
        To calculate CO2 equivalent emissions per person, we multiply the distance of a journey (km) by the corresponding emission factor (mass of CO2 equivalent per person per km) of a mean of transport. For a mutlistep journey, these emissions are summed over the different steps.
        </Text>
        <div id="equation" />


        <Heading as="h2" color="blue.500" fontWeight="bold"  
        fontSize={"2xl"}
        marginBottom={3}
        marginTop={3}>
        Estimation of distances
          </Heading>

      {/* Table */}
      <Table variant="simple"fontSize={14} marginBottom={3}>
        <Thead>
          <Tr>
            <Th>Mean of Transport</Th>
            <Th>Distance source</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td bg="blue.100">Train</Td> {/* Highlighting the first column */}
            <Td>OpenStreetMap network</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Car - Bus - eCar</Td> {/* Highlighting the first column */}
            <Td>OpenStreetMap network</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Bike route</Td> {/* Highlighting the first column */}
            <Td>OpenStreetMap network</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Plane</Td> {/* Highlighting the first column */}
            <Td>Geodesic distance</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Ferry</Td> {/* Highlighting the first column */}
            <Td>Aproximation of shortest path</Td>
          </Tr>
          {/* Add more rows as needed */}
        </Tbody>
      </Table>

      <Heading as="h2" color="blue.500" fontWeight="bold"  
      fontSize={"2xl"}
      marginBottom={3}>
        What do emission factors depend on?
        </Heading>

      {/* Table */}
      <Table variant="simple"fontSize={14} marginBottom={3}>
        <Thead>
          <Tr>
            <Th>Mean of Transport</Th>
            <Th>Variable</Th>
            <Th>Why?</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td bg="blue.100">Train</Td> {/* Highlighting the first column */}
            <Td>Visited country</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Bus - Bike</Td> {/* Highlighting the first column */}
            <Td> - </Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Car</Td> {/* Highlighting the first column */}
            <Td>Number of passengers</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">eCar</Td> {/* Highlighting the first column */}
            <Td>Number of passengers & Visited countries</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Plane</Td> {/* Highlighting the first column */}
            <Td>Travel distance</Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Ferry</Td> {/* Highlighting the first column */}
            <Td>(not yet) user parameters</Td>
          </Tr>
          {/* Add more rows as needed */}
        </Tbody>
      </Table>

        <Text marginBottom={3}> 
        Emissions factors consider usage (linked to the manufacture and use of energy to move the vehicle) as well as infrastructure and vehicle construction where these are significant. The table below summarizes the types of emissions taken into account by lowtrip. Empty cells mean that the related emissions did not contribute significantly to the result and are therefore excluded to facilitate understanding and readability for the user.
        </Text>

      {/* Table */}
      <Table variant="simple" fontSize={14} marginBottom={3}>
        <Thead>
          <Tr>
            <Th>Mean of Transport</Th>
            <Th>Usage</Th>
            <Th>Vehicule production</Th>
            <Th>Infrastructure construction</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td bg="blue.100">Train</Td> {/* Highlighting the first column */}
            <Td><FaCheck color="green" /></Td>
            <Td> - </Td>
            <Td><FaCheck color="green" /></Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Bus - Car - eCar</Td> {/* Highlighting the first column */}
            <Td><FaCheck color="green" /></Td>
            <Td><FaCheck color="green" /></Td>
            <Td> - </Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Bicycle</Td> {/* Highlighting the first column */}
            <Td> - </Td>
            <Td><FaCheck color="green" /></Td>
            <Td> Not found </Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Plane</Td> {/* Highlighting the first column */}
            <Td><FaCheck color="green" /></Td>
            <Td> - </Td>
            <Td> - </Td>
          </Tr>
          <Tr>
            <Td bg="blue.100">Ferry</Td> {/* Highlighting the first column */}
            <Td><FaCheck color="green" /></Td>
            <Td> Not found </Td>
            <Td> Not found </Td>
          </Tr>
          {/* Add more rows as needed */}
        </Tbody>
      </Table>

        <Text marginBottom={3}> 
        All the assumptions, data and sources used are available in the{' '}
        <a href={MethodologyPdf} target="_blank" rel="noreferrer" style={{color: "blue"}}>
          methodology
        </a>{' '}
        document. 
        </Text>


    </Box>
  )
};



export default MethodView;
