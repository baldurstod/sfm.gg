import { Panel } from './panel';
import outlineCSS from '../../css/outline.css';
import { SceneExplorer } from 'harmony-3d';

export class Outline extends Panel {
	protected initPanel(): void {
		super.initPanel({ size: 1, adoptStyle: outlineCSS });
		this.panel!.append(new SceneExplorer().htmlElement);

		;
	}
}
