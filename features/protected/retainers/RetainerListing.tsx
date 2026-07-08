"use client";

import { useState } from "react";

import { Button, Flex, TextInput } from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

import AddRetainerModal from "@/components/retainers/modals/AddRetainerModal";

import { useGetAllRetainersQuery } from "@/store/services/retainerService";
import DataTable from "@/components/data-table/DataTable";
import { retainerColumns } from "@/components/data-table/columns/RetainerColumns";
import { useRouteErrorNotification } from "@/utils/notifications/useRouteErrorNotification";

export default function RetainerListing() {
  useRouteErrorNotification({ entity: "retainer" });

  const shrink = useMediaQuery("(max-width: 768px)");
  const { user, isLoaded, isSignedIn } = useUser();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [
    retainerModal,
    { open: openRetainerModal, close: closeRetainerModal },
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
            placeholder="Search client, contact person"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {!!user && isLoaded && user?.unsafeMetadata?.role === "admin" && (
            <Button
              size="sm"
              leftSection={<IconCirclePlus />}
              onClick={openRetainerModal}
            >
              New Retainer Client
            </Button>
          )}
        </Flex>

        <DataTable
          columns={retainerColumns}
          useQuery={useGetAllRetainersQuery}
          queryArgs={{ search: debouncedSearch }}
          queryOptions={{ skip: !isLoaded || !isSignedIn }}
        />
      </Flex>

      <AddRetainerModal opened={retainerModal} onClose={closeRetainerModal} />
    </>
  );
}
