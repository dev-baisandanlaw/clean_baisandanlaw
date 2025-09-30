"use client";

import EmptyTableComponent from "@/components/EmptyTableComponent";
// import DeleteNotaryRequestModal from "@/components/notary-requests/modals/DeleteNotaryRequestModal";
import { COLLECTIONS, NOTARY_STEPS_ORDER } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest } from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus } from "@/utils/getNotaryStatus";
import { useUser } from "@clerk/nextjs";
import {
  Group,
  Flex,
  TextInput,
  TableScrollContainer,
  Table,
  Button,
  Stack,
  Text,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBan,
  IconBook,
  IconCirclePlus,
  IconDots,
  IconEye,
  IconFile,
  IconFile3d,
  IconFileCheck,
  IconFileDownload,
  IconPackage,
  IconPencil,
  IconRubberStamp,
  IconSearch,
  IconTextScan2,
} from "@tabler/icons-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appwriteDownloadFile } from "@/app/api/appwrite";
import RejectNotaryRequestModal from "@/components/notary-requests/modals/RejectNotaryRequestModal";
import { UpsertNotaryRequestModal } from "@/components/notary-requests/modals/UpsertNotaryRequest";
import { ViewNotaryRequestDrawer } from "@/components/notary-requests/drawer/ViewNotaryRequestDrawer";
import ReviewNotaryRequestModal from "@/components/notary-requests/modals/ReviewNotaryRequestModal";
import ApproveNotaryRequestModal from "@/components/notary-requests/modals/ApproveNotaryRequestModal";
import ClientReviewModal from "@/components/notary-requests/modals/ClientReviewModal";
import ConfirmationModal from "@/components/notary-requests/modals/ConfirmationModal";

