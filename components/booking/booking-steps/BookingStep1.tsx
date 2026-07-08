import {
  Stack,
  Text,
  TextInput,
  Checkbox,
  Textarea,
  Flex,
  NumberInput,
  Radio,
  Group,
  Select,
  TagsInput,
  useMantineTheme,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { BookingFormTypeValues } from "../RevampedBookingModal";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { ATTY_PRACTICE_AREAS } from "@/constants/constants";

export default function BookingStepOne({
  form,
}: {
  form: UseFormReturnType<BookingFormTypeValues>;
}) {
  const theme = useMantineTheme();

  return (
    <Stack>
      <Text fw={600}>Booking Information</Text>
      <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
        <TextInput
          size="sm"
          label="First name"
          placeholder="John"
          withAsterisk
          {...form.getInputProps("firstname")}
          flex={1}
        />

        <TextInput
          size="sm"
          label="Last name"
          placeholder="Doe"
          withAsterisk
          {...form.getInputProps("lastname")}
          flex={1}
        />
      </Flex>

      <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
        <TextInput
          size="sm"
          label="Email"
          placeholder="john.doe@example.com"
          type="email"
          withAsterisk
          {...form.getInputProps("email")}
          flex={1}
        />

        <NumberInput
          hideControls
          maxLength={10}
          size="sm"
          label="Phone number"
          placeholder="9091234567"
          withAsterisk
          {...form.getInputProps("phone")}
          flex={1}
          leftSection={
            <Text size="sm" c="dimmed">
              +63
            </Text>
          }
          allowNegative={false}
        />
      </Flex>

      <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
        <DateInput
          withAsterisk
          label="Birthday"
          placeholder="1970-01-01"
          valueFormat="YYYY-MM-DD"
          value={form.values.birthday}
          onChange={(value: string | null) =>
            form.setFieldValue(
              "birthday",
              value ? dayjs(value, "YYYY-MM-DD").toDate() : null,
            )
          }
          flex={1}
        />

        <TextInput
          label="Adverse Party"
          placeholder="Adverse Party"
          {...form.getInputProps("adverseParty")}
          flex={1}
        />
      </Flex>

      <TextInput
        withAsterisk
        label="Full Address"
        placeholder="123 ABC Street, NYC"
        {...form.getInputProps("fullAddress")}
      />

      <Radio.Group
        name="consultationMode"
        label="Consultation Type"
        withAsterisk
        {...form.getInputProps("consultationType")}
      >
        <Group mt="xs">
          <Radio value="in-person" label="In person consultation" />
          <Radio value="online" label="Online consultation" />
        </Group>
      </Radio.Group>

      {form.values.consultationType === "in-person" && (
        <Select
          withAsterisk
          label="Branch"
          placeholder="Angeles, Magalang"
          data={[
            { value: "Angeles branch", label: "Angeles branch" },
            { value: "Magalang branch", label: "Magalang branch" },
          ]}
          {...form.getInputProps("branch")}
        />
      )}

      <TagsInput
        withAsterisk
        label="Areas"
        placeholder="General Law, Civil Law, Criminal Law"
        data={ATTY_PRACTICE_AREAS}
        clearable
        styles={{
          pill: {
            backgroundColor: theme.colors.green[0],
            color: theme.colors.green[9],
          },
        }}
        {...form.getInputProps("areas")}
      />

      <Textarea
        withAsterisk
        label="Message"
        placeholder="Something you might want to share before the appointment"
        {...form.getInputProps("message")}
        styles={{ input: { paddingBlock: 6 } }}
        rows={5}
        maxLength={1000}
        inputWrapperOrder={["label", "error", "input", "description"]}
        description={`${form.values.message.length}/1000 characters`}
      />

      <Checkbox
        label="Represented by previous lawyer"
        {...form.getInputProps("representedByPreviousLawyer", {
          type: "checkbox",
        })}
      />
    </Stack>
  );
}
