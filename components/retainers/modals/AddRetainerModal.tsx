import { useEffect } from "react";

import {
  Button,
  Group,
  NumberInput,
  Radio,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";

import { ATTY_PRACTICE_AREAS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { useCreateRetainerMutation } from "@/store/services/retainerService";
import { nanoid } from "nanoid";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import AppModal from "@/components/Common/modal/AppModal";

interface AddRetainerModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AddRetainerModal({
  opened,
  onClose,
}: AddRetainerModalProps) {
  const shrink = useMediaQuery("(max-width: 500px)");
  const theme = useMantineTheme();

  const [createRetainerFn, { isLoading: isSubmitting }] =
    useCreateRetainerMutation();

  const form = useForm({
    initialValues: {
      clientName: "",
      clientType: "individual",
      contactPerson: {
        fullname: "",
        email: "",
        phone: "",
        address: "",
      },
      practiceAreas: [],
      retainerSince: new Date(),
      description: "",
    },

    validate: {
      clientName: (value) => (!value.length ? "Client name is required" : null),
      contactPerson: {
        fullname: (value) =>
          !value.length ? "Contact Person Full name is required" : null,
        email: (value) =>
          !value?.length
            ? "Email is required"
            : /^\S+@\S+$/.test(value)
              ? null
              : "Invalid Email",
        phone: (value) =>
          String(value).length < 10 ? "Invalid Phone Number" : null,
        address: (value) =>
          !value || !String(value).length ? "Address is required" : null,
      },
      practiceAreas: (value) =>
        !value.length ? "Please select at least one matter type" : null,
      description: (value) =>
        !value.length ? "Description is required" : null,
    },

    validateInputOnChange: true,
  });

  const handleSubmit = async (values: typeof form.values) => {
    const {
      clientName,
      clientType,
      contactPerson,
      description,
      practiceAreas,
      retainerSince,
    } = values;

    createRetainerFn({
      areas: practiceAreas,
      clientName,
      clientType,
      contactPerson: {
        phone: contactPerson.phone,
        email: contactPerson.email,
        fullname: contactPerson.fullname,
        id: nanoid(12),
        fullAddress: contactPerson.address,
      },
      description,
      retainerSince: getDateFormatDisplay(retainerSince),
    })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Retainer added successfully",
          message: "The retainer has been added successfully",
        });

        onClose();
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
  };

  useEffect(() => {
    if (!opened) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="New Retainer"
      size="lg"
      closable={!isSubmitting}
      type="success"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Stack gap="xs" mb="xs">
            <TextInput
              withAsterisk
              label="Client Name"
              placeholder="Acme Corp"
              {...form.getInputProps("clientName")}
            />

            <Radio.Group
              withAsterisk
              label="Client Type"
              {...form.getInputProps("clientType")}
            >
              <Group mt="xs">
                <Radio value="individual" label="Individual" />
                <Radio value="company" label="Company" />
              </Group>
            </Radio.Group>
          </Stack>

          <Stack gap="xs" mb="xs">
            <SimpleGrid
              cols={shrink ? 1 : 2}
              verticalSpacing={shrink ? "2px" : "md"}
            >
              <TextInput
                withAsterisk
                label="Contact Person"
                placeholder="Jane Doe"
                {...form.getInputProps("contactPerson.fullname")}
              />

              <TextInput
                withAsterisk
                label="Email"
                placeholder="jane.doe@example.com"
                {...form.getInputProps("contactPerson.email")}
              />

              <NumberInput
                withAsterisk
                hideControls
                label="Phone Number"
                maxLength={10}
                placeholder="912 345 6789"
                leftSection={
                  <Text size="sm" c="dimmed">
                    +63
                  </Text>
                }
                allowNegative={false}
                {...form.getInputProps("contactPerson.phone")}
              />

              <TextInput
                withAsterisk
                label="Full Address"
                placeholder="123 ABC Street, NYC"
                {...form.getInputProps("contactPerson.address")}
              />
            </SimpleGrid>
          </Stack>

          <Stack gap="xs" mb="xs">
            <DatePickerInput
              withAsterisk
              label="Retainer Since"
              placeholder="January 1, 2000"
              clearable
              hideOutsideDates
              {...form.getInputProps("retainerSince")}
            />

            <TagsInput
              withAsterisk
              label="Areas"
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

            <Textarea
              withAsterisk
              label="Description"
              placeholder="Type here the retainer's description"
              minRows={6}
              autosize
              styles={{ input: { paddingBlock: 6 } }}
              {...form.getInputProps("description")}
            />
          </Stack>

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!form.isValid()}
            >
              Add Retainer
            </Button>
          </Group>
        </Stack>
      </form>
    </AppModal>
  );
}
