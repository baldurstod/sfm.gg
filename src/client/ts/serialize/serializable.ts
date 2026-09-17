import { quat, vec2, vec3, vec4 } from 'gl-matrix';
import { generateRandomUUID } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { errorOnce } from 'harmony-utils';
import { Command, Undoable } from '../history/action';
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
	metadatas?: Record<string, SerializableMetadata>;
}

export type UnserializationContext = {
	elements: Map<string, Serializable>;
	fileVersion: number;
}

export type SerializablePropertyValue =
	boolean
	| string
	| number
	| Serializable
	| undefined
	| null
	| vec2
	| vec3
	| vec4
	| quat
	// Array types
	| boolean[]
	| string[]
	| number[]
	| Serializable[]
	| undefined[]
	| null[]
	| vec2[]
	| vec3[]
	| vec4[]
	| quat[]
	;

export type SerializablePropertyType = 'bool'
	| 'string'
	| 'integer'
	| 'double'
	| 'element'
	| 'undefined'
	| 'null'
	| 'vec2'
	| 'vec3'
	| 'vec4'
	| 'quat'
	| 'enum'// string enum
	| 'bool_array'
	| 'string_array'
	| 'integer_array'
	| 'double_array'
	| 'element_array'
	| 'undefined_array'
	| 'null_array'
	| 'vec2_array'
	| 'vec3_array'
	| 'vec4_array'
	| 'quat_array'
	;

export type SerializableProperty = {
	name: string;
	i18n: string;
	type: SerializablePropertyType;
	settable: boolean;
	/** Enum must be provided if type is 'enum' */
	enum?: string[];
}

export type SerializableMetadata = string | number | null;

export abstract class Serializable implements Undoable {
	readonly isSerializable = true as const;
	#id: string;
	#name: string;
	#metadatas?: Map<string, SerializableMetadata>;

	constructor(params: SerializableParameters = {}) {
		this.#id = params.id ?? generateRandomUUID();
		this.#name = params.name ?? this.getDefaultName();

		const metadatas = params.metadatas
		if (metadatas) {
			for (const key in metadatas) {
				this.#setMetadata(key, metadatas[key]!);
			}
		}
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

	#setMetadata(name: string, value: SerializableMetadata): void {
		if (!this.#metadatas) {
			this.#metadatas = new Map();
		}

		this.#metadatas.set(name, value);
	}

	getMetadata(name: string): SerializableMetadata | undefined {
		if (!this.#metadatas) {
			return undefined;
		}

		return this.#metadatas.get(name);
	}

	#deleteMetadata(name: string): void {
		if (!this.#metadatas) {
			return;
		}

		this.#metadatas.delete(name);
	}

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-name':
				const name = this.#name;
				this.#name = command.params as string;
				command.undoParams = name;
				return true;
			case 'set-metadata':
				if (this.#metadatas) {
					command.undoParams = new Map<string, SerializableMetadata>(this.#metadatas);
				}
				this.#setMetadata((command.params as SetMetadata).name, (command.params as SetMetadata).value);
				return true;
			default:
				throw new Error('unknow command: ' + command.command);
		}
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-name':
				this.#name = command.undoParams as string;
				return true;
			case 'set-metadata':
				this.#metadatas?.clear();
				(command.undoParams as Map<string, SerializableMetadata>).forEach((value, key) => this.#setMetadata(key, value));
				return true;
			default:
				throw new Error('unknow command: ' + command.command);
		}
	}

	static getTypeName(): string {
		throw new Error('override me');
	}

	getTypeName(): string {
		return (this.constructor as typeof Serializable).getTypeName();
	}

	abstract getDefaultName(): string;

	serialize(): JSONSerializable {
		const json = {
			id: this.#id,
			name: this.#name,
			type: (this.constructor as typeof Serializable).getTypeName(),
		} as JSONObject;

		if (this.#metadatas?.size) {
			json.metadatas = Object.fromEntries(this.#metadatas) as JSONObject;
		}

		return json;
	}

	unserialize(json: JSONSerializable, context: UnserializationContext): void {
		this.#id = json.id as string;
		this.#name = json.name as string;

		this.#metadatas?.clear();
		const metadatas = json.metadatas as JSONObject;//TODO: check type
		if (metadatas) {
			for (const name in metadatas) {
				this.#setMetadata(name, metadatas[name] as SerializableMetadata);//TODO: check the actual type
			}
		}
	}

	abstract getProperties(): SerializableProperty[];

	getProperty(name: string): SerializablePropertyValue {// TODO: set abstract ?
		return null;
	}

	setProperty(name: string, value: SerializablePropertyValue): boolean {// TODO: set abstract ?
		return false;
	}

	/**
	 * Set the sub value of a property. For instance x value of a vector
	 * @param name Name of the property
	 * @param element Name of the sub element
	 * @param value Value
	 * @returns True in case of success, false otherwise
	 */
	setSubProperty(name: string, element: string, value: number): boolean {
		errorOnce(`This method shoul be overriden, ${name} ${element} ${value}`);
		return false;
	}
}

/** Concrete subclasses of Serializable */
export type ConcreteSerializable = typeof Serializable & (new (...args: any[]) => Serializable);

export type SetMetadata = {
	name: string;
	value: SerializableMetadata;
}
