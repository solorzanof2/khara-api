import { GlobalStatus, GlobalVisibilityType } from '../constants/GlobalConstants';


export const useIsValidGlobalVisibilityType = (input: string): boolean => {
  const values = Object.values(GlobalVisibilityType) as string[];
  return values.includes(input);
};

export const useIsValidProjectStatus = (input: string): boolean => {
  const Status = [
    `${GlobalStatus.Active}`,
    `${GlobalStatus.Inactive}`,
    `${GlobalStatus.Deleted}`,
    `${GlobalStatus.Archived}`,
  ];

  return Status.includes(input);
}