import { SetStateAction, Dispatch, useEffect, useState } from "react";

import {
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Radio,
  Select,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { DatePickerInput, TimeGrid, getTimeRange } from "@mantine/dates";
import { useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import {
  COLLECTIONS,
  SPECIAL_HOLIDAYS,
  REGULAR_HOLIDAYS,
} from "@/constants/constants";
import { db } from "@/firebase/config";
import { WORK_SCHEDULE } from "@/constants/non-working-sched";

import { appNotifications } from "@/utils/notifications/notifications";

import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";

interface ClientReviewModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS5ClientModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: ClientReviewModalProps) {
  const { user } = useUser();

  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const [remarks, setRemarks] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [pickupBranch, setPickupBranch] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);

  const [validHolidays, setValidHolidays] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>(
    {},
  );
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const fetchNotaryRequest = async () => {
    setIsFetching(true);

    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
      );
      if (snap.exists()) {
        setNotaryRequestData({
          ...(snap.data() as NotaryRequest),
          id: snap.id,
        });
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch request data",
        message: "The request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  const fetchGlobalSched = async () => {
    try {
      const snap = await getDoc(
        doc(
          db,
          COLLECTIONS.GLOBAL_SCHED,
          process.env.NEXT_PUBLIC_FIREBASE_HOLIDAYS_BLOCKED_SCHED_ID!,
        ),
      );
      if (!snap.exists()) return;

      const d = snap.data();

      const getValidKeys = (o: Record<string, boolean>) =>
        Object.keys(o).filter((key) => o[key]);

      const validHolidayIds = [
        ...getValidKeys(d.regularHolidays),
        ...getValidKeys(d.specialHolidays),
      ];

      const holidayMap = Object.fromEntries([
        ...REGULAR_HOLIDAYS.map((h) => [h.id, h.date]),
        ...SPECIAL_HOLIDAYS.map((h) => [h.id, h.date]),
      ]);

      const timeHours = getTimeRange({
        startTime: d.officeHours.officeStart,
        endTime: d.officeHours.officeEnd,
        interval: d.officeHours.bookingInterval,
      });

      const workDays = Object.keys(d.workSchedule)
        .filter((key) => d.workSchedule[key])
        .map((key) => WORK_SCHEDULE.find((w) => w.name === key)?.value);

      const blockedDatesMap = d?.blockedDates;

      setValidHolidays(
        validHolidayIds.map((id) => holidayMap[id]).filter(Boolean),
      );
      setWorkDays(workDays as number[]);
      setTimeSlots(timeHours);
      setBlockedDates(blockedDatesMap);
    } catch {
      appNotifications.error({
        title: "Failed to fetch schedule settings",
        message:
          "The schedule settings could not be fetched. Please try again.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!reviewAction) return;

    setIsReviewing(true);

    try {
      if (reviewAction === "reject") {
        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
          {
            status: NotaryRequestStatus.NEEDS_ATTORNEY_REVISION,
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            timeline: [
              ...(notaryRequestData?.timeline || []),
              {
                id: nanoid(8),
                title: "NEEDS_ATTORNEY_REVISION",
                description: "Finished document rejected by client",
                dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                status: NotaryRequestStatus.NEEDS_ATTORNEY_REVISION,
                user: {
                  id: user!.id,
                  fullname: user!.firstName + " " + user!.lastName,
                  email: user!.primaryEmailAddress!.emailAddress,
                },
                reason: remarks,
              },
            ],
          },
          { merge: true },
        );

        appNotifications.success({
          title: "Document sent back for revision",
          message:
            "The finished document has been sent back for attorney revision.",
        });
      } else if (reviewAction === "approve") {
        const pickupDateFormatted =
          pickupBranch !== "Soft copy only" && pickupDate
            ? dayjs(pickupDate).format("YYYY-MM-DD")
            : null;

        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
          {
            status: NotaryRequestStatus.CLIENT_APPROVED,
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            pickupBranch: pickupBranch,
            pickupDate: pickupDateFormatted,
            pickupTime: pickupBranch !== "Soft copy only" ? pickupTime : null,
            timeline: [
              ...(notaryRequestData?.timeline || []),
              {
                id: nanoid(8),
                title: "CLIENT_APPROVED",
                description: "Request approved by client",
                dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                status: NotaryRequestStatus.CLIENT_APPROVED,
                user: {
                  id: user!.id,
                  fullname: user!.firstName + " " + user!.lastName,
                  email: user!.primaryEmailAddress!.emailAddress,
                },
              },
            ],
          },
          { merge: true },
        );

        appNotifications.success({
          title: "Request approved",
          message: "The request has been approved successfully.",
        });
      }

      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: `Failed to ${reviewAction} request`,
        message: `The request could not be ${reviewAction}ed. Please try again.`,
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownloadFile = async () => {
    const finishedFileId = notaryRequestData?.documents?.finishedFile?.id;
    if (!finishedFileId) return;

    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const axios = (await import("axios")).default;
      const res = await axios.get(
        `/api/google/drive/download/${finishedFileId}`,
        {
          responseType: "blob",
        },
      );

      const disposition = res.headers["content-disposition"];
      const filenameMatch = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );

      let filename = "download";
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
        try {
          filename = decodeURIComponent(filename);
        } catch {
          /* Empty */
        }
      }

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      appNotifications.error({
        title: "Download failed",
        message: "Failed to download the file. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (!opened) {
      setRemarks("");
      setReviewAction(null);
      setPickupBranch(null);
      setPickupDate(null);
      setPickupTime(null);
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
        fetchGlobalSched();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  useEffect(() => {
    setPickupTime(null);
  }, [pickupDate]);

  const isPhysicalPickup =
    pickupBranch === "Angeles branch" || pickupBranch === "Magalang branch";

  const isApproveDisabled =
    reviewAction === "approve" &&
    (!pickupBranch || (isPhysicalPickup && (!pickupDate || !pickupTime)));

  const isRejectDisabled = reviewAction === "reject" && !remarks.trim();

  const isSubmitDisabled =
    !reviewAction || isApproveDisabled || isRejectDisabled || isReviewing;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review Finished File"
      size="lg"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isReviewing}
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching request data...</Text>
          </Stack>
        </Center>
      ) : (
        <>
          <Text ta="center" mb="md">
            To review the finished file, you can either download{" "}
            <Anchor
              component="button"
              type="button"
              onClick={handleDownloadFile}
              disabled={!notaryRequestData?.documents?.finishedFile?.id}
              c="blue"
              fw={600}
              td="underline"
              style={{ cursor: "pointer" }}
            >
              here
            </Anchor>{" "}
            or download from the table actions.
          </Text>

          <Select
            label="Review Action"
            placeholder="Select action"
            data={[
              { value: "reject", label: "Reject" },
              { value: "approve", label: "Approve" },
            ]}
            value={reviewAction}
            onChange={(value) => {
              setReviewAction(value);
              if (value !== "approve") {
                setPickupBranch(null);
                setPickupDate(null);
                setPickupTime(null);
              }
              if (value !== "reject") {
                setRemarks("");
              }
            }}
            withAsterisk
            mb="md"
          />

          {reviewAction === "approve" && (
            <>
              <Radio.Group
                label="Pickup Method"
                value={pickupBranch}
                onChange={(value) => {
                  setPickupBranch(value);
                  if (value === "Soft copy only") {
                    setPickupDate(null);
                    setPickupTime(null);
                  }
                }}
                withAsterisk
                mb="md"
              >
                <Stack gap="xs" mt="xs">
                  <Radio value="Angeles branch" label="Angeles branch" />
                  <Radio value="Magalang branch" label="Magalang branch" />
                  <Radio value="Soft copy only" label="Soft copy only" />
                </Stack>
              </Radio.Group>

              {isPhysicalPickup && (
                <>
                  <DatePickerInput
                    label="Date of Pickup"
                    placeholder="Select pickup date"
                    value={pickupDate}
                    onChange={setPickupDate}
                    withAsterisk
                    mb="md"
                    minDate={new Date()}
                    excludeDate={(date) => {
                      const truncatedDate = dayjs(date).format("MM/DD");

                      // if holiday, return true
                      if (validHolidays.includes(truncatedDate)) return true;

                      // if it's not a work day, return true
                      if (!workDays.includes(dayjs(date).day())) return true;

                      return false;
                    }}
                  />

                  {pickupDate && (
                    <Stack gap="xs" mb="md">
                      <Group gap={4}>
                        <Text fw={500} fz="sm">
                          Time of Pickup
                        </Text>
                        <Text fw={700} c="red" fz="sm">
                          *
                        </Text>
                      </Group>
                      <TimeGrid
                        value={pickupTime}
                        onChange={setPickupTime}
                        disabled={!pickupDate}
                        data={timeSlots}
                        disableTime={(time) => {
                          // if time is in blocked dates
                          if (
                            pickupDate &&
                            blockedDates?.[pickupDate]?.includes(time)
                          )
                            return true;

                          return false;
                        }}
                        allowDeselect
                        format="12h"
                      />
                    </Stack>
                  )}
                </>
              )}
            </>
          )}

          {reviewAction === "reject" && (
            <Textarea
              placeholder="Please provide a reason for rejecting the document..."
              label="Rejection Reason"
              rows={6}
              withAsterisk
              styles={{ input: { paddingBlock: 6 } }}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              mb="md"
              maxLength={1000}
              inputWrapperOrder={["label", "input", "description", "error"]}
              description={`${remarks.length}/1000 characters`}
            />
          )}

          <Group justify="end" gap="md" mt="md">
            <Button variant="default" onClick={onClose} disabled={isReviewing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              loading={isReviewing}
              color={
                !reviewAction
                  ? undefined
                  : reviewAction === "reject"
                    ? "red"
                    : "green"
              }
            >
              {!reviewAction
                ? "Submit"
                : reviewAction === "reject"
                  ? "Reject"
                  : "Approve"}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
