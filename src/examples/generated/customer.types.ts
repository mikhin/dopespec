export type CustomerStatus = "active" | "suspended" | "deleted";

export type CustomerProps = {
  email: string;
  name: string;
  status: CustomerStatus;
};
