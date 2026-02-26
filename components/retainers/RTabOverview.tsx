"use client";

import { useEffect, useState } from "react";

import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  NumberInput,
  Paper,
  Radio,
  ScrollArea,
  SimpleGrid,
  Spoiler,
  Stack,
  Table,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBuilding,
  IconPencil,
  IconSend,
  IconUser,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { ATTY_PRACTICE_AREAS, COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { syncToAppwrite } from "@/lib/syncToAppwrite";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";

import type { Retainer } from "@/types/retainer";
import type { Note } from "@/types/matter-notes";

interface RTabOverviewProps {
  retainerData: Retainer;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RTabOverview({
  retainerData,
  setDataChanged,
}: RTabOverviewProps) {
  const shrink = useMediaQuery("(max-width: 948px)");
  const theme = useMantineTheme();
  const { user } = useUser();

  const isAdmin = user?.unsafeMetadata?.role === "admin";

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    clientName: retainerData.clientName,
    clientType: retainerData.clientType,
    practiceAreas: retainerData.practiceAreas,
    retainerSince: new Date(retainerData.retainerSince),
  });

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [editedContact, setEditedContact] = useState({
    fullname: retainerData.contactPerson.fullname,
    email: retainerData.contactPerson.email,
    phoneNumber: retainerData.contactPerson.phoneNumber,
    address: retainerData.contactPerson.address,
  });

  const retainerDetailsCardData = [
    {
      th: "Client Name",
      td: isEditingDetails ? (
        <TextInput
          size="xs"
          value={editedDetails.clientName}
          onChange={(e) =>
            setEditedDetails({ ...editedDetails, clientName: e.target.value })
          }
        />
      ) : (
        <Group gap="xs">
          {retainerData.clientType === "individual" ? (
            <IconUser size={18} />
          ) : (
            <IconBuilding size={18} />
          )}
          <Text c="green" fw={600} size="sm">
            {retainerData.clientName}
          </Text>
        </Group>
      ),
    },
    {
      th: "Client Type",
      td: isEditingDetails ? (
        <Radio.Group
          value={editedDetails.clientType}
          onChange={(value) =>
            setEditedDetails({
              ...editedDetails,
              clientType: value as "individual" | "company",
            })
          }
        >
          <Group gap="xs">
            <Radio value="individual" label="Individual" size="xs" />
            <Radio value="company" label="Company" size="xs" />
          </Group>
        </Radio.Group>
      ) : null,
    },
    {
      th: "Practice Areas",
      td: isEditingDetails ? (
        <TagsInput
          size="xs"
          value={editedDetails.practiceAreas}
          onChange={(value) =>
            setEditedDetails({ ...editedDetails, practiceAreas: value })
          }
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
        />
      ) : (
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
      td: isEditingDetails ? (
        <DatePickerInput
          size="xs"
          value={editedDetails.retainerSince}
          onChange={(value) =>
            setEditedDetails({
              ...editedDetails,
              retainerSince: (value || new Date()) as Date,
            })
          }
          clearable
          hideOutsideDates
        />
      ) : (
        getDateFormatDisplay(retainerData.retainerSince)
      ),
    },
    {
      th: "Date Created",
      td: getDateFormatDisplay(retainerData.createdAt),
    },
  ];

  const contactDetailsCardData = [
    {
      th: "Name",
      td: isEditingContact ? (
        <TextInput
          size="xs"
          value={editedContact.fullname}
          onChange={(e) =>
            setEditedContact({ ...editedContact, fullname: e.target.value })
          }
        />
      ) : (
        <Text c="green" fw={600} size="sm">
          {retainerData.contactPerson.fullname}
        </Text>
      ),
    },
    {
      th: "Email",
      td: isEditingContact ? (
        <TextInput
          size="xs"
          value={editedContact.email}
          onChange={(e) =>
            setEditedContact({ ...editedContact, email: e.target.value })
          }
        />
      ) : (
        <Text c="green" fw={600} size="sm">
          {retainerData.contactPerson.email}
        </Text>
      ),
    },
    {
      th: "Phone",
      td: isEditingContact ? (
        <NumberInput
          size="xs"
          hideControls
          maxLength={10}
          placeholder="912 345 6789"
          leftSection={
            <Text size="sm" c="dimmed">
              +63
            </Text>
          }
          allowNegative={false}
          value={editedContact.phoneNumber}
          onChange={(value) =>
            setEditedContact({ ...editedContact, phoneNumber: String(value) })
          }
        />
      ) : (
        retainerData.contactPerson.phoneNumber || "-"
      ),
    },
    {
      th: "Address",
      td: isEditingContact ? (
        <TextInput
          size="xs"
          value={editedContact.address}
          onChange={(e) =>
            setEditedContact({ ...editedContact, address: e.target.value })
          }
        />
      ) : (
        retainerData.contactPerson.address || "-"
      ),
    },
  ];

  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditDescription, setIsEditDescription] = useState(false);
  const [description, setDescription] = useState("");

  const handleUpdateContact = async () => {
    setIsUpdatingContact(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.RETAINERS, retainerData.id),
        {
          contactPerson: editedContact,
          updatedAt: now,
        },
        {
          merge: true,
        },
      );

      // Sync to Appwrite
      await syncToAppwrite("RETAINERS", retainerData.id, {
        client: retainerData.clientName,
        clientType: retainerData.clientType,
        contactPersonName: editedContact.fullname,
        contactPersonEmail: editedContact.email,
        matterType: retainerData.practiceAreas.join("&_&"),
        retainerSince: retainerData.retainerSince,
        search_blob: `${retainerData.clientName} ${retainerData.clientType} ${editedContact.fullname} ${editedContact.email} ${retainerData.practiceAreas.join(" ")} ${retainerData.retainerSince}`,
      });

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Contact details updated successfully",
        message: "The contact details have been updated successfully",
      });
      setIsEditingContact(false);
    } catch {
      appNotifications.error({
        title: "Failed to update contact details",
        message: "The contact details could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingContact(false);
    }
  };

  const handleUpdateDetails = async () => {
    setIsUpdatingDetails(true);
    try {
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const formattedRetainerSince = dayjs(editedDetails.retainerSince).format(
        "YYYY-MM-DD",
      );

      // Update Firebase
      await setDoc(
        doc(db, COLLECTIONS.RETAINERS, retainerData.id),
        {
          clientName: editedDetails.clientName,
          clientType: editedDetails.clientType,
          practiceAreas: editedDetails.practiceAreas,
          retainerSince: formattedRetainerSince,
          updatedAt: now,
        },
        {
          merge: true,
        },
      );

      // Sync to Appwrite
      await syncToAppwrite("RETAINERS", retainerData.id, {
        client: editedDetails.clientName,
        clientType: editedDetails.clientType,
        contactPersonName: retainerData.contactPerson.fullname,
        contactPersonEmail: retainerData.contactPerson.email,
        matterType: editedDetails.practiceAreas.join("&_&"),
        retainerSince: formattedRetainerSince,
        search_blob: `${editedDetails.clientName} ${editedDetails.clientType} ${retainerData.contactPerson.fullname} ${retainerData.contactPerson.email} ${editedDetails.practiceAreas.join(" ")} ${formattedRetainerSince}`,
      });

      setDataChanged((prev) => !prev);
      appNotifications.success({
        title: "Retainer details updated successfully",
        message: "The retainer details have been updated successfully",
      });
      setIsEditingDetails(false);
    } catch {
      appNotifications.error({
        title: "Failed to update retainer details",
        message: "The retainer details could not be updated. Please try again.",
      });
    } finally {
      setIsUpdatingDetails(false);
    }
  };

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
        },
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
    setEditedDetails({
      clientName: retainerData.clientName,
      clientType: retainerData.clientType,
      practiceAreas: retainerData.practiceAreas,
      retainerSince: new Date(retainerData.retainerSince),
    });
    setEditedContact({
      fullname: retainerData.contactPerson.fullname,
      email: retainerData.contactPerson.email,
      phoneNumber: retainerData.contactPerson.phoneNumber,
      address: retainerData.contactPerson.address,
    });
  }, [retainerData]);

  return (
    <Flex direction="column" gap="md">
      <SimpleGrid cols={shrink ? 1 : 2}>
        <Card withBorder radius="md" p="md">
          <Card.Section inheritPadding py="xs">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={600} c="green">
                Retainer Details
              </Text>

              {isAdmin && !isEditingDetails ? (
                <ActionIcon
                  variant="white"
                  size="sm"
                  color={theme.other.customPumpkin}
                  onClick={() => setIsEditingDetails(true)}
                >
                  <IconPencil size={20} />
                </ActionIcon>
              ) : isAdmin && isEditingDetails ? (
                <Group gap={4}>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      setIsEditingDetails(false);
                      setEditedDetails({
                        clientName: retainerData.clientName,
                        clientType: retainerData.clientType,
                        practiceAreas: retainerData.practiceAreas,
                        retainerSince: new Date(retainerData.retainerSince),
                      });
                    }}
                    disabled={isUpdatingDetails}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    loading={isUpdatingDetails}
                    onClick={handleUpdateDetails}
                    disabled={
                      !editedDetails.clientName.trim().length ||
                      !editedDetails.practiceAreas.length ||
                      (editedDetails.clientName === retainerData.clientName &&
                        editedDetails.clientType === retainerData.clientType &&
                        JSON.stringify(editedDetails.practiceAreas) ===
                          JSON.stringify(retainerData.practiceAreas) &&
                        dayjs(editedDetails.retainerSince).format(
                          "YYYY-MM-DD",
                        ) === retainerData.retainerSince)
                    }
                  >
                    Save
                  </Button>
                </Group>
              ) : null}
            </Group>
          </Card.Section>

          <Table variant="vertical" layout="fixed">
            <Table.Tbody>
              {retainerDetailsCardData
                .filter((item) => item.td !== null)
                .map((item, index) => (
                  <Table.Tr key={index}>
                    <Table.Th w={120}>{item.th}</Table.Th>
                    <Table.Td>{item.td}</Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Card>
        <Card withBorder radius="md" p="md">
          <Card.Section inheritPadding py="xs">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={600} c="green">
                Contact Details
              </Text>

              {isAdmin && !isEditingContact ? (
                <ActionIcon
                  variant="white"
                  size="sm"
                  color={theme.other.customPumpkin}
                  onClick={() => setIsEditingContact(true)}
                >
                  <IconPencil size={20} />
                </ActionIcon>
              ) : isAdmin && isEditingContact ? (
                <Group gap={4}>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      setIsEditingContact(false);
                      setEditedContact({
                        fullname: retainerData.contactPerson.fullname,
                        email: retainerData.contactPerson.email,
                        phoneNumber: retainerData.contactPerson.phoneNumber,
                        address: retainerData.contactPerson.address,
                      });
                    }}
                    disabled={isUpdatingContact}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    loading={isUpdatingContact}
                    onClick={handleUpdateContact}
                    disabled={
                      !editedContact.fullname.trim().length ||
                      !editedContact.email.trim().length ||
                      !/^\S+@\S+$/.test(editedContact.email) ||
                      String(editedContact.phoneNumber).length < 10 ||
                      !editedContact.address.trim().length ||
                      (editedContact.fullname ===
                        retainerData.contactPerson.fullname &&
                        editedContact.email ===
                          retainerData.contactPerson.email &&
                        editedContact.phoneNumber ===
                          retainerData.contactPerson.phoneNumber &&
                        editedContact.address ===
                          retainerData.contactPerson.address)
                    }
                  >
                    Save
                  </Button>
                </Group>
              ) : null}
            </Group>
          </Card.Section>

          <Table variant="vertical" layout="fixed">
            <Table.Tbody>
              {contactDetailsCardData.map((item, index) => (
                <Table.Tr key={index}>
                  <Table.Th w={120}>{item.th}</Table.Th>
                  <Table.Td>{item.td}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group align="center" mb="sm" gap={4} justify="space-between">
          <Text size="lg" fw={600} c="green">
            Description
          </Text>

          {isAdmin && !isEditDescription && (
            <ActionIcon
              variant="white"
              size="sm"
              color={theme.other.customPumpkin}
              onClick={() => setIsEditDescription(true)}
            >
              <IconPencil size={20} />
            </ActionIcon>
          )}

          {isAdmin && isEditDescription && (
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

  const isAdmin = user?.unsafeMetadata?.role === "admin";

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
        { merge: true },
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

        {isAdmin && (
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
        )}
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
