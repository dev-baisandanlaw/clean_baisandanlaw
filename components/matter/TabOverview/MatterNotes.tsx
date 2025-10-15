import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Note } from "@/types/matter-notes";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@clerk/nextjs";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";

interface MatterNotesProps {
  notes: Note[] | null;
  matterId: string;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MatterNotes({
  notes,
  matterId,
  setDataChanged,
}: MatterNotesProps) {
  const { user } = useUser();
  const [addingNote, setAddingNote] = useState(false);

  const [note, setNote] = useState("");

  const handleAddNote = async () => {
    setAddingNote(true);

    try {
      await setDoc(
        doc(db, COLLECTIONS.CASES, matterId),
        {
          notes: arrayUnion({
            id: nanoid(10),
            user: {
              id: user?.id,
              fullname: user?.firstName + " " + user?.lastName,
              email: user?.emailAddresses[0].emailAddress,
              profileImageUrl: user?.imageUrl,
            },

            content: note,

            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          }),
        },
        { merge: true }
      );

      toast.success("Note added successfully");
      setNote("");
      setDataChanged((prev) => !prev);
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <Card withBorder radius="md" p="md">
      <Card.Section inheritPadding py="xs">
        <Text size="lg" fw={600} c="green">
          Notes
        </Text>

        <Group align="start" gap="xs" my="md">
          <Avatar src={user?.imageUrl}>{user?.firstName?.charAt(0)}</Avatar>
          <Stack flex={1}>
            <Textarea
              rows={4}
              maxRows={4}
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              rightSection={<IconSend />}
              ml="auto"
              loading={addingNote}
              onClick={handleAddNote}
              disabled={!note.trim().length}
            >
              Add Note
            </Button>
          </Stack>
        </Group>
      </Card.Section>

      <ScrollArea mah={500} offsetScrollbars>
        <Stack>
          {notes
            ?.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((note) => (
              <Group key={note.id} align="start" gap="xs">
                <Avatar src={note.user.profileImageUrl}>
                  {note.user.fullname.charAt(0)}
                </Avatar>
                <Paper
                  withBorder
                  radius="md"
                  px="md"
                  py="sm"
                  bg="gray.1"
                  flex={1}
                >
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      {note.user.fullname}
                    </Text>

                    <Text size="xs" c="gray.7">
                      {getDateFormatDisplay(note.createdAt, true)}
                    </Text>
                  </Group>
                  <Text size="sm" c="gray.7" style={{ whiteSpace: "pre-wrap" }}>
                    {note.content}
                  </Text>
                </Paper>
              </Group>
            ))}

          {(!notes || notes?.length === 0) && (
            <Divider label="No notes found" labelPosition="center" mt="md" />
          )}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
