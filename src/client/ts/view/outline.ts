import outlineCSS from '../../css/outline.css';
import { ElementViewerPanel } from './elementviewer';
import { Panel } from './panel';
import { SceneExplorerPanel } from './sceneexplorer';

export class OutlinePanel extends Panel {
	protected initPanel(): void {
		if (this.panel) {
			return;
		}
		super.initPanel({ size: 1, adoptStyle: outlineCSS, layout: 'tabs', titleI18n: '#outline', dropTarget: true, });
		this.panel!.append(new SceneExplorerPanel().getPanel());
		this.panel!.append(new ElementViewerPanel().getPanel());
	}
}
