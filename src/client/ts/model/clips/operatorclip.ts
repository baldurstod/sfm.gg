import { SerializableProperty, SerializablePropertyType, UnserializationContext } from '../../serialize/serializable';
import { JSONSerializable, SfmSerializer } from '../../serialize/serializer';
import { ClipParameters, SfmClip, SfmClipType } from '../clip';
import { SfmOperator } from '../operators/operator';

export interface OperatorClipParameters extends ClipParameters {
}

export class SfmOperatorClip extends SfmClip {
	readonly isSfmOperatorClip = true as const;
	readonly #operators = new Set<SfmOperator>();

	addOperator(operator: SfmOperator): SfmOperator {
		this.#operators.add(operator);
		return operator;
	}

	deleteOperator(operator: SfmOperator): void {
		this.#operators.delete(operator);
	}

	getClipType(): SfmClipType {
		return 'operator';
	}

	static override getTypeName(): string {
		return 'OperatorClip';
	}

	override serialize(): JSONSerializable {
		const json = super.serialize();

		if (this.#operators.size) {
			json.operators = [...this.#operators];
		}

		return json;
	}

	override unserialize(json: JSONSerializable, context: UnserializationContext): void {
		super.unserialize(json, context);

		this.#operators.clear();
		if (json.operators) {
			for (const operatorId of json.operators as string[]) {
				const operator = context.elements.get(operatorId) as SfmOperator | undefined; // TODO: check if it's actually an operator

				if (operator) {
					this.#operators.add(operator);
				}
			}
		}
	}

	override getProperties(): SerializableProperty[] {
		return [
			{
				name: 'operators',
				i18n: '#operators',
				//type: typeof nodeArray,
				settable: false,
			},
		];
	}

	override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'operators':
				return [...this.#operators];
			default:
				throw new Error("do me " + name);
		}
	}
}

SfmSerializer.registerSerializable(SfmOperatorClip);
