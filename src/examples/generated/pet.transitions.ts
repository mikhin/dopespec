import type { PetProps } from './pet.types.js';

export function PetRelease(ctx: PetProps): PetProps {
  if (ctx.status !== 'reserved') {
    throw new Error(`Cannot release: expected status 'reserved', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'available' };
}

export function PetReserve(ctx: PetProps): PetProps {
  if (ctx.status !== 'available') {
    throw new Error(`Cannot reserve: expected status 'available', got '${ctx.status}'`);
  }
  if (!(ctx.vaccinated === true)) {
    throw new Error('Guard failed for transition reserve');
  }
  return { ...ctx, status: 'reserved' };
}

export function PetSell(ctx: PetProps): PetProps {
  if (ctx.status !== 'reserved') {
    throw new Error(`Cannot sell: expected status 'reserved', got '${ctx.status}'`);
  }
  if (!(ctx.price > 0)) {
    throw new Error('Guard failed for transition sell');
  }
  return { ...ctx, status: 'sold' };
}
