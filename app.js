const API_URL = "YOUR AWS API URL "; 

let myEmail = "";
let currentGame = null;
let pollInterval = null;

// 1. Login
async function login() {
    myEmail = document.getElementById("email").value.trim().toLowerCase();
    const username = document.getElementById("username").value.trim();

    if (!myEmail || !username) return alert("Fill in both fields!");

    await fetch(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ email: myEmail, username: username })
    });

    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";
    document.getElementById("welcome-text").innerText = `Welcome, ${username}!`;

    pollInterval = setInterval(fetchGameState, 3000);
}

// 2. Create Game
async function createGame() {
    const res = await fetch(`${API_URL}/create`, {
        method: 'POST',
        body: JSON.stringify({ email: myEmail })
    });
    const data = await res.json();
    document.getElementById("room-code-display").innerText = `Share this code with your friend: ${data.code}`;
}

// 3. Join Game
async function joinGame() {
    const code = document.getElementById("join-code").value.trim();
    if (!code) return alert("Enter a 4-digit code!");

    const res = await fetch(`${API_URL}/join`, {
        method: 'POST',
        body: JSON.stringify({ email: myEmail, code: code })
    });
    const data = await res.json();
    
    if (res.status !== 200) {
        alert(data.message);
    }
}

// 4. Clear/Forfeit Stuck Games
async function clearGame() {
    await fetch(`${API_URL}/clear`, {
        method: 'POST',
        body: JSON.stringify({ email: myEmail })
    });
    
    alert("All active games cleared!");
    document.getElementById("room-code-display").innerText = "";
    document.getElementById("game-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";
    currentGame = null;
}

// 5. Fetch Game State (Polling)
async function fetchGameState() {
    if (!myEmail) return;

    const res = await fetch(`${API_URL}/game?email=${myEmail}`);
    const game = await res.json();

    if (game.status === 'playing') {
        currentGame = game;
        document.getElementById("dashboard-section").style.display = "none";
        document.getElementById("game-section").style.display = "block";
        renderBoard();
    } else if (game.status === 'waiting_for_player') {
        // If they navigate away, remind them of their code
        document.getElementById("room-code-display").innerText = `Waiting for opponent... Code: ${game.gameId}`;
    } else if (game.status === 'finished') {
        alert(game.winner === 'draw' ? "It's a draw!" : `${game.winner} won!`);
        clearGame(); // Auto-clear the game when finished
    }
}

// 6. Render Board and Make Move
function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    
    const isMyTurn = currentGame.turn === myEmail;
    document.getElementById("turn-indicator").innerText = isMyTurn ? "Your Turn!" : "Waiting for opponent...";

    currentGame.board.forEach((symbol, index) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerText = symbol;
        cell.onclick = () => makeMove(index);
        boardDiv.appendChild(cell);
    });
}

async function makeMove(position) {
    if (currentGame.turn !== myEmail || currentGame.board[position] !== "") return;

    currentGame.board[position] = currentGame.playerX === myEmail ? 'X' : 'O';
    currentGame.turn = "waiting"; 
    renderBoard();

    await fetch(`${API_URL}/move`, {
        method: 'POST',
        body: JSON.stringify({
            gameId: currentGame.gameId,
            email: myEmail,
            position: position
        })
    });
    
    fetchGameState();
}
