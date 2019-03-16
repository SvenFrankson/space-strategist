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

        Main.Light = new BABYLON.HemisphericLight("AmbientLight", BABYLON.Axis.Y, Main.Scene);

        let admiralSpaceship = new Spaceship("admiral-ship");
        admiralSpaceship.instantiate();

        let admiralCamera = new AdmiralCamera(admiralSpaceship);
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
