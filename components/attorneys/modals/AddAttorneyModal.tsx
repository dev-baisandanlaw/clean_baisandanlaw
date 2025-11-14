import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  TagsInput,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { ATTY_PRACTICE_AREAS, CLERK_ORG_IDS } from "@/constants/constants";
import { IconRefresh } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import axios from "axios";
import { appNotifications } from "@/utils/notifications/notifications";

interface AddAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  setIsDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AddAttorneyModal = ({
  opened,
  onClose,
  setIsDataChanged,
}: AddAttorneyModalProps) => {
  const theme = useMantineTheme();

  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    try {
      const { data: createdUserData } = await axios.post(
        "/api/clerk/user/create-user",
        values
      );

      await axios.post("/api/clerk/organization/post-user-to-org", {
        user_id: createdUserData!.id,
        organization_id: CLERK_ORG_IDS.attorney,
      });

      appNotifications.success({
        title: "Attorney added successfully",
        message: "The attorney has been added successfully",
      });

      setIsDataChanged(true);
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.errors?.[0]?.message;

      if (errorMessage?.includes("online data breach")) {
        form.setFieldError(
          "password",
          "Password is too weak. Please try again."
        );
      }

      appNotifications.error({
        title: "Failed to add attorney",
        message:
          errorMessage || "The attorney could not be added. Please try again.",
        autoClose: 5000,
      });
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
      title="Add Attorney"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group gap="md">
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
          </Group>

          <Group gap="md">
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
          </Group>

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

          <Button type="submit" disabled={!form.isValid()} loading={isLoading}>
            Add Attorney
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
