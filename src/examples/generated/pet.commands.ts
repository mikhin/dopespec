export type PetUpdatePriceCommand = {
  type: 'PetUpdatePrice';
  payload: { price: number };
};

export type PetVaccinateCommand = {
  type: 'PetVaccinate';
  payload: { date: string };
};

export type PetCommand = PetUpdatePriceCommand | PetVaccinateCommand;
