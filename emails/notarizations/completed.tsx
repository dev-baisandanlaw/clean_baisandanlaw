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

interface NotarizationCompletedEmailProps {
  fullname?: string;
}

export const NotarizationCompletedEmail = ({
  fullname,
}: NotarizationCompletedEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Your Notary Request is Completed!</Preview>
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
              Thank you for picking up your document. Attached is a copy of the
              document you picked up.
            </Text>

            <Text style={paragraph}>
              Should you have any questions or concerns, please feel free to
              contact us.
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

NotarizationCompletedEmail.PreviewProps = {
  fullname: "John Doe",
} as NotarizationCompletedEmailProps;

export default NotarizationCompletedEmail;

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
