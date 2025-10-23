import {
  ATTY_PRACTICE_AREAS,
  CLERK_ORG_IDS,
  COLLECTIONS,
} from "@/constants/constants";
import { db } from "@/firebase/config";
import { Attorney, Client } from "@/types/user";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import axios from "axios";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useUser } from "@clerk/nextjs";
import { MatterUpdateType } from "@/types/matter-updates";
import { addMatterUpdate } from "../utils/addMatterUpdate";

interface AddMatterModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AddMatterModal({
  opened,
  onClose,
}: AddMatterModalProps) {
  const { user } = useUser();
  const theme = useMantineTheme();
  const router = useRouter();

  const form = useForm({
    initialValues: {
      leadAttorney: {
        fullname: "",
        id: "",
        imageUrl: "",
      },
      clientData: {
        fullname: "",
        id: "",
        imageUrl: "",
      },
      caseType: [],
      caseDescription: "",
    },
  });

  const [isClientFetchCalled, setIsClientFetchCalled] = useState(false);
  const [isAttorneyFetchCalled, setIsAttorneyFetchCalled] = useState(false);

  const [clientUsers, setClientUsers] = useState<Client[]>([]);
  const [attorneyUsers, setAttorneyUsers] = useState<Attorney[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);

    try {
      const leadAttorneyDetails = attorneyUsers.find(
        (user) => user.id === values.leadAttorney.id
      );
      const attyCasesCount =
        leadAttorneyDetails?.unsafe_metadata?.involvedCases || 0;

      const clientDetails = clientUsers.find(
        (user) => user.id === values.clientData.id
      );

      const data = {
        ...values,
        leadAttorney: {
          fullname:
            leadAttorneyDetails?.first_name +
            " " +
            leadAttorneyDetails?.last_name,
          id: leadAttorneyDetails?.id,
          imageUrl: leadAttorneyDetails?.profile_image_url,
          email: leadAttorneyDetails?.email_addresses[0].email_address,
        },
        clientData: {
          fullname: clientDetails?.first_name + " " + clientDetails?.last_name,
          id: clientDetails?.id,
          imageUrl: clientDetails?.profile_image_url,
          email: clientDetails?.email_addresses[0].email_address,
        },
        caseNumber: `JA-${nanoid(8).toUpperCase()}`,
        createdBy: {
          id: user!.id,
          fullname: user!.firstName + " " + user!.lastName,
          email: user!.emailAddresses[0].emailAddress,
        },
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        documents: [],
        status: "active",
      };

      await axios.patch("/api/clerk/user/update-user-metadata", {
        userId: leadAttorneyDetails?.id,
        unsafe_metadata: {
          ...leadAttorneyDetails?.unsafe_metadata,
          involvedCases: attyCasesCount + 1,
        },
      });

      const res = await addDoc(collection(db, COLLECTIONS.CASES), data);
      await setDoc(doc(db, COLLECTIONS.TASKS, res.id), {
        caseId: res.id,
        totalTasks: 0,
        totalPendingTasks: 0,
        totalCompletedTasks: 0,
        tasks: [],
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      });
      await addMatterUpdate(
        user!,
        res.id,
        "system",
        MatterUpdateType.SYSTEM,
        "Matter Initiated"
      );

      toast.success("Matter added successfully");
      onClose();
      router.push(`/matters/${res.id}`);
    } catch {
      toast.error("Failed to add matter");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClientFetchCalled && isAttorneyFetchCalled) {
      form.reset();
      return;
    }

    const fetchClientUsers = async () => {
      const { data } = await axios.get("/api/clerk/organization/fetch", {
        params: {
          organization_id: CLERK_ORG_IDS.client,
          limit: 9999,
        },
      });

      setClientUsers(data);
      setIsClientFetchCalled(true);
    };

    const fetchAttorneyUsers = async () => {
      const { data } = await axios.get("/api/clerk/organization/fetch", {
        params: {
          organization_id: CLERK_ORG_IDS.attorney,
          limit: 9999,
        },
      });

      setAttorneyUsers(data);
      setIsAttorneyFetchCalled(true);
    };

    fetchAttorneyUsers();
    fetchClientUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientFetchCalled, isAttorneyFetchCalled, opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Matter"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            withAsterisk
            label="Lead Attorney"
            placeholder="Select Lead Attorney"
            data={attorneyUsers.map((user) => ({
              value: user.id,
              label: `${user.first_name} ${user.last_name} (${user.email_addresses[0].email_address})`,
            }))}
            searchable
            clearable
            nothingFoundMessage="No attorneys found"
            {...form.getInputProps("leadAttorney.id")}
          />

          <Select
            withAsterisk
            label="Client"
            placeholder="Select Client"
            data={clientUsers.map((user) => ({
              value: user.id,
              label: `${user.first_name} ${user.last_name} (${user.email_addresses[0].email_address})`,
            }))}
            searchable
            clearable
            nothingFoundMessage="No clients found"
            {...form.getInputProps("clientData.id")}
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
            {...form.getInputProps("caseType")}
          />

          <Textarea
            withAsterisk
            label="Description"
            placeholder="Enter description"
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("caseDescription")}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={
                !form.values.leadAttorney.id ||
                !form.values.clientData.id ||
                !form.values.caseType.length ||
                !form.values.caseDescription.length
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
