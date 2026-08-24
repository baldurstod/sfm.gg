import { JSONObject, JSONValue } from 'harmony-types';
import { Session } from '../session/session';
import { Serializable } from './serializable';

//export type SerializableValueSingle = string | number | Serializable;
//export type SerializableValueArray = SerializableValueSingle[];
export type JSONSerializable = { [Key: string]: JSONValue | Serializable | Serializable[] };
//
//export type SFMFile = JSONSerializable[];

/*
export declare interface JSONSerializable {
	[k: string]: JSONSerializableValue;
}
*/

export declare type JSONSerializableValue = JSONValue | Serializable;

/*
export type JSONFile = {
	file_infos: JSONSerializable;
	session: JSONSerializable;
	elements: JSONSerializable[];
};
*/
export type JSONElement = {
	id: string;
	name: string;
	type: string;
};

export type JSONFile = {
	file_infos: JSONObject;
	session: string;
	elements: JSONElement[];
};

export class SFMSerializer {

	static readonly #entities = new Map<string, typeof Serializable>();

	static async fromJSON(file: JSONFile): Promise<Serializable | null> {
		let loadedResolve: Function = () => { };// Note: typescript falsely complains about loadedResolve not being assigned without this.
		const loadedPromise = new Promise<void>(resolve => {
			loadedResolve = resolve;
		});

		let session: Serializable | null = null;
		const elements = new Map<string, Serializable>();
		const elements2 = new Map<Serializable, JSONObject>();
		for (const elementJSON of file.elements) {
			const element = this.#getElement(elementJSON);
			if (element) {
				elements.set(element.id, element);
			}
		}

		for (const [element, json] of elements2) {
			element.serialize(json, elements);
		}

		if (file.session) {
			session = elements.get(file.session) as Session;
		}

		loadedResolve(true);
		return session;
	}

	static serializeJSON(session: Session): JSONFile {
		//const elements = new Map<string, Serializable>();
		//const json = session.toJSON();
		const elementsMap = new Map<string, JSONObject>();
		this.#serializeElement(session, elementsMap);


		const elements: JSONElement[] = [];
		for (const [, e] of elementsMap) {
			elements.push(e as JSONElement);
		}

		return {
			file_infos: {},
			session: session.id,
			elements,
		}
	}

	static #serializeElement(element: Serializable, elements: Map<string, JSONObject>): void {
		const serialized = element.unserialize();
		const json: JSONObject = {};
		elements.set(serialized.id as string, json);

		for (const key in serialized) {
			const value = serialized[key];

			if (value instanceof Serializable) {
				if (!elements.has(value.id)) {
					this.#serializeElement(value, elements);
				}
				json[key] = value.id;
			} else if (Array.isArray(element)) {
				const arr: JSONValue[] = [];
				for (const value of element) {
					if (value instanceof Serializable) {
						if (!elements.has(value.id)) {
							this.#serializeElement(value, elements);
						}
						arr.push(value.id);
					}
				}
				json[key] = arr;
			} else {
				json[key] = value as JSONValue;
			}
		}
	}

	static #serializeElementJSON(element: JSONSerializable, elements: Map<string, JSONObject>): JSONObject {
		const json: JSONObject = {};
		for (const key in element) {
			const value = element[key];

			if (value instanceof Serializable) {
				if (!elements.has(value.id)) {

					this.#serializeElement(value, elements);

				}
				//json[key] = this.#serializeElement(value, elements);
				json[key] = value.id;

			}

		}

		return {};
	}

	static #checkJSON(json: JSONObject): boolean {
		return true;
	}

	static #getElement(json: JSONElement): Serializable | null {
		const serializableType = this.#getSerializableClass(json.type as string);
		if (!serializableType) {
			console.error('Unknown constructor', json.type);
			return null;
		}

		return new serializableType({ name: json.name as string, id: json.id as string });
	}

	/*
	static async #fromJSON(file: SFMFile): Promise<Serializable | null> {
		let loadedResolve: Function = () => { };// Note: typescript falsely complains about loadedResolve not being assigned without this.
		const loadedPromise = new Promise<void>(resolve => {
			loadedResolve = resolve;
		});
		const entities = new Map<string, Serializable>();
		let root: Serializable | null = null;
		for (const o of file) {
			const serializable = await this.loadSerializable(o, entities, loadedPromise);
			if (!root) {
				root = serializable;
			}
		}

		loadedResolve(true);
		return root;
	}
	*/

	/*
	static async loadSerializable(jsonSerializable: JSONObject, entities: Map<string, Serializable>, loadedPromise: Promise<void>): Promise<Serializable | null> {
		const type = jsonSerializable.type;
		if (typeof type !== 'string') {
			return null;
		}
		const serializableType = this.#getSerializableClass(type);
		if (!serializableType) {
			console.error('Unknown constructor', type);
			return null;
		}
		//const serializable = await serializableType.constructFromJSON(jsonSerializable/*, entities, loadedPromise* /);
		const serializable = new serializableType({ name: jsonSerializable.name as string, id: jsonSerializable.id as string })//.constructFromJSON(jsonSerializable/*, entities, loadedPromise* /);
		if (!serializable) {
			return null;
		}
		serializable.fromJSON(jsonSerializable);
		entities.set(serializable.id, serializable);

		if (jsonSerializable.children) {
			for (const child of jsonSerializable.children as JSONObject[]) {
				const childSerializable = await this.loadSerializable(child, entities, loadedPromise);
				if (childSerializable) {
					serializable.addChild(childSerializable as Serializable);
				}
			}
		}
		return serializable;
	}
	*/

	static registerSerializable(type: typeof Serializable): void {
		const name = type.getTypeName().toLowerCase();
		if (this.#entities.has(name)) {
			throw new Error(`${name} is already registered`);
		}
		this.#entities.set(name, type);
	}

	static #getSerializableClass(name: string) {
		return this.#entities.get(name.toLowerCase());
	}
}
