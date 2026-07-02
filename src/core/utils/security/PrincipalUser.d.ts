

export interface PrincipalUserRoleDTO {
  name: string;
  code: string;
  uid: string;
}


export interface PrincipalUserDTO {
  sid: string;
  iat: number;
  email: string;
  username: string;
  uid: string;
  fullName: string;
  document: string;
  roles: PrincipalUserRoleDTO[];
  tenantUid: string;
}

