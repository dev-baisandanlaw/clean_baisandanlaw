import { ATTY_PRACTICE_AREAS, COLLECTIONS } from "@/constants/constants";
import {
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import axios from "axios";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";

interface AddRetainerModalProps {
  opened: boolean;
  onClose: () => void;
  setIsDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AddRetainerModal({
  opened,
  onClose,
  setIsDataChanged,
}: AddRetainerModalProps) {
  const theme = useMantineTheme();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      clientName: "",
      contactPerson: {
        fullname: "",
        email: "",
        phoneNumber: "",
        address: "",
      },
      practiceAreas: [],
      retainerSince: new Date(),
      description: "",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const snap = await getDocs(
        query(
          collection(db, COLLECTIONS.RETAINERS),
          where("clientName", "==", values.clientName)
        )
      );

      if (snap.docs.length > 0) {
        toast.error(`Retainer with the same client name already exists`, {
          autoClose: 5000,
        });
        setIsLoading(false);
        return;
      }

      const { data: googleDriveFolder } = await axios.post(
        "/api/google/drive/gFolders/create",
        {
          name: values.clientName,
          parentId:
            process.env.NEXT_PUBLIC_GOOGLE_DOCUMENTS_RETAINERS_FOLDER_ID,
        }
      );

      await addDoc(collection(db, COLLECTIONS.RETAINERS), {
        ...values,
        retainerSince: dayjs(values.retainerSince).format("YYYY-MM-DD"),
        createdAt: now,
        updatedAt: now,
        googleDriveFolderId: googleDriveFolder.id,
      })
        .then(() => {
          setIsDataChanged((p) => !p);
          toast.success("Retainer added successfully");
          onClose();
        })
        .catch(() => toast.error("Failed to add retainer"))
        .finally(() => setIsLoading(false));
    } catch {
      toast.error("Failed to add retainer");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!opened) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Retainer Client"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Stack gap="xs" mb="xs">
            <Divider label="Client" color="blue" />
            <TextInput
              withAsterisk
              label="Client Name"
              placeholder="Enter client name"
              {...form.getInputProps("clientName")}
            />
          </Stack>

          <Stack gap="xs" mb="xs">
            <Divider label="Contact Person" color="blue" />
            <SimpleGrid cols={2}>
              <TextInput
                withAsterisk
                label="Full Name"
                placeholder="Enter full name"
                {...form.getInputProps("contactPerson.fullname")}
              />

              <TextInput
                withAsterisk
                label="Email"
                placeholder="Enter email"
                {...form.getInputProps("contactPerson.email")}
              />

              <TextInput
                withAsterisk
                label="Phone Number"
                placeholder="Enter phone number"
                {...form.getInputProps("contactPerson.phoneNumber")}
              />

              <TextInput
                withAsterisk
                label="Address"
                placeholder="Enter address"
                {...form.getInputProps("contactPerson.address")}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="xs" mb="xs">
            <Divider label="Other Details" color="blue" />
            <DatePickerInput
              withAsterisk
              label="Retainer Since"
              placeholder="Select Retainer Start Date"
              clearable
              hideOutsideDates
              {...form.getInputProps("retainerSince")}
            />

            <TagsInput
              withAsterisk
              label="Matter Type"
              placeholder="Select Matter Type"
              data={ATTY_PRACTICE_AREAS}
              clearable
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: "pop-top-left", duration: 200 },
              }}
              styles={{
                pill: {
                  backgroundColor: theme.colors.green[0],
                  color: theme.colors.green[9],
                },
              }}
              {...form.getInputProps("practiceAreas")}
            />

            <Textarea
              withAsterisk
              label="Description"
              placeholder="Enter description"
              minRows={6}
              autosize
              styles={{ input: { paddingBlock: 6 } }}
              {...form.getInputProps("description")}
            />
          </Stack>

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={
                !form.values.clientName ||
                !form.values.contactPerson.fullname ||
                !form.values.contactPerson.email ||
                !form.values.contactPerson.phoneNumber ||
                !form.values.contactPerson.address ||
                !form.values.retainerSince ||
                !form.values.practiceAreas.length ||
                !form.values.description.length
              }
            >
              Add Matter
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
