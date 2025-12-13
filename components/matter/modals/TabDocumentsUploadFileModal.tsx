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
import { useUser } from "@clerk/nextjs";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { MatterUpdateType } from "@/types/matter-updates";
import axios from "axios";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { appNotifications } from "@/utils/notifications/notifications";

interface TabDocumentsUploadFileModalProps {
  opened: boolean;
  onClose: () => void;
  matterId: string;
  googleDriveFolderId: string;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabDocumentsUploadFileModal({
  opened,
  onClose,
  matterId,
  googleDriveFolderId,
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

    const CASE_REF = doc(db, COLLECTIONS.CASES, matterId);

    // 1. upload files to google drive
    const settled = await Promise.allSettled(
      files.map(async (file) => {
        const fd = new FormData();
        fd.append("parentId", googleDriveFolderId);
        fd.append("file", file);

        const res = await axios.post("/api/google/drive/upload", fd);
        return { file, raw: res.data };
      })
    );

    // 2. prepare documents to add to the database
    const docsToAdd = settled
      .filter((r) => r.status === "fulfilled")
      .map((r) => {
        const { file, raw } = r.value;
        return {
          id: nanoid(),
          name: file.name,
          mimeType: file.type,
          originalSize: file.size,
          sizeInMb: +(file.size / 1024 / 1024).toFixed(2),
          uploadedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          googleDriveId: raw.uploadedFiles.id,
          uploadedBy: {
            id: user?.id ?? null,
            fullname:
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              null,
          },
        };
      });

    // 3. add documents to the database
    if (docsToAdd.length) {
      await updateDoc(CASE_REF, {
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        documents: arrayUnion(...docsToAdd),
      });

      // 4. add matter update
      await addMatterUpdate(
        user!,
        matterId,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.DOCUMENT,
        `${docsToAdd.length} file(s) uploaded`
      );

      appNotifications.success({
        title: `Files uploaded successfully`,
        message: `${docsToAdd.length} file(s) uploaded successfully`,
      });
      setDataChanged((prev) => !prev);
    }

    if (settled.filter((r) => r.status === "rejected").length > 0) {
      appNotifications.error({
        title: `Failed to upload files`,
        message: `${settled.filter((r) => r.status === "rejected").length} file(s) failed to upload`,
      });
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
              disabled={isUploading}
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
