import type { InviteProps } from './invite.types.js';
import type { MemberProps } from './member.types.js';

export type OnlyOwnerCanResendContext = {
  invite: InviteProps;
  editor: MemberProps;
};

export function validateOnlyOwnerCanResend(ctx: OnlyOwnerCanResendContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.editor.orgRole!=="owner") violations.push('OnlyOwnerCanResend:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type OnlyOwnerCanRevokeContext = {
  invite: InviteProps;
  editor: MemberProps;
};

export function validateOnlyOwnerCanRevoke(ctx: OnlyOwnerCanRevokeContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.editor.orgRole!=="owner") violations.push('OnlyOwnerCanRevoke:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}
