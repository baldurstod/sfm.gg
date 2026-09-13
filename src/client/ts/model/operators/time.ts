import { SerializableProperty, SerializablePropertyValue } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';
import { SfmOperatorContext } from '../interfaces/operator';
import { SfmOperatorIO } from './io';
import { SfmOperator } from './operator';

export class SfmTimeOperator extends SfmOperator {
	#time = 50;

	override operate(context: SfmOperatorContext): boolean {
		this.#time = context.time;
		return true;
	}

	override getInputs(): SfmOperatorIO[] {
		return [];
	}

	override getOutputs(): SfmOperatorIO[] {
		return [{
			name: 'time',
			i18n: '#time',
			type: 'number',
		}];
	}

	override getOutputValue(name: string): SerializablePropertyValue {
		return this.#time;
	}

	override getProperties(): SerializableProperty[] {
		return [];
	}

	static override getTypeName(): string {
		return 'TimeOperator';
	}

	override getDefaultName(): string {
		return 'Time operator';
	}
}

SfmSerializer.registerSerializable(SfmTimeOperator);
