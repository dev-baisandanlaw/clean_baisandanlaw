"use client";

import { Attorney } from "@/types/user";

import { Button, Flex, Tabs, TextInput } from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useGetUsersQuery } from "@/store/services/userService";
import DataTable from "@/components/data-table/DataTable";
import { attorneyColumns } from "@/components/data-table/columns/AttorneyColumns";

export default function AttorneyListing() {
  const shrink = useMediaQuery("(max-width: 768px)");

  const [selectedAtty, setSelectedAtty] = useState<Attorney | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  type StatusTab = "Active" | "Banned";
  const [statusTab, setStatusTab] = useState<StatusTab>("Active");

  const [
    isAddAttorneyModalOpen,
    { open: openAddAttorneyModal, close: closeAddAttorneyModal },
  ] = useDisclosure(false);

  const [
    isBanAttorneyModalOpen,
    { open: openBanAttorneyModal, close: closeBanAttorneyModal },
  ] = useDisclosure(false);

  const [
    isUnbanAttorneyModalOpen,
    { open: openUnbanAttorneyModal, close: closeUnbanAttorneyModal },
  ] = useDisclosure(false);

  return (
    <>
      <Flex
        w="100%"
        h="100%"
        gap={16}
        px={{ sm: 12, md: 0 }}
        direction="column"
      >
        <Flex
          align="stretch"
          direction={shrink ? "column-reverse" : "row"}
          gap={16}
          w="100%"
        >
          <TextInput
            placeholder="Search name, email"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            size="sm"
            leftSection={<IconCirclePlus />}
            onClick={openAddAttorneyModal}
          >
            Add Attorney
          </Button>
        </Flex>

        <Tabs
          value={statusTab}
          onChange={(v) => setStatusTab((v as StatusTab) ?? "Active")}
        >
          <Tabs.List>
            <Tabs.Tab value="Active">Active</Tabs.Tab>
            <Tabs.Tab value="Banned">Banned</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <DataTable
          columns={attorneyColumns}
          useQuery={useGetUsersQuery}
          queryArgs={{
            organization_id: "attorney",
            page: 1,
            search: debouncedSearch,
            banned: statusTab === "Active" ? "false" : "true",
          }}
        />
      </Flex>

      {/* <AddAttorneyModal
        opened={isAddAttorneyModalOpen}
        onClose={closeAddAttorneyModal}
        setIsDataChanged={setIsDataChanged}
      />

      <BanAttorneyModal
        opened={isBanAttorneyModalOpen}
        userDetails={selectedAtty}
        onClose={closeBanAttorneyModal}
        setDataChanged={setIsDataChanged}
      />

      <UnbanAttorneyModal
        opened={isUnbanAttorneyModalOpen}
        userDetails={selectedAtty}
        onClose={closeUnbanAttorneyModal}
        setDataChanged={setIsDataChanged}
      /> */}
    </>
  );
}
