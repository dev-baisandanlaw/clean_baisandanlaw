"use client";

import { useEffect, useState } from "react";

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
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import {
  IconBuilding,
  IconCirclePlus,
  IconEye,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import AddRetainerModal from "@/components/retainers/modals/AddRetainerModal";

import { useGetAllRetainersQuery } from "@/store/services/retainerService";
import Link from "next/link";

export default function RetainerListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { user, isLoaded, isSignedIn } = useUser();

  const { data: retainerList, isLoading: isLoadingRetainerList } =
    useGetAllRetainersQuery(undefined, {
      skip: !isLoaded || !isSignedIn,
    });

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [clientTypeFilter, setClientTypeFilter] = useState<string | null>(
    "all",
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount] = useState(0);

  const [
    retainerModal,
    { open: openRetainerModal, close: closeRetainerModal },
  ] = useDisclosure(false);

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientTypeFilter]);

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
            placeholder="Search client, contact person, or matter type"
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

        <Tabs value={clientTypeFilter} onChange={setClientTypeFilter}>
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="individual">Individual</Tabs.Tab>
            <Tabs.Tab value="company">Company</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Paper withBorder shadow="sm" px={16} py={8} pos="relative">
          {isLoadingRetainerList && (
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
            h="calc(100vh - 252px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Contact Person</Table.Th>
                  <Table.Th>Retainer Since</Table.Th>
                  <Table.Th>Last Update</Table.Th>
                  <Table.Th ta="center">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!isLoadingRetainerList &&
                  retainerList &&
                  !retainerList?.length && (
                    <EmptyTableComponent
                      colspan={6}
                      message="No retainers found"
                    />
                  )}

                {!isLoadingRetainerList &&
                  retainerList &&
                  retainerList?.length > 0 &&
                  retainerList.map((retainer) => (
                    <Table.Tr key={retainer.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          {retainer?.clientType === "individual" ? (
                            <IconUser />
                          ) : (
                            <IconBuilding />
                          )}
                          <Text size="sm">{retainer.clientName}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm">
                            {retainer.contactPerson.fullname}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {retainer.contactPerson.email}
                          </Text>
                        </Stack>
                      </Table.Td>
                      {/* <Table.Td width={250}>
                        <Group gap={2}>
                          {retainer.areas?.map((area) => (
                            <AreaBadge area={area} key={area} />
                          ))}
                        </Group>
                      </Table.Td> */}
                      <Table.Td>
                        {getDateFormatDisplay(retainer.retainerSince)}
                      </Table.Td>
                      <Table.Td>
                        {getDateFormatDisplay(retainer.updatedAt, true)}
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon
                          size="sm"
                          variant="transparent"
                          component={Link}
                          href={`/retainers/${retainer.id}`}
                        >
                          <IconEye size={24} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
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
                {Math.min(currentPage * 25, totalCount)} of {totalCount}{" "}
                Retainers
              </Text>
            ) : (
              <Text size="sm">No retainers found</Text>
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

      <AddRetainerModal opened={retainerModal} onClose={closeRetainerModal} />
    </>
  );
}
