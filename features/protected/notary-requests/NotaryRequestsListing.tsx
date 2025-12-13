"use client";

import EmptyTableComponent from "@/components/EmptyTableComponent";
// import DeleteNotaryRequestModal from "@/components/notary-requests/modals/DeleteNotaryRequestModal";
import { NOTARY_STEPS_ORDER } from "@/constants/constants";
import {
  NotaryRequestLabel,
  NotaryRequestStatus,
} from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus } from "@/utils/getNotaryStatus";
import { useUser } from "@clerk/nextjs";
import {
  Flex,
  TextInput,
  TableScrollContainer,
  Table,
  Button,
  Stack,
  Text,
  ActionIcon,
  Menu,
  Paper,
  Progress,
  Pagination,
  Tabs,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import {
  IconCirclePlus,
  IconDots,
  IconDownload,
  IconEye,
  IconFileCheck,
  IconPackage,
  IconPencil,
  IconRubberStamp,
  IconSearch,
  IconTextScan2,
  IconTools,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import RejectNotaryRequestModal from "@/components/notary-requests/modals/RejectNotaryRequestModal";
import { UpsertNotaryRequestModal } from "@/components/notary-requests/modals/UpsertNotaryRequest";
import { ViewNotaryRequestDrawer } from "@/components/notary-requests/drawer/ViewNotaryRequestDrawer";
import ReviewNotaryRequestModal from "@/components/notary-requests/modals/ReviewNotaryRequestModal";
import ApproveNotaryRequestModal from "@/components/notary-requests/modals/ApproveNotaryRequestModal";
import ClientReviewModal from "@/components/notary-requests/modals/ClientReviewModal";
import ConfirmationModal from "@/components/notary-requests/modals/ConfirmationModal";
import axios from "axios";
import { appNotifications } from "@/utils/notifications/notifications";
import { Query } from "appwrite";
import { listDatabaseDocuments } from "@/app/api/appwrite";
import { AppwriteNotaryRequestDocument } from "@/types/appwriteResponses";
import { useRouter, useSearchParams } from "next/navigation";
import classes from "@/app/custom-css/TabsCustomCss.module.css";

export default function NotaryRequestsListing() {
  const shrink = useMediaQuery("(max-width: 768px)");

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const idFromSearchParams = searchParams.get("id");

  useEffect(() => {
    if (isLoaded && idFromSearchParams) {
      setSearch(idFromSearchParams);
      router.replace("/notary-requests");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, idFromSearchParams]);

  const [notaryRequests, setNotaryRequests] = useState<
    AppwriteNotaryRequestDocument[]
  >([]);

  const [dataChanged, setDataChanged] = useState(false);

  const [isFetching, setIsFetching] = useState(false);

  const [activeTab, setActiveTab] = useState<NotaryRequestStatus | "All">(
    "All"
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotaryRequestsFromAppwrite = async (
    search: string,
    page: number = 1,
    status: NotaryRequestStatus | "All" = "All"
  ) => {
    if (!user) return;

    setIsFetching(true);
    const userRole = user.unsafeMetadata?.role;
    const limit = 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [Query.limit(limit), Query.offset(offset)];

    if (userRole === "client") {
      queries.push(
        Query.equal("requestorEmail", user.emailAddresses[0].emailAddress)
      );
    }

    if (search && search.trim().length > 0) {
      queries.push(Query.search("search_blob", search.trim()));
    }

    if (status !== "All") {
      queries.push(Query.equal("status", status));
    }

    await listDatabaseDocuments("notary_requests", queries)
      .then(({ documents, total }) => {
        setNotaryRequests(
          documents as unknown as AppwriteNotaryRequestDocument[]
        );

        setTotalCount(total);
      })
      .finally(() => setIsFetching(false));
  };

  const [
    isUpsertNotaryRequestModalOpen,
    {
      open: openUpsertNotaryRequestModal,
      close: closeUpsertNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isReviewNotaryRequestModalOpen,
    {
      open: openReviewNotaryRequestModal,
      close: closeReviewNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isViewNotaryRequestDrawerOpen,
    { open: openViewNotaryRequestDrawer, close: closeViewNotaryRequestDrawer },
  ] = useDisclosure(false);

  const [
    isRejectNotaryRequestModalOpen,
    {
      open: openRejectNotaryRequestModal,
      close: closeRejectNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isApproveNotaryRequestModalOpen,
    {
      open: openApproveNotaryRequestModal,
      close: closeApproveNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isClientReviewModalOpen,
    { open: openClientReviewModal, close: closeClientReviewModal },
  ] = useDisclosure(false);

  const [
    isConfirmationModalOpen,
    { open: openConfirmationModal, close: closeConfirmationModal },
  ] = useDisclosure(false);

  const [selectedNotaryRequest, setSelectedNotaryRequest] =
    useState<AppwriteNotaryRequestDocument | null>(null);

  const handleDownloadFile = async (fileId: string) => {
    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    const res = await axios.get(`/api/google/drive/download/${fileId}`, {
      responseType: "blob",
    });

    const disposition = res.headers["content-disposition"];
    const filenameMatch = disposition?.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );

    let filename = "download";
    if (filenameMatch?.[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
      try {
        filename = decodeURIComponent(filename);
      } catch {
        /* Empty */
      }
    }

    // Create and trigger download
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchNotaryRequestsFromAppwrite(debouncedSearch, currentPage, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, debouncedSearch, currentPage, dataChanged, activeTab]);

  const disableActions = (
    t:
      | "edit"
      | "process"
      | "notarize"
      | "reject"
      | "review"
      | "for_pickup"
      | "completed",
    notaryRequest: AppwriteNotaryRequestDocument
  ) => {
    const step =
      NOTARY_STEPS_ORDER[
        notaryRequest.status as keyof typeof NOTARY_STEPS_ORDER
      ];

    switch (t) {
      case "edit":
        // Disable once processing or beyond, except allow if already hard-rejected
        return step >= 2 && step !== -4;

      case "process":
        // Disable on/after processing, or if client rejected (and also if hard-rejected)
        return step >= 2 || step === -4;

      case "notarize":
        // Enable only while exactly in Processing
        return step !== 2;

      case "reject":
        // Disable if already client approved, client rejected, or hard-rejected
        return (
          step === 33 ||
          step === -33 ||
          step === -4 ||
          step === 3 ||
          step === 4 ||
          step === 5 ||
          step === 6
        );

      case "review":
        // Disable unless exactly For Client Review
        return step !== 3;

      case "for_pickup":
        return step !== 33;

      case "completed":
        return step !== 4;

      default:
        return false;
    }
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
            placeholder="Search ID, reference number, or requestor"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {user?.unsafeMetadata?.role === "client" && (
            <Button
              size="sm"
              leftSection={<IconCirclePlus />}
              onClick={() => {
                setSelectedNotaryRequest(null);
                openUpsertNotaryRequestModal();
              }}
            >
              New Request
            </Button>
          )}
        </Flex>

        <Tabs
          value={activeTab}
          onChange={(value) =>
            setActiveTab(value as NotaryRequestStatus | "All")
          }
          styles={{
            list: {
              flexWrap: "nowrap",
              overflowX: "auto",
              scrollbarWidth: "none",
            },
          }}
          classNames={{
            list: classes.tabsListCustom,
            tab: classes.tabsTabCustom,
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="All">All</Tabs.Tab>
            {Object.values(NotaryRequestStatus).map((status) => (
              <Tabs.Tab key={status} value={status}>
                {NotaryRequestLabel[status]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

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
            h="calc(100vh - 273px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={shrink ? 50 : "auto"}>ID</Table.Th>
                  <Table.Th>Reference Number</Table.Th>

                  {user?.unsafeMetadata?.role !== "client" && (
                    <Table.Th>Requestor</Table.Th>
                  )}
                  <Table.Th>Created At</Table.Th>
                  <Table.Th>Updated At</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="center">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!notaryRequests?.length && (
                  <EmptyTableComponent
                    colspan={user?.unsafeMetadata?.role === "client" ? 6 : 7}
                    message="No notary requests found"
                  />
                )}

                {notaryRequests &&
                  notaryRequests
                    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt))
                    .map((notaryRequest) => (
                      <Table.Tr key={notaryRequest.$id}>
                        <Table.Td w={shrink ? 50 : "auto"}>
                          <Text
                            truncate
                            maw={shrink ? 50 : "auto"}
                            size="sm"
                            fw={600}
                            c="green"
                          >
                            {notaryRequest.$id}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {notaryRequest?.referenceNumber ?? "-"}
                        </Table.Td>
                        {user?.unsafeMetadata?.role !== "client" && (
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm" fw={600} c="green">
                                {notaryRequest.requestorFullName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {notaryRequest.requestorEmail}
                              </Text>
                            </Stack>
                          </Table.Td>
                        )}

                        <Table.Td>
                          {getDateFormatDisplay(notaryRequest.$createdAt, true)}
                        </Table.Td>
                        <Table.Td>
                          {getDateFormatDisplay(notaryRequest.$updatedAt, true)}
                        </Table.Td>
                        <Table.Td>
                          {getNotaryStatus(
                            notaryRequest.status as NotaryRequestStatus
                          )}
                        </Table.Td>

                        <Table.Td ta="center">
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
                                      !notaryRequest.documentInitialFileId &&
                                      !notaryRequest.documentFinishedFileId
                                    }
                                  >
                                    Download
                                  </Menu.Sub.Item>
                                </Menu.Sub.Target>

                                <Menu.Sub.Dropdown>
                                  <Menu.Item
                                    disabled={
                                      !notaryRequest.documentInitialFileId
                                    }
                                    onClick={() =>
                                      handleDownloadFile(
                                        notaryRequest.documentInitialFileId
                                      )
                                    }
                                  >
                                    Initial File
                                  </Menu.Item>
                                  <Menu.Item
                                    disabled={
                                      !notaryRequest.documentFinishedFileId
                                    }
                                    onClick={() =>
                                      handleDownloadFile(
                                        notaryRequest.documentFinishedFileId
                                      )
                                    }
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
                                  {!disableActions(
                                    "process",
                                    notaryRequest
                                  ) && (
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

                                  {!disableActions(
                                    "notarize",
                                    notaryRequest
                                  ) && (
                                    <Menu.Item
                                      c="green"
                                      onClick={() => {
                                        setSelectedNotaryRequest(notaryRequest);
                                        openApproveNotaryRequestModal();
                                      }}
                                      leftSection={
                                        <IconRubberStamp size={16} />
                                      }
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
                {Math.min(currentPage * 10, totalCount)} of {totalCount} Matters
              </Text>
            ) : (
              <Text size="sm">No notary requests found</Text>
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

      <UpsertNotaryRequestModal
        opened={isUpsertNotaryRequestModalOpen}
        onClose={closeUpsertNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />

      {/* <DeleteNotaryRequestModal
        opened={isDeleteNotaryRequestModalOpen}
        onClose={closeDeleteNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      /> */}

      <ClientReviewModal
        opened={isClientReviewModalOpen}
        onClose={closeClientReviewModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />

      <ApproveNotaryRequestModal
        opened={isApproveNotaryRequestModalOpen}
        onClose={closeApproveNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />

      <RejectNotaryRequestModal
        opened={isRejectNotaryRequestModalOpen}
        onClose={closeRejectNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />

      <ViewNotaryRequestDrawer
        opened={isViewNotaryRequestDrawerOpen}
        onClose={closeViewNotaryRequestDrawer}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
      />

      <ReviewNotaryRequestModal
        opened={isReviewNotaryRequestModalOpen}
        onClose={closeReviewNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />

      <ConfirmationModal
        opened={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        notaryRequestId={selectedNotaryRequest?.$id ?? ""}
        setDataChanged={setDataChanged}
      />
    </>
  );
}
