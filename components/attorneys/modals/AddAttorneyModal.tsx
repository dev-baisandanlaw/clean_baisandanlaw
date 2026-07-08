import {
  ActionIcon,
  Button,
  em,
  SimpleGrid,
  Stack,
  TagsInput,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { IconRefresh } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { nanoid } from "nanoid";
import { appNotifications } from "@/utils/notifications/notifications";
import { useMediaQuery } from "@mantine/hooks";
import AppModal from "@/components/Common/modal/AppModal";
import { useAddNewAttorneyMutation } from "@/store/services/userService";

interface AddAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
}

export const AddAttorneyModal = ({
  opened,
  onClose,
}: AddAttorneyModalProps) => {
  const isMobile = useMediaQuery(`(max-width: ${em(600)})`);
  const theme = useMantineTheme();

  const [createAttyFn, { isLoading: isSubmitting }] =
    useAddNewAttorneyMutation();

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      practiceAreas: [],
      role: "attorney",
    },

    validate: {
      firstName: (value) => (!value.length ? "First name is required" : null),
      lastName: (value) => (!value.length ? "Last name is required" : null),
      email: (value) =>
        !value.length
          ? "Email is required"
          : /^\S+@\S+$/.test(value)
            ? null
            : "Invalid Email",
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      practiceAreas: (value) =>
        !value.length ? "Practice areas are required" : null,
    },

    validateInputOnChange: true,
  });

  const handleGeneratePassword = () => {
    const password = nanoid(12);
    form.setFieldValue("password", password);
  };

  const handleSubmit = async (values: typeof form.values) => {
    createAttyFn({ ...values })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Attorney added successfully",
          message: "The attorney has been added successfully",
        });

        onClose();
      })
      .catch((e) => {
        const message =
          e?.data?.message ||
          "The attorney could not be added. Please try again.";
        appNotifications.error({
          title: "Failed to add attorney",
          message,
          autoClose: 5000,
        });
      });
  };

  useEffect(() => {
    if (!opened) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

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
          <SimpleGrid
            cols={isMobile ? 1 : 2}
            verticalSpacing={isMobile ? "2px" : "md"}
          >
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
              withAsterisk
              label="Email"
              placeholder="john.doe@example.com"
              flex={1}
              {...form.getInputProps("email")}
            />

            <TextInput
              label="Phone Number"
              placeholder="09123456789"
              flex={1}
              {...form.getInputProps("phoneNumber")}
            />
          </SimpleGrid>
          <TextInput
            withAsterisk
            label="Password"
            placeholder="********"
            rightSection={
              <ActionIcon
                variant="light"
                color="green"
                size="sm"
                onClick={handleGeneratePassword}
              >
                <IconRefresh />
              </ActionIcon>
            }
            {...form.getInputProps("password")}
          />

          <TagsInput
            label="Practice Areas"
            placeholder="Select Practice Areas"
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
            Add Attorney
          </Button>
        </Stack>
      </form>
    </AppModal>
  );
};
