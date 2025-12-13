"use client";

import { AddAttorneyModal } from "@/components/attorneys/modals/AddAttorneyModal";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import { CLERK_ORG_IDS } from "@/constants/constants";
import { Attorney } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";

import {
  Badge,
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
  useMantineTheme,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";

export default function AttorneyListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const theme = useMantineTheme();

  const [isDataChanged, setIsDataChanged] = useState(false);

  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [
    isAddAttorneyModalOpen,
    { open: openAddAttorneyModal, close: closeAddAttorneyModal },
  ] = useDisclosure(false);

  const fetchAttorneys = async (searchTerm: string, page: number) => {
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
      const { data } = await axios.get<Attorney[]>(
        "/api/clerk/organization/fetch",
        {
          params: {
            organization_id: CLERK_ORG_IDS.attorney,
            limit: 10,
            offset: (page - 1) * 10,
            search: searchTerm.trim(),
          },
        }
      );

      setAttorneys(data);
    } catch {
      appNotifications.error({
        title: "Failed to fetch attorneys",
        message: "The attorneys could not be fetched. Please try again.",
      });

      setAttorneys([]);
      setTotalCount(0);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchTotalCount = useCallback(async (searchTerm: string) => {
    const { data } = await axios.get("/api/clerk/fetch-total-count", {
      params: {
        organization_id: CLERK_ORG_IDS.attorney,
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

    fetchAttorneys(debouncedSearch, currentPage);
    fetchTotalCount(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, currentPage, isDataChanged, isLoaded]);

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
                  <Table.Th>Practice Area</Table.Th>
                  <Table.Th>Account Created</Table.Th>
                  <Table.Th>Involved Cases</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!isFetching && !attorneys?.length && (
                  <EmptyTableComponent
                    colspan={5}
                    message="No attorneys found"
                  />
                )}

                {!isFetching &&
                  attorneys &&
                  attorneys.map((attorney) => (
                    <Table.Tr key={attorney.id}>
                      <Table.Td>
                        {attorney.first_name + " " + attorney.last_name}
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm">
                            {attorney.email_addresses[0].email_address}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {attorney.unsafe_metadata.phoneNumber}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={2}>
                          {attorney.unsafe_metadata.practiceAreas?.map(
                            (area, index) => (
                              <Badge
                                size="xs"
                                key={index}
                                variant="outline"
                                radius="xs"
                                color={theme.other.customPumpkin}
                              >
                                {area}
                              </Badge>
                            )
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {getDateFormatDisplay(attorney.created_at, true)}
                      </Table.Td>
                      <Table.Td>
                        {attorney.unsafe_metadata.involvedCases || 0}
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
                Showing {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                Attorneys
              </Text>
            ) : (
              <Text size="sm">No attorneys found</Text>
            )}

            <Pagination
              ml={shrink ? 0 : "auto"}
              total={Math.ceil(totalCount / 10) || 1}
              value={currentPage}
              onChange={setCurrentPage}
            />
          </Flex>
        </Paper>
      </Flex>

      <AddAttorneyModal
        opened={isAddAttorneyModalOpen}
        onClose={closeAddAttorneyModal}
        setIsDataChanged={setIsDataChanged}
      />
    </>
  );
}
