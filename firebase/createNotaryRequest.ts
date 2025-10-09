import { COLLECTIONS } from "@/constants/constants";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";
import dayjs from "dayjs";
import { Models } from "appwrite";
import { NotaryRequestStatus } from "@/types/notary-requests";
import { UserResource } from "@clerk/types";
import { customAlphabet } from "nanoid";

export const createNotaryRequest = async (
  res: Models.File | null,
  description: string,
  user: UserResource,
  uuid: string
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;
  const document =
    res && res?.$id
      ? {
          id: res.$id,
          name: res.name,
          mimeType: res.mimeType,
          originalSize: res.sizeOriginal,
          sizeInMb: res.sizeOriginal / 1024 / 1024,
          uploadedAt: res.$createdAt,
          uploadedBy: { fullname: uploaderName, id: user.id },
        }
      : null;

  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, uuid),
    {
      createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      description,
      document,
      status: NotaryRequestStatus.SUBMITTED,
      finishedDocument: null,
      finishedAt: null,
      isPaid: false,
      timeline: [
        {
          id: customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)(),
          title: "SUBMITTED",
          description,
          dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          status: NotaryRequestStatus.SUBMITTED,
          user: {
            id: user?.id,
            fullname: user?.firstName + " " + user?.lastName,
          },
        },
      ],
      requestor: {
        id: user?.id,
        fullname: user?.firstName + " " + user?.lastName,
        email: user?.emailAddresses[0].emailAddress,
      },
    },
    { merge: true }
  );
};
