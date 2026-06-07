import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import axios from "axios";

import { ATTY_PRACTICE_AREAS, CLERK_ORG_IDS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";

import { Attorney, Client } from "@/types/user";
import { useCreateNewMatterMutation } from "@/store/services/matterService";
import { CreateNewMatterDto } from "@/store/service-types/type-matter-service";

interface AddMatterModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AddMatterModal({
  opened,
  onClose,
}: AddMatterModalProps) {
  const theme = useMantineTheme();
  const router = useRouter();

  const [createNewMatterFn, { isLoading: isSubmitting }] =
    useCreateNewMatterMutation();

  const form = useForm<CreateNewMatterDto>({
    initialValues: {
      caseNumber: "",
      leadAttorney: {
        fullname: "",
        id: "",
        email: "",
      },
      clientData: {
        fullname: "",
        id: "",
        email: "",
      },
      caseType: [],
      caseDescription: "",
    },
  });

  const [isClientFetchCalled, setIsClientFetchCalled] = useState(false);
  const [isAttorneyFetchCalled, setIsAttorneyFetchCalled] = useState(false);

  const [clientUsers, setClientUsers] = useState<Client[]>([]);
  const [attorneyUsers, setAttorneyUsers] = useState<Attorney[]>([]);

  const handleSubmit = async (values: typeof form.values) => {
    const leadAttorneyDetails = attorneyUsers.find(
      (user) => user.id === values.leadAttorney.id,
    );

    const clientDetails = clientUsers.find(
      (user) => user.id === values.clientData.id,
    );

    const payload = {
      ...values,
      leadAttorney: {
        fullname:
          leadAttorneyDetails?.first_name +
          " " +
          leadAttorneyDetails?.last_name,
        id: leadAttorneyDetails?.id,
        email: leadAttorneyDetails?.email_addresses[0].email_address,
      },
      clientData: {
        fullname: clientDetails?.first_name + " " + clientDetails?.last_name,
        id: clientDetails?.id,
        email: clientDetails?.email_addresses[0].email_address,
      },
      caseNumber: form.values.caseNumber.trim(),
    };

    createNewMatterFn(payload)
      .unwrap()
      .then(({ data }) => {
        const id = data?.id;

        appNotifications.success({
          title: "Matter added successfully",
          message: "The matter has been initiated successfully",
        });

        onClose();

        router.push(`/matters/${id}`);
      })
      .catch((e) => {
        const message = e?.data?.message
          ? e.data.message
          : "The matter could not be added. Please try again.";

        appNotifications.error({
          title: "Failed to add matter",
          message,
        });
      });

    // // 3. Update lead attorney's involved cases count
    // await axios.patch("/api/clerk/user/update-user-metadata", {
    //   userId: leadAttorneyDetails?.id,
    //   unsafe_metadata: {
    //     ...leadAttorneyDetails?.unsafe_metadata,
    //     involvedCases: attyCasesCount + 1,
    //   },
    // });

    // // 6. Add matter update
    // await addMatterUpdate(
    //   user!,
    //   res.id,
    //   "system",
    //   MatterUpdateType.SYSTEM,
    //   "Matter Initiated",
    // );
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
          limit: 500,
        },
      });

      setClientUsers(data);
      setIsClientFetchCalled(true);
    };

    const fetchAttorneyUsers = async () => {
      const { data } = await axios.get("/api/clerk/organization/fetch", {
        params: {
          organization_id: CLERK_ORG_IDS.attorney,
          limit: 500,
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
      withCloseButton={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            withAsterisk
            label="Matter Number"
            placeholder="JA_2020_01_20"
            {...form.getInputProps("caseNumber")}
          />
          <Select
            withAsterisk
            label="Lead Attorney"
            placeholder="Jane Doe (jane.doe@example.com)"
            data={attorneyUsers
              .filter((user) => !user.banned)
              .map((user) => ({
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
            placeholder="Jane Doe (jane.doe@example.com)"
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
            placeholder="General Law, Civil Law"
            data={ATTY_PRACTICE_AREAS}
            clearable
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
            placeholder="Type here the matter's description"
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("caseDescription")}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={
                !form.values.leadAttorney.id ||
                !form.values.clientData.id ||
                !form.values.caseType.length ||
                !form.values.caseDescription.trim().length ||
                !form.values.caseNumber.trim().length
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
