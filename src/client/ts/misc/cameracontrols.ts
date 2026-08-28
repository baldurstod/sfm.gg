import { Camera, FirstPersonControl } from 'harmony-3d';

const controls = new Map<Camera, FirstPersonControl>();

export function getFirstPersonControl(camera: Camera): FirstPersonControl {
	let control = controls.get(camera);
	if (!control) {
		control = new FirstPersonControl(camera);
		controls.set(camera, control);

		control.movementSpeed = 100;
		control.lookSpeed = 0.1;
	}
	return control;
}
