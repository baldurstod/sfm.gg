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

export class Serializable {
	readonly isSerializable = true as const;
	#id: string;
	#name: string;

	constructor(params: SerializableParameters = {}) {
		this.#id = params.id ?? generateRandomUUID();
		this.#name = params.name ?? '';
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
}
