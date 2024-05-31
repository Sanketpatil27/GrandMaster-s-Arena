const express = require('express');
const http = require('http');
const socket = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';        // first player who join will be white


// socket.io 
io.on('connection', (socket) => {
    console.log('connected');

    // whenever new player connected, assign role based on there entering number, if first assign 'white' if 2nd assign 'black' else assign 'spectator'
    if(!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    }
    else if(!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    }
    else {
        socket.emit("spectatorRole");
    }

    // remove assigned role when either black or while leaves not on spectator leaves
    // instead of this we should close the game coz single player cannot play game
    socket.on("disconnect", () => {
        if(socket.id === players.white) 
            delete players.white;
        else if(socket.id === players.black) 
            delete players.black
    });

    // if its valid player playing & move is valid then we send move event from frontEnd
    socket.on("move", (move) => {
        try{
            // first validate if its current player turn
            if(chess.turn() === 'w' && socket.id !== players.white)  return;
            if(chess.turn() === 'b' && socket.id !== players.black)  return;
            
            // validate move (like knight can't move 1 step)
            const result = chess.move(move);
            if(result) {
                currentPlayer = chess.turn();
                io.emit("move", move);                  // send move to frontEnd
                io.emit("boardState", chess.fen());     // send the current board fen state to frontEnd
            }
            else {
                console.log("Invalid Move: ", move);
                socket.emit("invalidMove: ", move);
            }
        }
        catch(err) {
            console.log(err);
            socket.emit("Invalid Move: ", move);
        }
    })
})


// ejs setting:
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
})


server.listen(3000, () => {
    console.log("Grandmaster's Arena is running on PORT 3000");
})