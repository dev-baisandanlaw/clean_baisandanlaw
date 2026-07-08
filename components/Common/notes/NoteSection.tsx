import { Note } from "@/types/notes";
import {
  Button,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import BasicCard from "../BasicCard";
import { IconCirclePlus, IconSend } from "@tabler/icons-react";
import NoteComp from "./NoteComp";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useUpdateNoteMutation,
} from "@/store/services/noteService";
import { appNotifications } from "@/utils/notifications/notifications";
import DeleteModal from "../modal/DeleteModal";
import { useDisclosure } from "@mantine/hooks";
import { useUser } from "@clerk/nextjs";

export default function NoteSection({
  notes,
  from,
  slugId,
}: {
  notes: Note[];
  from: "matter" | "retainer";
  slugId: string;
}) {
  const { user } = useUser();

  const [createNoteFn, { isLoading: isSubmitting }] = useCreateNoteMutation();
  const [updateNoteFn, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [deleteNoteFn] = useDeleteNoteMutation();

  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editModeId, setEditModeId] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState("");

  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      note: "",
    },
  });

  useEffect(() => {
    form.reset();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, editModeId]);

  useEffect(() => {
    if (editModeId) {
      const foundNote = notes.find((e) => e.id === editModeId);
      form.setFieldValue("note", foundNote?.note || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModeId]);

  const handleAddNote = () => {
    createNoteFn({
      note: form.values.note,
      ...(from === "matter" ? { matterId: slugId } : { retainerId: slugId }),
    })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Note added successfully",
          message: "Note can now be viewed by other users",
        });
        setIsCreateMode(false);
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to add note",
          message: "The note cannot be added. Please try again",
        });
      });
  };

  const handleUpdateNote = useCallback(
    (id: string) => {
      updateNoteFn({
        note: form.values.note,
        noteId: id,
        slug: from,
        slugId,
      })
        .unwrap()
        .then(() => {
          appNotifications.success({
            title: "Note updated successfully",
            message: "Updated note can now be viewed by other users",
          });
          setEditModeId("");
        })
        .catch(() => {
          appNotifications.error({
            title: "Failed to add note",
            message: "The note cannot be added. Please try again",
          });
        });
    },
    [updateNoteFn, from, slugId, form.values.note],
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      return deleteNoteFn({ slug: from, noteId: id, slugId })
        .unwrap()
        .then(() => {
          appNotifications.success({
            title: "Note deleted successfully",
            message: "The note has been deleted",
          });
          setEditModeId("");
          setDeleteNoteId("");
          setIsCreateMode(false);
          close();
        })
        .catch(() => {
          appNotifications.error({
            title: "Failed to delete note",
            message: "The note cannot be deleted. Please try again",
          });
        });
    },
    [close, deleteNoteFn, from, slugId],
  );

  if (!from || !slugId) return null;

  return (
    <>
      <BasicCard
        bodyProps={{ pb: 0 }}
        title="Notes"
        actionButton={
          !isCreateMode &&
          !editModeId && (
            <Button
              leftSection={<IconCirclePlus size={18} />}
              size="xs"
              variant="outline"
              onClick={() => setIsCreateMode(true)}
            >
              Add Note
            </Button>
          )
        }
      >
        <ScrollArea.Autosize mah={200} offsetScrollbars>
          {isCreateMode && (
            <Stack gap="xs" mb="sm">
              <Textarea
                placeholder="Type notes here ..."
                rows={3}
                maxLength={250}
                disabled={isSubmitting}
                {...form.getInputProps("note")}
              />
              <Group justify="space-between" align="flex-start">
                <Text size="xs" c="dimmed">
                  {form.values.note.length}/250 characters
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setIsCreateMode(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    leftSection={<IconSend size={18} />}
                    disabled={form.values.note.trim().length === 0}
                    loading={isSubmitting}
                    onClick={handleAddNote}
                  >
                    Add note
                  </Button>
                </Group>
              </Group>
            </Stack>
          )}

          {notes && notes?.length > 0 ? (
            notes
              .map((n) => (
                <NoteComp
                  note={n}
                  key={n.id}
                  editingId={editModeId}
                  setEditingId={setEditModeId}
                  form={form}
                  isUpdating={isUpdating}
                  handleUpdateNote={handleUpdateNote}
                  handleClickDelete={() => {
                    setDeleteNoteId(n.id);
                    open();
                  }}
                  canPerformAction={n.createdBy.id === user?.id}
                />
              ))
              .reverse()
          ) : (
            <Divider label="No notes available" />
          )}
        </ScrollArea.Autosize>
      </BasicCard>

      <DeleteModal
        opened={opened}
        onClose={() => {
          close();
          setDeleteNoteId("");
        }}
        title="Delete note"
        action="delete"
        entityType="note"
        handleDelete={async () => {
          if (!deleteNoteId) return;
          await handleDeleteNote(deleteNoteId);
        }}
      />
    </>
  );
}
