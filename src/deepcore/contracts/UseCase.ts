

export interface UseCaseOptions {
  [property: string]: any;
}


export interface UseCase {

  execute<T>(options: UseCaseOptions): Promise<T>;

}

