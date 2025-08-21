import {
  ActionIcon,
  Button,
  Card,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  Text,
  Tooltip,
} from "@mantine/core";
import { Matter } from "@/types/case";
import { getMimeTypeIcon } from "@/utils/getMimeTypeIcon";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  IconCirclePlus,
  IconFileDownload,
  IconTrash,
} from "@tabler/icons-react";
import TabDocumentDeleteFileModal from "./modals/TabDocumentDeleteFileModal";
import { useDisclosure } from "@mantine/hooks";
import React, { useState } from "react";
import TabDocumentsUploadFileModal from "./modals/TabDocumentsUploadFileModal";
import EmptyTableComponent from "../EmptyTableComponent";
import { appwriteDownloadFile } from "@/app/api/appwrite";

interface MatterTabDocumentsProps {
  matterData: Matter;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabDocuments({
  matterData,
  setDataChanged,
}: MatterTabDocumentsProps) {
  const [selectedDocument, setSelectedDocument] =
    useState<Matter["documents"][number]>();

  const [
    isDeleteModalFileOpen,
    { open: openDeleteModalFile, close: closeDeleteModalFile },
  ] = useDisclosure(false);

  const [
    isUploadModalFileOpen,
    { open: openUploadModalFile, close: closeUploadModalFile },
  ] = useDisclosure(false);

  return (
    <>
      <Flex direction="column" gap="md">
        <SimpleGrid cols={1}>
          <Card withBorder radius="md" p="md">
            <Card.Section inheritPadding py="xs">
              <Group justify="space-between">
                <Text size="lg" fw={600} c="green">
                  Documents
                </Text>

                <Button
                  leftSection={<IconCirclePlus />}
                  size="sm"
                  variant="outline"
                  onClick={openUploadModalFile}
                >
                  Upload
                </Button>
              </Group>
            </Card.Section>

            <Table variant="vertical" layout="fixed">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th w={160}>Total Files</Table.Th>
                  <Table.Td>
                    <Text c="green" fw={600} size="sm">
                      {matterData.documents?.length || 0}
                    </Text>
                  </Table.Td>
                </Table.Tr>

                <Table.Tr>
                  <Table.Th>Total Size</Table.Th>
                  <Table.Td>
                    <Text c="green" fw={600} size="sm">
                      {matterData.documents
                        ?.reduce((sum, doc) => sum + (doc.sizeInMb || 0), 0)
                        .toFixed(2)}
                      MB
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Card>
        </SimpleGrid>

        <TableScrollContainer minWidth={500} h={"calc(100vh - 335px)"}>
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Upload Details</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {matterData.documents &&
                matterData.documents.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Tooltip label={doc.name} position="top">
                        <Text truncate maw={175} size="sm" fw={600} c="green">
                          {doc.name}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} c="green">
                        {doc.sizeInMb.toFixed(2)} MB
                      </Text>
                    </Table.Td>
                    <Table.Td>{getMimeTypeIcon(doc.mimeType)}</Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={600} c="green">
                          {doc.uploadedBy?.fullname || "-"}
                        </Text>
                        <Text size="xs" c="black" opacity={0.8}>
                          {getDateFormatDisplay(doc.uploadedAt, true)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => appwriteDownloadFile(doc.id)}
                        >
                          <IconFileDownload size={24} />
                        </ActionIcon>

                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color="red"
                          onClick={() => {
                            setSelectedDocument(doc);
                            openDeleteModalFile();
                          }}
                        >
                          <IconTrash />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}

              {matterData?.documents?.length < 1 && (
                <EmptyTableComponent colspan={5} />
              )}
            </Table.Tbody>
          </Table>
        </TableScrollContainer>
      </Flex>

      <TabDocumentsUploadFileModal
        opened={isUploadModalFileOpen}
        onClose={closeUploadModalFile}
        matterId={matterData.id!}
        setDataChanged={setDataChanged}
      />

      <TabDocumentDeleteFileModal
        opened={isDeleteModalFileOpen}
        onClose={closeDeleteModalFile}
        document={selectedDocument}
        setDataChanged={setDataChanged}
        matterId={matterData.id!}
      />
    </>
  );
}
