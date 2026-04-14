import {
  Modal,
  Button,
  Group,
  Image,
  LoadingOverlay,
  Center,
} from "@mantine/core";
import { appNotifications } from "@/utils/notifications/notifications";
import { useEffect, useState } from "react";
import axios from "axios";

interface ReceiptPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  receiptFileId: string;
  isPaid: boolean;
  onApprove: () => Promise<void>;
  filenamePrefix?: string;
}

export default function ReceiptPreviewModal({
  opened,
  onClose,
  receiptFileId,
  isPaid,
  onApprove,
  filenamePrefix = "receipt",
}: ReceiptPreviewModalProps) {
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

    if (receiptFileId && opened) {
      loadPreview();
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptFileId, opened]);

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

      let filename = `${filenamePrefix}-${receiptFileId}`;

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
      await onApprove();
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
