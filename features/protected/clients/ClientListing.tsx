"use client";

import { useState } from "react";

import { Flex, Group, TextInput } from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";

import DataTable from "@/components/data-table/DataTable";
import { useGetUsersQuery } from "@/store/services/userService";
import UpgradeSubscriptionModal from "@/components/clients/modals/UpgradeSubscriptionModal";
import {
  ClientRow,
  createClientColumns,
} from "@/components/data-table/columns/ClientColumns";
import dayjs from "dayjs";
import DowngradeSubscriptionModal from "@/components/clients/modals/DowngradeSubscriptionModal";
import DeleteUserModal from "@/components/Common/modal/DeleteUserModal";

export default function ClientListing() {
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [upgradeModal, { open: openUpgradeModal, close: closeUpgradeModal }] =
    useDisclosure(false);

  const [
    downgradeModal,
    { open: openDowngradeModal, close: closeDowngradeModal },
  ] = useDisclosure(false);

  const [
    isDeleteUserModalOpen,
    { open: openDeleteUserModal, close: closeDeleteUserModal },
  ] = useDisclosure(false);

  const handleActionClick = (client: ClientRow) => {
    const subscription = client?.metadata?.subscription;
    const subscriptionEndDate = subscription?.subscribedEndDate;

    const isSubscribed =
      subscriptionEndDate &&
      dayjs(subscriptionEndDate).endOf("day").isAfter(dayjs());

    setSelectedClient(client);

    if (isSubscribed) openDowngradeModal();
    else openUpgradeModal();
  };

  const handleOnDeleteclick = (client: ClientRow) => {
    setSelectedClient(client);
    openDeleteUserModal();
  };

  const clientColumns = createClientColumns(
    handleActionClick,
    handleOnDeleteclick,
  );

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

        <DataTable
          columns={clientColumns}
          useQuery={useGetUsersQuery}
          queryArgs={{
            organization_id: "client",
            search: debouncedSearch,
          }}
        />
      </Flex>

      <UpgradeSubscriptionModal
        opened={upgradeModal}
        onClose={closeUpgradeModal}
        clientDetails={selectedClient}
      />

      <DowngradeSubscriptionModal
        opened={downgradeModal}
        onClose={closeDowngradeModal}
        clientDetails={selectedClient}
      />

      <DeleteUserModal
        opened={isDeleteUserModalOpen}
        user={selectedClient}
        onClose={closeDeleteUserModal}
      />
    </>
  );
}
