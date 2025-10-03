import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface NotarizationForPickupEmailProps {
  fullname?: string;
  referenceNumber?: string;
}

export const NotarizationForPickupEmail = ({
  fullname,
  referenceNumber,
}: NotarizationForPickupEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Your Notary Request is Ready for Pickup!</Preview>
        <Container style={container}>
          <Section style={logo}>
            <Img
              width={114}
              src={
                "https://img1.wsimg.com/isteam/ip/5cdb597e-9862-4bd8-a975-914f985624f4/BA%20LAW%20ICON.png/:/rs=w:400,h:400,cg:true,m/cr=w:400,h:400/qt=q:95"
              }
              alt="Baisandan Law"
              style={logoImg}
            />
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              Good day <strong>{fullname},</strong>
            </Text>

            <Text style={paragraph}>
              We are glad to inform you that your notary request is ready for
              pickup.
            </Text>

            <Section style={codeBox}>
              <Text style={codeBoxTitle}>Reference Number:</Text>
              <Text style={codeBoxText}>{referenceNumber}</Text>
            </Section>

            <Text style={paragraph}>
              Please bring a valid government-issued ID along with your
              reference number when claiming your document.
            </Text>

            <Text style={paragraph}>
              You can claim your document at the office from Monday to Friday,
              from 8:00 AM to 5:00 PM.
            </Text>

            <Text style={paragraph}>Thank you for choosing Baisandan Law.</Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Row>
            <Text style={{ textAlign: "center", color: "#706a7b" }}>
              Block 7, Lot 3, Unit D, Fil-Am Friendship Hwy, Brgy. Cutcut,
              Angeles City <br />
              2nd Floor, GT Building, O. Gueco St., cor. Lacson St., Purok
              Mabuko, Brgy. Sta. Cruz, Magalang, Pampanga. <br />
              Mobile No. 0915 968 2503 | Tel No. (045) 281 0164 <br />
              Copyright © 2024 Bais Andan Law Offices - All Rights Reserved.
            </Text>
          </Row>
        </Section>
      </Body>
    </Html>
  );
};

NotarizationForPickupEmail.PreviewProps = {
  fullname: "John Doe",
  referenceNumber: "RV440KL77PO",
} as NotarizationForPickupEmailProps;

export default NotarizationForPickupEmail;

const fontFamily = "HelveticaNeue,Helvetica,Arial,sans-serif";

const main = {
  backgroundColor: "#efeef1",
  fontFamily,
};

const paragraph = {
  lineHeight: 1.5,
  fontSize: 14,
};

const container = {
  maxWidth: "580px",
  margin: "30px auto",
  backgroundColor: "#ffffff",
};

const footer = {
  maxWidth: "580px",
  margin: "0 auto",
};

const content = {
  padding: "5px 20px 10px 20px",
};

const logo = {
  padding: 30,
  backgroundColor: "#2B4E45",
};

const logoImg = {
  margin: "0 auto",
};

const codeBox = {
  background: "rgb(245, 244, 245)",
  borderRadius: "4px",
  marginBottom: "30px",
  padding: "10px",
};

const codeBoxTitle = {
  fontSize: "16px",
  textAlign: "center" as const,
  verticalAlign: "middle",
  color: "#2B4E45",
  letterSpacing: "1px",
};

const codeBoxText = {
  fontSize: "30px",
  textAlign: "center" as const,
  verticalAlign: "middle",
  color: "#2B4E45",
  letterSpacing: "1px",
};
