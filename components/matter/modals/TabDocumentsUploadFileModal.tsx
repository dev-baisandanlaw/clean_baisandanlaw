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
import { appwriteHandleUploadFile } from "@/app/api/appwrite";
import { toast } from "react-toastify";
import {
  IconAlertCircle,
  IconFileTypePdf,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import { User } from "@/types/user";

interface TabDocumentsUploadFileModalProps {
  opened: boolean;
  onClose: () => void;
  matterId: string;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabDocumentsUploadFileModal({
  opened,
  onClose,
  matterId,
  setDataChanged,
}: TabDocumentsUploadFileModalProps) {
  const { user } = useUser();
  const [files, setFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = (newFiles: File[]) => {
    setRejectedFiles([]);
    const maxFiles = 5;
    const remainingSlots = maxFiles - files.length;

    if (remainingSlots <= 0) return;

    // Remove duplicates by comparing name + size + lastModified
    const uniqueNewFiles = newFiles.filter(
      (newFile) =>
        !files.some(
          (existing) =>
            existing.name === newFile.name &&
            existing.size === newFile.size &&
            existing.lastModified === newFile.lastModified
        )
    );

    // Slice to ensure we don't exceed the max
    const acceptedFiles = uniqueNewFiles.slice(0, remainingSlots);

    setFiles((prev) => [...prev, ...acceptedFiles]);

    const droppedCount = newFiles.length - acceptedFiles.length;
    if (droppedCount > 0) {
      setDisclaimer(
        `${droppedCount} file(s) ignored due to duplicates or max limit`
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setRejectedFiles([]);
    setDisclaimer("");
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    setIsUploading(true);

    const { successes, failures } = await appwriteHandleUploadFile(
      files,
      matterId,
      {
        id: user?.id ?? "",
        first_name: user?.firstName ?? "",
        last_name: user?.lastName ?? "",
      } as User
    );

    setDataChanged((prev) => !prev);

    if (successes.length > 0) {
      toast.success(`${successes.length} file(s) uploaded successfully`);
    }

    if (failures.length > 0) {
      toast.error(`${failures.length} file(s) failed to upload`);
    }

    setTimeout(() => {
      setIsUploading(false);
    }, 1000);

    onClose();
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
      withCloseButton={!isUploading}
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
          <IconUpload size={40} />
          <Text c={files.length >= 5 ? "dimmed" : "green"} fw={600}>
            Drag and drop files here or click to select files
          </Text>
          <Text c={files.length >= 5 ? "dimmed" : "green"} size="sm">
            Max size: <strong>5MB</strong> - Max files: <strong>5</strong>
          </Text>
        </Stack>
      </Dropzone>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }}>
        {previews}
      </SimpleGrid>

      <Group justify="flex-end" mt="xl">
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          disabled={files.length === 0}
          onClick={handleUploadFiles}
          loading={isUploading}
        >
          Upload
        </Button>
      </Group>
    </Modal>
  );
}
