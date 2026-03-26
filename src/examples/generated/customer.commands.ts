export type CustomerUpdateEmailCommand = {
  type: "CustomerUpdateEmail";
  payload: { email: string };
};

export type CustomerCommand = CustomerUpdateEmailCommand;
