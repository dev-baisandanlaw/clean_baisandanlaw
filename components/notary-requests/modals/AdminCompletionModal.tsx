import BasicCard from "@/components/Common/BasicCard";
import AppModal from "@/components/Common/modal/AppModal";
import SpoilerComp from "@/components/Common/SpoilerComp";
import {
  useCompleteClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface AdminCompletionModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}
export default function AdminCompletionModal({
  opened,
  onClose,
  clientRequestId,
}: AdminCompletionModalProps) {
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();
  const [completeClientRequestFn, { isLoading: isCompleting }] =
    useCompleteClientRequestMutation();
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
    if (isCompleting) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!clientRequestId) return;

    try {
      await completeClientRequestFn({
        id: clientRequestId,
        remarks: remarks.trim() || undefined,
      }).unwrap();

      appNotifications.success({
        title: "Request completed",
        message: "The client request has been marked as completed.",
      });
      handleClose();
    } catch {
      appNotifications.error({
        title: "Failed to complete request",
        message: "Please check the request and try again.",
      });
    }
  };

  const isLoadingDetails = isLoading || isFetching;

  return (
    <AppModal
      type="success"
      title="Complete Request"
      opened={opened}
      onClose={handleClose}
      size="lg"
      closable={!isCompleting}
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          {clientRequestData.status === "for_client_review" && (
            <Alert
              color="blue"
              variant="light"
              icon={<IconInfoCircle />}
              title="Completion Available"
            >
              <Text size="sm">
                You can complete this request now because the finished document
                has already been uploaded, even if the client has not confirmed
                it in the app.
              </Text>
            </Alert>
          )}

          <BasicCard title="Description">
            <SpoilerComp>{clientRequestData.description}</SpoilerComp>
          </BasicCard>

          <Textarea
            label="Remarks"
            placeholder="Add optional completion remarks"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={350}
            description={`${remarks.length}/350 characters`}
            disabled={isCompleting}
          />

          <Group justify="end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              color="green.7"
              loading={isCompleting}
              disabled={!clientRequestId || isCompleting}
              onClick={handleSubmit}
            >
              Complete Request
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
