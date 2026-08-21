import { SceneExplorer } from 'harmony-3d';
import { Panel } from './panel';

export class SceneExplorerPanel extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 1, layout: 'column', titleI18n: '#scene_explorer', });
		this.panel!.append(new SceneExplorer().htmlElement);
	}
}
