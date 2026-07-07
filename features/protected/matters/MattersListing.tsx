"use client";

import { useState } from "react";

import { Button, Flex, TextInput } from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import { useAuth, useUser } from "@clerk/nextjs";

import AddMatterModal from "@/components/matter/modals/AddMatterModal";

import { useGetAllMattersQuery } from "@/store/services/matterService";
import DataTable from "@/components/data-table/DataTable";
import { matterColumns } from "@/components/data-table/columns/MatterColumns";
import { useRouteErrorNotification } from "@/utils/notifications/useRouteErrorNotification";

export default function MattersListing() {
  useRouteErrorNotification({ entity: "matter" });

  const shrink = useMediaQuery("(max-width: 768px)");

  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [
    isAddMatterModalOpen,
    { open: openAddMatterModal, close: closeAddMatterModal },
  ] = useDisclosure(false);

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
            placeholder="Search matter number, attorney, client, areas"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {user?.unsafeMetadata?.role === "admin" && (
            <Button
              leftSection={<IconCirclePlus />}
              size="sm"
              onClick={openAddMatterModal}
            >
              New Matter
            </Button>
          )}
        </Flex>

        <DataTable
          columns={matterColumns}
          useQuery={useGetAllMattersQuery}
          queryArgs={{ search: debouncedSearch }}
          queryOptions={{
            skip: !isLoaded || !isSignedIn,
          }}
        />
      </Flex>

      <AddMatterModal
        onClose={closeAddMatterModal}
        opened={isAddMatterModalOpen}
      />
    </>
  );
}
