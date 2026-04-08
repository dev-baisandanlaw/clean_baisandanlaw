import {
  Modal,
  Button,
  Group,
  Image,
  LoadingOverlay,
  Center,
} from "@mantine/core";
import { Booking } from "@/types/booking";
import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { appNotifications } from "@/utils/notifications/notifications";
import { doc, updateDoc } from "firebase/firestore";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import axios from "axios";

interface ReceiptPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function ReceiptPreviewModal({
  opened,
  onClose,
  booking,
  setDataChanged,
}: ReceiptPreviewModalProps) {
  const receiptFileId = booking?.paymentFields?.receiptFileId || "";
  const isPaid = booking?.paymentFields?.isPaid;

  const [isApproving, setIsApproving] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const res = await axios.get(
          `/api/google/drive/download_receipts/${receiptFileId}`,
          { responseType: "blob" },
        );

        const url = URL.createObjectURL(res.data);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Preview failed", error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    if (receiptFileId) {
      loadPreview();
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptFileId]);

  const handleDownload = async () => {
    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const res = await axios.get(
        `/api/google/drive/download_receipts/${receiptFileId}`,
        {
          responseType: "blob",
        },
      );

      const disposition = res.headers["content-disposition"];
      const filenameMatch = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );

      // 🔹 Your custom filename base
      let filename = `receipt-${booking?.paymentFields?.receiptFileId}`;

      // 🔹 Try to extract extension from original filename
      if (filenameMatch?.[1]) {
        let original = filenameMatch[1].replace(/['"]/g, "");

        try {
          original = decodeURIComponent(original);
        } catch {
          // ignore decode errors
        }

        const ext = original.split(".").pop();
        if (ext) {
          filename += `.${ext}`;
        }
      }

      // 🔹 Create and trigger download
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      appNotifications.error({
        title: "Failed to download file",
        message: "The file could not be downloaded. Please try again.",
      });
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const ref = doc(db, COLLECTIONS.BOOKINGS, booking!.id);
      await updateDoc(ref, {
        "paymentFields.isPaid": true,
      });
      appNotifications.success({
        title: "Payment approved",
        message: "The payment has been approved successfully.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to approve payment",
        message: "Could not approve the payment. Please try again.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Receipt Preview"
      size="lg"
      withCloseButton={!isApproving}
    >
      {isLoadingPreview && <Center h={200} />}
      <LoadingOverlay
        visible={isLoadingPreview}
        loaderProps={{ type: "bars" }}
      />
      {previewUrl && (
        <Image
          src={previewUrl}
          alt="Receipt"
          fit="contain"
          height={400}
          width="100%"
        />
      )}
      <Group justify="center" mt="md">
        <Button onClick={handleDownload} variant="outline">
          Download
        </Button>
        {!isPaid && (
          <Button onClick={handleApprove} color="green" loading={isApproving}>
            Approve
          </Button>
        )}
      </Group>
    </Modal>
  );
}
