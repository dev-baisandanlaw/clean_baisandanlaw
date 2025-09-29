"use client";

import { AddAttorneyModal } from "@/components/attorneys/modals/AddAttorneyModal";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { Attorney } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";

import {
  Badge,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Pagination,
  Stack,
  Table,
  TableScrollContainer,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AttorneyListing() {
  const theme = useMantineTheme();

  const [isDataChanged, setIsDataChanged] = useState(false);

  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [
    isAddAttorneyModalOpen,
    { open: openAddAttorneyModal, close: closeAddAttorneyModal },
  ] = useDisclosure(false);

  const fetchAttorneys = useCallback(
    async (searchTerm: string, page: number) => {
      setIsFetching(true);

      try {
        const { data } = await axios.get<Attorney[]>(
          "/api/clerk/organization/fetch",
          {
            params: {
              organization_id: CLERK_ORG_IDS.attorney,
              limit: 25,
              offset: (page - 1) * 25,
              search: searchTerm,
            },
          }
        );

        setAttorneys(data);
      } catch {
        toast.error("Failed to fetch attorneys");
        setAttorneys([]);
        setTotalCount(0);
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  const fetchTotalCount = useCallback(async (searchTerm: string) => {
    const { data } = await axios.get("/api/clerk/fetch-total-count", {
      params: {
        organization_id: CLERK_ORG_IDS.attorney,
        search: searchTerm,
      },
    });

    setTotalCount(data?.total_count);
  }, []);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchAttorneys(debouncedSearch, currentPage);
    fetchTotalCount(debouncedSearch);
  }, [
    debouncedSearch,
    currentPage,
    fetchAttorneys,
    fetchTotalCount,
    isDataChanged,
  ]);

  return (
    <>
      <Flex
        w="100%"
        h="100%"
        gap={16}
        px={{ sm: 12, md: 0 }}
        direction="column"
      >
        <Group align="center" justify="space-between" w="100%">
          <TextInput
            placeholder="Search"
            w="300px"
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            variant="outline"
            leftSection={<IconCirclePlus />}
            onClick={openAddAttorneyModal}
          >
            Add Attorney
          </Button>
        </Group>

        <TableScrollContainer
          minWidth={500}
          h="calc(100vh - 220px)"
          pos="relative"
        >
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Practice Area</Table.Th>
                <Table.Th>Admitted Since</Table.Th>
                <Table.Th>Involved Cases</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {isFetching && (
                <Table.Tr>
                  <Table.Td h="100%">
                    <LoadingOverlay visible />
                  </Table.Td>
                </Table.Tr>
              )}

              {!isFetching && !attorneys?.length && (
                <EmptyTableComponent colspan={5} message="No attorneys found" />
              )}

              {!isFetching &&
                attorneys &&
                attorneys.map((attorney) => (
                  <Table.Tr key={attorney.id}>
                    <Table.Td>
                      {attorney.first_name + " " + attorney.last_name}
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">
                          {attorney.email_addresses[0].email_address}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {attorney.unsafe_metadata.phoneNumber}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={2}>
                        {attorney.unsafe_metadata.practiceAreas?.map(
                          (area, index) => (
                            <Badge
                              size="xs"
                              key={index}
                              variant="outline"
                              radius="xs"
                              color={theme.other.customPumpkin}
                            >
                              {area}
                            </Badge>
                          )
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {getDateFormatDisplay(attorney.created_at)}
                    </Table.Td>
                    <Table.Td>
                      {attorney.unsafe_metadata.involvedCases || 0}
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </TableScrollContainer>

        <Group align="center">
          {totalCount > 0 ? (
            <Text size="sm">
              Showing {(currentPage - 1) * 25 + 1}-
              {Math.min(currentPage * 25, totalCount)} of {totalCount} attorneys
            </Text>
          ) : (
            <Text size="sm">No attorneys found</Text>
          )}

          <Pagination
            ml="auto"
            total={Math.ceil(totalCount / 25) || 1}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      </Flex>

      <AddAttorneyModal
        opened={isAddAttorneyModalOpen}
        onClose={closeAddAttorneyModal}
        setIsDataChanged={setIsDataChanged}
      />
    </>
  );
}
