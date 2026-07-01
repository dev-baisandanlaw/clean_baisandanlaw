"use client";

import { useCallback, useMemo, useState } from "react";

import DataTable from "@/components/data-table/DataTable";
import { getClientRequestColumns } from "@/components/data-table/columns/ClientRequestColumns";
import ReceiptPreviewModal from "@/components/Common/ReceiptPreviewModal";
import ClientRequestTimelineDrawer from "@/components/notary-requests/drawer/ClientRequestTimelineDrawer";
import AdminApproveRejectModal from "@/components/notary-requests/modals/AdminApproveRejectModal";
import AdminCancelModal from "@/components/notary-requests/modals/AdminCancelModal";
import AdminCompletionModal from "@/components/notary-requests/modals/AdminCompletionModal";
import AdminFinishedFileUploadModal from "@/components/notary-requests/modals/AdminFinishedFileUploadModal";
import ClientApproveRejectModal from "@/components/notary-requests/modals/ClientApproveRejectModal";
import UpsertClientRequestModal from "@/components/notary-requests/modals/UpsertClientRequestModal";
import ViewClientRequestModal from "@/components/notary-requests/modals/ViewClientRequestModal";
import {
  useApproveClientRequestPaymentMutation,
  useGetClientRequestsListingQuery,
  useProcessAgainClientRequestMutation,
} from "@/store/services/clientRequestService";
import { useDownloadDocumentMutation } from "@/store/services/documentService";
import { type ClientRequestStatus } from "@/types/clientRequest";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import { Button, Flex, ScrollArea, Tabs, TextInput } from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import { IconCirclePlus, IconSearch } from "@tabler/icons-react";
import classes from "@/app/custom-css/TabsCustomCss.module.css";
import ClientRequestPaymentModal from "@/components/notary-requests/modals/ClientRequestPaymentModal";

type StatusFilter = "all" | ClientRequestStatus;
type ClientRequestModalName =
  | "upsert-client-request"
  | "view-client-request"
  | "admin-approve-reject"
  | "admin-cancel"
  | "admin-completion"
  | "admin-upload-finished-file"
  | "client-approve-reject"
  | "client-upload-payment"
  | "receipt-preview";
