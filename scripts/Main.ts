/// <reference path="../lib/babylon.d.ts"/>

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
    public static Light: BABYLON.Light;

    public static _cellShadingMaterial: BABYLON.CellMaterial;
	public static get cellShadingMaterial(): BABYLON.CellMaterial {
		if (!Main._cellShadingMaterial) {
			Main._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
			Main._cellShadingMaterial.computeHighLevel = true;
		}
		return Main._cellShadingMaterial;
	}

    constructor(canvasElement: string) {
        Main.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }

    createScene(): void {
        Main.Scene = new BABYLON.Scene(Main.Engine);

        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);

        var camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, BABYLON.Vector3.Zero(), Main.Scene);
        camera.setPosition(new BABYLON.Vector3(0, 5, -10));
        camera.attachControl(Main.Canvas, true);

        new VertexDataLoader(Main.Scene);
        new NavGraphManager();

        let start = new BABYLON.Vector2(0, -10);
        BABYLON.MeshBuilder.CreateSphere("start", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(start.x, 0, start.y);
        let end = new BABYLON.Vector2(0, 10);
        BABYLON.MeshBuilder.CreateSphere("end", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(end.x, 0, end.y);

        let worker = new DroneWorker();
        worker.position2D = start;
        worker.instantiate();

        /*
        let container1 = new Container("c1", new BABYLON.Vector2(1, -5), Math.PI * 0.5);
        container1.instantiate();
        let container2 = new Container("c2", new BABYLON.Vector2(3, 0), Math.PI * 0.5);
        container2.instantiate();
        let container3 = new Container("c3", new BABYLON.Vector2(-2, 0), Math.PI * 0.4);
        container3.instantiate();
        let container4 = new Container("c4", new BABYLON.Vector2(-2, 5), Math.PI * 0.5);
        container4.instantiate();
        */
        let container1 = new Container("c1", new BABYLON.Vector2(-3, -2), 0);
        container1.instantiate();

        let container2 = new Container("c1", new BABYLON.Vector2(-1.5, 1.75), Math.PI * 0.5);
        container2.instantiate();

        let container21 = new Tank("c1", new BABYLON.Vector2(-6.5, 1.75), Math.PI * 0.8);
        container21.instantiate();
        
        let container3 = new Container("c1", new BABYLON.Vector2(1.5, - 1.75), Math.PI * 0.5);
        container3.instantiate();
        
        let container4 = new Container("c1", new BABYLON.Vector2(3, 2), 0);
        container4.instantiate();
        
        let container41 = new Tank("c1", new BABYLON.Vector2(6.5, 2), 0);
        container41.instantiate();
        
        let container5 = new Container("c1", new BABYLON.Vector2(1.5, 5.25), Math.PI * 0.5);
        container5.instantiate();

        let navGraph = NavGraphManager.GetForRadius(0);
        navGraph.update();
        navGraph.computePathFromTo(start, end);
        navGraph.display(Main.Scene);

        worker.currentPath = navGraph.path; 
    }

    public animate(): void {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });

        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let game: Main = new Main("render-canvas");
    game.createScene();
    game.animate();
});
