import { Panel } from './panel';
import outlineCSS from '../../css/outline.css';
import { SceneExplorer } from 'harmony-3d';
import { SceneExplorerPanel } from './sceneexplorer';

export class Outline extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: outlineCSS, layout: 'tabs', titleI18n: '#outline', dropTarget: true, });
		this.panel!.append(new SceneExplorerPanel().getPanel());
	}
}
