import NotarizationCompletedEmail from "@/emails/notarizations/completed";
import { NotarizationForPickupEmail } from "@/emails/notarizations/for-pickup";
import NotarizationNewRequestEmail from "@/emails/notarizations/new-request";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, template, data, attachments } = body;

    let emailComponent;

    switch (template) {
      case "notarization-for-pickup":
        emailComponent = NotarizationForPickupEmail(data);
        break;

      case "notarization-completed":
        emailComponent = NotarizationCompletedEmail(data);
        break;

      case "notarization-new-request":
        emailComponent = NotarizationNewRequestEmail(data);
        break;

      default:
        emailComponent = NotarizationForPickupEmail({
          fullname: "User",
          referenceNumber: "1234567890",
        });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Baisandan Law <onboarding@resend.dev>",
      // to: [to],
      to: "developer.baisandanlaw@gmail.com",
      subject: subject,
      react: emailComponent,
      ...(attachments && { attachments }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(emailData);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
