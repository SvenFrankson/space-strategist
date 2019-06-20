/// <reference path="../Main.ts"/>

class Maze extends Main {

    public async createRandomMaze(): Promise<void> {
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

    public async initialize(): Promise<void> {
        return new Promise<void>(
            resolve => {
                let request = new XMLHttpRequest();
                request.open("GET", "datas/scenes/maze.json", true);
        
                request.onload = async () => {
                    if (request.status >= 200 && request.status < 400) {
                        var data = JSON.parse(request.responseText);
                        await Serializer.Deserialize(Main.Scene, data, Main.Player);
                
                        let playerControl = new PlayerControl(Main.Scene);
                        playerControl.enable();
                        
                        let worker = new DroneWorker(Main.Player);
                        worker.position2D = new BABYLON.Vector2(0, 0);
                        await worker.instantiate();

                        let targetPosition = BABYLON.Vector2.Zero();
                        Main.Scene.onBeforeRenderObservable.add(() => {
                            if (BABYLON.Vector2.DistanceSquared(worker.position2D, targetPosition) < 0.1) {
                                if (targetPosition.lengthSquared() < 0.1) {
                                    let a = Math.random() * Math.PI * 2;
                                    targetPosition = new BABYLON.Vector2(Math.cos(a) * 22.5, Math.sin(a) * 22.5);
                                }
                                else {
                                    targetPosition = BABYLON.Vector2.Zero();
                                }
                                worker.currentTask = new GoToTask(worker, targetPosition);
                            }
                        });

                        resolve();
                    } 
                };
        
                request.send();
            }
        )
    }
}

window.addEventListener("DOMContentLoaded", () => {
	if (window.location.href.indexOf("maze-1.html") > -1) {
		let maze: Maze = new Maze("render-canvas");
		maze.initializeScene();
		maze.initialize();
		maze.animate();
	}
});