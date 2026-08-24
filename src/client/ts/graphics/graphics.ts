import { Camera, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, WebGLStats } from 'harmony-3d';
import { SfmCamera } from '../model/camera';

export function initGraphics(): void {
	Graphics.initCanvas({
		useOffscreenCanvas: true,
		autoResize: false,
		webGL: {
			alpha: true,
			preserveDrawingBuffer: true,
			premultipliedAlpha: false,
		}
	});

	const handleTick = (event: Event) => {
		WebGLStats.tick();
		Graphics.renderMultiCanvas((event as CustomEvent<GraphicTickEvent>).detail.delta, /*TODO: add context*/);
	}

	GraphicsEvents.addEventListener(GraphicsEvent.Tick, handleTick);
	Graphics.play();
}

export const workCamera = new SfmCamera({
	name: 'Work camera',
	//camera: new Camera({ name: 'Work camera', position: [0, 0, 0] }),
})
