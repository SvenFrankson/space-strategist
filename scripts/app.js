class Main {
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }
    createScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", BABYLON.Axis.Y, Main.Scene);
        let admiralSpaceship = new Spaceship("admiral-ship");
        admiralSpaceship.instantiate();
        let admiralCamera = new AdmiralCamera(admiralSpaceship);
    }
    animate() {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });
        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}
window.addEventListener("DOMContentLoaded", () => {
    let game = new Main("render-canvas");
    game.createScene();
    game.animate();
});
class AdmiralCamera extends BABYLON.FreeCamera {
    constructor(spaceship) {
        super("AdmiralCamera", new BABYLON.Vector3(0, 7.4, -12), spaceship.getScene());
        this.parent = spaceship;
        this.attachControl(Main.Canvas);
    }
}
class Spaceship extends BABYLON.TransformNode {
    constructor(name) {
        super(name);
    }
    async instantiate() {
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", "./datas/" + this.name + ".babylon", "", this.getScene(), (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    mesh.parent = this;
                }
                resolve();
            });
        });
    }
}
