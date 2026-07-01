import AppModal from "@/components/Common/modal/AppModal";
import { useDownloadDocumentMutation } from "@/store/services/documentService";
import { useGetBookingSettingsQuery } from "@/store/services/bookingService";
import {
  useApproveClientRequestDocumentMutation,
  useLazyGetClientRequestByIdQuery,
  useRejectClientRequestDocumentMutation,
} from "@/store/services/clientRequestService";
import { appNotifications } from "@/utils/notifications/notifications";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Select,
  Stack,
  Textarea,
  Text,
  Anchor,
} from "@mantine/core";
import { DatePickerInput, getTimeRange, TimeGrid } from "@mantine/dates";
import { IconInfoCircle } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ClientApproveRejectControl = "approve" | "reject";
type PickupMethod = "soft_copy" | "pickup";

interface ClientApproveRejectModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

export default function ClientApproveRejectModal({
  opened,
  onClose,
  clientRequestId,
}: ClientApproveRejectModalProps) {
  const [downloadDocument] = useDownloadDocumentMutation();
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();

  const [approveClientRequestDocumentFn, { isLoading: isApproving }] =
    useApproveClientRequestDocumentMutation();
  const [rejectClientRequestDocumentFn, { isLoading: isRejecting }] =
    useRejectClientRequestDocumentMutation();

  const { data: bookingSettings } = useGetBookingSettingsQuery(undefined, {
    skip: !opened,
  });

  const [remarks, setRemarks] = useState("");
  const [control, setControl] = useState<ClientApproveRejectControl>("approve");
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>("soft_copy");
  const [pickupBranch, setPickupBranch] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);

  const timeSlots = useMemo(() => {
    if (!bookingSettings) return [];

    return getTimeRange({
      startTime: bookingSettings.officeHourStart,
      endTime: bookingSettings.officeHourEnd,
      interval: `${bookingSettings.bookingIntervalMinutes}:00`,
    }).map((time) => time.slice(0, 5));
  }, [bookingSettings]);

  const enabledHolidayDates = useMemo(
    () =>
      [
        ...(bookingSettings?.regularHolidays ?? []),
        ...(bookingSettings?.specialHolidays ?? []),
      ]
        .filter((holiday) => holiday.enabled)
        .map((holiday) => holiday.date),
    [bookingSettings],
  );

  const resetForm = useCallback(() => {
    setRemarks("");
    setControl("approve");
    setPickupMethod("soft_copy");
    setPickupBranch(null);
    setPickupDate(null);
    setPickupTime(null);
  }, []);

  useEffect(() => {
    if (!opened || !clientRequestId) {
      resetForm();
      return;
    }

    getClientRequestById(clientRequestId);
  }, [clientRequestId, getClientRequestById, opened, resetForm]);

  const isApprove = control === "approve";
  const isHardCopy = pickupMethod === "pickup";
  const isSubmitting = isApproving || isRejecting;
  const isLoadingDetails = isLoading || isFetching;

  const handleClose = () => {
    if (isSubmitting) return;

    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!clientRequestId) return;

    try {
      if (isApprove) {
        await approveClientRequestDocumentFn({
          id: clientRequestId,
          pickupMethod,
          pickupBranch: isHardCopy ? pickupBranch : null,
          pickupDate: isHardCopy ? pickupDate : null,
          pickupTime: isHardCopy ? pickupTime : null,
          remarks: remarks.trim(),
        }).unwrap();
      } else {
        await rejectClientRequestDocumentFn({
          id: clientRequestId,
          remarks: remarks.trim(),
        }).unwrap();
      }

      appNotifications.success({
        title: isApprove ? "Document approved" : "Document rejected",
        message: isApprove
          ? "The finished document has been approved."
          : "Your requested changes have been sent.",
      });
      handleClose();
    } catch {
      appNotifications.error({
        title: isApprove
          ? "Failed to approve document"
          : "Failed to reject document",
        message: "Please check your review and try again.",
      });
    }
  };

  const isDateDisabled = (date: string) => {
    if (!bookingSettings) return true;

    const dayName = dayjs(date)
      .format("dddd")
      .toLowerCase() as keyof typeof bookingSettings.workSchedule;
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    const formattedMonthDay = dayjs(date).format("MM/DD");
    const isHoliday = enabledHolidayDates.some(
      (holidayDate) =>
        holidayDate === formattedDate || holidayDate === formattedMonthDay,
    );

    return !bookingSettings.workSchedule[dayName] || isHoliday;
  };

  const isTimeDisabled = (time: string) => {
    if (!pickupDate || !bookingSettings) return true;

    const selectedDate = dayjs(pickupDate).format("YYYY-MM-DD");
    const blockedSchedule = bookingSettings.blockedSchedules.find(
      (schedule) => schedule.date === selectedDate,
    );

    return blockedSchedule?.timeSlots.includes(time) ?? false;
  };

  const isSubmitDisabled =
    !clientRequestId ||
    (isApprove &&
      isHardCopy &&
      (!pickupBranch || !pickupDate || !pickupTime)) ||
    !remarks.trim().length;

  const handleDownloadFinishedFile = async () => {
    if (!clientRequestData?.finishedFileId) return;

    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const file = await downloadDocument({
        fileId: clientRequestData.finishedFileId,
        source: "client-requests",
      }).unwrap();
      const a = document.createElement("a");

      a.href = file.objectUrl;
      a.download = file.filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(file.objectUrl);
      }, 1000);
    } catch {
      appNotifications.error({
        title: "Failed to download file",
        message: "The finished file could not be downloaded.",
      });
    }
  };

  return (
    <AppModal
      title="Review Finished Document"
      opened={opened}
      onClose={handleClose}
      type={isApprove ? "success" : "danger"}
      size="lg"
      closable={!isSubmitting}
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          <Alert
            color="blue"
            variant="light"
            icon={<IconInfoCircle />}
            title="Finished Document Ready"
          >
            The admin uploaded your finished document and it is ready for
            review. Click{" "}
            <Anchor
              component="button"
              onClick={handleDownloadFinishedFile}
              underline="always"
              size="sm"
              c="blue"
            >
              here
            </Anchor>{" "}
            to download the document.
          </Alert>

          <SegmentedControl
            value={control}
            onChange={(value) => {
              setControl(value as ClientApproveRejectControl);
              if (value === "reject") {
                setPickupMethod("soft_copy");
                setPickupBranch(null);
                setPickupDate(null);
                setPickupTime(null);
              }
            }}
            disabled={isSubmitting}
            data={[
              { label: "Approve", value: "approve" },
              { label: "Reject", value: "reject" },
            ]}
          />

          {isApprove && (
            <>
              <Select
                label="Pickup Option"
                placeholder="Select pickup option"
                withAsterisk
                value={pickupMethod}
                onChange={(value) => {
                  const nextMethod = (value ?? "soft_copy") as PickupMethod;

                  setPickupMethod(nextMethod);
                  if (nextMethod === "soft_copy") {
                    setPickupBranch(null);
                    setPickupDate(null);
                    setPickupTime(null);
                  }
                }}
                disabled={isSubmitting}
                data={[
                  { value: "soft_copy", label: "Soft Copy" },
                  { value: "pickup", label: "Hard Copy" },
                ]}
              />

              {isHardCopy && (
                <>
                  <Select
                    label="Pickup Office"
                    placeholder="Select pickup office"
                    withAsterisk
                    value={pickupBranch}
                    onChange={setPickupBranch}
                    disabled={isSubmitting}
                    data={[
                      { value: "Angeles branch", label: "Angeles branch" },
                      { value: "Magalang branch", label: "Magalang branch" },
                    ]}
                  />

                  <DatePickerInput
                    label="Pickup Date"
                    placeholder="Select pickup date"
                    value={pickupDate}
                    onChange={(value) => {
                      setPickupDate(value);
                      setPickupTime(null);
                    }}
                    hideOutsideDates
                    minDate={new Date()}
                    excludeDate={isDateDisabled}
                    withAsterisk
                    disabled={isSubmitting}
                  />

                  {pickupDate && (
                    <Stack gap="xs">
                      <Group gap={4}>
                        <Text fw={500} fz="sm">
                          Pickup Time
                        </Text>
                        <Text fw={700} c="red" fz="sm">
                          *
                        </Text>
                      </Group>
                      <TimeGrid
                        value={pickupTime}
                        onChange={setPickupTime}
                        data={timeSlots}
                        disableTime={isTimeDisabled}
                        disabled={isSubmitting}
                        allowDeselect
                        format="12h"
                      />
                    </Stack>
                  )}
                </>
              )}
            </>
          )}

          <Textarea
            withAsterisk
            placeholder={
              isApprove
                ? "Add any remarks for approving the finished document"
                : "Please provide your requested changes"
            }
            label="Remarks"
            rows={4}
            styles={{ input: { paddingBlock: 6 } }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={350}
            description={`${remarks.length}/350 characters`}
            disabled={isSubmitting}
          />

          <Group justify="end">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color={isApprove ? "green.7" : "red.7"}
              disabled={isSubmitDisabled || isSubmitting}
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {isApprove ? "Approve" : "Reject"}
            </Button>
          </Group>
        </Stack>
      )}
    </AppModal>
  );
}
