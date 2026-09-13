import { JSONObject } from 'harmony-types';
import { errorOnce } from 'harmony-utils';
import { Serializable, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';
import { SfmEntityPropertyValue } from '../entity';
import { SfmOperatorContext } from '../interfaces/operator';
import { HasInputs, HasOutputs, SfmOperatorIO, SfmOperatorOutput } from './io';

export abstract class SfmOperator extends Serializable implements HasInputs, HasOutputs {
	readonly isSfmOperator = true as const;

	protected readonly inputs = new Map<string, SfmOperatorOutput>();

	abstract getInputs(): SfmOperatorIO[];
	abstract getOutputs(): SfmOperatorIO[];
	//abstract getOutput(name: string): SfmOperatorIO | null;//TODO
	abstract getOutputValue(name: string): SerializablePropertyValue;
	//abstract getOutputValue(context: SfmOperatorContext, name: string, outputId: number): SerializablePropertyType;
	/** Do the operation. Return true is the operation succeed, false otherwise */
	abstract operate(context: SfmOperatorContext): boolean;

	setPredecessor(input: string, predecessor: SfmOperatorOutput): void {
		//TODO: check predecessor type
		this.inputs.set(input, predecessor);
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.inputs.size) {
			errorOnce('TODO');
			//json.inputs = Object.fromEntries(this.inputs) as JSONObject;
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.inputs.clear();
		const properties = json.inputs as JSONObject;
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
