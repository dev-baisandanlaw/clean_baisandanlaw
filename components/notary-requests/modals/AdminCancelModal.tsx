import AppModal from "@/components/Common/modal/AppModal";
import {
  useCancelClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";
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
          <Stack align="center" gap="2">
            <ThemeIcon variant="light" color="red" radius="50%" size={60}>
              <IconAlertTriangle size={32} />
            </ThemeIcon>
            <Text size="lg" fw={600}>
              Are you sure?
            </Text>

            <Text ta="center" my="xs">
              This action will cancel the request. <br />
              You won&apos;t be able to revert this!
            </Text>
          </Stack>

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

          <Group grow mt="md">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isCancelling}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="red.7"
              loading={isCancelling}
              disabled={!clientRequestId || isCancelling}
              onClick={handleSubmit}
              leftSection={<IconTrash />}
            >
              I Understand
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