export default function NotaryRequestsListing() {
  const { user } = useUser();
  const [notaryRequests, setNotaryRequests] = useState<NotaryRequest[]>([]);

  const [
    isUpsertNotaryRequestModalOpen,
    {
      open: openUpsertNotaryRequestModal,
      close: closeUpsertNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isReviewNotaryRequestModalOpen,
    {
      open: openReviewNotaryRequestModal,
      close: closeReviewNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isViewNotaryRequestDrawerOpen,
    { open: openViewNotaryRequestDrawer, close: closeViewNotaryRequestDrawer },
  ] = useDisclosure(false);

  const [
    isRejectNotaryRequestModalOpen,
    {
      open: openRejectNotaryRequestModal,
      close: closeRejectNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isApproveNotaryRequestModalOpen,
    {
      open: openApproveNotaryRequestModal,
      close: closeApproveNotaryRequestModal,
    },
  ] = useDisclosure(false);

  const [
    isClientReviewModalOpen,
    { open: openClientReviewModal, close: closeClientReviewModal },
  ] = useDisclosure(false);

  const [
    isConfirmationModalOpen,
    { open: openConfirmationModal, close: closeConfirmationModal },
  ] = useDisclosure(false);

  const [selectedNotaryRequest, setSelectedNotaryRequest] =
    useState<NotaryRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, COLLECTIONS.NOTARY_REQUESTS);
    let q;

    if (user.unsafeMetadata?.role === "client") {
      q = query(ref, where("requestor.id", "==", user.id));
    } else {
      q = query(ref);
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results: NotaryRequest[] = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as NotaryRequest[];

        setNotaryRequests(results);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
      }
    );

    return () => unsub();
  }, [user]);

  const disableActions = (
    t:
      | "edit"
      | "process"
      | "notarize"
      | "reject"
      | "review"
      | "for_pickup"
      | "completed",
    notaryRequest: NotaryRequest
  ) => {
    const step = NOTARY_STEPS_ORDER[notaryRequest.status];

    switch (t) {
      case "edit":
        // Disable once processing or beyond, except allow if already hard-rejected
        return step >= 2 && step !== -4;

      case "process":
        // Disable on/after processing, or if client rejected (and also if hard-rejected)
        return step >= 2 || step === -4;

      case "notarize":
        // Enable only while exactly in Processing
        return step !== 2;

      case "reject":
        // Disable if already client approved, client rejected, or hard-rejected
        return (
          step === 33 ||
          step === -33 ||
          step === -4 ||
          step === 4 ||
          step === 5 ||
          step === 6
        );

      case "review":
        // Disable unless exactly For Client Review
        return step !== 3;

      case "for_pickup":
        return step !== 33;

      case "completed":
        return step !== 4;

      default:
        return false;
    }
  };

  return (
    <>
      <Flex
        w="100%"
        h="100%"
        gap={16}
        px={{ sm: 12, md: 0 }}
        direction="column"
      >
        <Group align="center" justify="space-between" w="100%">
          <TextInput
            placeholder="Search"
            w="300px"
            leftSectionPointerEvents="none"
            leftSection={<IconSearch />}
            // value={search}
            // onChange={(e) => setSearch(e.target.value)}
          />

          {user?.unsafeMetadata?.role === "client" && (
            <Button
              variant="outline"
              leftSection={<IconCirclePlus />}
              onClick={() => {
                setSelectedNotaryRequest(null);
                openUpsertNotaryRequestModal();
              }}
            >
              New Request
            </Button>
          )}
        </Group>

        <TableScrollContainer
          minWidth={500}
          h="calc(100vh - 220px)"
          pos="relative"
        >
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                {user?.unsafeMetadata?.role !== "client" && (
                  <Table.Th>Requestor</Table.Th>
                )}
                <Table.Th>Uploaded At</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {!notaryRequests?.length && (
                <EmptyTableComponent
                  colspan={5}
                  message="No notary requests found"
                />
              )}

              {notaryRequests &&
                notaryRequests
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((notaryRequest) => (
                    <Table.Tr key={notaryRequest.id}>
                      {user?.unsafeMetadata?.role !== "client" && (
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm" fw={600} c="green">
                              {notaryRequest.requestor.fullname}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {notaryRequest.requestor.email}
                            </Text>
                          </Stack>
                        </Table.Td>
                      )}
                      <Table.Td>
                        {getDateFormatDisplay(notaryRequest.createdAt, true)}
                      </Table.Td>
                      <Table.Td>
                        {getNotaryStatus(notaryRequest.status)}
                      </Table.Td>

                      <Table.Td>
                        <Menu
                          width={200}
                          shadow="lg"
                          withArrow
                          styles={{ dropdown: { fontWeight: 600 } }}
                        >
                          <Menu.Target>
                            <ActionIcon variant="outline" size={24}>
                              <IconDots size={24} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Label>Actions</Menu.Label>

                            <Menu.Sub>
                              <Menu.Sub.Target>
                                <Menu.Sub.Item
                                  disabled={
                                    !notaryRequest.document &&
                                    !notaryRequest.finishedDocument
                                  }
                                  leftSection={<IconFileDownload size={24} />}
                                >
                                  Download
                                </Menu.Sub.Item>
                              </Menu.Sub.Target>

                              <Menu.Sub.Dropdown>
                                <Menu.Item
                                  disabled={!notaryRequest.document}
                                  leftSection={<IconFile size={24} />}
                                  onClick={() => {
                                    appwriteDownloadFile(
                                      notaryRequest.document!.id
                                    );
                                  }}
                                >
                                  Initial File
                                </Menu.Item>
                                <Menu.Item
                                  disabled={!notaryRequest.finishedDocument}
                                  leftSection={<IconFile3d size={24} />}
                                  onClick={() => {
                                    appwriteDownloadFile(
                                      notaryRequest.finishedDocument!.id
                                    );
                                  }}
                                >
                                  Finished File
                                </Menu.Item>
                              </Menu.Sub.Dropdown>
                            </Menu.Sub>

                            <Menu.Item
                              leftSection={<IconEye size={24} />}
                              onClick={() => {
                                setSelectedNotaryRequest(notaryRequest);
                                openViewNotaryRequestDrawer();
                              }}
                            >
                              View
                            </Menu.Item>

                            {user?.unsafeMetadata?.role === "client" && (
                              <Menu.Item
                                leftSection={<IconPencil size={24} />}
                                disabled={
                                  NOTARY_STEPS_ORDER[notaryRequest.status] >=
                                    2 &&
                                  NOTARY_STEPS_ORDER[notaryRequest.status] !==
                                    -4
                                }
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openUpsertNotaryRequestModal();
                                }}
                              >
                                Edit
                              </Menu.Item>
                            )}

                            <Menu.Divider />

                            {user?.unsafeMetadata?.role !== "client" && (
                              <>
                                <Menu.Item
                                  c="blue"
                                  leftSection={<IconBook size={24} />}
                                  disabled={disableActions(
                                    "process",
                                    notaryRequest
                                  )}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openReviewNotaryRequestModal();
                                  }}
                                >
                                  Process
                                </Menu.Item>

                                <Menu.Item
                                  c="green.3"
                                  disabled={disableActions(
                                    "notarize",
                                    notaryRequest
                                  )}
                                  leftSection={<IconRubberStamp size={24} />}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openApproveNotaryRequestModal();
                                  }}
                                >
                                  Notarize
                                </Menu.Item>

                                <Menu.Item
                                  c="red"
                                  leftSection={<IconBan size={24} />}
                                  disabled={disableActions(
                                    "reject",
                                    notaryRequest
                                  )}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openRejectNotaryRequestModal();
                                  }}
                                >
                                  Reject
                                </Menu.Item>

                                <Menu.Item
                                  c="purple"
                                  leftSection={<IconPackage size={24} />}
                                  disabled={disableActions(
                                    "for_pickup",
                                    notaryRequest
                                  )}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openConfirmationModal();
                                  }}
                                >
                                  Ready for Pickup
                                </Menu.Item>

                                <Menu.Item
                                  c="teal"
                                  leftSection={<IconFileCheck size={24} />}
                                  disabled={disableActions(
                                    "completed",
                                    notaryRequest
                                  )}
                                  onClick={() => {
                                    setSelectedNotaryRequest(notaryRequest);
                                    openConfirmationModal();
                                  }}
                                >
                                  Complete
                                </Menu.Item>
                              </>
                            )}

                            {user?.unsafeMetadata?.role === "client" && (
                              <Menu.Item
                                c="green"
                                leftSection={<IconTextScan2 size={24} />}
                                disabled={disableActions(
                                  "review",
                                  notaryRequest
                                )}
                                onClick={() => {
                                  setSelectedNotaryRequest(notaryRequest);
                                  openClientReviewModal();
                                }}
                              >
                                Review
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
            </Table.Tbody>
          </Table>
        </TableScrollContainer>
      </Flex>

      <UpsertNotaryRequestModal
        opened={isUpsertNotaryRequestModalOpen}
        onClose={closeUpsertNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      />

      {/* <DeleteNotaryRequestModal
        opened={isDeleteNotaryRequestModalOpen}
        onClose={closeDeleteNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      /> */}

      <ClientReviewModal
        opened={isClientReviewModalOpen}
        onClose={closeClientReviewModal}
        notaryRequest={selectedNotaryRequest}
      />

      <ApproveNotaryRequestModal
        opened={isApproveNotaryRequestModalOpen}
        onClose={closeApproveNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      />

      <RejectNotaryRequestModal
        opened={isRejectNotaryRequestModalOpen}
        onClose={closeRejectNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      />

      <ViewNotaryRequestDrawer
        opened={isViewNotaryRequestDrawerOpen}
        onClose={closeViewNotaryRequestDrawer}
        notaryRequest={selectedNotaryRequest}
      />

      <ReviewNotaryRequestModal
        opened={isReviewNotaryRequestModalOpen}
        onClose={closeReviewNotaryRequestModal}
        notaryRequest={selectedNotaryRequest}
      />

      <ConfirmationModal
        opened={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        notaryRequest={selectedNotaryRequest}
      />
    </>
  );
}
