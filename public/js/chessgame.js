const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();        // it gives an array, containing each row,col and its piece & color.
    boardElement.innerHTML = "";        // incase there is something in board empty it
    // console.log(board);

    board.forEach((row, rowInd) => {
        row.forEach((square, squareInd) => {
            // create square for each piece
            const squareElement = document.createElement('div');
            squareElement.classList.add("square", 
                ((rowInd + squareInd) % 2 === 0 ? 'light': 'dark')          // even places have light color
            );

            squareElement.dataset.row = rowInd;
            squareElement.dataset.col = squareInd;

            // square which is not null
            if(square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);               // get the piece symbol, square has its type property
                pieceElement.draggable = playerRole === square.color;           // make pieces dragabale for player which has turn

                pieceElement.addEventListener("dragstart", (e) => {
                    if(pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowInd, col: squareInd };
                        e.dataTransfer.setData("text/plain", "");       // whenever we are changing something with dragables, so its recommended to do this, set blank data
                    }
                });

                // no one draged now, so set null
                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                // put piece on square block
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();     // means don't drag on already mounted square, prevent its default nature
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if(draggedPiece) {
                    const targetSource = {                                  // get the row and col and dropped place
                        row: parseInt(squareElement.dataset.row),           // it give string when accessing from dataset.
                        col: parseInt(squareElement.dataset.col)
                    }

                    // now move the piece from sourceSquare to targetSource
                    handleMove(sourceSquare, targetSource);
                }
            })

            boardElement.appendChild(squareElement);  
        });
    });

    // now flip the board for the opposite side player
    if(playerRole === 'b') {
        boardElement.classList.add('flipped');
    }
    else {
        // remove role if already give, for whiteRole player
        boardElement.classList.remove('flipped');
    }
}


const handleMove = (source, target) => {
    // in chessboard cols have alphabets from a, b, c, ...h & rows has numbers 1,.., 8,  so we count move as 'rowcol'  exp: 'a4' (see in chessboard image)
    // here row value starts from bottom so, we do 8 - rowCount, & for gettign character we add 97 to its col index
    const move = {              
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',         // by default promote to queen, else give prompt to client
    };

    socket.emit("move", move);
};


// to make the faces of pieces
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    }

    // return the required piece symbol
    return unicodePieces[piece.type] || "";
}

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

// get fen from backent
socket.on("baordState", (fen) => {
    chess.load(fen);
    renderBoard();
})

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
})


renderBoard();