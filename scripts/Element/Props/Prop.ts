/// <reference path="../Draggable.ts"/>

class PropData {
    public elementName: string;
    public name: string;
    public position2D: IVector2;
    public rotation2D: number;
}

abstract class Prop extends Draggable {

    public isActive = false;
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
        if (this.position.x !== this.position2D.x || this.position.z !== this.position2D.y || this.rotation.y !== - this.rotation2D) {
            this.position.x = this.position2D.x;
            this.position.z = this.position2D.y;
            this.rotation.y = - this.rotation2D;
            this.onPositionChanged();
        }
    }

    protected onPositionChanged(): void {}

    public addToScene(): void {
        this.isActive = true;
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public serialize(): PropData {
        let data = new PropData();

        data.elementName = this.elementName();
        data.name = this.name;
        data.position2D = this.position2D;
        data.rotation2D = this.rotation2D;

        return data;
    }

    public static Deserialize(data: PropData, owner: Player): Prop {
        if(data.elementName === "Container") {
            return new Container(data.name, owner, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if(data.elementName === "Tank") {
            return new Tank(data.name, owner, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if(data.elementName === "Cristal") {
            return new Cristal(data.name, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if(data.elementName === "Turret") {
            return new Turret(data.name, owner, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        return undefined;
    }

    public abstract async instantiate(): Promise<void>;

    public setVisibility(v: number): void {
        let children = this.getChildMeshes();
        if (v === 0) {
            this.isVisible = false;
            for (let i = 0; i < children.length; i++) {
                children[i].isVisible = false;
            }
        }
        else {
            this.isVisible = true;
            this.visibility = v;
            for (let i = 0; i < children.length; i++) {
                children[i].isVisible = true;
                children[i].visibility = v;
            }
        }
    }

    public elementName(): string {
        return "Prop";
    }
}