import { useRouter } from "next/navigation";

import {
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";

import { useCreateNewMatterMutation } from "@/store/services/matterService";
import { CreateNewMatterDto } from "@/store/service-types/type-matter-service";
import { useGetUsersByOrgQuery } from "@/store/services/userService";

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

  const {
    data: users,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useGetUsersByOrgQuery(
    {
      types: ["attorney", "client"],
    },
    { skip: !opened },
  );

  const [createNewMatterFn, { isLoading: isSubmitting }] =
    useCreateNewMatterMutation();

  const form = useForm<CreateNewMatterDto>({
    initialValues: {
      caseNumber: "",
      leadAttorney: {
        fullname: "",
        id: "",
        email: "",
        phone: "",
      },
      clientData: {
        fullname: "",
        id: "",
        email: "",
        phone: "",
      },
      caseType: [],
      caseDescription: "",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const leadAttorneyDetails = users?.attorney.find(
      (user) => user.id === values.leadAttorney.id,
    );

    const clientDetails = users?.client.find(
      (user) => user.id === values.clientData.id,
    );

    if (!leadAttorneyDetails || !clientDetails) {
      appNotifications.error({
        message: "Client or Attorney details are missing",
        title: "Failed to create new Matter",
      });
      return;
    }

    const payload = {
      ...values,
      leadAttorney: {
        fullname: leadAttorneyDetails?.fullname,
        id: leadAttorneyDetails?.id,
        email: leadAttorneyDetails?.email,
        phone: leadAttorneyDetails?.phone || undefined,
      },
      clientData: {
        fullname: clientDetails?.fullname,
        id: clientDetails?.id,
        email: clientDetails?.email,
        phone: clientDetails?.phone || undefined,
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

  const isLoading = isFetchingUsers || isLoadingUsers;

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
            data={
              users?.attorney?.map((u) => ({
                value: u?.id || "",
                label: `${u.fullname} (${u.email})`,
              })) || []
            }
            rightSection={isLoading ? <Loader size="sm" /> : undefined}
            disabled={isLoading}
            searchable
            clearable
            nothingFoundMessage="No attorneys found"
            {...form.getInputProps("leadAttorney.id")}
          />

          <Select
            withAsterisk
            label="Client"
            placeholder="Jane Doe (jane.doe@example.com)"
            data={
              users?.client?.map((u) => ({
                value: u?.id || "",
                label: `${u.fullname} (${u.email})`,
              })) || []
            }
            searchable
            clearable
            rightSection={isLoading ? <Loader size="sm" /> : undefined}
            disabled={isLoading}
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
