import {
  ActionIcon,
  Alert,
  Button,
  Flex,
  Group,
  Image,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useEffect, useState } from "react";

import {
  Dropzone,
  FileRejection,
  IMAGE_MIME_TYPE,
  PDF_MIME_TYPE,
} from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconCloudUpload,
  IconFileTypePdf,
  IconX,
} from "@tabler/icons-react";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUploadRetainerDocumentsMutation } from "@/store/services/retainerService";

interface TabRDocumentsUploadFileModalProps {
  opened: boolean;
  onClose: () => void;
  retainerId: string;
}

export default function TabRDocumentsUploadFileModal({
  opened,
  onClose,
  retainerId,
}: TabRDocumentsUploadFileModalProps) {
  const [uploadRetainerDocumentsFn, { isLoading: isUploadingDocument }] =
    useUploadRetainerDocumentsMutation();

  const [files, setFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");

  const handleDrop = (newFiles: File[]) => {
    setRejectedFiles([]);
    const maxFiles = 5;
    const remainingSlots = maxFiles - files.length;

    if (remainingSlots <= 0) return;

    const uniqueNewFiles = newFiles.filter(
      (newFile) =>
        !files.some(
          (existing) =>
            existing.name === newFile.name &&
            existing.size === newFile.size &&
            existing.lastModified === newFile.lastModified,
        ),
    );

    const acceptedFiles = uniqueNewFiles.slice(0, remainingSlots);

    setFiles((prev) => [...prev, ...acceptedFiles]);

    const droppedCount = newFiles.length - acceptedFiles.length;
    if (droppedCount > 0) {
      setDisclaimer(
        `${droppedCount} file(s) ignored due to duplicates or max limit`,
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setRejectedFiles([]);
    setDisclaimer("");
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    uploadRetainerDocumentsFn({ id: retainerId, files: Array.from(files) })
      .unwrap()
      .then(({ failedUploads, successfulUploads }) => {
        if (successfulUploads <= 0) {
          appNotifications.success({
            title: "Failed to upload files",
            message: "All files failed to upload",
          });
          return;
        }

        if (successfulUploads === files.length) {
          appNotifications.success({
            title: "Files uploaded successfully",
            message: "All files were uploaded successfully",
          });
          onClose();
          return;
        }

        if (successfulUploads > 0 && failedUploads > 0) {
          appNotifications.success({
            title: "Some files uploaded successfully",
            message: `Only ${successfulUploads} file(s) were uploaded successfully`,
          });
          onClose();
        }
      })
      .catch(() => {
        appNotifications.success({
          title: "Failed to upload files",
          message: "All files failed to upload",
        });
      });
  };

  const previews = files.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <Stack key={index} gap="xs" bdrs="md">
        {file.type.includes("image") ? (
          <Paper pos="relative" withBorder radius="md">
            <Image
              src={imageUrl}
              alt={file?.name || ""}
              onLoad={() => URL.revokeObjectURL(imageUrl)}
              fit="cover"
              radius="md"
              width="100%"
              h={125}
              style={{ objectFit: "cover" }}
            />
            <ActionIcon
              pos="absolute"
              color="red"
              top={5}
              right={5}
              size={24}
              onClick={() => handleRemoveFile(index)}
              disabled={isUploadingDocument}
            >
              <IconX size={16} />
            </ActionIcon>
          </Paper>
        ) : (
          <Paper pos="relative" withBorder radius="md">
            <Flex
              bdrs="md"
              bg="gray.0"
              w="100%"
              h={125}
              align="center"
              justify="center"
            >
              <ThemeIcon variant="transparent" size={48} my="auto">
                <IconFileTypePdf size={48} />
              </ThemeIcon>
            </Flex>

            <ActionIcon
              pos="absolute"
              color="red"
              top={5}
              right={5}
              size={24}
              onClick={() => handleRemoveFile(index)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Paper>
        )}
        <Text size="xs" truncate ml="2">
          {file?.name}
        </Text>
      </Stack>
    );
  });

  useEffect(() => {
    if (!opened) {
      setFiles([]);
      setDisclaimer("");
      setRejectedFiles([]);
    }
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title="Upload Document"
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isUploadingDocument}
      centered
    >
      {rejectedFiles.length > 0 && (
        <Alert
          color="red"
          title={`${rejectedFiles.length} file(s) rejected due to file type or size limit`}
          icon={<IconAlertCircle />}
          mb="md"
        />
      )}

      {files.length === 5 && disclaimer && (
        <Alert
          color="orange"
          title={disclaimer}
          icon={<IconAlertCircle />}
          mb="md"
        />
      )}

      <Dropzone
        styles={{
          root: {
            border: `2px dashed ${files.length >= 5 ? "gray" : "green"}`,
          },
        }}
        accept={[...IMAGE_MIME_TYPE, ...PDF_MIME_TYPE]}
        onDrop={handleDrop}
        onReject={setRejectedFiles}
        maxSize={5 * 1024 * 1024}
        mb="md"
        disabled={files.length >= 5}
        bg={files.length >= 5 ? "gray.2" : "#f6fcfb"}
        style={{ cursor: files.length >= 5 ? "not-allowed" : "pointer" }}
      >
        <Stack
          align="center"
          justify="center"
          gap="10"
          mih={100}
          style={{ pointerEvents: "none" }}
        >
          <IconCloudUpload
            size={50}
            color={files.length >= 5 ? "gray" : "green"}
          />
          <Text ta="center">
            <Text span fw={700} c="green">
              Click here
            </Text>{" "}
            to upload your files or drag
          </Text>
          <Text
            c={files.length >= 5 ? "dimmed" : "green"}
            size="sm"
            fw={500}
            ta="center"
          >
            Supported formats:{" "}
            <Text span fw={700}>
              Images
            </Text>{" "}
            and{" "}
            <Text span fw={700}>
              PDFs
            </Text>{" "}
            (Max 5 files, 5MB per file)
          </Text>
        </Stack>
      </Dropzone>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }}>
        {previews}
      </SimpleGrid>

      <Group justify="flex-end" mt="xl">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isUploadingDocument}
        >
          Cancel
        </Button>
        <Button
          disabled={files.length === 0}
          onClick={handleUploadFiles}
          loading={isUploadingDocument}
        >
          Upload
        </Button>
      </Group>
    </Modal>
  );
}
