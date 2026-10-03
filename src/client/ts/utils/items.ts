import { Item } from '../characters/item';
import { Action } from '../history/action';
import { SfmModel } from '../model/model';
import { SfmNode } from '../model/node';

export function getItemNodes(item: Item): SfmNode<SfmModel>[] {
	const nodes: SfmNode<SfmModel>[] = [];
	const action = new Action();

	const itemGame = item.getGame();
	const itemId = item.getId();
	const itemStyle = item.getStyle();
	const itemSkin = item.getSkin();

	// Create the item main model
	const itemNode = new SfmNode({
		entity: new SfmModel({
			repository: itemGame,
			path: item.getModelPath(),
			skin: itemSkin,
			metadatas: {
				game: itemGame,
				item_id: itemId,
				item_style: itemStyle,
				type: 'item',
				slot: item.getSlot(),
			},
		}),
	});
	nodes.push(itemNode);

	// Attach the model the item main model
	const attachedModel = item.getAttachedModel();
	if (attachedModel) {
		const attachedNode = new SfmNode({
			entity: new SfmModel({
				repository: itemGame,
				path: attachedModel,
				skin: itemSkin,
				metadatas: {
					game: itemGame,
					item_id: itemId,
					item_style: itemStyle,
					type: 'attached_model',
					slot: item.getSlot(),
				},
			}),
		});
		action.do(itemNode, 'add-child', attachedNode);
	}

	// Add extra wearable to the character
	const extraWearable = item.getExtraWearable();
	if (extraWearable) {
		const itemNode = new SfmNode({
			entity: new SfmModel({
				repository: itemGame,
				path: extraWearable,
				skin: itemSkin,
				metadatas: {
					game: itemGame,
					item_id: itemId,
					item_style: itemStyle,
					type: 'item',
					slot: item.getSlot(),
				},
			}),
		});
		nodes.push(itemNode);
	}

	return nodes;
}
