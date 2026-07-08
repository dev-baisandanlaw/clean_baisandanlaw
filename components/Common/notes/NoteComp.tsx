import { Note } from "@/types/notes";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import React, { SetStateAction } from "react";

export default function NoteComp({
  note,
  setEditingId,
  editingId,
  form,
  isUpdating,
  handleUpdateNote,
  handleClickDelete,
  canPerformAction,
}: {
  note: Note;
  setEditingId: React.Dispatch<SetStateAction<string>>;
  editingId: string;
  form: UseFormReturnType<{ note: string }>;
  isUpdating: boolean;
  handleUpdateNote: (id: string) => void;
  handleClickDelete: () => void;
  canPerformAction: boolean;
}) {
  if (!note) return null;

  return (
    <Paper withBorder radius="sm" p="sm" mb="sm">
      <Stack gap="2">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {note.createdBy.fullname} •{" "}
            {note.isUpdated
              ? `Edited at ${getDateFormatDisplay(note.updatedAt, true)}`
              : getDateFormatDisplay(note.createdAt, true)}
          </Text>

          {canPerformAction && editingId !== note.id && (
            <Group gap="2">
              <ActionIcon
                variant="subtle"
                size="xs"
                color="#D4AF37"
                onClick={() => setEditingId(note.id)}
                disabled={!!editingId}
              >
                <IconPencil size={18} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="xs"
                color="red"
                onClick={handleClickDelete}
                disabled={!!editingId}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          )}

          {canPerformAction && editingId === note.id && (
            <Group gap="2">
              <Button
                size="compact-xs"
                variant="default"
                onClick={() => setEditingId("")}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                size="compact-xs"
                variant="filled"
                onClick={() => handleUpdateNote(note.id)}
                disabled={form.values.note.trim().length === 0}
                loading={isUpdating}
              >
                Save
              </Button>
            </Group>
          )}
        </Group>
        {editingId === note.id ? (
          <Textarea
            rows={3}
            maxLength={250}
            {...form.getInputProps("note")}
            description={`${form.values.note.length}/250 characters`}
          />
        ) : (
          <Text size="sm" fw={500} style={{ wordBreak: "break-all" }}>
            {note.note}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
