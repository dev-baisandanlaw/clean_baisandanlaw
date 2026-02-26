import { doc, setDoc, arrayUnion } from "firebase/firestore";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";

import { MatterUpdateType } from "@/types/matter-updates";
import { UserResource } from "@clerk/types";

export const addMatterUpdate = async (
  user: UserResource,
  matterId: string,
  division: string,
  type: MatterUpdateType,
  description: string,
) => {
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const userDetails = {
    id: user.id,
    fullname: user.firstName + " " + user.lastName,
    email: user.emailAddresses[0].emailAddress,
  };

  await setDoc(
    doc(db, COLLECTIONS.MATTER_UPDATES, matterId),
    {
      id: matterId,
      updatedAt: now,
      items: arrayUnion({
        id: nanoid(10),
        type,
        dateAndTime: now,
        user: userDetails,
        updateDivision: division,
        description,
      }),
    },
    { merge: true },
  ).catch((error) => {
    console.error(error);
  });
};
