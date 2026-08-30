import { Serializable } from '../../serialize/serializable';
import { SfmSerializer } from '../../serialize/serializer';

export type SfmChannelSource =
	// SfmDataCurve
	'curve'
	;

export type SfmDataType =
	'bool'
	| 'double'
	| 'string'
	| 'vec3'
	| 'vec2'
	| 'vec4'
	| 'quat'
	// Color is normalized rgba
	| 'color'
	;

export interface SfmDataSource {
	readonly channels: number;
	getChannelSource(id: number): SfmChannelSource;
	//getChannelType(id: number): SfmChannelType;
	getDataType(id: number): SfmDataType;
}

/*
export class SfmDataSource extends Serializable {
	readonly isSfmDataSource = true as const;
	readonly channels = 1;

	static override getTypeName(): string {
		return 'DataSource';
	}
}

SfmSerializer.registerSerializable(SfmDataSource);
*/
