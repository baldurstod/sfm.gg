import { Serializable } from '../../../serialize/serializable';
import { SfmSerializer } from '../../../serialize/serializer';
import { SfmOperator, SfmOperatorIO } from '../operator';

export class SfmModuloOperator extends Serializable implements SfmOperator {
	modulo: number = 1;

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

	operate(): boolean {
		return true;
	}

	static override getTypeName(): string {
		return 'ModuloOperator';
	}
}

SfmSerializer.registerSerializable(SfmModuloOperator);
