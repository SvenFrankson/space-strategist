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
    private _leftPageUp: HTMLButtonElement;
    private _leftPageDown: HTMLButtonElement;
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

        let leftPageScroll = document.createElement("div");
        leftPageScroll.classList.add("board-page-left-scroll");
        innerBoard.appendChild(leftPageScroll);

        this._leftPageUp = document.createElement("button");
        this._leftPageUp.classList.add("board-button-vertical");
        leftPageScroll.appendChild(this._leftPageUp);
        this._leftPageUp.addEventListener(
            "click",
            () => {
                this._leftPageButtonsOffset--;
                this.updateLeftPageLayout();
            }
        )

        this._leftPageDown = document.createElement("button");
        this._leftPageDown.classList.add("board-button-vertical");
        leftPageScroll.appendChild(this._leftPageDown);
        this._leftPageDown.addEventListener(
            "click",
            () => {
                this._leftPageButtonsOffset++;
                this.updateLeftPageLayout();
            }
        )

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
        this._leftPageButtons = [];
        this._leftPageButtonsOffset = 0;
    }

    private _leftPageButtonsOffset: number = 0;
    private _leftPageButtons: HTMLButtonElement[] = [];

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
        button.style.display = "none";
        this._leftPageDiv.appendChild(button);
        this._leftPageButtons.push(button);
    }

    public updateLeftPageLayout(): void {
        let count = Math.floor(this._leftPageDiv.getBoundingClientRect().width / 110);
        console.log("Count = " + count);
        if (this._leftPageButtonsOffset < 0) {
            this._leftPageButtonsOffset = 0;
        }
        if (this._leftPageButtonsOffset > Math.floor(this._leftPageButtons.length / count) - 1) {
            this._leftPageButtonsOffset = Math.floor(this._leftPageButtons.length / count) - 1;
        }
        for (let i = 0; i < this._leftPageButtonsOffset * count; i++) {
            let button = this._leftPageButtons[i];
            if (button) {
                button.style.display = "none";
            }
        }
        for (let i = this._leftPageButtonsOffset * count; i < (this._leftPageButtonsOffset + 2) * count; i++) {
            let button = this._leftPageButtons[i];
            if (button) {
                button.style.display = "inline-block";
            }
        }
        for (let i = (this._leftPageButtonsOffset + 2) * count; i < this._leftPageButtons.length; i++) {
            let button = this._leftPageButtons[i];
            if (button) {
                button.style.display = "none";
            }
        }
    }
}