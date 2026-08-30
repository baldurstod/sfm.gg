import { Serializable, SerializableProperty, SerializablePropertyType, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';

export type SfmOperatorTypes = 'number';

export type SfmOperatorIO = {
	name: string;
	i18n: string;
	type: SfmOperatorTypes;
	/** How many of that input is allowed ? Default to 1 */
	limit?: number
}

export interface SfmOperator extends Serializable {
	getInputs(): SfmOperatorIO[];
	getOutputs(): SfmOperatorIO[];
	/** Do the operation. Return true is the operation succeed, false otherwise  */
	operate(): boolean;
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
