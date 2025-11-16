"use client";

import EmptyTableComponent from "@/components/EmptyTableComponent";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";

import {
  Badge,
  Flex,
  Group,
  Pagination,
  Paper,
  Progress,
  Stack,
  Table,
  TableScrollContainer,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export default function ClientListing() {
  const theme = useMantineTheme();

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
            search: searchTerm.trim(),
          },
        }
      );

      setClients(data);
    } catch {
      appNotifications.error({
        title: "Failed to fetch clients",
        message: "The clients could not be fetched. Please try again.",
      });

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
        search: searchTerm.trim(),
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
          placeholder="Search name, email"
          flex={1}
          leftSectionPointerEvents="none"
          leftSection={<IconSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Group>

      <Paper withBorder shadow="sm" p={16} pos="relative">
        {isFetching && (
          <Progress
            value={100}
            animated
            pos="absolute"
            top={0}
            left={0}
            right={0}
            radius="xs"
          />
        )}
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
                <Table.Th>Subscription</Table.Th>
                <Table.Th>Subscribed Until</Table.Th>
                <Table.Th>Member Since</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {!isFetching && !clients?.length && (
                <EmptyTableComponent colspan={5} />
              )}

              {!isFetching &&
                clients &&
                clients.map((client) => (
                  <Table.Tr key={client.id}>
                    <Table.Td>
                      {client.first_name + " " + client.last_name}
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">
                          {client.email_addresses[0].email_address}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {client.unsafe_metadata.phoneNumber}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        radius="xs"
                        color={
                          client.unsafe_metadata.subscription?.isSubscribed
                            ? "green"
                            : theme.colors.gray[6]
                        }
                      >
                        {client.unsafe_metadata.subscription?.isSubscribed
                          ? "Premium"
                          : "Basic"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {client.unsafe_metadata.subscription?.subscribedEndDate
                        ? getDateFormatDisplay(
                            client.unsafe_metadata.subscription
                              ?.subscribedEndDate,
                            true
                          )
                        : "-"}
                    </Table.Td>
                    <Table.Td>
                      {getDateFormatDisplay(client.created_at, true)}
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
              {Math.min(currentPage * 25, totalCount)} of {totalCount} clients
            </Text>
          ) : (
            <Text size="sm">No clients found</Text>
          )}

          <Pagination
            size="sm"
            ml="auto"
            total={Math.ceil(totalCount / 25) || 1}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      </Paper>
    </Flex>
  );
}
