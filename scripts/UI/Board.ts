class Board {

    private static _Instance: Board;
    public static get Instance(): Board {
        if (!Board._Instance) {
            Board._Instance = new Board();
        }
        return Board._Instance;
    }

    private _leftDiv: HTMLDivElement;
    private _leftPageDiv: HTMLDivElement;
    private _rightPageDiv: HTMLDivElement;
    private _rightDiv: HTMLDivElement;

    constructor() {
        let main = document.createElement("div");
        main.classList.add("board");
        document.body.appendChild(main);

        let innerBoard = document.createElement("div");
        innerBoard.classList.add("board-inner-border");
        main.appendChild(innerBoard);

        this._leftDiv = document.createElement("div");
        this._leftDiv.classList.add("board-left");
        innerBoard.appendChild(this._leftDiv);

        this._leftPageDiv = document.createElement("div");
        this._leftPageDiv.classList.add("board-page-left");
        innerBoard.appendChild(this._leftPageDiv);

        this._rightPageDiv = document.createElement("div");
        this._rightPageDiv.classList.add("board-page-right");
        innerBoard.appendChild(this._rightPageDiv);

        this._rightDiv = document.createElement("div");
        this._rightDiv.classList.add("board-right");
        innerBoard.appendChild(this._rightDiv);
    }

    public clearLeftPage(): void {
        while (this._leftPageDiv.childElementCount > 0) {
            this._leftPageDiv.removeChild(this._leftPageDiv.firstChild);
        }
    }

    public addButtonLeftPage(value: string, onClickCallback: () => void): void {
        let button = document.createElement("button");
        button.classList.add("board-button");
        button.addEventListener(
            "click",
            () => {
                onClickCallback();
            }
        );
        button.textContent = value;
        this._leftPageDiv.appendChild(button);
    }
}