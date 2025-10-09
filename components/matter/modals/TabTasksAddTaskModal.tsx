import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import {
  Button,
  CheckIcon,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { arrayUnion, doc, increment, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { TaskDivision } from "@/types/task";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { useUser } from "@clerk/nextjs";
import { MatterUpdateType } from "@/types/matter-updates";

interface TabTasksAddTaskModalProps {
  opened: boolean;
  onClose: () => void;
  matterData: Matter;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function TabTasksAddTaskModal({
  opened,
  onClose,
  matterData,
  setDataChanged,
}: TabTasksAddTaskModalProps) {
  const { user } = useUser();
  const selectData = [
    {
      label: `Attorney (${matterData?.leadAttorney.fullname})`,
      value: "attorney",
    },
    {
      label: `Client (${matterData?.clientData.fullname})`,
      value: "client",
    },
  ];

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      priority: "",
      name: "",
      dueDate: "",
      description: "",
      assignee: "",
      taskName: "",
    },
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const assigneeDetails =
        form.values.assignee === "attorney"
          ? matterData?.leadAttorney
          : matterData?.clientData;

      await setDoc(
        doc(db, COLLECTIONS.TASKS, matterData!.id),
        {
          totalTasks: increment(1),
          totalPendingTasks: increment(1),
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          tasks: arrayUnion({
            ...form.values,
            assignee: {
              ...assigneeDetails,
              division:
                form.values.assignee === "attorney"
                  ? TaskDivision.Attorney
                  : TaskDivision.Client,
            },
            taskId: nanoid(10),
            status: "Pending",
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          }),
        },
        { merge: true }
      );
      await addMatterUpdate(
        user!,
        matterData!.id,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.TASK,
        `Task Created: ${form.values.taskName}`
      );

      toast.success("Task created successfully!");
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      toast.error("Failed to create task");
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
      title="Add Task"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
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
            placeholder="Select Assignee"
            data={matterData ? selectData : []}
            searchable
            clearable
            nothingFoundMessage="No assignees found"
            styles={{ groupLabel: { color: "green" } }}
            {...form.getInputProps("assignee")}
          />

          <TextInput
            withAsterisk
            label="Name"
            placeholder="Enter task name"
            {...form.getInputProps("taskName")}
          />

          <DateTimePicker
            withAsterisk
            label="Due Date"
            placeholder="Select Due Date"
            {...form.getInputProps("dueDate")}
          />

          <Textarea
            withAsterisk
            label="Description"
            placeholder="Enter description"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            {...form.getInputProps("description")}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={
                !form.values.assignee ||
                !form.values.taskName ||
                !form.values.dueDate ||
                !form.values.description ||
                !form.values.priority
              }
            >
              Add Task
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
