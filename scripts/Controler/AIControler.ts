/// <reference path="./SpaceshipControler.ts"/>

class AIControler extends SpaceshipControler {

    public get scene(): BABYLON.Scene {
        return this.spaceship.getScene();
    }

    constructor(spaceship: Spaceship) {
        super(spaceship);
        this.scene.onBeforeRenderObservable.add(this.update);
    }

    private _k = 0;
    public update = () => {
        this.spaceship.thrust = 1;
        this.spaceship.roll = Math.cos(this._k * 0.01);
        this.spaceship.pitch = Math.cos(this._k * 0.05);
        this._k += 1;
    }
}