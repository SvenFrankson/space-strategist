/// <reference path="../lib/babylon.d.ts"/>

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
    public static Light: BABYLON.Light;

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

        let start = new BABYLON.Vector2(-5, -5);
        BABYLON.MeshBuilder.CreateSphere("start", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(-5, 0, -5);
        let end = new BABYLON.Vector2(5, 5);
        BABYLON.MeshBuilder.CreateSphere("end", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(5, 0, 5);

        let navGraph = new NavGraph();
        navGraph.setStart(start);
        navGraph.setEnd(end);
        navGraph.obstacles = [];
        for (let i = 0; i < 10; i++) {
            let o = Obstacle.CreateHexagon(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 2.5 + 0.5);
            o.display(Main.Scene);
            navGraph.obstacles.push(o);
        }
        navGraph.update();
        navGraph.display(Main.Scene);
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
