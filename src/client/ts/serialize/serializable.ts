import { generateRandomUUID } from 'harmony-3d';
import { JSONSerializable } from './serializer';

/*
export interface Serializable
{
	id: string;
	name: string;
	new(): Serializable;
	fromJSON: (json: JSONObject) => void;
	toJSON: () => JSONObject;
	//static test: () => void;
}
*/

export interface SerializableParameters {
	id?: string;
	name?: string;
}

export type UnserializationContext = {
	elements: Map<string, Serializable>;
	fileVersion: number;
}

export type SerializablePropertyType = boolean | string | number | Serializable | undefined | null | boolean[] | string[] | number[] | Serializable[];

export type SerializableProperty = {
	name: string;
	i18n: string;
	//type: SerializablePropertyType | SerializablePropertyType[];
	settable: boolean;
}

export class Serializable {
	readonly isSerializable = true as const;
	#id: string;
	#name: string;

	constructor(params: SerializableParameters = {}) {
		this.#id = params.id ?? generateRandomUUID();
		this.#name = params.name ?? this.getDefaultName();
	}

	getId(): string {
		return this.#id;
	}

	getName(): string {
		return this.#name;
	}

	setName(name: string): void {
		this.#name = name;
	}

	static getTypeName(): string {
		throw new Error('override me');
	}

	getTypeName(): string {
		return (this.constructor as typeof Serializable).getTypeName();
	}

	getDefaultName(): string {
		console.error('providing an empty default name for', this);
		return '';
	}

	serialize(): JSONSerializable {
		return {
			id: this.#id,
			name: this.#name,
			type: (this.constructor as typeof Serializable).getTypeName(),
		};
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		this.#id = json.id as string;
		this.#name = json.name as string;
	}

	getProperties(): SerializableProperty[] {
		throw new Error('TODO: override me');

	}

	getProperty(name: string): SerializablePropertyType {
		return null;
	}

	setProperty(name: string, value: SerializablePropertyType): boolean {
		return true;
	}
}
