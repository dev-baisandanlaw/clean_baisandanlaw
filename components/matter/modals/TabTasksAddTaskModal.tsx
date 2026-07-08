import {
  Button,
  CheckIcon,
  Group,
  Radio,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { nanoid } from "nanoid";
import { appNotifications } from "@/utils/notifications/notifications";
import { Matter } from "@/types/matter";
import { useCreateNewMatterTaskMutation } from "@/store/services/matterService";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { useEffect } from "react";
import AppModal from "@/components/Common/modal/AppModal";

interface TabTasksAddTaskModalProps {
  opened: boolean;
  onClose: () => void;
  matterData: Matter;
}
export default function TabTasksAddTaskModal({
  opened,
  onClose,
  matterData,
}: TabTasksAddTaskModalProps) {
  const [createMatterTaskFn, { isLoading: isSubmitting }] =
    useCreateNewMatterTaskMutation();

  const selectData = [
    {
      label: `Attorney (${matterData?.leadAttorney.fullname})`,
      value: "attorney",
    },
    {
      label: `Client (${matterData?.clientData.fullname})`,
      value: "client",
    },
    { label: "Staff", value: "staff" },
  ];

  const form = useForm({
    initialValues: {
      priority: "",
      staffName: "",
      dueDate: new Date(),
      description: "",
      assignee: "",
      taskName: "",
    },
  });

  const handleSubmit = async () => {
    const assigneeDetails =
      form.values.assignee === "attorney"
        ? { ...matterData?.leadAttorney, division: "Attorney" }
        : form.values.assignee === "client"
          ? { ...matterData?.clientData, division: "Client" }
          : {
              id: `id-${nanoid(8)}-staff`,
              fullname: form.values.staffName,
              email: `email-${nanoid(8)}-staff@example.com`,
              division: "Staff",
            };

    createMatterTaskFn({
      description: form.values.description,
      dueDate: getDateFormatDisplay(form.values.dueDate),
      priority: form.values.priority,
      taskName: form.values.taskName,
      status: "Pending",
      assignee: assigneeDetails,
      caseId: matterData.id,
    })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Task created successfully",
          message: "The task has been created successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to create task",
          message: "The task could not be created. Please try again.",
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
      title="Add Task"
      size="lg"
      closable={!isSubmitting}
      type="success"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Radio.Group
            name="Priority"
            label="Select Priority"
            withAsterisk
            {...form.getInputProps("priority")}
          >
            <Group mt="xs">
              <Radio value="low" label="Low" icon={CheckIcon} />
              <Radio value="medium" label="Medium" icon={CheckIcon} />
              <Radio value="high" label="High" icon={CheckIcon} />
            </Group>
          </Radio.Group>

          <Select
            withAsterisk
            label="Assignee"
            placeholder="Jane Doe (jane.doe@example.com)"
            data={matterData ? selectData : []}
            searchable
            clearable
            nothingFoundMessage="No assignees found"
            styles={{ groupLabel: { color: "green" } }}
            {...form.getInputProps("assignee")}
          />

          {form.values.assignee === "staff" && (
            <TextInput
              withAsterisk
              label="Staff name"
              placeholder="Mark Doe"
              {...form.getInputProps("staffName")}
            />
          )}

          <TextInput
            withAsterisk
            label="Name"
            placeholder="Submit necessary documents"
            {...form.getInputProps("taskName")}
          />

          <DatePickerInput
            withAsterisk
            label="Due Date"
            placeholder="January 01, 2000"
            minDate={new Date()}
            {...form.getInputProps("dueDate")}
          />

          <Textarea
            withAsterisk
            label="Description"
            placeholder="Type here the task's description"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("description")}
            inputWrapperOrder={["label", "error", "input", "description"]}
            description={`${form.values.description.length}/1000 characters`}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={
                !form.values.assignee ||
                !form.values.taskName ||
                !form.values.dueDate ||
                !form.values.description ||
                !form.values.priority ||
                (form.values.assignee === "staff" &&
                  !form.values.staffName.trim())
              }
            >
              Add Task
            </Button>
          </Group>
        </Stack>
      </form>
    </AppModal>
  );
}
