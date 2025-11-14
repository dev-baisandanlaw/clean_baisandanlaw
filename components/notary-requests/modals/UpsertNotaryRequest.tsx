import { NOTARY_STEPS } from "@/constants/constants";
import { NotaryRequest } from "@/types/notary-requests";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  List,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconFileTypePdf, IconUpload, IconX } from "@tabler/icons-react";
import { ID } from "appwrite";
import { useEffect, useState } from "react";
import { createNotaryRequest } from "@/firebase/createNotaryRequest";
import { sendEmail } from "@/emails/triggers/sendEmail";
import axios from "axios";
import { updateNotaryRequest } from "@/firebase/updateNotaryRequest";
import { attachToResend } from "@/lib/attachToResend";
import { appNotifications } from "@/utils/notifications/notifications";

interface UpsertNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export const UpsertNotaryRequestModal = ({
  opened,
  onClose,
  notaryRequest,
}: UpsertNotaryRequestModalProps) => {
  const upsertLabels = {
    modalTitle: notaryRequest ? "Edit Notary Request" : "New Notary Request",
    submitButton: notaryRequest ? "Update" : "Submit",
  };

  const { user } = useUser();

  const [description, setDescription] = useState("");
  const [file, setFile] = useState<(File & { id?: string }) | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!opened) {
      setFile(null);
      setDescription("");
    } else {
      if (notaryRequest) {
        setFile(
          (notaryRequest?.documents?.initialFile
            ? {
                name: notaryRequest?.documents?.initialFile?.name,
                id: notaryRequest?.documents?.initialFile?.id,
              }
            : null) as unknown as File & { id?: string }
        );
        setDescription(notaryRequest.description);
      }
    }
  }, [opened, notaryRequest]);

  const handleSubmit = async () => {
    setIsUploading(true);
    const uuid = notaryRequest?.id ?? ID.unique();

    try {
      if (notaryRequest) {
        if (!file) {
          if (notaryRequest.documents.initialFile) {
            await axios.delete(
              `/api/google/drive/delete/${notaryRequest.documents.initialFile.id}`
            );
          }

          await updateNotaryRequest(
            description,
            user!,
            notaryRequest,
            undefined
          );
        }

        //existing file
        if (file?.id) {
          await updateNotaryRequest(description, user!, notaryRequest, {
            id: notaryRequest.documents.initialFile!.id,
            name: notaryRequest.documents.initialFile!.name,
          });
        }

        // there's new file
        if (file?.size) {
          if (notaryRequest.documents.initialFile) {
            //  delete the existing file
            await axios.delete(
              `/api/google/drive/delete/${notaryRequest.documents.initialFile.id}`
            );
          }

          // upload the new file
          const fd = new FormData();
          fd.append("parentId", notaryRequest.documents.googleDriveFolderId);
          fd.append("file", file);
          const { data: uploadedFile } = await axios.post(
            "/api/google/drive/upload",
            fd
          );

          // update the notary request
          await updateNotaryRequest(description, user!, notaryRequest, {
            id: uploadedFile.uploadedFiles.id,
            name: uploadedFile.uploadedFiles.name,
          });
        }
      } else {
        let fileIdToDL = null;
        const { data: googleDriveFolder } = await axios.post(
          "/api/google/drive/gFolders/create",
          {
            name: uuid,
            parentId: process.env.NEXT_PUBLIC_GOOGLE_DOCUMENTS_NOTARY_FOLDER_ID,
          }
        );

        if (file) {
          const fd = new FormData();
          fd.append("parentId", googleDriveFolder.id);
          fd.append("file", file);

          const { data: uploadedFile } = await axios.post(
            "/api/google/drive/upload",
            fd
          );

          fileIdToDL = uploadedFile.uploadedFiles.id;

          await createNotaryRequest(
            description,
            user!,
            uuid,
            googleDriveFolder.id,
            {
              id: uploadedFile.uploadedFiles.id,
              name: uploadedFile.uploadedFiles.name,
            }
          );
        } else {
          await createNotaryRequest(
            description,
            user!,
            uuid,
            googleDriveFolder.id
          );
        }
        const downloadedAttachments = [];
        if (fileIdToDL) {
          const att = await attachToResend(fileIdToDL);
          downloadedAttachments.push(att);
        }

        await sendEmail({
          to: "",
          subject: "New Notary Request",
          template: "notarization-new-request",
          data: {
            fullname: user?.firstName + " " + user?.lastName,
            email: user!.emailAddresses[0].emailAddress,
            description,
            link: `${process.env.NEXT_PUBLIC_APP_URL}/notary-requests?id=${uuid}`,
          },
          ...(downloadedAttachments.length > 0 && {
            attachments: downloadedAttachments.map((att) => ({
              filename: att.filename,
              content: att.content,
            })),
          }),
        });
      }

      appNotifications.success({
        title: "Notary request submitted",
        message: "The notary request has been submitted successfully",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to submit notary request",
        message: "The notary request could not be submitted. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const preview = (
    <Paper pos="relative" withBorder radius="md" w="100%">
      <Flex
        bdrs="md"
        bg="gray.0"
        w="100%"
        h={125}
        align="center"
        justify="center"
        direction="column"
      >
        <ThemeIcon variant="transparent" size={48} my="auto">
          <IconFileTypePdf size={48} />
        </ThemeIcon>
        <Text size="sm" truncate ml="2" fw={600} c="green">
          {file?.name}
        </Text>
      </Flex>

      <ActionIcon
        disabled={isUploading}
        pos="absolute"
        color="red"
        top={5}
        right={5}
        size={24}
        onClick={() => setFile(null)}
      >
        <IconX size={16} />
      </ActionIcon>
    </Paper>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={upsertLabels.modalTitle}
      centered
      transitionProps={{ transition: "pop" }}
      size="xl"
      withCloseButton={!isUploading}
    >
      <Stack gap="md">
        <Textarea
          placeholder="Tell us what you need"
          label="Description"
          minRows={6}
          autosize
          withAsterisk
          styles={{ input: { paddingBlock: 6 } }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Divider label="You can also upload your document" />

        {!file && (
          <Dropzone
            accept={[...PDF_MIME_TYPE]}
            maxSize={5 * 1024 * 1024}
            maxFiles={1}
            style={{ cursor: "pointer" }}
            onDrop={(files) => setFile(files[0])}
          >
            <Stack
              align="center"
              justify="center"
              gap="10"
              mih={100}
              style={{ pointerEvents: "none" }}
            >
              <Text c={!!file ? "dimmed" : "green"} fw={600}>
                Drag and drop file here or click to select file
              </Text>
              <Text c={!!file ? "dimmed" : "green"} size="sm">
                Max size: <strong>5MB</strong> - <strong>1 file only</strong>
              </Text>
              <IconUpload size={40} />
            </Stack>
          </Dropzone>
        )}

        <Group align="center" justify="center">
          {file ? preview : null}
        </Group>

        <Stack gap="xs">
          <Text fw={600}>How It Works</Text>
          <List
            type="ordered"
            styles={{
              item: { fontSize: 14 },
            }}
          >
            {NOTARY_STEPS.map((step, index) => (
              <List.Item key={index}>
                <Text size="sm" fw={600}>
                  {step.title}.{" "}
                  <Text span c="gray.8">
                    {step.description}
                  </Text>
                </Text>
              </List.Item>
            ))}
          </List>
        </Stack>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>

          <Button
            disabled={!description}
            loading={isUploading}
            onClick={handleSubmit}
          >
            {upsertLabels.submitButton}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
