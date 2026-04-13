export type PetSpecies = 'dog' | 'cat' | 'bird' | 'fish';
export type PetStatus = 'available' | 'reserved' | 'sold';
export type PetProps = {
    name: string;
    nickname: string;
    price: number;
    species: PetSpecies;
    status: PetStatus;
    vaccinated: boolean;
};
//# sourceMappingURL=pet.types.d.ts.map