export interface User {
  id: string;
  first_name: string;
  last_name: string;
  unsafe_metadata: {
    role: "client" | "attorney" | string;
    phoneNumber?: string;
    involvedCases?: number;
  };
  created_at: number;
  profile_image_url: string;
  email_addresses: {
    email_address: string;
    id: string;
  }[];
}

export interface Client extends User {
  unsafe_metadata: {
    role: "client";
    involvedCases?: number;
    subscription?: {
      lastPaymentDate: string | Date;
      renewsAt: string | Date;
      paymentId: string;
      subscribedStartDate: string | Date;
      subscribedEndDate: string | Date;
      isSubscribed: boolean;
    };
  };
}

export interface Attorney extends User {
  unsafe_metadata: {
    role: "attorney";
    practiceAreas?: string[];
    involvedCases?: number;
  };
}
