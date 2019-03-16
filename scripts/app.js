/// <reference path="../lib/babylon.d.ts"/>
class Main {
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }
    createScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", BABYLON.Axis.Y, Main.Scene);
        new SpaceshipMaterial(Main.Scene);
        let admiralSpaceship = new Spaceship("admiral-ship");
        admiralSpaceship.instantiate();
        new AdmiralCamera(admiralSpaceship);
        for (let i = 0; i < 5; i++) {
            let dummySpaceship = new Spaceship("fighter-1");
            dummySpaceship.position.copyFromFloats(-10 + Math.random() * 20, 10 + Math.random() * 5, 50 + Math.random() * 20);
            dummySpaceship.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(Math.random(), Math.random(), Math.random()), Math.random() * Math.PI * 2);
            dummySpaceship.instantiate();
            new AIControler(dummySpaceship);
        }
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
class SpaceshipControler {
    constructor(spaceship) {
        this.spaceship = spaceship;
    }
}
/// <reference path="./SpaceshipControler.ts"/>
class AIControler extends SpaceshipControler {
    constructor(spaceship) {
        super(spaceship);
        this._k = 0;
        this.update = () => {
            this.spaceship.thrust = 1;
            this.spaceship.roll = Math.cos(this._k * 0.01);
            this.spaceship.pitch = Math.cos(this._k * 0.05);
            this._k += 1;
        };
        this.scene.onBeforeRenderObservable.add(this.update);
    }
    get scene() {
        return this.spaceship.getScene();
    }
}
class SpaceshipMaterial {
    constructor(scene) {
        this.scene = scene;
        SpaceshipMaterial.instance = this;
        this.transparentGlass = new BABYLON.StandardMaterial("glassMaterial", this.scene);
        this.transparentGlass.diffuseColor.copyFromFloats(0, 0.2, 0.8);
        this.transparentGlass.alpha = 0.1;
    }
}
class Spaceship extends BABYLON.TransformNode {
    constructor(name) {
        super(name);
        this.speed = 0;
        this.thrust = 0;
        this.roll = 0;
        this.pitch = 0;
        this._deltaPosition = BABYLON.Vector3.Zero();
        this.update = () => {
            let dt = this.getScene().getEngine().getDeltaTime() / 1000;
            this.speed += this.thrust * 10 * dt;
            this.speed *= 0.99;
            this.getDirectionToRef(BABYLON.Axis.Z, this._deltaPosition);
            this._deltaPosition.scaleInPlace(this.speed * dt);
            this.position.addInPlace(this._deltaPosition);
            let roll = BABYLON.Quaternion.RotationAxis(this.getDirection(BABYLON.Axis.Z), this.roll * dt);
            this.rotationQuaternion.multiplyInPlace(roll);
            let pitch = BABYLON.Quaternion.RotationAxis(this.getDirection(BABYLON.Axis.X), this.pitch * dt);
            this.rotationQuaternion.multiplyInPlace(pitch);
        };
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this.update);
    }
    async instantiate() {
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", "./datas/" + this.name + ".babylon", "", this.getScene(), (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.StandardMaterial) {
                        if (mesh.material.name.split(".")[1] === "transparentGlass") {
                            console.log(mesh.material.name);
                            mesh.material = SpaceshipMaterial.instance.transparentGlass;
                        }
                    }
                    mesh.parent = this;
                }
                resolve();
            });
        });
    }
}
