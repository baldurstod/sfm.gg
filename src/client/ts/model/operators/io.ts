import { quat, vec3 } from 'gl-matrix';
import { SerializablePropertyValue } from '../../serialize/serializable';

export type SfmOperatorType = 'null' | 'undefined' | 'number' | 'vec3' | 'quat';
//export type SfmOperatorValue = null | undefined | number | vec3 | quat;

export type SfmOperatorIO = {
	name: string;
	i18n: string;
	type: SfmOperatorType;
	///** How many of that input is allowed ? Default to 1 */
	//limit?: number;
	/** Sub input/output. For instance a vec3 will have x, y, z as sub io */
	subIos?: SfmOperatorIO[];
}
/*
export type SfmOperatorInput = {
	name: string;
	///** Input id, if several of the same name exist. Default to 0 * /
	//id?: number;
};
*/

export type SfmOperatorOutput = {
	element: HasOutputs;
	name: string;
	///** Output id, if several of the same name exist. Default to 0 */
	//id?: number;
};

export interface HasInputs {
	//inputs: Map2<string, number, SfmOperatorOutput>;
	setPredecessor(input: string, predecessor: SfmOperatorOutput | null): void;
	getInputs(): SfmOperatorIO[];
}

export interface HasOutputs {
	getOutputs(): SfmOperatorIO[];
	//getOutput(name: string): SfmOperatorIO | null;
	getOutputValue(name: string): SerializablePropertyValue;
}
