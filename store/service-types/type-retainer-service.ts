import { GenericPaginatedResponse } from "@/types/pagination";
import { Retainer } from "@/types/retainer-new";
import { UserReference } from "@/types/user-reference";

export type RetainerListingResponse = GenericPaginatedResponse<
  Pick<
    Retainer,
    | "id"
    | "clientName"
    | "clientType"
    | "contactPerson"
    | "areas"
    | "retainerSince"
    | "updatedAt"
  >
>;

export interface CreateNewRetainerDto {
  clientName: string;
  clientType: string;
  contactPerson: UserReference & { fullAddress: string };
  retainerSince: string;
  areas: string[];
  description: string;
}

export type UpdateRetainerDto = Partial<CreateNewRetainerDto> & { id: string };
