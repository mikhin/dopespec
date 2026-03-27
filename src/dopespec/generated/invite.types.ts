export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type InviteProps = {
  id: string;
  email: string;
  status: InviteStatus;
  createdAt: Date;
  expiresAt: Date;
  organizationId: string; // belongsTo Organization
  memberId: string; // belongsTo Member
};
