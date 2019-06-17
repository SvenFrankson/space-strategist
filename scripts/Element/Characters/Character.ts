/// <reference path="../Draggable.ts"/>

class Character extends Draggable {

    public owner: Player;

    public moveSpeed: number = 1;
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