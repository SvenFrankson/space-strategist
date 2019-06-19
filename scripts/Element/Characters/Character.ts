/// <reference path="../Draggable.ts"/>

class Character extends Draggable {

    public owner: Player;

    private _moveSpeed: number = 2;
    public get moveSpeed(): number {
        return Cheat.MasterWalker?this._moveSpeed*10:this._moveSpeed;
    }
    public set moveSpeed(v: number) {
        this._moveSpeed = v;
    }
    public stamina: number = 20;
    public currentHitPoint: number = 20;
    public alive: boolean = true;

    constructor(name: string = "", owner?: Player) {
        super(name);
        this.owner = owner;
    }

    public wound(amount: number = 1): void {
        if (this.alive) {
            this.currentHitPoint -= amount;
            if (this.currentHitPoint <= 0) {
                this.currentHitPoint = 0;
                this.kill();
            }
        }
    }

    public kill(): void {
        this.alive = false;
    }
}