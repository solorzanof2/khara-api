

export const useListPaginator = <T>(collection: any[], perPage: number = 10): T[][] => {
  try {
    // const maxListeners = +process.env.WEBSOCKET_MAX_LISTENERS;

    const totalPages = Math.ceil(collection.length / perPage);

    let collector = new Array<T>();
    const resultCollection = new Array<T[]>();

    let start = 0;
    let end = perPage;
    for (let index = 0; index < totalPages; index++) {
      if (index > 0) {
        start = index * perPage;
        end = start + perPage;
      }

      collector = collection.slice(start, end);

      resultCollection.push(collector);
    }

    return resultCollection;
  }
  catch (error) {

  }
}


export const useTotalPages = (totalRows: number, perPage: number): number => {
  try {
    return Math.ceil(totalRows / perPage);
  }
  catch {

  }
}


export interface PaginationResponse<T> {
  collection: T[];
  length: number;
  page: number;
  perPage: number;
  totalPages: number;
  totalRows: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

