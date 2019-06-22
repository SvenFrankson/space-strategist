/// <reference path="../Main.ts"/>

class Maze extends Main {

	private _worker: DroneWorker;
	private _banner: Banner;
	private _targetPosition: BABYLON.Vector2;

    public async createRandomMazeWall(): Promise<void> {
        let wallNode5: WallNode[] = [];
		for (let i = 0; i < 6; i++) {
			let cosa = Math.cos(i * (2 * Math.PI / 6));
			let sina = Math.sin(i * (2 * Math.PI / 6));
			let wallNode = new WallNode(new BABYLON.Vector2(cosa * 5, sina * 5), Main.WallSystem);
			wallNode5.push(wallNode);
		}
		for (let i = 0; i < wallNode5.length; i++) {
			if (Math.random() > 0.4) {
				let n1 = wallNode5[i];
				let n2 = wallNode5[(i + 1) % wallNode5.length];
				new Wall(n1, n2);
			}
		}
		let wallNode10: WallNode[] = [];
		for (let i = 0; i < 12; i++) {
			let cosa = Math.cos(i * (2 * Math.PI / 12));
			let sina = Math.sin(i * (2 * Math.PI / 12));
			let wallNode = new WallNode(new BABYLON.Vector2(cosa * 10, sina * 10), Main.WallSystem);
			wallNode10.push(wallNode);
		}
		for (let i = 0; i < wallNode5.length; i++) {
			if (Math.random() > 0.6) {
				let n1 = wallNode5[i];
				let n2 = wallNode10[2 * i];
				new Wall(n1, n2);
			}
		}
		for (let i = 0; i < wallNode10.length; i++) {
			if (Math.random() > 0.4) {
				let n1 = wallNode10[i];
				let n2 = wallNode10[(i + 1) % wallNode10.length];
				new Wall(n1, n2);
			}
		}
		let wallNode15: WallNode[] = [];
		for (let i = 0; i < 12; i++) {
			let cosa = Math.cos(i * (2 * Math.PI / 12));
			let sina = Math.sin(i * (2 * Math.PI / 12));
			let wallNode = new WallNode(new BABYLON.Vector2(cosa * 15, sina * 15), Main.WallSystem);
			wallNode15.push(wallNode);
		}
		for (let i = 0; i < wallNode10.length; i++) {
			if (Math.random() > 0.6) {
				let n1 = wallNode10[i];
				let n2 = wallNode15[i];
				new Wall(n1, n2);
			}
		}
		for (let i = 0; i < wallNode15.length; i++) {
			if (Math.random() > 0.4) {
				let n1 = wallNode15[i];
				let n2 = wallNode15[(i + 1) % wallNode15.length];
				new Wall(n1, n2);
			}
		}
		let wallNode20: WallNode[] = [];
		for (let i = 0; i < 24; i++) {
			let cosa = Math.cos(i * (2 * Math.PI / 24));
			let sina = Math.sin(i * (2 * Math.PI / 24));
			let wallNode = new WallNode(new BABYLON.Vector2(cosa * 20, sina * 20), Main.WallSystem);
			wallNode20.push(wallNode);
		}
		for (let i = 0; i < wallNode15.length; i++) {
			if (Math.random() > 0.6) {
				let n1 = wallNode15[i];
				let n2 = wallNode20[2 * i];
				new Wall(n1, n2);
			}
		}
		for (let i = 0; i < wallNode20.length; i++) {
			if (Math.random() > 0.4) {
				let n1 = wallNode20[i];
				let n2 = wallNode20[(i + 1) % wallNode20.length];
				new Wall(n1, n2);
			}
		}
		await Main.WallSystem.instantiate();
		Main.WallSystem.addToScene();
	}

