import AppModal from "@/components/Common/modal/AppModal";
import MultiFileUploadComp from "@/components/Common/MultiFileUploadComp";
import {
  useCreateClientRequestMutation,
  useLazyGetClientRequestByIdQuery,
  useUpdateClientRequestMutation,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Stack,
  Textarea,
} from "@mantine/core";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

interface UpsertClientRequestModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}
export default function UpsertClientRequestModal({
  opened,
  onClose,
  clientRequestId,
}: UpsertClientRequestModalProps) {
  const [createClientRequestFn, { isLoading: isSubmitting }] =
    useCreateClientRequestMutation();
  const [updateClientRequestFn, { isLoading: isUpdating }] =
    useUpdateClientRequestMutation();

  const [
    getClientRequestById,
    { isFetching: isFetchingClientRequest, isLoading: isLoadingClientRequest },
  ] = useLazyGetClientRequestByIdQuery();

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [hadInitialFile, setHadInitialFile] = useState(false);
  const [isShowingExistingFile, setIsShowingExistingFile] = useState(false);

  const isEditMode = !!clientRequestId;
  const isSaving = isSubmitting || isUpdating;
  const isLoadingDetails = isLoadingClientRequest || isFetchingClientRequest;

  const resetForm = useCallback(() => {
    setDescription("");
    setFiles([]);
    setHadInitialFile(false);
    setIsShowingExistingFile(false);
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!opened) {
      resetForm();
      return;
    }

    if (!clientRequestId) {
      resetForm();
      return;
    }

    getClientRequestById(clientRequestId)
      .unwrap()
      .then((clientRequest) => {
        if (!isActive) return;

        setDescription(clientRequest.description ?? "");
        setHadInitialFile(!!clientRequest.initialFileId);
        setIsShowingExistingFile(!!clientRequest.initialFileId);
        setFiles(
          clientRequest.initialFileId
            ? [
                new File(
                  [],
                  clientRequest.initialFileName ?? "Initial document.pdf",
                  { type: "application/pdf" },
                ),
              ]
            : [],
        );
      })
      .catch(() => {
        if (!isActive) return;

        appNotifications.error({
          title: "Failed to load request",
          message: "The request details could not be loaded. Please try again.",
        });
        onClose();
      });

    return () => {
      isActive = false;
    };
  }, [clientRequestId, getClientRequestById, onClose, opened, resetForm]);

  const handleClose = () => {
    if (isSaving) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;

    const payloadFile = isShowingExistingFile ? null : (files[0] ?? null);
    const removeInitialFile =
      isEditMode && hadInitialFile && files.length === 0;

    try {
      if (clientRequestId) {
        await updateClientRequestFn({
          id: clientRequestId,
          description: description.trim(),
          file: payloadFile,
          removeInitialFile,
        }).unwrap();

        appNotifications.success({
          title: "Request updated",
          message: "Your request has been updated successfully.",
        });
      } else {
        await createClientRequestFn({
          description: description.trim(),
          file: payloadFile,
        }).unwrap();

        appNotifications.success({
          title: "Request submitted",
          message: "Your request has been submitted successfully.",
        });
      }

      handleClose();
    } catch {
      appNotifications.error({
        title: clientRequestId
          ? "Failed to update request"
          : "Failed to submit request",
        message: "Please check your request and try again.",
      });
    }
  };

  const handleSetFiles: Dispatch<SetStateAction<File[]>> = (value) => {
    if (isShowingExistingFile) {
      setIsShowingExistingFile(false);
    }

    setFiles(value);
  };

  return (
    <AppModal
      size="lg"
      opened={opened}
      onClose={handleClose}
      closable={!isSaving}
      title={isEditMode ? "Edit Request" : "New Request"}
      type="success"
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}
      {!isLoadingDetails && (
        <Stack>
          <Textarea
            withAsterisk
            label="Description"
            placeholder="Tell us what you need help with"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            readOnly={isSaving}
            styles={{ input: { paddingBlock: 6 } }}
            rows={5}
            maxLength={1000}
            inputWrapperOrder={["label", "error", "input", "description"]}
            description={`${description.length}/1000 characters`}
          />

          <Divider label="Upload your document (optional)" />

          <MultiFileUploadComp
            files={files}
            setFiles={handleSetFiles}
            acceptPdf
            maxFiles={1}
            disabled={isSaving}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>

            <Button
              color="green.7"
              disabled={!description.trim() || isSaving}
              loading={isSaving}
              onClick={handleSubmit}
            >
              {isEditMode ? "Update Request" : "Submit Request"}
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
