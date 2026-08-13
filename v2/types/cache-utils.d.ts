export declare function setBoundedMapEntry<K, V>(cache: Map<K, V>, key: K, value: V, maxSize: number): void;
export declare function pruneMapToSize<K, V>(cache: Map<K, V>, maxSize: number, retainedSize?: number): void;
