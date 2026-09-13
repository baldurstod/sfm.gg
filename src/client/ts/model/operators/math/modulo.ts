import { errorOnce } from 'harmony-utils';
import { SerializablePropertyType } from '../../../serialize/serializable';
import { SfmSerializer } from '../../../serialize/serializer';
import { SfmOperator, SfmOperatorContext, SfmOperatorIO } from '../operator';

export class SfmModuloOperator extends SfmOperator {
	modulo: number = 1;



	override operate(context: SfmOperatorContext): boolean {
		errorOnce('TODO')
		return true;
	}

	getInputs(): SfmOperatorIO[] {
		return [{
			name: 'input',
			i18n: '#input',
			type: 'number',

		}];
	}

	getOutputs(): SfmOperatorIO[] {
		return [{
			name: 'output',
			i18n: '#output',
			type: 'number',

		}];
	}

	getOutputValue(context: SfmOperatorContext, name: string, outputId = 0): SerializablePropertyType {
		return context.time;
	}

	/*
	operate(): boolean {
		return true;
	}
	*/

	override getProperty(name: string): SerializablePropertyType {
		//override getProperty(name: string): SerializablePropertyType {
		switch (name) {
			case 'output':
				//return this.#camera.verticalFov;
				throw new Error("TODO");
				break;
			default:
				return super.getProperty(name);
		}
	}

	static override getTypeName(): string {
		return 'ModuloOperator';
	}

	override getDefaultName(): string {
		return 'Modulo operator';
	}
}

SfmSerializer.registerSerializable(SfmModuloOperator);
