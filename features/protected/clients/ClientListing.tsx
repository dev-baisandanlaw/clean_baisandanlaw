"use client";

import DeleteClientModal from "@/components/clients/modals/DeleteClientModal";
import DowngradeSubscriptionModal from "@/components/clients/modals/DowngradeSubscriptionModal";
import UpgradeSubscriptionModal from "@/components/clients/modals/UpgradeSubscriptionModal";
import SubscriptionBadge from "@/components/Common/SubscriptionBadge";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";

import {
  ActionIcon,
  Button,
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
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import {
  IconArrowBadgeDown,
  IconArrowBadgeUp,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "nextjs-toploader/app";

export default function ClientListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [dataChanged, setDataChanged] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [upgradeModal, { open: openUpgradeModal, close: closeUpgradeModal }] =
    useDisclosure(false);
  const [
    downgradeModal,
    { open: openDowngradeModal, close: closeDowngradeModal },
  ] = useDisclosure(false);
  const [
    deleteClientModal,
    { open: openDeleteClientModal, close: closeDeleteClientModal },
  ] = useDisclosure(false);

  const fetchClients = async (searchTerm: string, page: number) => {
    if (!user || !isLoaded) return;

    if (user.unsafeMetadata?.role !== "admin") {
      appNotifications.clean();
      appNotifications.cleanQueue();
      appNotifications.error({
        title: "Unauthorized",
        message: "You are not authorized to access this page.",
      });
      router.push("/appointments");
      return;
    }

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
  };

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
    if (!isLoaded) return;

    fetchClients(debouncedSearch, currentPage);
    fetchTotalCount(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, currentPage, isLoaded, dataChanged]);

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
            minWidth={800}
            h="calc(100vh - 220px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Contact</Table.Th>
                  <Table.Th>Member Since</Table.Th>
                  <Table.Th>Subscription</Table.Th>
                  <Table.Th>Subscribed Until</Table.Th>
                  <Table.Th ta="center">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!isFetching && !clients?.length && (
                  <EmptyTableComponent colspan={5} />
                )}

                {!isFetching &&
                  clients &&
                  clients.map((client) => {
                    const subscriptionEndDate =
                      client.unsafe_metadata.subscription?.subscribedEndDate;

                    const isSubscribed =
                      subscriptionEndDate &&
                      dayjs(subscriptionEndDate).endOf("day").isAfter(dayjs());

                    return (
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
                          {getDateFormatDisplay(client.created_at, true)}
                        </Table.Td>
                        <Table.Td>
                          <SubscriptionBadge
                            isSubscribed={isSubscribed || false}
                          />
                        </Table.Td>
                        <Table.Td>
                          {client.unsafe_metadata.subscription
                            ?.subscribedEndDate
                            ? getDateFormatDisplay(
                                client.unsafe_metadata.subscription
                                  ?.subscribedEndDate,
                                true
                              )
                            : "-"}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Button
                            styles={{ label: { marginLeft: -8 } }}
                            size="compact-sm"
                            color={isSubscribed ? "red" : "green"}
                            variant="filled"
                            leftSection={
                              isSubscribed ? (
                                <IconArrowBadgeDown size={20} />
                              ) : (
                                <IconArrowBadgeUp size={20} />
                              )
                            }
                            onClick={() => {
                              setSelectedClient(client);
                              if (isSubscribed) {
                                openDowngradeModal();
                              } else {
                                openUpgradeModal();
                              }
                            }}
                          >
                            {isSubscribed ? "Cancel" : "Upgrade"}
                          </Button>
                        </Table.Td>

                        {/* <Table.Td ta="center">
                          <ActionIcon
                            size="compact-sm"
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              setSelectedClient(client);
                              openDeleteClientModal();
                            }}
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </Table.Td> */}
                      </Table.Tr>
                    );
                  })}
              </Table.Tbody>
            </Table>
          </TableScrollContainer>

          <Flex
            align="center"
            direction={shrink ? "column" : "row"}
            gap={16}
            w="100%"
          >
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
              ml={shrink ? 0 : "auto"}
              total={Math.ceil(totalCount / 25) || 1}
              value={currentPage}
              onChange={setCurrentPage}
            />
          </Flex>
        </Paper>
      </Flex>

      <UpgradeSubscriptionModal
        opened={upgradeModal}
        onClose={closeUpgradeModal}
        clientDetails={selectedClient}
        setDataChanged={setDataChanged}
      />

      <DowngradeSubscriptionModal
        opened={downgradeModal}
        onClose={closeDowngradeModal}
        clientDetails={selectedClient}
        setDataChanged={setDataChanged}
      />

      <DeleteClientModal
        opened={deleteClientModal}
        onClose={closeDeleteClientModal}
        clientDetails={selectedClient}
        setDataChanged={setDataChanged}
      />
    </>
  );
}
