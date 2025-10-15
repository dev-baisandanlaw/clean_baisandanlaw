"use client";

import EmptyTableComponent from "@/components/EmptyTableComponent";
import AddMatterModal from "@/components/matter/modals/AddMatterModal";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { useUser } from "@clerk/nextjs";

import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Pagination,
  Table,
  TableScrollContainer,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconCirclePlus, IconEye, IconSearch } from "@tabler/icons-react";
import { collection, getDocs, or, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function MattersListing() {
  const theme = useMantineTheme();
  const { user } = useUser();

  const [matters, setMatters] = useState<Matter[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [
    isAddMatterModalOpen,
    { open: openAddMatterModal, close: closeAddMatterModal },
  ] = useDisclosure(false);

  const fetchMatters = async () => {
    if (!user) return;

    setIsFetching(true);
    try {
      let q;

      if (user.unsafeMetadata?.role === "attorney") {
        q = query(
          collection(db, COLLECTIONS.CASES),
          where("leadAttorney.id", "==", user.id)
          // or(
          //   where("leadAttorney.id", "==", user.id),
          //   where("involvedAttorneyIds", "array-contains", user.id)
          // )
        );
      } else if (user.unsafeMetadata?.role === "admin") {
        q = query(collection(db, COLLECTIONS.CASES));
      } else {
        q = query(
          collection(db, COLLECTIONS.CASES),
          where("clientData.id", "==", user.id)
        );
      }

      const querySnapshot = await getDocs(q);
      const m = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Matter[];

      setMatters(m);
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchMatters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const renderTableHeaders = () => {
    if (user?.unsafeMetadata?.role !== "client") {
      return (
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Matter #</Table.Th>
            <Table.Th>Lead Attorney</Table.Th>
            <Table.Th>Client</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Matter Type</Table.Th>
            {/* <Table.Th>Involved Attorneys</Table.Th> */}
            <Table.Th>Created At</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
      );
    }

    return (
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Matter #</Table.Th>
          <Table.Th>Lead Attorney</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Case Type</Table.Th>
          {/* <Table.Th>Involved Attorneys</Table.Th> */}
          <Table.Th>Created At</Table.Th>
          <Table.Th>Actions</Table.Th>
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
        <Group align="center" justify="space-between" w="100%">
          <TextInput
            placeholder="Search"
            w="300px"
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {user?.unsafeMetadata?.role === "admin" && (
            <Button
              leftSection={<IconCirclePlus />}
              size="sm"
              variant="outline"
              onClick={openAddMatterModal}
            >
              Add Matter
            </Button>
          )}
        </Group>

        <TableScrollContainer
          minWidth={500}
          h="calc(100vh - 220px)"
          pos="relative"
        >
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
            {renderTableHeaders()}

            <Table.Tbody>
              {isFetching && (
                <Table.Tr>
                  <Table.Td h="100%">
                    <LoadingOverlay visible />
                  </Table.Td>
                </Table.Tr>
              )}

              {!isFetching && !matters?.length && (
                <EmptyTableComponent
                  colspan={user?.unsafeMetadata?.role !== "client" ? 8 : 7}
                />
              )}

              {!isFetching &&
                matters &&
                matters.length > 0 &&
                matters.map((matter) => (
                  <Table.Tr key={matter.id}>
                    <Table.Td>{matter.caseNumber}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{matter.leadAttorney?.fullname}</Text>
                    </Table.Td>
                    {user?.unsafeMetadata?.role !== "client" && (
                      <Table.Td>{matter.clientData.fullname}</Table.Td>
                    )}
                    <Table.Td>
                      <Badge
                        size="xs"
                        radius="xs"
                        color={matter.status === "active" ? "green" : "red"}
                      >
                        {matter.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={2}>
                        {matter.caseType?.map((type) => (
                          <Badge
                            size="xs"
                            radius="xs"
                            variant="outline"
                            key={type}
                            color={theme.other.customPumpkin}
                          >
                            {type}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      {getDateFormatDisplay(matter.createdAt)}
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        size="sm"
                        variant="transparent"
                        component="a"
                        href={`/matters/${matter.id}`}
                      >
                        <IconEye size={24} />
                      </ActionIcon>
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
            <Text size="sm">No matters found</Text>
          )}

          <Pagination
            ml="auto"
            total={Math.ceil(totalCount / 25) || 1}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      </Flex>

      <AddMatterModal
        onClose={closeAddMatterModal}
        opened={isAddMatterModalOpen}
      />
    </>
  );
}
