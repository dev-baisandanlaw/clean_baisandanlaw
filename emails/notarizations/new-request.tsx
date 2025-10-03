import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface NotarizationNewRequestEmailProps {
  fullname?: string;
  email?: string;
  description?: string;
  link?: string;
}

export const NotarizationNewRequestEmail = ({
  fullname,
  email,
  description,
  link,
}: NotarizationNewRequestEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>New notarization request</Preview>
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
              A new notarization request has been submitted.
            </Text>

            <Section style={codeBox}>
              <Text style={codeBoxSubtitle}>
                Requestor: <span style={codeBoxSubtitleValue}>{fullname}</span>
              </Text>
              <Text style={codeBoxSubtitle}>
                Email: <span style={codeBoxSubtitleValue}>{email}</span>
              </Text>
              <Text style={codeBoxSubtitle}>
                Description:{" "}
                <span style={codeBoxSubtitleValue}>{description}</span>
              </Text>
            </Section>

            <Text style={paragraph}>
              You can view the whole request by clicking the button below.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={link}>
                View request
              </Button>
            </Section>
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

NotarizationNewRequestEmail.PreviewProps = {
  fullname: "-",
  description: "-",
  email: "-",
  link: "#",
} as NotarizationNewRequestEmailProps;

export default NotarizationNewRequestEmail;

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

const codeBoxSubtitle = {
  padding: "0px",
  margin: "0px",
  fontSize: "12px",
  textAlign: "left" as const,
  verticalAlign: "middle",
};

const codeBoxSubtitleValue = {
  color: "#2B4E45",
  fontWeight: 600,
  letterSpacing: ".4px",
};

const buttonContainer = {
  padding: "4px 0 18px",
};

const button = {
  backgroundColor: "#2B4E45",
  borderRadius: "3px",
  fontWeight: "600",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "11px 23px",
};
