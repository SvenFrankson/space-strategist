/// <reference path="Main.ts"/>

class Editor extends Main {

    public async initialize(): Promise<void> {

        let canvasHasFocus: boolean = false;
		Main.Canvas.addEventListener("pointerleave", () => { canvasHasFocus = false; });
		Main.Canvas.addEventListener("pointerenter", () => { canvasHasFocus = true; });
		Main.Scene.onBeforeRenderObservable.add(
			() => {
				if (Main.CameraTarget) {
					Main.Camera.target.x = Main.Camera.target.x * 0.9 + Main.CameraTarget.position.x * 0.1;
					Main.Camera.target.z = Main.Camera.target.z * 0.9 + Main.CameraTarget.position.z * 0.1;
				}
				Main.Camera.target.y = 0;
				if (!canvasHasFocus) {
					return;
				}
				let pointerTop = Main.Scene.pointerY;
				let pointerLeft = Main.Scene.pointerX;
				let pointerBottom = Main.Canvas.height - Main.Scene.pointerY;
				let pointerRight = Main.Canvas.width - Main.Scene.pointerX;

				if (pointerTop < 50) {
					Main.CameraTarget = undefined;
					let groundForward = Main.Camera.getDirection(BABYLON.Axis.Z);
					groundForward.y = 0;
					groundForward.normalize();
					groundForward.scaleInPlace(Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerTop) / 50);
					Main.Camera.target.addInPlace(groundForward);
				}
				if (pointerBottom < 50) {
					Main.CameraTarget = undefined;
					let groundBackward = Main.Camera.getDirection(BABYLON.Axis.Z);
					groundBackward.y = 0;
					groundBackward.normalize();
					groundBackward.scaleInPlace(- Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerBottom) / 50);
					Main.Camera.target.addInPlace(groundBackward);
				}
				if (pointerLeft < 50) {
					Main.CameraTarget = undefined;
					let groundLeft = Main.Camera.getDirection(BABYLON.Axis.X);
					groundLeft.y = 0;
					groundLeft.normalize();
					groundLeft.scaleInPlace(- Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerLeft) / 50);
					Main.Camera.target.addInPlace(groundLeft);
				}
				if (pointerRight < 50) {
					Main.CameraTarget = undefined;
					let groundRight = Main.Camera.getDirection(BABYLON.Axis.X);
					groundRight.y = 0;
					groundRight.normalize();
					groundRight.scaleInPlace(Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerRight) / 50);
					Main.Camera.target.addInPlace(groundRight);
				}
				if (Main.Ground.shape === GroundShape.Disc) {
					let halfSizeSquared = (Main.Ground.size * 0.5 - 5) * (Main.Ground.size * 0.5 - 5);
					if (Main.Camera.target.lengthSquared() > halfSizeSquared) {
						Main.Camera.target.normalize().scaleInPlace(Main.Ground.size* 0.5 - 5);
					}
				}
			}
		)
		
		let worker = new DroneWorker(Main.Player);
		worker.instantiate();

		new PlayerControl(Main.Scene);

		Cheat.OmniBuilder = true;
        
        console.log("Editor initialized.");
    }
}

window.addEventListener("DOMContentLoaded", async () => {
	if (window.location.href.indexOf("scene-editor.html") > -1) {
		let maze: Editor = new Editor("render-canvas");
		await maze.initializeScene();
		await maze.initialize();
		maze.animate();
	}
});