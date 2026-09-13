import { quat, vec2, vec3, vec4 } from 'gl-matrix';
import { generateRandomUUID } from 'harmony-3d';
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

export abstract class Serializable implements Undoable {
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

	do(command: Command): boolean {
		switch (command.command) {
			case 'set-name':
				const name = this.#name;
				this.#name = command.params as string;
				command.undoParams = name;
				return true;
			default:
				throw new Error('unknow command: ' + command.command);
		}

		return false;
	}

	undo(command: Command): boolean {
		switch (command.command) {
			case 'set-name':
				this.#name = command.undoParams as string;
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