	public async createRandomMazeContainers(): Promise<void> {
		for (let i = 0; i < 25; i++) {
			let p = BABYLON.Vector2.Zero();
			let others = Main.Scene.meshes.filter(m => { return m instanceof Container; });
			let isPosValid = false;
			let attempts = 0;
			while (!isPosValid && attempts < 20) {
				attempts++;
				let a = Math.random() * Math.PI * 2;
				let r = Math.random() * 15 + 5;
				p = new BABYLON.Vector2(Math.cos(a) * r, Math.sin(a) * r);
				isPosValid = true;
				for (let j = 0; j < others.length; j++) {
					let other = others[j] as Prop;
					let distanceSquared = BABYLON.Vector2.DistanceSquared(p, other.position2D);
					if (distanceSquared < 16) {
						isPosValid = false;
						break;
					}
				}
			}
			if (isPosValid) {
				let container = new Container(
					"",
					Main.Player,
					p,
					Math.random() * Math.PI * 2
				);
				container.instantiate();
				container.addToScene();
			}
		}
	}
	
	public async initializeDroneWorker(): Promise<void> {
		this._worker.position2D = new BABYLON.Vector2(0, 0);
		this._worker.currentTask = undefined;
		this._targetPosition = BABYLON.Vector2.Zero();
	}

    public async initialize(): Promise<void> {

		Main.Scene.onBeforeRenderObservable.add(
			() => {
				if (Main.CameraTarget) {
					Main.Camera.target.x = Main.Camera.target.x * 0.9 + Main.CameraTarget.position.x * 0.1;
					Main.Camera.target.y = Main.Camera.target.y * 0.9 + Main.CameraTarget.position.y * 0.1;
					Main.Camera.target.z = Main.Camera.target.z * 0.9 + Main.CameraTarget.position.z * 0.1;
				}
				if (Main.Ground.shape === GroundShape.Disc) {
					let halfSizeSquared = (Main.Ground.size * 0.5 - 5) * (Main.Ground.size * 0.5 - 5);
					if (Main.Camera.target.lengthSquared() > halfSizeSquared) {
						Main.Camera.target.normalize().scaleInPlace(Main.Ground.size* 0.5 - 5);
					}
				}
			}
		)

        return new Promise<void>(
            resolve => {
                let request = new XMLHttpRequest();
                request.open("GET", "datas/scenes/maze.json", true);
        
                request.onload = async () => {
                    if (request.status >= 200 && request.status < 400) {
                        var data = JSON.parse(request.responseText);
                        await Serializer.Deserialize(Main.Scene, data, Main.Player);
                        
                        this._worker = new DroneWorker(Main.Player);
						await this._worker.instantiate();

						Main.CameraTarget = this._worker;
						Main.Camera.radius = 18;
						
						await this.initializeDroneWorker();
						
						Main.Scene.onBeforeRenderObservable.add(() => {
							if (BABYLON.Vector2.DistanceSquared(this._worker.position2D, this._targetPosition) < 1) {
								if (this._targetPosition.lengthSquared() < 0.1) {
									let a = Math.random() * Math.PI * 2;
									this._targetPosition = new BABYLON.Vector2(Math.cos(a) * 22.5, Math.sin(a) * 22.5);
								}
								else {
									this._targetPosition = BABYLON.Vector2.Zero();
								}
								if (this._banner) {
									this._banner.dispose();
								}
								this._banner = new Banner("", this._targetPosition, Math.random() * Math.PI * 2, 1);
								this._banner.instantiate();
								this._banner.elasticBounce(2);
								this._worker.currentTask = new GoToTask(this._worker, this._targetPosition);
							}
						});

						console.log("Maze Initialized");
						new MazeConsole(this).enable();
                        resolve();
                    } 
                };
        
                request.send();
            }
        )
    }
}

window.addEventListener("DOMContentLoaded", async () => {
	if (window.location.href.indexOf("maze-1.html") > -1) {
		let maze: Maze = new Maze("render-canvas");
		await maze.initializeScene();
		await maze.initialize();
		maze.animate();
	}
});