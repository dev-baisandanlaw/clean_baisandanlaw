import { UserReference } from "@/types/user-reference";
import AppModal from "./AppModal";
import { Alert, Button, SimpleGrid } from "@mantine/core";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import BasicCard from "../BasicCard";
import DetailField from "../DetailField";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { useDeleteUserMutation } from "@/store/services/userService";
import { appNotifications } from "@/utils/notifications/notifications";

interface DeleteUserModalProps {
  opened: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: (UserReference & { metadata: any }) | null;
}

export default function DeleteUserModal({
  opened,
  onClose,
  user,
}: DeleteUserModalProps) {
  const [deleteUserFn, { isLoading }] = useDeleteUserMutation();

  const handleDeleteUser = () => {
    deleteUserFn({ id: user!.id! })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "User deleted successfully",
          message: "This user is now deleted and their access is revoked.",
        });
        onClose();
      })
      .catch((e) => {
        const message =
          e?.data?.message || "This user cannot be deleted. Please try again.";
        appNotifications.error({
          title: "Failed to delete user",
          message,
        });
      });
  };

  if (!user || !opened) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Delete User"
      type="danger"
      closable
      size="lg"
    >
      <Alert
        color="red"
        title="Confirm Account Deletion"
        icon={<IconAlertCircle />}
        mb={12}
      >
        Are you sure you want to delete this user? Once confirmed, all their
        sessions are revoked and they cannot access their account.
      </Alert>

      <BasicCard title="Attorney's Information">
        <SimpleGrid cols={2}>
          <DetailField title="Name" value={user.fullname} />
          <DetailField title="Email" value={user.email} />
          <DetailField title="Phone" value={user.phone} />
          <DetailField
            title="Member Since"
            value={getDateFormatDisplay(user?.metadata?.createdAt)}
          />
        </SimpleGrid>
      </BasicCard>

      <Button
        onClick={handleDeleteUser}
        loading={isLoading}
        color="red.7"
        fullWidth
        leftSection={<IconTrash />}
        mt="md"
      >
        I Understand
      </Button>
    </AppModal>
  );
}
