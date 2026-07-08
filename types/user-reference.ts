export interface UserReference {
  fullname: string;
  email: string | undefined;
  id: string | undefined;
  division?: string | null | undefined;

  phone?: string | undefined;

  birthday?: string | undefined | null;
  fullAddress?: string | undefined | null;
  fullAddres?: string | undefined | null;
}
