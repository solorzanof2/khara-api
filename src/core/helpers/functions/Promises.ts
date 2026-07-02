

export const useReject = (payload: any): Promise<never> => Promise.reject(payload);

export const useResolve = (payload?: any): Promise<any> => Promise.resolve(payload);

