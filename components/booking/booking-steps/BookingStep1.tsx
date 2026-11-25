import {
  Stack,
  Text,
  TextInput,
  Checkbox,
  Textarea,
  Flex,
  NumberInput,
  Paper,
  Radio,
  Group,
  SimpleGrid,
  TagsInput,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { BookingFormTypeValues } from "../RevampedBookingModal";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import {
  ATTY_PRACTICE_AREAS,
  IN_PERSON_OFFICE_ADDRESS,
} from "@/constants/constants";
import { IconMapPin, IconVideo } from "@tabler/icons-react";

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

      <Flex
        gap="sm"
        direction={{ base: "column", sm: "row" }}
        align="flex-start"
      >
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
          w={{ base: "100%", sm: "auto" }}
        />

        <TextInput
          withAsterisk
          label="Full Address"
          placeholder="House number, street, barangay, city"
          {...form.getInputProps("fullAddress")}
          flex={1}
          w={{ base: "100%", sm: "auto" }}
        />
      </Flex>

      <Paper
        withBorder
        p="md"
        radius="md"
        style={{
          borderColor: form.values.hasAdverseParty
            ? theme.colors.green[6]
            : theme.colors.gray[3],
          backgroundColor: form.values.hasAdverseParty
            ? theme.colors.green[0]
            : theme.colors.gray[0],
        }}
      >
        <Stack gap="md">
          <Checkbox
            label="Adverse party"
            description="Is there someone you're having a problem with?"
            color="green"
            styles={{
              label: { fontWeight: 600 },
              description: { lineHeight: 1.5 },
            }}
            {...form.getInputProps("hasAdverseParty", { type: "checkbox" })}
          />
          {form.values.hasAdverseParty && (
            <TextInput
              required
              label="Adverse Party Name"
              placeholder="Enter the adverse party's name"
              {...form.getInputProps("adverseParty")}
            />
          )}
        </Stack>
      </Paper>

      <Radio.Group
        name="consultationMode"
        label="Consultation Type"
        withAsterisk
        {...form.getInputProps("consultationType")}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="xs">
          <Radio.Card
            value="in-person"
            radius="md"
            p="md"
            style={(theme) => ({
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              backgroundColor:
                form.values.consultationType === "in-person"
                  ? theme.colors.green[0]
                  : theme.white,
              border: `1px solid ${
                form.values.consultationType === "in-person"
                  ? theme.colors.green[6]
                  : theme.colors.gray[3]
              }`,
              cursor: "pointer",
              transition:
                "border-color 150ms ease, background-color 150ms ease",
            })}
          >
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" color="green" size="md" radius="xl">
                <IconMapPin size={17} />
              </ThemeIcon>
              <Stack gap={3} style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  In-person consultation
                </Text>
                <Text size="xs" c="dimmed" lh={1.45}>
                  {IN_PERSON_OFFICE_ADDRESS}
                </Text>
              </Stack>
              <Radio.Indicator />
            </Group>
          </Radio.Card>

          <Radio.Card
            value="online"
            radius="md"
            p="md"
            style={(theme) => ({
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              backgroundColor:
                form.values.consultationType === "online"
                  ? theme.colors.green[0]
                  : theme.white,
              border: `1px solid ${
                form.values.consultationType === "online"
                  ? theme.colors.green[6]
                  : theme.colors.gray[3]
              }`,
              cursor: "pointer",
              transition:
                "border-color 150ms ease, background-color 150ms ease",
            })}
          >
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" color="green" size="md" radius="xl">
                <IconVideo size={17} />
              </ThemeIcon>
              <Stack gap={3} style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  Online consultation
                </Text>
                <Text size="xs" c="dimmed" lh={1.45}>
                  Via Zoom
                </Text>
              </Stack>
              <Radio.Indicator />
            </Group>
          </Radio.Card>
        </SimpleGrid>
      </Radio.Group>

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
