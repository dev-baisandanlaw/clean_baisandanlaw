import BasicCard from "@/components/Common/BasicCard";
import AppModal from "@/components/Common/modal/AppModal";
import SpoilerComp from "@/components/Common/SpoilerComp";
import {
  useApproveClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
  useSendBackClientRequestMutation,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Button,
  Center,
  Group,
  Loader,
  NumberInput,
  SegmentedControl,
  Stack,
  Textarea,
} from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

type AdminApproveRejectControl = "approve" | "reject";

interface AdminApproveRejectModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

export default function AdminApproveRejectModal({
  opened,
  onClose,
  clientRequestId,
}: AdminApproveRejectModalProps) {
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();

  const [approveClientRequestFn, { isLoading: isApproving }] =
    useApproveClientRequestMutation();
  const [sendBackClientRequestFn, { isLoading: isRejecting }] =
    useSendBackClientRequestMutation();

  const [remarks, setRemarks] = useState("");
  const [fee, setFee] = useState<number | string>(0);
  const [control, setControl] = useState<AdminApproveRejectControl>("approve");

  const resetForm = useCallback(() => {
    setRemarks("");
    setFee(0);
    setControl("approve");
  }, []);

  useEffect(() => {
    if (!opened || !clientRequestId) {
      resetForm();
      return;
    }

    getClientRequestById(clientRequestId);
  }, [clientRequestId, getClientRequestById, opened, resetForm]);

  const isApprove = control === "approve";
  const isSubmitting = isApproving || isRejecting;
  const isLoadingDetails = isLoading || isFetching;

  const handleSubmit = async () => {
    if (!clientRequestId) return;

    try {
      if (isApprove) {
        await approveClientRequestFn({
          id: clientRequestId,
          fee: String(fee),
        }).unwrap();
      } else {
        await sendBackClientRequestFn({
          id: clientRequestId,
          remarks: remarks.trim(),
        }).unwrap();
      }

      appNotifications.success({
        title: isApprove ? "Request approved" : "Request rejected",
        message: isApprove
          ? "The request has been approved with a payment fee."
          : "The request has been sent back to the client.",
      });
      onClose();
      resetForm();
    } catch {
      appNotifications.error({
        title: isApprove
          ? "Failed to approve request"
          : "Failed to reject request",
        message: "Please check the request and try again.",
      });
    }
  };

  return (
    <AppModal
      title="Review Request"
      opened={opened}
      onClose={onClose}
      type={control === "approve" ? "success" : "danger"}
      size="lg"
      closable={!isSubmitting}
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          <BasicCard title="Description">
            <SpoilerComp>{clientRequestData?.description}</SpoilerComp>
          </BasicCard>
          <SegmentedControl
            value={control}
            onChange={(value) => setControl(value as AdminApproveRejectControl)}
            disabled={isSubmitting}
            data={[
              { label: "Approve", value: "approve" },
              { label: "Reject", value: "reject" },
            ]}
          />

          {isApprove && (
            <NumberInput
              hideControls
              label="Payment Fee"
              placeholder="Enter payment fee"
              min={1}
              max={999999999}
              decimalScale={2}
              thousandSeparator=","
              prefix="₱ "
              withAsterisk
              value={fee}
              onChange={setFee}
              allowNegative={false}
              disabled={isSubmitting}
            />
          )}

          {!isApprove && (
            <Textarea
              placeholder="Please provide a reason for rejecting this request"
              label="Rejection Reason"
              rows={4}
              withAsterisk
              styles={{ input: { paddingBlock: 6 } }}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={1000}
              description={`${remarks.length}/1000 characters`}
              disabled={isSubmitting}
            />
          )}

          <Group justify="end">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              color={isApprove ? "green.7" : "red.7"}
              disabled={
                isApprove
                  ? !fee || Number(fee) <= 0
                  : remarks.trim().length <= 0
              }
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {control === "approve" ? "Approve" : "Reject"}
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
