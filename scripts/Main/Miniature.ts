/// <reference path="Main.ts"/>

class Miniature extends Main {

	public target: Draggable;

	public updateCameraPosition(): void {
		Main.Camera.lowerRadiusLimit = 0.01;
		Main.Camera.upperRadiusLimit = 1000;
		Main.Camera.target = new BABYLON.Vector3(0, this.target.height / 2, 0);
		let cameraPosition = new BABYLON.Vector3(- 1, 0.5, 1);
		cameraPosition.scaleInPlace(Math.max(this.target.height * 1.5, this.target.groundWidth) * 2);
		cameraPosition.y += this.target.height / 2;
		Main.Camera.setPosition(cameraPosition);
	}

    public async initialize(): Promise<void> {

        Main.Ground = new Ground(100, "datas/heightmaps/flat-ground.png", GroundShape.Disc);
        await Main.Ground.instantiate();
		Main.Ground.material = Main.groundMaterial;

		Main.Scene.clearColor.copyFromFloats(0, 1, 0, 1);
		Main.Ground.setVisibility(0);
		Main.Skybox.isVisible = false;

		this.createProp("Tank");
		setTimeout(
			() => { this.createProp("Container"); },
			2000
		);
		setTimeout(
			() => { this.createProp("LandingPad"); },
			4000
		);
		setTimeout(
			() => { this.createProp("Dock"); },
			6000
		);
		setTimeout(
			() => { this.createProp("Turret"); },
			8000
		);
        
        console.log("Miniature initialized.");
	}

	public async createWorker(): Promise<void> {
		if (this.target) {
			this.target.dispose();
		}
		this.target.dispose();
		let worker = new DroneWorker(Main.Player);
		await worker.instantiate(
			"#ffffff",
			"#404040",
			"#00ffff",
			"#ff00ff",
			"#ffff00"
		);
		this.target = worker;
		this.updateCameraPosition();
	}

	public async createProp(elementName: string): Promise<void> {
		if (this.target) {
			this.target.dispose();
		}
		let data: PropData = new PropData();
		data.elementName = elementName;
		let prop = Prop.Deserialize(data);
		await prop.instantiate(
			"#ffffff",
			"#404040",
			"#00ffff",
			"#ff00ff",
			"#ffff00"
		);
		this.target = prop;
		this.updateCameraPosition();
	}
}

window.addEventListener("DOMContentLoaded", async () => {
	if (window.location.href.indexOf("miniature.html") > -1) {
		let miniature: Miniature = new Miniature("render-canvas");
		await miniature.initializeScene();
		await miniature.initialize();
		miniature.animate();
	}
});