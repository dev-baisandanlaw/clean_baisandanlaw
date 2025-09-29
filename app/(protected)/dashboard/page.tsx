"use client";

import { ForPickup } from "@/components/email-templates/for-pickup/ForPickup";
import { useUser } from "@clerk/nextjs";
import { Button, Stack } from "@mantine/core";
import axios from "axios";

export default function DashboardPage() {
  const { user } = useUser();

  const onClick = async () => {
    try {
      const response = await axios.post("/api/resend/send", {
        to: "justinedavedr.zeniark@gmail.com",
        subject: "Your Notary Request is Ready for Pickup!",
        template: "for-pickup",
        data: {
          fullname: user?.fullName,
          email: user?.emailAddresses?.[0]?.emailAddress,
          referenceNumber: "1234567890",
        },
      });

      console.log(response.data);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  return (
    <Stack>
      <Button onClick={onClick}>Click me to send email</Button>
      <ForPickup fullname="John Doe" referenceNumber="1234567890" />
    </Stack>
  );
}
