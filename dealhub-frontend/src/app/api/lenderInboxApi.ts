import { httpJson } from "./http";

export type LenderInboxMessageDto = {
  id: number;
  dealName: string;
  lenderId: number;
  recipientEmail: string;
  createdAt: string;
  payload: any;
};

export async function getMyLenderInbox(): Promise<LenderInboxMessageDto[]> {
  return httpJson("GET", "/agreements/lender/inbox");
}
