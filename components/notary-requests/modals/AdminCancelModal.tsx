import {
  ClientRequestBadge,
  PaymentBadge,
} from "@/components/Common/BadgeComp";
import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import SpoilerComp from "@/components/Common/SpoilerComp";
import {
  useCancelClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
} from "@/store/services/clientRequestService";
import { formatFee } from "@/utils/formatFee";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface AdminCancelModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

export default function AdminCancelModal({
  opened,
  onClose,
  clientRequestId,
}: AdminCancelModalProps) {
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();
  const [cancelClientRequestFn, { isLoading: isCancelling }] =
    useCancelClientRequestMutation();
  const [remarks, setRemarks] = useState("");

  const resetForm = useCallback(() => {
    setRemarks("");
  }, []);

  useEffect(() => {
    if (!opened || !clientRequestId) {
      resetForm();
      return;
    }

    getClientRequestById(clientRequestId);
  }, [clientRequestId, getClientRequestById, opened, resetForm]);

  const handleClose = () => {
    if (isCancelling) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!clientRequestId) return;

    try {
      await cancelClientRequestFn({
        id: clientRequestId,
        remarks: remarks.trim() || undefined,
      }).unwrap();

      appNotifications.success({
        title: "Request cancelled",
        message: "The client request has been cancelled.",
      });
      handleClose();
    } catch {
      appNotifications.error({
        title: "Failed to cancel request",
        message: "Please check the request and try again.",
      });
    }
  };

  const isLoadingDetails = isLoading || isFetching;

  return (
    <AppModal
      type="danger"
      title="Cancel Request"
      opened={opened}
      onClose={handleClose}
      size="lg"
      closable={!isCancelling}
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertTriangle />}
            title="This action cannot be undone"
          >
            <Text size="sm">
              Once this request is cancelled, it cannot be restored or processed
              again.
            </Text>
          </Alert>

          <BasicCard title="Request's Information">
            <SimpleGrid cols={{ base: 2, sm: 3 }} mb={16}>
              <DetailField
                title="Requestor's name"
                value={clientRequestData?.requestor?.fullname}
              />
              <DetailField
                title="Submitted Date"
                value={getDateFormatDisplay(clientRequestData?.createdAt, true)}
              />
              <DetailField
                title="Last Update"
                value={getDateFormatDisplay(clientRequestData?.updatedAt, true)}
              />
              <DetailField
                title="Fee"
                value={
                  clientRequestData?.fee ? (
                    <Stack gap={2}>
                      <Text size="sm">
                        {formatFee(Number(clientRequestData?.fee))}
                      </Text>
                      <PaymentBadge
                        isPaid={clientRequestData?.paymentStatus.isPaid}
                        hasReceiptUploaded={
                          !!clientRequestData?.paymentStatus?.receiptFileId
                        }
                      />
                    </Stack>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailField
                title="Status"
                value={
                  <ClientRequestBadge status={clientRequestData?.status} />
                }
              />
            </SimpleGrid>

            <DetailField
              title="Description"
              value={<SpoilerComp>{clientRequestData.description}</SpoilerComp>}
            />
          </BasicCard>

          <Textarea
            label="Remarks"
            placeholder="Add optional cancellation remarks"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={350}
            description={`${remarks.length}/350 characters`}
            disabled={isCancelling}
          />

          <Group justify="end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isCancelling}
            >
              Close
            </Button>
            <Button
              color="red.7"
              loading={isCancelling}
              disabled={!clientRequestId || isCancelling}
              onClick={handleSubmit}
            >
              Cancel Request
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
