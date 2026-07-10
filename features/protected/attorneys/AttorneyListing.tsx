"use client";

import { Button, Flex, TextInput } from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useGetUsersQuery } from "@/store/services/userService";
import DataTable from "@/components/data-table/DataTable";
import {
  AttorneyRow,
  createAttorneyColumns,
} from "@/components/data-table/columns/AttorneyColumns";
import { AddAttorneyModal } from "@/components/attorneys/modals/AddAttorneyModal";
import BanAttorneyModal from "@/components/attorneys/modals/BanAttorneyModal";
import UnbanAttorneyModal from "@/components/attorneys/modals/UnbanAttorneyModal";
import DeleteUserModal from "@/components/Common/modal/DeleteUserModal";
import { UpdateAttorneyModal } from "@/components/attorneys/modals/UpdateAttorneyModal";

export default function AttorneyListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { isLoaded, isSignedIn } = useAuth();

  const [selectedAtty, setSelectedAtty] = useState<AttorneyRow | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

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

  const [
    isUpdateAttorneyModalOpen,
    { open: openUpdateAttorneyModal, close: closeUpdateAttorneyModal },
  ] = useDisclosure(false);

  const [
    isDeleteUserModalOpen,
    { open: openDeleteUserModal, close: closeDeleteUserModal },
  ] = useDisclosure(false);

  const handleOnBanClick = (row: AttorneyRow) => {
    setSelectedAtty(row);
    if (row?.metadata?.banned) openUnbanAttorneyModal();
    else openBanAttorneyModal();
  };

  const handleOnUpdateClick = (row: AttorneyRow) => {
    setSelectedAtty(row);
    openUpdateAttorneyModal();
  };

  const handleOnDeleteClick = (row: AttorneyRow) => {
    setSelectedAtty(row);
    openDeleteUserModal();
  };

  const columns = createAttorneyColumns(
    handleOnBanClick,
    handleOnUpdateClick,
    handleOnDeleteClick,
  );

  return (
    <>
      <Flex w="100%" h="100%" gap={8} px={{ sm: 12, md: 0 }} direction="column">
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

        <DataTable
          columns={columns}
          useQuery={useGetUsersQuery}
          queryArgs={{
            organization_id: "attorney",
            search: debouncedSearch,
          }}
          queryOptions={{ skip: !isLoaded || !isSignedIn }}
        />
      </Flex>

      <AddAttorneyModal
        opened={isAddAttorneyModalOpen}
        onClose={closeAddAttorneyModal}
      />

      <BanAttorneyModal
        opened={isBanAttorneyModalOpen}
        userDetails={selectedAtty}
        onClose={closeBanAttorneyModal}
      />

      <UnbanAttorneyModal
        opened={isUnbanAttorneyModalOpen}
        userDetails={selectedAtty}
        onClose={closeUnbanAttorneyModal}
      />

      <UpdateAttorneyModal
        opened={isUpdateAttorneyModalOpen}
        user={selectedAtty}
        onClose={closeUpdateAttorneyModal}
      />

      <DeleteUserModal
        opened={isDeleteUserModalOpen}
        user={selectedAtty}
        onClose={closeDeleteUserModal}
      />
    </>
  );
}
