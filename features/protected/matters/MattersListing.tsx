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
import { IconCirclePlus, IconEye, IconSearch } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import { Query } from "appwrite";

import { listDatabaseDocuments } from "@/app/api/appwrite";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import AddMatterModal from "@/components/matter/modals/AddMatterModal";

import { AppwriteMatterDocument } from "@/types/appwriteResponses";
import { AreaBadge } from "@/components/Common/BadgeComp";

export default function MattersListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { user } = useUser();

  const [matters, setMatters] = useState<AppwriteMatterDocument[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [
    isAddMatterModalOpen,
    { open: openAddMatterModal, close: closeAddMatterModal },
  ] = useDisclosure(false);

  const fetchMattersFromAppwrite = async (search: string, page: number = 1) => {
    if (!user) return;

    setIsFetching(true);
    const userRole = user.unsafeMetadata?.role;
    const limit = 25;
    const offset = (page - 1) * limit;

    const queries: string[] = [Query.limit(limit), Query.offset(offset)];
    queries.push(Query.orderDesc("$updatedAt"));

    if (userRole === "attorney") {
      queries.push(Query.equal("leadAttorneyId", user.id));
    } else if (userRole === "client") {
      queries.push(Query.equal("clientId", user.id));
    }

    if (search && search.trim().length > 0) {
      queries.push(Query.search("search_blob", search.trim()));
    }

    await listDatabaseDocuments("matters", queries)
      .then(({ documents, total }) => {
        setMatters(documents as unknown as AppwriteMatterDocument[]);

        setTotalCount(total);
      })
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchMattersFromAppwrite(debouncedSearch, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, debouncedSearch, currentPage]);

  const renderTableHeaders = () => {
    if (user?.unsafeMetadata?.role !== "client") {
      return (
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Matter #</Table.Th>
            <Table.Th>Attorney</Table.Th>
            <Table.Th>Client</Table.Th>
            <Table.Th>Matter Type</Table.Th>
            {/* <Table.Th>Involved Attorneys</Table.Th> */}
            <Table.Th>Date Created</Table.Th>
            <Table.Th>Date Updated</Table.Th>
            <Table.Th ta="center">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
      );
    }

    return (
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Matter #</Table.Th>
          <Table.Th>Lead Attorney</Table.Th>
          <Table.Th>Case Type</Table.Th>
          {/* <Table.Th>Involved Attorneys</Table.Th> */}
          <Table.Th>Created At</Table.Th>
          <Table.Th ta="center">Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
    );
  };

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
            placeholder="Search matter number, lead attorney, client, or matter type"
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

        <Paper withBorder shadow="sm" px={16} py={8} pos="relative">
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
            h="calc(100vh - 200px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              {renderTableHeaders()}

              <Table.Tbody>
                {!isFetching && !matters?.length && (
                  <EmptyTableComponent
                    colspan={user?.unsafeMetadata?.role !== "client" ? 8 : 7}
                  />
                )}

                {matters &&
                  matters.length > 0 &&
                  matters.map((matter) => (
                    <Table.Tr key={matter.$id}>
                      <Table.Td>{matter.matterNumber}</Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {matter.leadAttorneyFirstName}{" "}
                          {matter.leadAttorneyLastName}
                        </Text>
                      </Table.Td>
                      {user?.unsafeMetadata?.role !== "client" && (
                        <Table.Td>
                          {matter.clientFirstName} {matter.clientLastName}
                        </Table.Td>
                      )}
                      <Table.Td width={200}>
                        <Group gap={2}>
                          {matter.matterType
                            ?.split("&_&")
                            ?.slice(0, 3)
                            .map((type) => (
                              <AreaBadge key={type} area={type} />
                            ))}
                          {matter.matterType?.split("&_&")?.length > 3 && (
                            <AreaBadge
                              area={`+${matter.matterType?.split("&_&")?.length - 3}`}
                            />
                          )}
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        {getDateFormatDisplay(matter.$createdAt, true)}
                      </Table.Td>
                      <Table.Td>
                        {getDateFormatDisplay(matter.$updatedAt, true)}
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon
                          size="sm"
                          variant="transparent"
                          component="a"
                          href={`/matters/${matter.$id}`}
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
            justify={shrink ? "center" : "space-between"}
            w="100%"
          >
            {totalCount > 0 ? (
              <Text size="sm">
                Showing {(currentPage - 1) * 25 + 1}-
                {Math.min(currentPage * 25, totalCount)} of {totalCount} Matters
              </Text>
            ) : (
              <Text size="sm">No matters found</Text>
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

      <AddMatterModal
        onClose={closeAddMatterModal}
        opened={isAddMatterModalOpen}
      />
    </>
  );
}
