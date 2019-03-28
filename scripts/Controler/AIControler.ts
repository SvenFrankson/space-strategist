/// <reference path="./SpaceshipControler.ts"/>

class AIControler extends SpaceshipControler {

    public get scene(): BABYLON.Scene {
        return this.spaceship.getScene();
    }

    private dirToTarget: BABYLON.Vector3 = BABYLON.Vector3.One();
    private localX: BABYLON.Vector3 = BABYLON.Vector3.Right();
    private localY: BABYLON.Vector3 = BABYLON.Vector3.Up();
    private localZ: BABYLON.Vector3 = BABYLON.Vector3.Forward();

    constructor(spaceship: Spaceship) {
        super(spaceship);
        this.scene.onBeforeRenderObservable.add(this.update);
    }

    private _k = 0;
    public update = () => {
        this.rotateToward(new BABYLON.Vector3(50, 60, 100));
    }

    private rotateToward(target: BABYLON.Vector3): void {
        this.dirToTarget.copyFrom(target);
        this.dirToTarget.subtractInPlace(this.spaceship.position);
        this.spaceship.getDirectionToRef(BABYLON.Axis.X, this.localX);
        this.spaceship.getDirectionToRef(BABYLON.Axis.Z, this.localZ);

        let pitchAngle = SpaceMath.AngleFromToAround(this.localZ, this.dirToTarget, this.localX);
        this.spaceship.pitch =  pitchAngle / Math.PI * 0.25 + this.spaceship.pitch * 0.75;

        let rollAngle = SpaceMath.AngleFromToAround(this.localZ, this.dirToTarget, this.localY);
        this.spaceship.roll = rollAngle / Math.PI * 0.25 + this.spaceship.roll * 0.75;
    }
}