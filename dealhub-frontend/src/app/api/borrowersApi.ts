import { httpJson } from "./http";

export type BorrowerDto = {
  id: number;
  name: string;
};

export async function listMyBorrowers(): Promise<BorrowerDto[]> {
  return httpJson("GET", "/borrowers");
}

export async function createBorrower(name: string): Promise<BorrowerDto> {
  return httpJson("POST", "/borrowers", { name });
}

export async function deleteBorrower(id: number): Promise<void> {
  return httpJson("DELETE", `/borrowers/${id}`);
}
