"use client";
import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Group,
  LoadingOverlay,
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
import { useDisclosure } from "@mantine/hooks";
import AddRetainerModal from "@/components/retainers/modals/AddRetainerModal";
import { toast } from "react-toastify";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { Retainer } from "@/types/retainer";

export default function RetainerListing() {
  const theme = useMantineTheme();

  const [dataChanged, setDataChanged] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [retainers, setRetainers] = useState<Retainer[]>([]);

  const [
    retainerModal,
    { open: openRetainerModal, close: closeRetainerModal },
  ] = useDisclosure(false);

  const fetchRetainers = async () => {
    setIsFetching(true);
    try {
      const q = query(collection(db, COLLECTIONS.RETAINERS));
      const querySnapshot = await getDocs(q);
      const r = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Retainer[];

      setRetainers(r);
    } catch {
      toast.error("Failed to fetch retainers");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchRetainers();
  }, [dataChanged]);

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
            // value={search}
            // onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            variant="outline"
            leftSection={<IconCirclePlus />}
            onClick={openRetainerModal}
          >
            New Retainer Client
          </Button>
        </Group>

        <TableScrollContainer
          minWidth={500}
          h="calc(100vh - 180px)"
          pos="relative"
        >
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Client</Table.Th>
                <Table.Th>Contact Person</Table.Th>
                <Table.Th>Matter Type</Table.Th>
                <Table.Th>Retainer Since</Table.Th>
                <Table.Th>Updated At</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {isFetching && (
                <Table.Tr>
                  <Table.Td h="100%">
                    <LoadingOverlay visible />
                  </Table.Td>
                </Table.Tr>
              )}

              {!isFetching && !retainers?.length && (
                <EmptyTableComponent colspan={5} message="No retainers found" />
              )}

              {!isFetching &&
                retainers &&
                retainers.length > 0 &&
                retainers.map((retainer) => (
                  <Table.Tr key={retainer.id}>
                    <Table.Td>{retainer.clientName}</Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">{retainer.contactPerson.fullname}</Text>
                        <Text size="xs" c="dimmed">
                          {retainer.contactPerson.email}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={2}>
                        {retainer.practiceAreas.map((area, i) => (
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
                    <Table.Td>{retainer.updatedAt}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        size="sm"
                        variant="transparent"
                        component="a"
                        href={`/retainers/${retainer.id}`}
                      >
                        <IconEye size={24} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              {/* 
              {retainers &&
                retainers
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((notaryRequest) => (
                    <Table.Tr key={notaryRequest.id}>
                      {user?.unsafeMetadata?.role !== "client" && (
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm" fw={600} c="green">
                              {notaryRequest.requestor.fullname}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {notaryRequest.requestor.email}
                            </Text>
                          </Stack>
                        </Table.Td>
                      )}
                      <Table.Td>
                        {getDateFormatDisplay(notaryRequest.createdAt, true)}
                      </Table.Td>
                      <Table.Td>
                        {getNotaryStatus(notaryRequest.status)}
                      </Table.Td>

                      <Table.Td>
                        <Menu
                          width={200}
                          shadow="lg"
                          withArrow
                          styles={{ dropdown: { fontWeight: 600 } }}
                        >
                          <Menu.Target>
                            <ActionIcon variant="outline" size={24}>
                              <IconDots size={24} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Sub>
                              <Menu.Sub.Target>
                                <Menu.Sub.Item
                                  leftSection={<IconDownload size={16} />}
                                  disabled={
                                    !notaryRequest.document &&
                                    !notaryRequest.finishedDocument
                                  }
                                >
                                  Download
                                </Menu.Sub.Item>
                              </Menu.Sub.Target>

                              <Menu.Sub.Dropdown>
                                <Menu.Item
                                  disabled={!notaryRequest.document}
                                  onClick={() => {
                                    appwriteDownloadFile(
                                      notaryRequest.document!.id
                                    );
                                  }}
                                >
                                  Initial File
                                </Menu.Item>
                                <Menu.Item
                                  disabled={!notaryRequest.finishedDocument}
                                  onClick={() => {
                                    appwriteDownloadFile(
                                      notaryRequest.finishedDocument!.id
                                    );
                                  }}
                                >
                                  Finished File
                                </Menu.Item>
                              </Menu.Sub.Dropdown>
                            </Menu.Sub>

                            <Menu.Item
                              leftSection={<IconEye size={16} />}
                              onClick={() => {
                                setSelectedNotaryRequest(notaryRequest);
                                openViewNotaryRequestDrawer();
                              }}
                            >
                              View
                            </Menu.Item>

                            {user?.unsafeMetadata?.role === "client" &&
                              !disableActions("edit", notaryRequest) && (
                                <Menu.Item
                                  leftSection={<IconPencil size={16} />}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openUpsertNotaryRequestModal();
                                  }}
                                >
                                  Edit
                                </Menu.Item>
                              )}

                            {user?.unsafeMetadata?.role !== "client" && (
                              <>
                                {!disableActions("process", notaryRequest) && (
                                  <Menu.Item
                                    c="blue.5"
                                    onClick={() => {
                                      setSelectedNotaryRequest(notaryRequest);
                                      openReviewNotaryRequestModal();
                                    }}
                                    leftSection={<IconTools size={16} />}
                                  >
                                    Process
                                  </Menu.Item>
                                )}

                                {!disableActions("notarize", notaryRequest) && (
                                  <Menu.Item
                                    c="green"
                                    onClick={() => {
                                      setSelectedNotaryRequest(notaryRequest);
                                      openApproveNotaryRequestModal();
                                    }}
                                    leftSection={<IconRubberStamp size={16} />}
                                  >
                                    Notarize
                                  </Menu.Item>
                                )}

                                {!disableActions("reject", notaryRequest) && (
                                  <Menu.Item
                                    c="red"
                                    onClick={() => {
                                      setSelectedNotaryRequest(notaryRequest);
                                      openRejectNotaryRequestModal();
                                    }}
                                    leftSection={<IconX size={16} />}
                                  >
                                    Reject
                                  </Menu.Item>
                                )}

                                {!disableActions(
                                  "for_pickup",
                                  notaryRequest
                                ) && (
                                  <Menu.Item
                                    c="purple"
                                    onClick={() => {
                                      setSelectedNotaryRequest(notaryRequest);
                                      openConfirmationModal();
                                    }}
                                    leftSection={<IconPackage size={16} />}
                                  >
                                    Ready for Pickup
                                  </Menu.Item>
                                )}

                                {!disableActions(
                                  "completed",
                                  notaryRequest
                                ) && (
                                  <Menu.Item
                                    c="green"
                                    onClick={() => {
                                      setSelectedNotaryRequest(notaryRequest);
                                      openConfirmationModal();
                                    }}
                                    leftSection={<IconFileCheck size={16} />}
                                  >
                                    Complete
                                  </Menu.Item>
                                )}
                              </>
                            )}

                            {user?.unsafeMetadata?.role === "client" &&
                              !disableActions("review", notaryRequest) && (
                                <Menu.Item
                                  c="green"
                                  leftSection={<IconTextScan2 size={16} />}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openClientReviewModal();
                                  }}
                                >
                                  Review
                                </Menu.Item>
                              )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))} */}
            </Table.Tbody>
          </Table>
        </TableScrollContainer>
      </Flex>

      <AddRetainerModal
        opened={retainerModal}
        onClose={closeRetainerModal}
        setIsDataChanged={setDataChanged}
      />
    </>
  );
}
