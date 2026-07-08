import {
  Button,
  em,
  SimpleGrid,
  Stack,
  TagsInput,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { appNotifications } from "@/utils/notifications/notifications";
import { useMediaQuery } from "@mantine/hooks";
import AppModal from "@/components/Common/modal/AppModal";
import { useUpdateUserMutation } from "@/store/services/userService";
import { UserReference } from "@/types/user-reference";

interface UpdateAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: (UserReference & { metadata: any }) | null;
}

export const UpdateAttorneyModal = ({
  opened,
  onClose,
  user,
}: UpdateAttorneyModalProps) => {
  const isMobile = useMediaQuery(`(max-width: ${em(600)})`);
  const theme = useMantineTheme();

  const [updateUserFn, { isLoading: isSubmitting }] = useUpdateUserMutation();

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      practiceAreas: [],
      role: "attorney",
    },

    validate: {
      firstName: (value) => (!value.length ? "First name is required" : null),
      lastName: (value) => (!value.length ? "Last name is required" : null),
      practiceAreas: (value) =>
        !value.length ? "Practice areas are required" : null,
    },

    validateInputOnChange: true,
  });

  const handleSubmit = async (values: typeof form.values) => {
    updateUserFn({
      id: user!.id!,
      firstName: values.firstName,
      lastName: values.lastName,
      metadata: {
        role: values.role,
        phoneNumber: values.phoneNumber,
        practiceAreas: values.practiceAreas,
      },
    })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Attorney updated successfully",
          message: "The attorney has been updated successfully",
        });
        onClose();
      })
      .catch((e) => {
        const message =
          e?.data?.message ||
          "The attorney could not be updated. Please try again.";
        appNotifications.error({
          title: "Failed to update attorney",
          message,
          autoClose: 5000,
        });
      });
  };

  useEffect(() => {
    if (!opened) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (opened && !!user) {
      form.setFieldValue("firstName", user.metadata?.firstName || "");
      form.setFieldValue("lastName", user.metadata?.lastName || "");
      form.setFieldValue("phoneNumber", user?.phone || "");
      form.setFieldValue("practiceAreas", user?.metadata?.practiceAreas || []);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, opened]);

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Add Attorney"
      size="lg"
      type="success"
      closable={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <SimpleGrid cols={1} verticalSpacing={isMobile ? "2px" : "md"}>
            <TextInput
              withAsterisk
              label="First Name"
              placeholder="John"
              flex={1}
              {...form.getInputProps("firstName")}
            />
            <TextInput
              withAsterisk
              label="Last Name"
              placeholder="Doe"
              flex={1}
              {...form.getInputProps("lastName")}
            />

            <TextInput
              label="Phone Number"
              placeholder="09123456789"
              flex={1}
              {...form.getInputProps("phoneNumber")}
            />
          </SimpleGrid>

          <TagsInput
            label="Practice Areas"
            placeholder="General Law, Civil Law"
            data={ATTY_PRACTICE_AREAS}
            clearable
            styles={{
              pill: {
                backgroundColor: theme.colors.green[0],
                color: theme.colors.green[9],
              },
            }}
            {...form.getInputProps("practiceAreas")}
          />

          <Button
            type="submit"
            disabled={!form.isValid()}
            loading={isSubmitting}
          >
            Update Attorney
          </Button>
        </Stack>
      </form>
    </AppModal>
  );
};
