export interface EmailTemplateProps {
  fullname: string;
  email?: string;
}

export interface ForPickupProps extends EmailTemplateProps {
  referenceNumber: string;
}