type ClientRequestDrawerName = "client-request-timeline";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "needs_client_revision", label: "Revision" },
  { value: "payment_pending", label: "Payment" },
  { value: "for_payment_verification", label: "Verification" },
  { value: "processing", label: "Processing" },
  { value: "for_client_review", label: "Review" },
  { value: "client_rejected", label: "Rejected" },
  { value: "client_approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function NotaryRequestsListing() {
  const shrink = useMediaQuery("(max-width: 768px)");
  const { user, isLoaded } = useUser();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [activeModal, setActiveModal] = useState<ClientRequestModalName | null>(
    null,
  );
  const [activeDrawer, setActiveDrawer] =
    useState<ClientRequestDrawerName | null>(null);

  const [selectedClientRequestId, setSelectedClientRequestId] = useState<
    string | null
  >(null);
  const [fee, setFee] = useState<number>(0);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    clientRequestId: string;
    fileId: string;
    isPaid: boolean;
  } | null>(null);
  const [approveClientRequestPaymentFn] =
    useApproveClientRequestPaymentMutation();
  const [processAgainClientRequestFn] = useProcessAgainClientRequestMutation();
  const [downloadDocument] = useDownloadDocumentMutation();

  const openModal = useCallback(
    (name: ClientRequestModalName, clientRequestId: string | null = null) => {
      setSelectedClientRequestId(clientRequestId);
      setActiveModal(name);
    },
    [],
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedClientRequestId(null);
    setFee(0);
    setSelectedReceipt(null);
  }, []);

  const openAdminApproveRejectModal = useCallback((clientRequestId: string) => {
    setSelectedClientRequestId(clientRequestId);
    setActiveModal("admin-approve-reject");
  }, []);

  const openAdminFinishedFileUploadModal = useCallback(
    (clientRequestId: string) => {
      setSelectedClientRequestId(clientRequestId);
      setActiveModal("admin-upload-finished-file");
    },
    [],
  );

  const openAdminCompletionModal = useCallback((clientRequestId: string) => {
    setSelectedClientRequestId(clientRequestId);
    setActiveModal("admin-completion");
  }, []);

  const openAdminCancelModal = useCallback((clientRequestId: string) => {
    setSelectedClientRequestId(clientRequestId);
    setActiveModal("admin-cancel");
  }, []);

  const openClientUploadPaymentModal = useCallback(
    (clientRequestId: string, fee: number) => {
      setSelectedClientRequestId(clientRequestId);
      setActiveModal("client-upload-payment");
      setFee(Number(fee));
    },
    [],
  );

  const openClientApproveRejectModal = useCallback(
    (clientRequestId: string) => {
      setSelectedClientRequestId(clientRequestId);
      setActiveModal("client-approve-reject");
    },
    [],
  );

  const openReceiptPreviewModal = useCallback(
    (clientRequestId: string, receiptFileId: string, isPaid: boolean) => {
      setSelectedReceipt({ clientRequestId, fileId: receiptFileId, isPaid });
      setActiveModal("receipt-preview");
    },
    [],
  );

  const handleApproveReceipt = useCallback(async () => {
    if (!selectedReceipt?.clientRequestId) return;

    await approveClientRequestPaymentFn({
      id: selectedReceipt.clientRequestId,
    }).unwrap();

    appNotifications.success({
      title: "Payment approved",
      message: "The client request payment receipt has been approved.",
    });
  }, [approveClientRequestPaymentFn, selectedReceipt]);

  const handleProcessAgain = useCallback(
    async (clientRequestId: string) => {
      appNotifications.info({
        title: "Resuming processing",
        message: "The request is being moved back to processing.",
      });

      try {
        await processAgainClientRequestFn({ id: clientRequestId }).unwrap();

        appNotifications.success({
          title: "Request processing resumed",
          message: "The client request has been moved back to processing.",
        });
      } catch {
        appNotifications.error({
          title: "Failed to resume processing",
          message: "Please check the request and try again.",
        });
      }
    },
    [processAgainClientRequestFn],
  );

  const downloadClientRequestFile = useCallback(
    async (fileId: string) => {
      appNotifications.info({
        title: "Downloading file",
        message: "The file is being downloaded. Please wait...",
      });

      try {
        const file = await downloadDocument({
          fileId,
          source: "client-requests",
        }).unwrap();
        const a = document.createElement("a");

        a.href = file.objectUrl;
        a.download = file.filename;
        a.style.display = "none";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(() => {
          window.URL.revokeObjectURL(file.objectUrl);
        }, 1000);
      } catch {
        appNotifications.error({
          title: "Failed to download file",
          message: "The file could not be downloaded. Please try again.",
        });
      }
    },
    [downloadDocument],
  );

  const openDrawer = useCallback(
    (name: ClientRequestDrawerName, clientRequestId: string) => {
      setSelectedClientRequestId(clientRequestId);
      setActiveDrawer(name);
    },
    [],
  );

  const closeDrawer = useCallback(() => {
    setActiveDrawer(null);
    setSelectedClientRequestId(null);
  }, []);

  const queryArgs = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [debouncedSearch, statusFilter],
  );

  const columns = useMemo(
    () =>
      getClientRequestColumns({
        // general actions

        onView: (clientRequestId) =>
          openModal("view-client-request", clientRequestId),
        onTimeline: (clientRequestId) =>
          openDrawer("client-request-timeline", clientRequestId),
        onDownloadInitialFile: downloadClientRequestFile,
        onDownloadFinishedFile: downloadClientRequestFile,
        onViewReceipt: openReceiptPreviewModal,

        onEdit: (clientRequestId) =>
          openModal("upsert-client-request", clientRequestId),
        onAdminAction: openAdminApproveRejectModal,
        onAdminUploadFinishedFile: openAdminFinishedFileUploadModal,
        onAdminComplete: openAdminCompletionModal,
        onAdminCancel: openAdminCancelModal,
        onAdminProcessAgain: handleProcessAgain,
        onClientPayment: openClientUploadPaymentModal,
        onClientReviewAction: openClientApproveRejectModal,
      }),
    [
      openModal,
      openDrawer,
      downloadClientRequestFile,
      openReceiptPreviewModal,

      openClientUploadPaymentModal,
      openClientApproveRejectModal,
      openAdminApproveRejectModal,
      openAdminFinishedFileUploadModal,
      openAdminCompletionModal,
      openAdminCancelModal,
      handleProcessAgain,
    ],
  );

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
            placeholder="Search ID, description, requestor, or pickup method"
            flex={1}
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />

          {userRole === "client" && (
            <Button
              size="sm"
              leftSection={<IconCirclePlus />}
              onClick={() => openModal("upsert-client-request")}
            >
              New Request
            </Button>
          )}
        </Flex>

        <ScrollArea type="hover" offsetScrollbars="x" scrollbarSize={4}>
          <Tabs
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter((value as StatusFilter) ?? "all")
            }
            classNames={{
              list: classes.tabsListCustom,
              tab: classes.tabsTabCustom,
            }}
          >
            <Tabs.List style={{ flexWrap: "nowrap" }}>
              {statusFilters.map((filter) => (
                <Tabs.Tab key={filter.value} value={filter.value}>
                  {filter.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </ScrollArea>

        <DataTable
          columns={columns}
          useQuery={useGetClientRequestsListingQuery}
          queryArgs={queryArgs}
          queryOptions={{ skip: !isLoaded || !user }}
          emptyText="No client requests found."
        />
      </Flex>

      <ViewClientRequestModal
        opened={activeModal === "view-client-request"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <ClientRequestTimelineDrawer
        opened={activeDrawer === "client-request-timeline"}
        onClose={closeDrawer}
        clientRequestId={selectedClientRequestId}
      />

      <ReceiptPreviewModal
        opened={activeModal === "receipt-preview"}
        onClose={closeModal}
        receiptFileId={selectedReceipt?.fileId ?? ""}
        isPaid={selectedReceipt?.isPaid ?? false}
        onApprove={handleApproveReceipt}
        filenamePrefix="client-request-receipt"
        source="client-requests"
      />

      <UpsertClientRequestModal
        opened={activeModal === "upsert-client-request"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <AdminApproveRejectModal
        opened={activeModal === "admin-approve-reject"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <ClientRequestPaymentModal
        opened={activeModal === "client-upload-payment"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
        fee={fee}
      />

      <AdminFinishedFileUploadModal
        opened={activeModal === "admin-upload-finished-file"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <ClientApproveRejectModal
        opened={activeModal === "client-approve-reject"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <AdminCompletionModal
        opened={activeModal === "admin-completion"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />

      <AdminCancelModal
        opened={activeModal === "admin-cancel"}
        onClose={closeModal}
        clientRequestId={selectedClientRequestId}
      />
    </>
  );
}
