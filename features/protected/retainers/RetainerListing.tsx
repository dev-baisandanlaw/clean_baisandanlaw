"use client";
import {
  ActionIcon,
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
import { IconCirclePlus, IconEye, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import AddRetainerModal from "@/components/retainers/modals/AddRetainerModal";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import { AppwriteRetainersDocument } from "@/types/appwriteResponses";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { listDatabaseDocuments } from "@/app/api/appwrite";
import dayjs from "dayjs";

export default function RetainerListing() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const theme = useMantineTheme();

  const [dataChanged, setDataChanged] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [retainers, setRetainers] = useState<AppwriteRetainersDocument[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [
    retainerModal,
    { open: openRetainerModal, close: closeRetainerModal },
  ] = useDisclosure(false);

  const fetchRetainers = async (search: string, page: number = 1) => {
    if (!user) return;

    setIsFetching(true);

    const userRole = user.unsafeMetadata?.role;

    if (
      // user is a client
      userRole === "client" &&
      // @ts-expect-error - user is a client
      (!user?.unsafeMetadata?.subscription?.subscribedEndDate ||
        // subscription is still valid
        dayjs().isAfter(
          // @ts-expect-error - user is a client
          dayjs(user?.unsafeMetadata?.subscription?.subscribedEndDate).endOf(
            "day"
          )
        ))
    ) {
      appNotifications.clean();
      appNotifications.cleanQueue();
      appNotifications.error({
        title: "Subscription Required",
        message: "You need to subscribe to a plan to access this feature.",
      });
      router.push("/appointments");
      return;
    }

    const limit = 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [Query.limit(limit), Query.offset(offset)];

    if (userRole === "client") {
      queries.push(
        Query.equal("contactPersonEmail", user.emailAddresses[0].emailAddress)
      );
    }

    if (search && search.trim().length > 0) {
      queries.push(Query.search("search_blob", search.trim()));
    }

    await listDatabaseDocuments("retainers", queries)
      .then(({ documents, total }) => {
        setRetainers(documents as unknown as AppwriteRetainersDocument[]);

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
    if (!isLoaded) return;

    fetchRetainers(debouncedSearch, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, debouncedSearch, currentPage, dataChanged, isLoaded]);

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
            minWidth={500}
            h="calc(100vh - 220px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Contact Person</Table.Th>
                  <Table.Th>Matter Type</Table.Th>
                  <Table.Th>Retainer Since</Table.Th>
                  <Table.Th>Last Update</Table.Th>
                  <Table.Th ta="center">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!isFetching && !retainers?.length && (
                  <EmptyTableComponent
                    colspan={6}
                    message="No retainers found"
                  />
                )}

                {!isFetching &&
                  retainers &&
                  retainers.length > 0 &&
                  retainers.map((retainer) => (
                    <Table.Tr key={retainer.$id}>
                      <Table.Td>{retainer.client}</Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm">{retainer.contactPersonName}</Text>
                          <Text size="xs" c="dimmed">
                            {retainer.contactPersonEmail}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td width={250}>
                        <Group gap={2}>
                          {retainer.matterType?.split("&_&").map((area, i) => (
                            <Badge
                              size="xs"
                              key={i}
                              variant="outline"
                              radius="xs"
                              color={theme.other.customPumpkin}
                            >
                              {area}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>{retainer.retainerSince}</Table.Td>
                      <Table.Td>
                        {getDateFormatDisplay(retainer.$updatedAt, true)}
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon
                          size="sm"
                          variant="transparent"
                          component="a"
                          href={`/retainers/${retainer.$id}`}
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
                Showing {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                Retainers
              </Text>
            ) : (
              <Text size="sm">No retainers found</Text>
            )}

            <Pagination
              ml="auto"
              total={Math.ceil(totalCount / 10) || 1}
              value={currentPage}
              onChange={setCurrentPage}
            />
          </Group>
        </Paper>
      </Flex>

      <AddRetainerModal
        opened={retainerModal}
        onClose={closeRetainerModal}
        setIsDataChanged={setDataChanged}
      />
    </>
  );
}
