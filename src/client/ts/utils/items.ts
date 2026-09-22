import { Action } from '../history/action';
import { Item } from '../misc/character';
import { SfmModel } from '../model/model';
import { SfmNode } from '../model/node';

export function getItemNodes(item: Item): SfmNode<SfmModel>[] {
	const nodes: SfmNode<SfmModel>[] = [];
	const action = new Action();

	// Create the item main model
	const itemNode = new SfmNode({
		entity: new SfmModel({
			repository: item.game,
			path: item.modelPath,
			skin: item.skin,
			metadatas: {
				game: item.game,
				item_id: item.id,
				item_style: item.style,
				type: 'item',
				slot: item.slot,
			},
		}),
	});
	nodes.push(itemNode);

	// Attach the model the item main model
	if (item.attachedModel) {
		const attachedNode = new SfmNode({
			entity: new SfmModel({
				repository: item.game,
				path: item.attachedModel,
				skin: item.skin,
				metadatas: {
					game: item.game,
					item_id: item.id,
					item_style: item.style,
					type: 'attached_model',
					slot: item.slot,
				},
			}),
		});
		action.do(itemNode, 'add-child', attachedNode);
	}

	// Add extra wearable to the character
	if (item.extraWearable) {
		const itemNode = new SfmNode({
			entity: new SfmModel({
				repository: item.game,
				path: item.extraWearable,
				skin: item.skin,
				metadatas: {
					game: item.game,
					item_id: item.id,
					item_style: item.style,
					type: 'item',
					slot: item.slot,
				},
			}),
		});
		nodes.push(itemNode);
	}

	return nodes;
}
