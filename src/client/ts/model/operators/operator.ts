import { JSONObject } from 'harmony-types';
import { errorOnce } from 'harmony-utils';
import { Serializable, SerializableParameters, SerializablePropertyValue, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable } from '../../serialize/serializer';
import { SfmEntityPropertyValue } from '../entity';
import { SfmOperatorContext } from '../interfaces/operator';
import { HasInputs, HasOutputs, SfmOperatorIO, SfmOperatorOutput } from './io';

export interface OperatorParameters extends SerializableParameters {
	predecessors?: Record<string, SfmOperatorOutput>;
}

export abstract class SfmOperator extends Serializable implements HasInputs, HasOutputs {
	readonly isSfmOperator = true as const;

	protected readonly inputs = new Map<string, SfmOperatorOutput>();

	constructor(params: OperatorParameters = {}) {
		super(params);
		const predecessors = params.predecessors;
		if (predecessors) {
			for (const name in predecessors) {
				this.setPredecessor(name, predecessors[name]!);
			}
		}
	}

	abstract getInputs(): SfmOperatorIO[];
	abstract getOutputs(): SfmOperatorIO[];
	//abstract getOutput(name: string): SfmOperatorIO | null;//TODO

	protected getInputValue(name: string): SerializablePropertyValue {
		const input = this.inputs.get(name);
		if (!input) {
			return undefined;
		}

		return input.element.getOutputValue(input.output);
	}

	abstract getOutputValue(name: string): SerializablePropertyValue;
	//abstract getOutputValue(context: SfmOperatorContext, name: string, outputId: number): SerializablePropertyType;
	/** Do the operation. Return true is the operation succeed, false otherwise */
	abstract operate(context: SfmOperatorContext): boolean;

	setPredecessor(input: string, predecessor: SfmOperatorOutput | null): void {
		//TODO: check predecessor type
		if (predecessor) {
			this.inputs.set(input, predecessor);
		} else {
			this.inputs.delete(input);
		}
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
