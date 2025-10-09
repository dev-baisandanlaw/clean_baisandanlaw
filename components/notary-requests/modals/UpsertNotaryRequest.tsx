import {
  appwriteGetFileLink,
  appwriteUpdateNotaryRequest,
  appwriteUploadFile,
} from "@/app/api/appwrite";
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
import { toast } from "react-toastify";
import { createNotaryRequest } from "@/firebase/createNotaryRequest";
import { sendEmail } from "@/emails/triggers/sendEmail";

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
  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!opened) {
      setFile(null);
      setDescription("");
    } else {
      if (notaryRequest) {
        setFile((notaryRequest?.document as unknown as File) || null);
        setDescription(notaryRequest.description);
      }
    }
  }, [opened, notaryRequest]);

  const handleSubmit = async () => {
    setIsUploading(true);

    try {
      if (notaryRequest) {
        await appwriteUpdateNotaryRequest(
          file,
          user!,
          description,
          notaryRequest
        );

        toast.success("Notary request updated successfully");
      } else {
        const uuid = ID.unique();
        const attachmentLink = file ? await appwriteGetFileLink(uuid) : null;

        if (file) {
          const res = await appwriteUploadFile(file, uuid);
          await createNotaryRequest(res, description, user!, uuid);
        } else {
          await createNotaryRequest(null, description, user!, uuid);
        }

        await sendEmail({
          to: "",
          subject: "New Notary Request",
          template: "notarization-new-request",
          data: {
            fullname: user?.firstName + " " + user?.lastName,
            email: user!.emailAddresses[0].emailAddress,
            description,
            link: `https://localhost:3001/notary-requests?id=${uuid}`,
          },
          ...(file && {
            attachments: [
              {
                filename: file?.name,
                path: attachmentLink!,
              },
            ],
          }),
        });

        toast.success("Notary request submitted successfully");
      }
      onClose();
    } catch {
      toast.error("An error occurred");
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
