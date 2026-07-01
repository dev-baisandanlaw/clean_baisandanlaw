import { Button, Group, Image, LoadingOverlay, Center } from "@mantine/core";
import { appNotifications } from "@/utils/notifications/notifications";
import { useEffect, useState } from "react";
import {
  type DocumentDownloadSource,
  useDownloadDocumentMutation,
} from "@/store/services/documentService";
import { useUser } from "@clerk/nextjs";
import AppModal from "./modal/AppModal";

interface ReceiptPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  receiptFileId: string;
  isPaid: boolean;
  onApprove?: () => Promise<void>;
  filenamePrefix?: string;
  source: DocumentDownloadSource;
}

export default function ReceiptPreviewModal({
  opened,
  onClose,
  receiptFileId,
  isPaid,
  onApprove,
  filenamePrefix = "receipt",
  source,
}: ReceiptPreviewModalProps) {
  const { user } = useUser();
  const isAdmin = user?.unsafeMetadata?.role === "admin";

  const [isApproving, setIsApproving] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const [downloadDocument] = useDownloadDocumentMutation();

  useEffect(() => {
    let objectUrl = "";
    let isActive = true;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const receipt = await downloadDocument({
          fileId: receiptFileId,
          source,
        }).unwrap();

        if (!isActive) {
          URL.revokeObjectURL(receipt.objectUrl);
          return;
        }

        objectUrl = receipt.objectUrl;
        setPreviewUrl(objectUrl);
      } catch {
        appNotifications.error({
          title: "Failed to load receipt",
          message: "The receipt preview could not be loaded.",
        });
      } finally {
        if (isActive) {
          setIsLoadingPreview(false);
        }
      }
    };

    if (receiptFileId && opened) {
      loadPreview();
    } else {
      setPreviewUrl("");
    }

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [downloadDocument, receiptFileId, opened, source]);

  const handleDownload = async () => {
    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const { objectUrl, extension } = await downloadDocument({
        fileId: receiptFileId,
        source,
      }).unwrap();
      let filename = filenamePrefix;

      if (extension) {
        filename += `.${extension}`;
      }

      const a = document.createElement("a");

      a.href = objectUrl;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 1000);
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
      await onApprove?.();
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
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Receipt Preview"
      size="lg"
      closable={!isApproving}
      type="success"
    >
      {isLoadingPreview && (
        <Center h={400}>
          <LoadingOverlay
            visible={isLoadingPreview}
            loaderProps={{ type: "bars" }}
          />
        </Center>
      )}

      {previewUrl && !isLoadingPreview && (
        <Image
          fallbackSrc="https://placehold.net/400x400.png"
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
        {!isPaid && isAdmin && onApprove && (
          <Button onClick={handleApprove} color="green" loading={isApproving}>
            Approve
          </Button>
        )}
      </Group>
    </AppModal>
  );
}
