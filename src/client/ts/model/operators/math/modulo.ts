import { errorOnce } from 'harmony-utils';
import { SerializablePropertyType } from '../../../serialize/serializable';
import { SfmSerializer } from '../../../serialize/serializer';
import { SfmOperatorContext } from '../../interfaces/operator';
import { SfmOperatorIO } from '../io';
import { SfmOperator } from '../operator';

export class SfmModuloOperator extends SfmOperator {
	modulo: number = 1;
	value = 50;

	override operate(context: SfmOperatorContext): boolean {
		errorOnce('TODO')
		this.value = 10 + (context.time % 0.1) * 100;
		return true;
	}

	override getInputs(): SfmOperatorIO[] {
		return [{
			name: 'input',
			i18n: '#input',
			type: 'number',

		}];
	}

	override getOutputs(): SfmOperatorIO[] {
		return [{
			name: 'output',
			i18n: '#output',
			type: 'number',

		}];
	}

	//abstract getOutputValue(name: string): SfmOperatorIO[];
	override getOutputValue(name: string): SerializablePropertyType {
		return this.value;
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
