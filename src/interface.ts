export interface PropertySource {

}

export interface PropertyResolver {
    contains( property: string): boolean;
    get<T>( property: string ): T
}

export interface Environment {

}
