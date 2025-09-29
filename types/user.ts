export interface User {
  id: string;
  first_name: string;
  last_name: string;
  created_at: number;
  profile_image_url: string;
  email_addresses: {
    email_address: string;
    id: string;
  }[];
  unsafe_metadata: BaseMetadata;
}

interface BaseMetadata {
  role: string; // narrowed by union
  phoneNumber?: string;
  involvedCases?: number;
}

interface ClientMetadata extends BaseMetadata {
  role: "client";
  subscription?: {
    lastPaymentDate: string | Date;
    renewsAt: string | Date;
    paymentId: string;
    subscribedStartDate: string | Date;
    subscribedEndDate: string | Date;
    isSubscribed: boolean;
  };
}

interface AttorneyMetadata extends BaseMetadata {
  role: "attorney";
  practiceAreas?: string[];
}

interface AdminMetadata extends BaseMetadata {
  role: "admin";
}

export type Client = Omit<User, "unsafe_metadata"> & {
  unsafe_metadata: ClientMetadata;
};

export type Attorney = Omit<User, "unsafe_metadata"> & {
  unsafe_metadata: AttorneyMetadata;
};

export type Admin = Omit<User, "unsafe_metadata"> & {
  unsafe_metadata: AdminMetadata;
};
