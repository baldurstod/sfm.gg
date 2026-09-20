import { SfmEntity } from '../model/entity';
import { SfmModel } from '../model/model';
import { SfmNode } from '../model/node';

function isModel(node: SfmNode<SfmEntity>, type: string): boolean {
	const entity = node.getEntity();
	if (!entity || !(entity as SfmModel).isSfmModel) {
		return false;
	}

	return entity.getMetadata('type') === type;
}

export function isCharacter(node: SfmNode<SfmEntity>): boolean {
	return isModel(node, 'character');
}

export function isItem(node: SfmNode<SfmEntity>): boolean {
	return isModel(node, 'item');
}
