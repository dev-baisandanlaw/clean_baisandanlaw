"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

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
  Group,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import {
  IconBan,
  IconCash,
  IconCheck,
  IconCirclePlus,
  IconDots,
  IconDownload,
  IconEye,
  IconFileCheck,
  IconPencil,
  IconRubberStamp,
  IconSearch,
  IconTextScan2,
  IconX,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";

import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { appNotifications } from "@/utils/notifications/notifications";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { NotaryStatusBadge, PaymentBadge } from "@/components/Common/BadgeComp";
import EmptyTableComponent from "@/components/EmptyTableComponent";
import { NS1ClientModal } from "@/components/notary-requests/modals/NS1ClientModal";
import NS2AdminModal from "@/components/notary-requests/modals/NS2AdminModal";
import NS1_5AdminModal from "@/components/notary-requests/modals/NS1_5AdminModal";
import NS2_5ClientModal from "@/components/notary-requests/modals/NS2_5ClientModal";
import NS4AdminModal from "@/components/notary-requests/modals/NS4AdminModal";
import NS5ClientModal from "@/components/notary-requests/modals/NS5ClientModal";
import NS6AdminModal from "@/components/notary-requests/modals/NS6AdminModal";
import NSCancelAdminModal from "@/components/notary-requests/modals/NSCancelAdminModal";

import { ViewNotaryRequestDrawer } from "@/components/notary-requests/drawer/ViewNotaryRequestDrawer";
import ReceiptPreviewModal from "@/components/Common/ReceiptPreviewModal";

import classes from "@/app/custom-css/TabsCustomCss.module.css";

import {
  NotaryRequest,
  NotaryRequestLabel,
  NotaryRequestStatus,
} from "@/types/notary-requests";

/**
 * Returns the set of visible actions for a notary request based on status and user role.
 * Admin/attorney see admin actions; client sees client actions.
 */
export function getVisibleActions(
  status: NotaryRequestStatus,
  role: string | undefined,
): string[] {
  const isAdmin = role === "admin" || role === "attorney";
  const isClient = role === "client";

  switch (status) {
    case NotaryRequestStatus.SUBMITTED:
      return isAdmin
        ? ["confirm", "reject", "cancel"]
        : isClient
          ? ["edit"]
          : [];

    case NotaryRequestStatus.NEEDS_CLIENT_REVISION:
      return isClient ? ["edit"] : [];

    case NotaryRequestStatus.PAYMENT_PENDING:
      if (isClient) return ["pay"];
      if (isAdmin) return ["cancel"];
      return [];

    case NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION:
      return [];

    case NotaryRequestStatus.PROCESSING:
      return isAdmin ? ["upload_finished_doc", "cancel"] : [];

    case NotaryRequestStatus.FOR_CLIENT_REVIEW:
      return isClient ? ["review"] : [];

    case NotaryRequestStatus.NEEDS_ATTORNEY_REVISION:
      return isAdmin ? ["upload_finished_doc"] : [];

    case NotaryRequestStatus.CLIENT_APPROVED:
      return isAdmin ? ["complete"] : [];

    case NotaryRequestStatus.COMPLETED:
    case NotaryRequestStatus.CANCELLED:
      return [];

    default:
      return [];
  }
}

const PAGE_SIZE = 25;

export default function NotaryRequestsListing() {
  const shrink = useMediaQuery("(max-width: 768px)");

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const idFromSearchParams = searchParams.get("id");

  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (isLoaded && idFromSearchParams) {
      setSearch(idFromSearchParams);
      router.replace("/notary-requests");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, idFromSearchParams]);

  // All notary requests fetched from Firebase
  const [allNotaryRequests, setAllNotaryRequests] = useState<NotaryRequest[]>(
    [],
  );
  const [selectedNotaryRequest, setSelectedNotaryRequest] =
    useState<NotaryRequest | null>(null);

  const [dataChanged, setDataChanged] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [activeTab, setActiveTab] = useState<NotaryRequestStatus | "All">(
    "All",
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Modal disclosures ---

  const [
    isUpsertNotaryRequestModalOpen,
    {
      open: openUpsertNotaryRequestModal,
      close: closeUpsertNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isAdminConfirmModalOpen,
    { open: openAdminConfirmModal, close: closeAdminConfirmModal },
  ] = useDisclosure(false);

  const [
    isRejectNotaryRequestModalOpen,
    {
      open: openRejectNotaryRequestModal,
      close: closeRejectNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isPaymentModalOpen,
    { open: openPaymentModal, close: closePaymentModal },
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

  const [
    isCancelModalOpen,
    { open: openCancelModal, close: closeCancelModal },
  ] = useDisclosure(false);

  const [
    isViewNotaryRequestDrawerOpen,
    { open: openViewNotaryRequestDrawer, close: closeViewNotaryRequestDrawer },
  ] = useDisclosure(false);

  const [
    isReceiptPreviewModalOpen,
    { open: openReceiptPreviewModal, close: closeReceiptPreviewModal },
  ] = useDisclosure(false);

  // --- Data fetching from Firebase ---

  const fetchNotaryRequests = async () => {
    if (!user) return;

    setIsFetching(true);
    try {
      const userRole = user.unsafeMetadata?.role;
      const colRef = collection(db, COLLECTIONS.NOTARY_REQUESTS);

      let q;
      if (userRole === "client") {
        q = query(
          colRef,
          where("requestor.id", "==", user.id),
          orderBy("createdAt", "desc"),
        );
      } else {
        q = query(colRef, orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      const docs: NotaryRequest[] = snapshot.docs.map((d) => ({
        ...(d.data() as NotaryRequest),
        id: d.id,
      }));

      setAllNotaryRequests(docs);
    } catch (eeee) {
      console.log(eeee);
      appNotifications.error({
        title: "Failed to fetch requests",
        message: "Could not load requests. Please try again.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchNotaryRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dataChanged]);

  // --- Local filtering, search, and pagination ---

  const filteredRequests = useMemo(() => {
    let result = allNotaryRequests;

    // Filter by status tab
    if (activeTab !== "All") {
      result = result.filter((r) => r.status === activeTab);
    }

    // Filter by search term (ID, requestor name/email)
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim();
      result = result.filter((r) => {
        const searchable = [
          r.id,
          r.requestor?.fullname,
          r.requestor?.email,
          r.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(term);
      });
    }

    return result;
  }, [allNotaryRequests, activeTab, debouncedSearch]);

  const totalCount = filteredRequests.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab]);

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
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
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

  const handlePaymentVerification = async () => {
    if (!selectedNotaryRequest?.id) return;

    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, selectedNotaryRequest.id),
        {
          status: NotaryRequestStatus.PROCESSING,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          paymentFields: {
            ...selectedNotaryRequest.paymentFields,
            isPaid: true,
          },
          timeline: [
            ...(selectedNotaryRequest.timeline || []),
            {
              id: nanoid(8),
              title: "PROCESSING",
              description: "Payment verified and approved",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.PROCESSING,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
            },
          ],
        },
        { merge: true },
      );

      appNotifications.success({
        title: "Payment approved",
        message:
          "The payment has been verified. The request is now being processed.",
      });
      setDataChanged((prev) => !prev);
    } catch {
      appNotifications.error({
        title: "Failed to approve payment",
        message: "The payment could not be approved. Please try again.",
      });
    }
  };

  const userRole = user?.unsafeMetadata?.role as string | undefined;

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
            placeholder="Search ID, or requestor"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {userRole === "client" && (
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
          <Tabs.List ref={tabsListRef}>
            <Tabs.Tab value="All">All</Tabs.Tab>
            {Object.values(NotaryRequestStatus).map((status) => (
              <Tabs.Tab key={status} value={status}>
                {NotaryRequestLabel[status]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

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
            h="calc(100vh - 252px)"
            pos="relative"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={shrink ? 50 : "auto"}>ID</Table.Th>
                  {userRole !== "client" && <Table.Th>Requestor</Table.Th>}
                  <Table.Th>Created At</Table.Th>
                  <Table.Th>Pickup</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Payment</Table.Th>
                  <Table.Th ta="center">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {!paginatedRequests?.length && (
                  <EmptyTableComponent
                    colspan={userRole === "client" ? 7 : 8}
                    message="No client requests found"
                  />
                )}

                {paginatedRequests.map((notaryRequest) => {
                  const actions = getVisibleActions(
                    notaryRequest.status,
                    userRole,
                  );

                  return (
                    <Table.Tr key={notaryRequest.id}>
                      <Table.Td w={100}>
                        <Text truncate maw={100} size="sm" fw={600} c="green">
                          {notaryRequest.id}
                        </Text>
                      </Table.Td>
                      {userRole !== "client" && (
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm" fw={600} c="green">
                              {notaryRequest.requestor?.fullname}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {notaryRequest.requestor?.email}
                            </Text>
                          </Stack>
                        </Table.Td>
                      )}

                      <Table.Td>
                        {getDateFormatDisplay(notaryRequest.createdAt, true)}
                      </Table.Td>
                      <Table.Td>
                        {notaryRequest?.pickupBranch ? (
                          <Stack gap="2">
                            <Text size="sm">{notaryRequest.pickupBranch}</Text>
                            {notaryRequest?.pickupBranch !== "Soft copy only" &&
                              notaryRequest?.pickupDate && (
                                <Text size="xs">
                                  {getDateFormatDisplay(
                                    notaryRequest.pickupDate as string,
                                  )}
                                </Text>
                              )}
                          </Stack>
                        ) : (
                          "-"
                        )}
                      </Table.Td>
                      <Table.Td>
                        <NotaryStatusBadge status={notaryRequest.status} />
                      </Table.Td>

                      <Table.Td>
                        <Group gap="xs" align="center" wrap="nowrap">
                          <PaymentBadge
                            hasReceiptUploaded={
                              !!notaryRequest?.paymentFields?.receiptFileId
                            }
                            isPaid={!!notaryRequest?.paymentFields?.isPaid}
                          />
                          {notaryRequest?.paymentFields?.receiptFileId && (
                            <ActionIcon
                              size="xs"
                              variant="default"
                              onClick={() => {
                                setSelectedNotaryRequest(notaryRequest);
                                openReceiptPreviewModal();
                              }}
                            >
                              <IconEye size={12} />
                            </ActionIcon>
                          )}
                        </Group>
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
                            {/* Download sub-menu — always visible */}
                            <Menu.Sub>
                              <Menu.Sub.Target>
                                <Menu.Sub.Item
                                  leftSection={<IconDownload size={16} />}
                                  disabled={
                                    !notaryRequest.documents?.initialFile?.id &&
                                    !notaryRequest.documents?.finishedFile?.id
                                  }
                                >
                                  Download
                                </Menu.Sub.Item>
                              </Menu.Sub.Target>

                              <Menu.Sub.Dropdown>
                                <Menu.Item
                                  disabled={
                                    !notaryRequest.documents?.initialFile?.id
                                  }
                                  onClick={() =>
                                    handleDownloadFile(
                                      notaryRequest.documents?.initialFile
                                        ?.id ?? "",
                                    )
                                  }
                                >
                                  Initial File
                                </Menu.Item>
                                <Menu.Item
                                  disabled={
                                    !notaryRequest.documents?.finishedFile?.id
                                  }
                                  onClick={() =>
                                    handleDownloadFile(
                                      notaryRequest.documents?.finishedFile
                                        ?.id ?? "",
                                    )
                                  }
                                >
                                  Finished File
                                </Menu.Item>
                              </Menu.Sub.Dropdown>
                            </Menu.Sub>

                            {/* View — always visible */}
                            <Menu.Item
                              leftSection={<IconEye size={16} />}
                              onClick={() => {
                                setSelectedNotaryRequest(notaryRequest);
                                openViewNotaryRequestDrawer();
                              }}
                            >
                              View
                            </Menu.Item>

                            {/* --- Status-based actions --- */}

                            {actions.includes("confirm") && (
                              <Menu.Item
                                c="blue.5"
                                leftSection={<IconCheck size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openAdminConfirmModal();
                                }}
                              >
                                Confirm
                              </Menu.Item>
                            )}

                            {actions.includes("reject") && (
                              <Menu.Item
                                c="red"
                                leftSection={<IconX size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openRejectNotaryRequestModal();
                                }}
                              >
                                Reject
                              </Menu.Item>
                            )}

                            {actions.includes("edit") && (
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

                            {actions.includes("pay") && (
                              <Menu.Item
                                c="green"
                                leftSection={<IconCash size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openPaymentModal();
                                }}
                              >
                                Pay
                              </Menu.Item>
                            )}

                            {actions.includes("upload_finished_doc") && (
                              <Menu.Item
                                c="green"
                                leftSection={<IconRubberStamp size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openApproveNotaryRequestModal();
                                }}
                              >
                                Upload Finished Doc
                              </Menu.Item>
                            )}

                            {actions.includes("review") && (
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

                            {actions.includes("complete") && (
                              <Menu.Item
                                c="green"
                                leftSection={<IconFileCheck size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openConfirmationModal();
                                }}
                              >
                                Complete
                              </Menu.Item>
                            )}

                            {actions.includes("cancel") && (
                              <Menu.Item
                                c="red"
                                leftSection={<IconBan size={16} />}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openCancelModal();
                                }}
                              >
                                Cancel
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
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
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                Requests
              </Text>
            ) : (
              <Text size="sm">No requests found</Text>
            )}

            <Pagination
              size="sm"
              ml={shrink ? 0 : "auto"}
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
            />
          </Flex>
        </Paper>
      </Flex>

      {/* --- Modals --- */}

      <NS1ClientModal
        opened={isUpsertNotaryRequestModalOpen}
        onClose={closeUpsertNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NS2AdminModal
        opened={isAdminConfirmModalOpen}
        onClose={closeAdminConfirmModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NS1_5AdminModal
        opened={isRejectNotaryRequestModalOpen}
        onClose={closeRejectNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NS2_5ClientModal
        opened={isPaymentModalOpen}
        onClose={closePaymentModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NS5ClientModal
        opened={isClientReviewModalOpen}
        onClose={closeClientReviewModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NS4AdminModal
        opened={isApproveNotaryRequestModalOpen}
        onClose={closeApproveNotaryRequestModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <ViewNotaryRequestDrawer
        opened={isViewNotaryRequestDrawerOpen}
        onClose={closeViewNotaryRequestDrawer}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
      />

      <NS6AdminModal
        opened={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <NSCancelAdminModal
        opened={isCancelModalOpen}
        onClose={closeCancelModal}
        notaryRequestId={selectedNotaryRequest?.id ?? ""}
        setDataChanged={setDataChanged}
      />

      <ReceiptPreviewModal
        opened={isReceiptPreviewModalOpen}
        onClose={closeReceiptPreviewModal}
        receiptFileId={
          selectedNotaryRequest?.paymentFields?.receiptFileId ?? ""
        }
        isPaid={selectedNotaryRequest?.paymentFields?.isPaid ?? false}
        onApprove={
          selectedNotaryRequest?.status ===
          NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION
            ? handlePaymentVerification
            : async () => {}
        }
        filenamePrefix="notary-receipt"
        isDownloadOnly={
          userRole === "client" &&
          selectedNotaryRequest?.status !==
            NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION
        }
      />
    </>
  );
}
