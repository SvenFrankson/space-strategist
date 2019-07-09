/// <reference path="Selectionable.ts"/>

abstract class Draggable extends Selectionable {

    public position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _rotation2D: number = 0;
    public get rotation2D(): number {
        return this._rotation2D;
    }
    public set rotation2D(v: number) {
        if (v !== this.rotation2D && isFinite(v)) {
            this._rotation2D = v;
            this._forward2D.x = - Math.sin(this._rotation2D);
            this._forward2D.y = Math.cos(this._rotation2D);
        }
    }

    private _forward2D: BABYLON.Vector2 = new BABYLON.Vector2(0, 1);
    public get forward2D(): BABYLON.Vector2 {
        return this._forward2D;
    }
}