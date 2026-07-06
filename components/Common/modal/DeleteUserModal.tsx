import { UserReference } from "@/types/user-reference";
import { useDeleteUserMutation } from "@/store/services/userService";
import { appNotifications } from "@/utils/notifications/notifications";
import DeleteModal from "./DeleteModal";

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
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Delete User"
      action="delete"
      entityType="user"
      handleDelete={handleDeleteUser}
      isLoading={isLoading}
    />
  );
}
