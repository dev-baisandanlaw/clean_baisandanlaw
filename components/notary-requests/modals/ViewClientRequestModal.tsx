import {
  ClientRequestBadge,
  PaymentBadge,
} from "@/components/Common/BadgeComp";
import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import SpoilerComp from "@/components/Common/SpoilerComp";
import { useLazyGetClientRequestByIdQuery } from "@/store/services/clientRequestService";
import { formatFee } from "@/utils/formatFee";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { Button, Center, Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect } from "react";

interface ViewClientRequestModalProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

const getPickupMethodLabel = (pickupMethod: string | null) => {
  if (pickupMethod === "soft_copy") return "Soft copy";
  if (pickupMethod === "pickup") return "Branch pickup";

  return undefined;
};

const getPickupDateTimeDisplay = ({
  pickupDate,
  pickupTime,
}: {
  pickupDate: string | null;
  pickupTime: string | null;
}) => {
  if (!pickupDate) return undefined;

  const dateValue = pickupTime
    ? dayjs(`${pickupDate} ${pickupTime}`).format("YYYY-MM-DD HH:mm")
    : pickupDate;

  return getDateFormatDisplay(dateValue, !!pickupTime);
};

export default function ViewClientRequestModal({
  opened,
  onClose,
  clientRequestId,
}: ViewClientRequestModalProps) {
  const [
    getClientRequestById,
    { data: clientRequestData, isFetching, isLoading },
  ] = useLazyGetClientRequestByIdQuery();

  useEffect(() => {
    if (!opened || !clientRequestId) return;

    getClientRequestById(clientRequestId);
  }, [clientRequestId, getClientRequestById, opened]);

  const pickupDateTimeDisplay = clientRequestData
    ? getPickupDateTimeDisplay({
        pickupDate: clientRequestData.pickupDate,
        pickupTime: clientRequestData.pickupTime,
      })
    : undefined;
  const isLoadingDetails = isLoading || isFetching;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Client Request Information"
      type="success"
      size="xl"
      closable
    >
      {isLoadingDetails && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoadingDetails && clientRequestData && (
        <Stack>
          <BasicCard title="Description">
            <SpoilerComp>
              <SpoilerComp>{clientRequestData.description}</SpoilerComp>
            </SpoilerComp>
          </BasicCard>

          <BasicCard title="Request Information">
            <SimpleGrid cols={{ base: 2, xs: 3 }}>
              <DetailField
                title="Full Name"
                value={clientRequestData.requestor?.fullname}
              />
              <DetailField
                title="Email"
                value={
                  clientRequestData.requestor?.email ||
                  clientRequestData.requestorEmail
                }
              />
              <DetailField
                title="Phone Number"
                value={clientRequestData.requestor?.phone}
              />
              <DetailField
                title="Submitted Date"
                value={getDateFormatDisplay(clientRequestData.createdAt, true)}
              />
              <DetailField
                title="Last Update"
                value={getDateFormatDisplay(clientRequestData.updatedAt, true)}
              />
              <DetailField
                title="Status"
                value={<ClientRequestBadge status={clientRequestData.status} />}
              />
            </SimpleGrid>
          </BasicCard>

          <BasicCard title="Payment Information">
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              <DetailField
                title="Fee"
                value={
                  clientRequestData.fee
                    ? formatFee(Number(clientRequestData.fee))
                    : "TBD"
                }
              />
              <DetailField
                title="Receipt Uploaded"
                value={
                  clientRequestData.paymentStatus.receiptFileId ? "Yes" : "No"
                }
              />
              <DetailField
                title="Payment Status"
                value={
                  <PaymentBadge
                    isPaid={clientRequestData.paymentStatus.isPaid}
                    hasReceiptUploaded={
                      !!clientRequestData.paymentStatus.receiptFileId
                    }
                  />
                }
              />
              <DetailField
                title="Payment Verified"
                value={clientRequestData.paymentVerifiedAt ? "Yes" : "No"}
              />
              <DetailField
                title="Verified By"
                value={clientRequestData.paymentVerifiedBy?.fullname}
              />
              <DetailField
                title="Verified At"
                value={
                  clientRequestData.paymentVerifiedAt
                    ? getDateFormatDisplay(
                        clientRequestData.paymentVerifiedAt,
                        true,
                      )
                    : undefined
                }
              />
            </SimpleGrid>
          </BasicCard>

          <BasicCard title="Document Information">
            <SimpleGrid cols={2}>
              <DetailField
                title="Initial File"
                value={clientRequestData.initialFileId ? "Yes" : "No"}
              />

              <DetailField
                title="Finished File"
                value={clientRequestData.finishedFileId ? "Yes" : "No"}
              />
            </SimpleGrid>
          </BasicCard>

          <BasicCard title="Pickup Information">
            <SimpleGrid cols={{ base: 2, xs: 3 }}>
              <DetailField
                title="Method"
                value={getPickupMethodLabel(clientRequestData.pickupMethod)}
              />
              <DetailField
                title="Branch"
                value={clientRequestData.pickupBranch}
              />
              <DetailField title="Date & Time" value={pickupDateTimeDisplay} />
            </SimpleGrid>
          </BasicCard>

          <Button
            onClick={onClose}
            variant="outline"
            ml="auto"
            display="block"
            mt="md"
          >
            Close
          </Button>
        </Stack>
      )}

      {!isLoadingDetails && opened && clientRequestId && !clientRequestData && (
        <Center h={200}>
          <Text>No client request found.</Text>
        </Center>
      )}
    </AppModal>
  );
}
