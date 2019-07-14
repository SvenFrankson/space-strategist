/// <reference path="Main.ts"/>

class Miniature extends Main {

	public target: Draggable;

	public updateCameraPosition(): void {
		Main.Camera.lowerRadiusLimit = 0.01;
		Main.Camera.upperRadiusLimit = 1000;
		Main.Camera.target = new BABYLON.Vector3(0, this.target.height / 2, 0);
		let cameraPosition = new BABYLON.Vector3(- 1, 0.5, 1);
		cameraPosition.scaleInPlace(Math.max(this.target.height, this.target.groundWidth) * 1.5);
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

		this.runAllScreenShots();
        
        console.log("Miniature initialized.");
	}

	public async runAllScreenShots(): Promise<void> {
		await this.createWorker();
		await this.createProp("Tank");
		await this.createProp("Container");
		await this.createProp("LandingPad");
		await this.createProp("Dock");
		await this.createProp("Turret");
	}

	public async createWorker(): Promise<void> {
		if (this.target) {
			this.target.dispose();
		}
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
		await this.makeScreenShot();
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
		await this.makeScreenShot();
	}

	public async makeScreenShot(): Promise<void> {
		return new Promise<void>(
			resolve => {
				requestAnimationFrame(
					() => {
						BABYLON.ScreenshotTools.CreateScreenshot(
							Main.Engine,
							Main.Camera,
							{
								width: 256 * Main.Canvas.width / Main.Canvas.height,
								height: 256
							},
							(data) => {
								let img = document.createElement("img");
								img.src = data;
								img.onload = () => {
									let sx = (img.width - 256) * 0.5;
									let sy = (img.height - 256) * 0.5;
									let canvas = document.createElement("canvas");
									canvas.width = 256;
									canvas.height = 256;
									let context = canvas.getContext("2d");
									context.drawImage(img, sx, sy, 256, 256, 0, 0, 256, 256);

									let data = context.getImageData(0, 0, 256, 256);
									for (let i = 0; i < data.data.length / 4; i++) {
										let r = data.data[4 * i];
										let g = data.data[4 * i + 1];
										let b = data.data[4 * i + 2];
										if (r === 0 && g === 255 && b === 0) {
											data.data[4 * i] = 0;
											data.data[4 * i + 1] = 0;
											data.data[4 * i + 2] = 0;
											data.data[4 * i + 3] = 0;
										}
										else {
											let desat = (r + g + b) / 3;
											desat = Math.floor(Math.sqrt(desat / 255) * 255);
											data.data[4 * i] = desat;
											data.data[4 * i + 1] = desat;
											data.data[4 * i + 2] = desat;
											data.data[4 * i + 3] = 255;
										}
									}
									for (let i = 0; i < data.data.length / 4; i++) {
										let a = data.data[4 * i + 3];
										if (a === 0) {
											let hasColoredNeighbour = false;
											for (let ii = -2; ii <= 2; ii++) {
												for (let jj = -2; jj <= 2; jj++) {
													if (ii !== 0 || jj !== 0) {
														let index = 4 * i + 3;
														index += ii * 4;
														index += jj * 4 * 256;
														if (index >= 0 && index < data.data.length) {
															let aNeighbour = data.data[index];
															if (aNeighbour === 255) {
																hasColoredNeighbour = true;
															}
														}
													}
												}
											}
											if (hasColoredNeighbour) {
												data.data[4 * i] = 255;
												data.data[4 * i + 1] = 255;
												data.data[4 * i + 2] = 255;
												data.data[4 * i + 3] = 254;
											}
										}
									}
									context.putImageData(data, 0, 0);

									var tmpLink = document.createElement( 'a' );
									let name = "Worker";
									if (this.target instanceof Prop) {
										name = this.target.elementName();
									}
									tmpLink.download = name + "-miniature.png";
									tmpLink.href = canvas.toDataURL();  
									
									document.body.appendChild( tmpLink );
									tmpLink.click(); 
									document.body.removeChild( tmpLink );
									resolve();
								}
							}
						);
					}
				)
			}
		)
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