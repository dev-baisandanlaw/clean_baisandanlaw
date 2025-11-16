import { COLLECTIONS, NOTARY_STEPS } from "@/constants/constants";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  List,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconCloudUpload, IconFileTypePdf, IconX } from "@tabler/icons-react";
import { ID } from "appwrite";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { createNotaryRequest } from "@/firebase/createNotaryRequest";
import { sendEmail } from "@/emails/triggers/sendEmail";
import axios from "axios";
import { updateNotaryRequest } from "@/firebase/updateNotaryRequest";
import { attachToResend } from "@/lib/attachToResend";
import { appNotifications } from "@/utils/notifications/notifications";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { syncToAppwrite } from "@/lib/syncToAppwrite";

interface UpsertNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export const UpsertNotaryRequestModal = ({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: UpsertNotaryRequestModalProps) => {
  const upsertLabels = {
    modalTitle: notaryRequestId ? "Edit Notary Request" : "New Notary Request",
    submitButton: notaryRequestId ? "Update" : "Submit",
  };

  const { user } = useUser();

  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const [description, setDescription] = useState("");
  const [file, setFile] = useState<(File & { id?: string }) | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const fetchNotaryRequest = async () => {
    setIsFetching(true);

    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId)
      );
      if (snap.exists()) {
        setNotaryRequestData({
          ...(snap.data() as NotaryRequest),
          id: snap.id,
        });
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch notary request data",
        message:
          "The notary request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setFile(null);
      setDescription("");
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  useEffect(() => {
    if (notaryRequestId && notaryRequestData) {
      setFile(
        (notaryRequestData?.documents?.initialFile
          ? {
              name: notaryRequestData?.documents?.initialFile?.name,
              id: notaryRequestData?.documents?.initialFile?.id,
            }
          : null) as unknown as File & { id?: string }
      );
      setDescription(notaryRequestData?.description ?? "");
    }
  }, [notaryRequestId, notaryRequestData]);

  const handleSubmit = async () => {
    setIsUploading(true);
    const uuid = notaryRequestId || notaryRequestData?.id || ID.unique();

    try {
      if (notaryRequestId && notaryRequestData) {
        if (!file) {
          if (notaryRequestData?.documents?.initialFile) {
            // 1. Delete the existing file from Google Drive
            await axios.delete(
              `/api/google/drive/delete/${notaryRequestData?.documents?.initialFile?.id}`
            );
          }

          // 2. Update the notary request in Firebase
          await updateNotaryRequest(
            description,
            user!,
            notaryRequestData,
            undefined
          );

          // 3. Update the notary request in Appwrite
          await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
            status: NotaryRequestStatus.SUBMITTED,
            documentInitialFileId: "",
            search_blob: `${notaryRequestId} ${notaryRequestData?.requestor?.fullname} ${notaryRequestData?.requestor?.email}`,
          });
        }

        //existing file
        if (file?.id) {
          await updateNotaryRequest(description, user!, notaryRequestData, {
            id: notaryRequestData.documents.initialFile!.id,
            name: notaryRequestData.documents.initialFile!.name,
          });
        }

        // there's new file
        if (file?.size) {
          if (notaryRequestData?.documents?.initialFile) {
            //  1. Delete the existing file from Google Drive
            await axios.delete(
              `/api/google/drive/delete/${notaryRequestData?.documents?.initialFile?.id}`
            );
          }

          // 2. Upload the new file to Google Drive
          const fd = new FormData();
          fd.append(
            "parentId",
            notaryRequestData?.documents?.googleDriveFolderId
          );
          fd.append("file", file);
          const { data: uploadedFile } = await axios.post(
            "/api/google/drive/upload",
            fd
          );

          // 3. Update the notary request in Firebase
          await updateNotaryRequest(description, user!, notaryRequestData, {
            id: uploadedFile.uploadedFiles.id,
            name: uploadedFile.uploadedFiles.name,
          });

          // 4. Update the notary request in Appwrite
          await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
            status: NotaryRequestStatus.SUBMITTED,
            documentInitialFileId: uploadedFile.uploadedFiles.id,
            search_blob: `${notaryRequestId} ${notaryRequestData?.requestor?.fullname} ${notaryRequestData?.requestor?.email}`,
          });
        }
      } else {
        let fileIdToDL = null;

        // 1. Create a new Google Drive folder
        const { data: googleDriveFolder } = await axios.post(
          "/api/google/drive/gFolders/create",
          {
            name: uuid,
            parentId: process.env.NEXT_PUBLIC_GOOGLE_DOCUMENTS_NOTARY_FOLDER_ID,
          }
        );

        // 2. Upload the file to Google Drive
        if (file) {
          const fd = new FormData();
          fd.append("parentId", googleDriveFolder.id);
          fd.append("file", file);

          const { data: uploadedFile } = await axios.post(
            "/api/google/drive/upload",
            fd
          );

          fileIdToDL = uploadedFile.uploadedFiles.id;

          // 3. Create the notary request in Firebase
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

          // 4. Update the notary request in Appwrite
          await syncToAppwrite("NOTARY_REQUESTS", uuid, {
            requestorFullName: `${user?.firstName} ${user?.lastName}`,
            requestorEmail: user?.emailAddresses[0].emailAddress,

            documentInitialFileId: uploadedFile.uploadedFiles.id,
            documentFinishedFileId: "",

            status: NotaryRequestStatus.SUBMITTED,
            search_blob: `${uuid} ${user?.firstName} ${user?.lastName} ${user?.emailAddresses[0].emailAddress}`,
          });
        } else {
          await createNotaryRequest(
            description,
            user!,
            uuid,
            googleDriveFolder.id
          );

          await syncToAppwrite("NOTARY_REQUESTS", uuid, {
            requestorFullName: `${user?.firstName} ${user?.lastName}`,
            requestorEmail: user?.emailAddresses[0].emailAddress,

            documentInitialFileId: "",
            documentFinishedFileId: "",

            status: NotaryRequestStatus.SUBMITTED,
            search_blob: `${uuid} ${user?.firstName} ${user?.lastName} ${user?.emailAddresses[0].emailAddress}`,
          });
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
      setDataChanged((prev) => !prev);
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
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching notary request data...</Text>
          </Stack>
        </Center>
      ) : (
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
              styles={{
                root: {
                  border: `2px dashed ${!!file ? "gray" : "green"}`,
                },
              }}
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
                <IconCloudUpload size={50} color={!!file ? "gray" : "green"} />
                <Text>
                  <Text span fw={700} c="green">
                    Click here
                  </Text>{" "}
                  to upload your files or drag
                </Text>
                <Text c={!!file ? "dimmed" : "green"} size="sm" fw={500}>
                  Supported format{" "}
                  <Text span fw={700}>
                    PDF
                  </Text>{" "}
                  (Max 1 file, 5MB)
                </Text>
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
      )}
    </Modal>
  );
};
