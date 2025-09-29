import { ForPickup } from "@/components/email-templates/for-pickup/ForPickup";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, template, data } = body;

    let emailComponent;

    switch (template) {
      case "for-pickup":
        emailComponent = ForPickup(data);
        break;

      default:
        emailComponent = ForPickup({
          fullname: "User",
          referenceNumber: "1234567890",
        });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Baisandan Law <onboarding@resend.dev>",
      // to: [to],
      to: "justinedavedr.zeniark@gmail.com",
      subject: subject,
      react: emailComponent,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(emailData);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
