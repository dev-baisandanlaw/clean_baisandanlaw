import { getFileSize } from "@/utils/getFileSize";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  ActionIcon,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  Dropzone,
  FileRejection,
  IMAGE_MIME_TYPE,
  PDF_MIME_TYPE,
} from "@mantine/dropzone";
import {
  IconCloudUpload,
  IconFileDescription,
  IconX,
} from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";

interface MultiFileUploadCompProps {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  maxFiles?: number;
  disabled?: boolean;

  acceptImage?: boolean;
  acceptPdf?: boolean;
}

export default function MultiFileUploadComp({
  files,
  setFiles,
  maxFiles = 1,
  disabled = false,

  acceptImage,
  acceptPdf,
}: MultiFileUploadCompProps) {
  const accept =
    acceptImage || acceptPdf
      ? [
          ...(acceptImage ? IMAGE_MIME_TYPE : []),
          ...(acceptPdf ? PDF_MIME_TYPE : []),
        ]
      : undefined;

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => {
      const remainingSlots = maxFiles - prevFiles.length;

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      return [...prevFiles, ...filesToAdd];
    });
  };

  const handleReject = (rejectedFiles: FileRejection[]) => {
    appNotifications.error({
      title: `Failed to upload ${rejectedFiles.length} file(s)`,
      message: "Please check all the existing & incoming files and try again.",
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const isMaxedOut = files.length >= maxFiles;
  const isDisabled = disabled || isMaxedOut;

  return (
    <Stack>
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        maxSize={5 * 1024 ** 2}
        maxFiles={maxFiles}
        accept={accept}
        disabled={isDisabled}
        bg={isDisabled ? "gray.2" : "#f6fcfb"}
        style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
      >
        <Stack align="center" style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconCloudUpload size={30} color="var(--mantine-color-green-6)" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={30} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconCloudUpload size={30} color="var(--mantine-color-green-6)" />
          </Dropzone.Idle>

          <Stack gap="4" align="center">
            <Text ta="center">Drag & Drop or Choose file to upload</Text>
            <Text size="sm" c="dimmed" ta="center">
              Supported files:{" "}
              {[acceptImage && "Images", acceptPdf && "PDF"]
                .filter(Boolean)
                .join(", ")}{" "}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Max size per file: 5MB | Max Files: {maxFiles}
            </Text>
          </Stack>
        </Stack>
      </Dropzone>

      <Stack gap={6}>
        {files.map((file, i) => (
          <Paper key={i} withBorder px="sm" py="xs" radius="sm" w="100%">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon variant="white">
                <IconFileDescription size={18} />
              </ThemeIcon>
              <Text size="sm" lineClamp={1} style={{ wordBreak: "break-all" }}>
                {file.name}
              </Text>

              <Text
                size="xs"
                c="dimmed"
                ml="auto"
                style={{
                  flexShrink: 0,
                  pointerEvents: file.size ? "all" : "none",
                }}
                opacity={file.size ? 1 : 0}
              >
                {getFileSize(file.size)}
              </Text>
              <ActionIcon
                size="xs"
                color="red.7"
                variant="light"
                disabled={disabled}
                onClick={() => handleRemoveFile(i)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
