

export const GlobalStatus = {
  Pending: 'pending',
  Active: 'active',
  Inactive: 'inactive',
  Deleted: 'deleted',
  EmailVerificationPending: 'email_verification_pending',
  Cancelled: 'cancelled',
  Closed: 'closed',
  Expired: 'expired',
  Busy: 'busy',
  Sent: 'sent',
  Available: 'available',
  ProfilePending: 'profile_pending',
  PasswordResetRequired: 'password_reset_required',
  Inherit: 'inherit',
  Payed: 'payed',
  Approved: 'approved',
  Deny: 'deny',
  Default: 'default',
  Scheduled: 'scheduled',
  Done: 'done',
  OfflineSale: 'offline_sale',
  Upgraded: 'upgraded',
  Disassembled: 'disassembled',
  Locked: 'locked',
  Failed: 'failed',
  Disabled: 'disabled',
  PartiallySent: 'partially_sent',
  Readed: 'readed',
  Authorized: 'authorized',
  Finished: 'finished',
  Coming: 'coming',
  Reported: 'reported',
  Archived: 'archived',
  Accepted: 'accepted',
} as const;

export const GlobalPersonType = {
  Legal: 'legal',
  Natural: 'natural',
  Application: 'application',
} as const;

export const GlobalPolicy = {
  Allow: 'allow',
  Deny: 'deny',
} as const;

export const GlobalDefaultStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Deleted: 'deleted'
} as const;

export const GlobalCategoryPost = {
  Post: 'post',
  Note: 'note',
  Reminder: 'reminder',
  Task: 'task',
  Comment: 'comment',
  Timer: 'timer',
} as const;

export const GlobalParentType = {
  Project: 'project',
  User: 'user',
  Team: 'team',
  Customer: 'customer',
  Post: 'post',
  Client: 'client',
  Supplier: 'supplier',
  Partner: 'partner',
  Owner: 'owner',
  Manager: 'manager',
  Contributor: 'contributor',
  Viewer: 'viewer',
  Contractor: 'contractor',
} as const;

export const GlobalVisibilityType = {
  Internal: 'internal',
  Private: 'private',
  Team: 'team',
  Restricted: 'restricted',
  Public: 'public',
} as const;

export const GlobalRoleMemberType = {
  Internal: 'internal',
  External: 'external',
  Contractor: 'contractor',
} as const;
