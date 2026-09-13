import { JSONObject } from 'harmony-types';
import { Map2 } from 'harmony-utils';
import { Serializable, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';
import { SfmEntityPropertyValue } from '../entity';

export type SfmOperatorTypes = 'number';

export type SfmOperatorIO = {
	name: string;
	i18n: string;
	type: SfmOperatorTypes;
	/** How many of that input is allowed ? Default to 1 */
	limit?: number;
}

export type SfmOperatorContext = {
	/** Id is an incremental value */
	id: number;
	time: number;
}

export type SfmOperatorInput = {
	name: string;
	/** Input id, if several of the same name exist. Default to 0 */
	id?: number;
};

export type SfmOperatorOutput = {
	operator: SfmOperator;
	name: string;
	/** Output id, if several of the same name exist. Default to 0 */
	id?: number;
};

export abstract class SfmOperator extends Serializable {
	protected readonly inputs = new Map2<string, number, SfmOperatorOutput>();

	//abstract getInputs(): SfmOperatorIO[];
	//abstract getOutputs(): SfmOperatorIO[];
	//abstract getOutputValue(context: SfmOperatorContext, name: string, outputId: number): SerializablePropertyType;
	/** Do the operation. Return true is the operation succeed, false otherwise  */
	abstract operate(context: SfmOperatorContext): boolean;

	setPredecessor(input: SfmOperatorInput, predecessor: SfmOperatorOutput): void {
		this.inputs.set(input.name, input.id ?? 0, predecessor);
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.inputs.size) {
			json.properties = Object.fromEntries(this.inputs) as JSONObject;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.inputs.clear();
		const properties = json.properties as JSONObject;
		if (properties) {
			for (const key in properties) {
				const value = properties[key] as SfmEntityPropertyValue;// TODO: check the value
				//this.properties.set(key, value);
			}
		}
	}
}

/*
export class SfmOperator extends Serializable {
	readonly isSfmOperator = true as const;

	static override getTypeName(): string {
		return 'Operator';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		throw new Error('TODO');


		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);


		throw new Error('TODO');
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'TODO',
				i18n: '#TODO',
				settable: true,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmOperator);
*/
