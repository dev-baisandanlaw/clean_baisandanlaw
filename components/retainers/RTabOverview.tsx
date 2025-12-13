"use client";

import { Retainer } from "@/types/retainer";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  em,
  Flex,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Spoiler,
  Stack,
  Table,
  Text,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { IconPencil, IconSend } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { useUser } from "@clerk/nextjs";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import { Note } from "@/types/matter-notes";
import { appNotifications } from "@/utils/notifications/notifications";
import { useMediaQuery } from "@mantine/hooks";

interface RTabOverviewProps {
  retainerData: Retainer;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

interface VerticalTableProps {
  title: string;
  data: {
    th: string;
    td: React.ReactNode;
  }[];
}

export default function RTabOverview({
  retainerData,
  setDataChanged,
}: RTabOverviewProps) {
  const shrink = useMediaQuery("(max-width: 948px)");
  const theme = useMantineTheme();

  const retainerDetailsCardData = [
    {
      th: "Client Name",
      td: (
        <Text c="green" fw={600} size="sm">
          {retainerData.clientName}
        </Text>
      ),
    },
    {
      th: "Practice Areas",
      td: (
        <Group gap={2}>
          {retainerData.practiceAreas.map((area) => (
            <Badge
              key={area}
              color={theme.other.customPumpkin}
              size="xs"
              radius="xs"
              variant="outline"
            >
              {area}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      th: "Retainer Since",
      td: getDateFormatDisplay(retainerData.retainerSince),
    },
    {
      th: "Date Created",
      td: getDateFormatDisplay(retainerData.createdAt),
    },
  ];

  const contactDetailsCardData = [
    {
      th: "Name",
      td: (
        <Text c="green" fw={600} size="sm">
          {retainerData.contactPerson.fullname}
        </Text>
      ),
    },
    {
      th: "Email",
      td: (
        <Text c="green" fw={600} size="sm">
          {retainerData.contactPerson.email}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: retainerData.contactPerson.phoneNumber || "-",
    },
    {
      th: "Address",
      td: retainerData.contactPerson.address || "-",
    },
  ];

  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditDescription, setIsEditDescription] = useState(false);
  const [description, setDescription] = useState("");

  const handleUpdateDescription = async () => {
    setIsUpdatingDescription(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.RETAINERS, retainerData.id),
        {
          description: description,
        },
        {
          merge: true,
        }
      );

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Description updated successfully",
        message: "The description has been updated successfully",
      });
      setIsEditDescription(false);
    } catch {
      appNotifications.error({
        title: "Failed to update description",
        message: "The description could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  useEffect(() => {
    setDescription(retainerData?.description || "");
  }, [retainerData]);

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={shrink ? 1 : 2}>
        <VerticalTable
          title="Retainer Details"
          data={retainerDetailsCardData}
        />
        <VerticalTable title="Contact Details" data={contactDetailsCardData} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group align="center" mb="sm" gap={4} justify="space-between">
          <Text size="lg" fw={600} c="green">
            Description
          </Text>

          <ActionIcon
            variant="white"
            size="sm"
            color={theme.other.customPumpkin}
            onClick={() => setIsEditDescription(true)}
          >
            <IconPencil size={20} />
          </ActionIcon>

          {isEditDescription && (
            <Group gap={4}>
              <Button
                size="xs"
                variant="default"
                onClick={() => {
                  setIsEditDescription(false);
                  setDescription(retainerData?.description || "");
                }}
                disabled={isUpdatingDescription}
              >
                Discard
              </Button>
              <Button
                size="xs"
                loading={isUpdatingDescription}
                onClick={handleUpdateDescription}
                disabled={
                  !description.trim().length ||
                  retainerData?.description === description
                }
              >
                Save
              </Button>
            </Group>
          )}
        </Group>

        {isEditDescription ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minRows={6}
            autosize
            styles={{ input: { paddingBlock: 6 } }}
          />
        ) : (
          <Spoiler
            maxHeight={80}
            showLabel="Show more"
            hideLabel="Show less"
            styles={{
              control: { fontWeight: 700, color: "#448AFF", fontSize: 14 },
            }}
          >
            <Text size="sm" mr="xl" style={{ whiteSpace: "pre-wrap" }}>
              {retainerData?.description || "-"}
            </Text>
          </Spoiler>
        )}
      </Paper>

      <RetainerNotes
        notes={retainerData.notes || null}
        retainerId={retainerData.id}
        setDataChanged={setDataChanged}
      />
    </Flex>
  );
}

const VerticalTable = ({ title, data = [] }: VerticalTableProps) => (
  <Card withBorder radius="md" p="md">
    <Card.Section inheritPadding py="xs">
      <Text size="lg" fw={600} c="green">
        {title}
      </Text>
    </Card.Section>

    <Table variant="vertical" layout="fixed">
      <Table.Tbody>
        {data.map((item, index) => (
          <Table.Tr key={index}>
            <Table.Th w={120}>{item.th}</Table.Th>
            <Table.Td>{item.td}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </Card>
);

interface RetainerNotesProps {
  notes: Note[] | null;
  retainerId: string;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

function RetainerNotes({
  notes,
  retainerId,
  setDataChanged,
}: RetainerNotesProps) {
  const { user } = useUser();
  const [addingNote, setAddingNote] = useState(false);

  const [note, setNote] = useState("");

  const handleAddNote = async () => {
    setAddingNote(true);

    try {
      await setDoc(
        doc(db, COLLECTIONS.RETAINERS, retainerId),
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

      appNotifications.success({
        title: "Note added successfully",
        message: "The note has been added successfully",
      });
      setNote("");
      setDataChanged((prev) => !prev);
    } catch {
      appNotifications.error({
        title: "Failed to add note",
        message: "The note could not be added. Please try again.",
      });
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
