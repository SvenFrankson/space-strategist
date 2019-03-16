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

        new SpaceshipMaterial(Main.Scene);

        let admiralSpaceship = new Spaceship("admiral-ship");
        admiralSpaceship.instantiate();

        new AdmiralCamera(admiralSpaceship);

        for (let i = 0; i < 5; i++) {
            let dummySpaceship = new Spaceship("fighter-1");
            dummySpaceship.position.copyFromFloats(- 10 + Math.random() * 20, 10 + Math.random() * 5, 50 + Math.random() * 20);
            dummySpaceship.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(Math.random(), Math.random(), Math.random()),
                Math.random() * Math.PI * 2
            );
            dummySpaceship.instantiate();
            new AIControler(dummySpaceship);
        }
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
