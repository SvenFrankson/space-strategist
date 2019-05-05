/// <reference path="Draggable.ts"/>

abstract class Prop extends Draggable {

    public rotation2D: number;

    public obstacle: Obstacle;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name);
        this.position2D = position2D;
        this.rotation2D = rotation2D;
        this.getScene().onBeforeRenderObservable.add(this._updatePosition);
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        this.getScene().onBeforeRenderObservable.removeCallback(this._updatePosition);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    private _updatePosition = () => {
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;
    }

    public addToScene(): void {
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public abstract async instantiate(): Promise<void>;

    public abstract displayName(): string;
}