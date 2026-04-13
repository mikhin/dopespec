import { z } from 'zod';

export const PetSchema = z.object({
  name: z.string(),
  nickname: z.string(),
  price: z.number(),
  species: z.enum(['dog', 'cat', 'bird', 'fish']),
  status: z.enum(['available', 'reserved', 'sold']),
  vaccinated: z.boolean(),
});
