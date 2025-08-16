"use client";

import EmptyTableComponent from "@/components/EmptyTableComponent";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { Client } from "@/types/user";

import {
  Flex,
  Group,
  LoadingOverlay,
  Pagination,
  Table,
  TableScrollContainer,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ClientListing() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClients = useCallback(async (searchTerm: string, page: number) => {
    setIsFetching(true);

    try {
      const { data } = await axios.get<Client[]>(
        "/api/clerk/organization/fetch",
        {
          params: {
            organization_id: CLERK_ORG_IDS.client,
            limit: 25,
            offset: (page - 1) * 25,
            search: searchTerm,
          },
        }
      );

      setClients(data);
    } catch {
      toast.error("Failed to fetch clients");
      setClients([]);
      setTotalCount(0);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchTotalCount = useCallback(async (searchTerm: string) => {
    const { data } = await axios.get("/api/clerk/fetch-total-count", {
      params: {
        organization_id: CLERK_ORG_IDS.client,
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
    fetchClients(debouncedSearch, currentPage);
    fetchTotalCount(debouncedSearch);
  }, [debouncedSearch, currentPage, fetchClients, fetchTotalCount]);

  return (
    <Flex w="100%" h="100%" gap={16} px={{ sm: 12, md: 0 }} direction="column">
      <Group align="center" justify="space-between" w="100%">
        <TextInput
          placeholder="Search"
          w="300px"
          leftSectionPointerEvents="none"
          leftSection={<IconSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <Table.Th>Cases</Table.Th>
              <Table.Th>Subscription</Table.Th>
              <Table.Th>Member Since</Table.Th>
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

            {!isFetching &&
              clients &&
              clients.map((client) => (
                <Table.Tr key={client.id}>
                  <Table.Td>
                    {client.first_name + " " + client.last_name}
                  </Table.Td>
                  <Table.Td>{client.email_addresses[0].email_address}</Table.Td>
                  <Table.Td>
                    {client.unsafe_metadata.involvedCases || 0}
                  </Table.Td>
                  <Table.Td>
                    {client.unsafe_metadata.subscription?.isSubscribed
                      ? "Premium"
                      : "Free"}
                  </Table.Td>
                  <Table.Td>
                    {dayjs(client.created_at).format("DD MMM YYYY")}
                  </Table.Td>
                </Table.Tr>
              ))}

            {!isFetching && clients.length === 0 && (
              <EmptyTableComponent colspan={5} />
            )}
          </Table.Tbody>
        </Table>
      </TableScrollContainer>

      <Group align="center">
        {totalCount > 0 ? (
          <Text size="sm">
            Showing {(currentPage - 1) * 25 + 1}-
            {Math.min(currentPage * 25, totalCount)} of {totalCount} clients
          </Text>
        ) : (
          <Text size="sm">No clients found</Text>
        )}

        <Pagination
          ml="auto"
          total={Math.ceil(totalCount / 25) || 1}
          value={currentPage}
          onChange={setCurrentPage}
        />
      </Group>
    </Flex>
  );
}
