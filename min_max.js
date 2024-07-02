
var versionCode = "Alpha 0.9";
var WIDTH = 800;
var HEIGHT = 850;

var COLORS = {white: "rgb(254, 250, 236)", black: "rgb(7, 5, 14)", blue: "rgb(36, 32, 95)", red: "rgb(129, 43, 56)"};

var boards = [

    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]

];
var mainBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var mousePosX = 0;
var mousePosY = 0;
var clicked = false;
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var currentTurn = 1;
var player = 1;
var ai = -1;
var currentBoard = 4;
var gameRunning = false;
var RUNS = 0;
var MOVES = 0;
var switchAroo = 1;
var AIACTIVE = true;
var playerNames = ["PLAYER", "AI"];



// Define fuzzy sets
var fuzzySets = {
    evaluation: {
        negative: { a: -10000, b: -5000, c: -2000, d: 0 },
        neutral: { a: -1000, b: 0, c: 1000, d: 2000 },
        positive: { a: 0, b: 2000, c: 5000, d: 10000 }
    },
    depth: {
        shallow: { a: 0, b: 1, c: 2, d: 3 },
        moderate: { a: 2, b: 3, c: 4, d: 5 },
        deep: { a: 4, b: 5, c: 6, d: 7 }
    }
};

// Fuzzification
function fuzzify(value, set) {
    var membership = {};
    for (var key in set) {
        var a = set[key].a, b = set[key].b, c = set[key].c, d = set[key].d;
        if (value <= a || value >= d) {
            membership[key] = 0;
        } else if (value > a && value <= b) {
            membership[key] = (value - a) / (b - a);
        } else if (value > b && value <= c) {
            membership[key] = 1;
        } else if (value > c && value < d) {
            membership[key] = (d - value) / (d - c);
        }
    }
    return membership;
}

// Fuzzy Inference
function fuzzyInference(evaluation, depthSet) {
    var depthFuzzy = fuzzify(evaluation, fuzzySets.evaluation);
    var depth = 0;
    var totalWeight = 0;
    for (var key in depthFuzzy) {
        if (key === 'negative') {
            depth += depthFuzzy[key] * depthSet.shallow.b;
        } else if (key === 'neutral') {
            depth += depthFuzzy[key] * depthSet.moderate.b;
        } else if (key === 'positive') {
            depth += depthFuzzy[key] * depthSet.deep.b;
        }
        totalWeight += depthFuzzy[key];
    }
    return depth / totalWeight;
}

// Defuzzification
function defuzzify(value, set) {
    var crispValue = 0;
    var maxMembership = 0;
    for (var key in set) {
        var membership = fuzzify(value, set)[key];
        if (membership > maxMembership) {
            maxMembership = membership;
            crispValue = (set[key].b + set[key].c) / 2;
        }
    }
    return crispValue;
}

// Wrapper for miniMax function
function fuzzyMiniMax(position, boardToPlayOn, depth, alpha, beta, maximizingPlayer) {
    var evaluation = evaluateGame(position, boardToPlayOn);
    var fuzzyDepth = Math.round(fuzzyInference(evaluation, fuzzySets.depth));
    return miniMax(position, boardToPlayOn, fuzzyDepth, alpha, beta, maximizingPlayer);
}

// Wrapper for AI move decision
function fuzzyAIMove() {
    if (currentTurn === -1 && gameRunning && AIACTIVE) {
        bestMove = -1;
        bestScore = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
        RUNS = 0; 
        var count = 0;
        for (var bt = 0; bt < boards.length; bt++) {
            if (checkWinCondition(boards[bt]) === 0) {
                boards[bt].forEach((v) => (v === 0 && count++));
            }
        }
        if (currentBoard === -1 || checkWinCondition(boards[currentBoard]) !== 0) {
            var savedMm;
            console.log("Remaining: " + count);
            savedMm = fuzzyMiniMax(boards, -1, Math.min(4, count), -Infinity, Infinity, true);
            console.log(savedMm.tP);
            currentBoard = savedMm.tP;
        }
        for (var i = 0; i < 9; i++) {
            if (boards[currentBoard][i] === 0) {
                bestMove = i;
                break;
            }
        }
        if (bestMove !== -1) {
            for (var a = 0; a < 9; a++) {
                if (boards[currentBoard][a] === 0) {
                    var score = evaluatePos(boards[currentBoard], a, currentTurn) * 45;
                    bestScore[a] = score;
                }
            }
            for (var b = 0; b < 9; b++) {
                if (checkWinCondition(boards[currentBoard]) === 0) {
                    if (boards[currentBoard][b] === 0) {
                        boards[currentBoard][b] = ai;
                        var savedMm = fuzzyMiniMax(boards, b, Math.min(5, count), -Infinity, Infinity, false);
                        console.log(savedMm);
                        var score2 = savedMm.mE;
                        boards[currentBoard][b] = 0;
                        bestScore[b] += score2;
                    }
                }
            }
            console.log(bestScore);
            for (var i in bestScore) {
                if (bestScore[i] > bestScore[bestMove]) {
                    bestMove = i;
                }
            }
            if (boards[currentBoard][bestMove] === 0) {
                boards[currentBoard][bestMove] = ai;
                currentBoard = bestMove;
            }
            console.log(evaluateGame(boards, currentBoard));
        }
        currentTurn = -currentTurn;
    }
}





function checkWinCondition(map) {//check winng condition for both player and ai,if player wins return a,if ai wins return -1 else return 0
    var a = 1;
    if (map[0] + map[1] + map[2] === a * 3 || map[3] + map[4] + map[5] === a * 3 || map[6] + map[7] + map[8] === a * 3 || map[0] + map[3] + map[6] === a * 3 || map[1] + map[4] + map[7] === a * 3 ||
        map[2] + map[5] + map[8] === a * 3 || map[0] + map[4] + map[8] === a * 3 || map[2] + map[4] + map[6] === a * 3) {
        return a;
    }
    a = -1;
    if (map[0] + map[1] + map[2] === a * 3 || map[3] + map[4] + map[5] === a * 3 || map[6] + map[7] + map[8] === a * 3 || map[0] + map[3] + map[6] === a * 3 || map[1] + map[4] + map[7] === a * 3 ||
        map[2] + map[5] + map[8] === a * 3 || map[0] + map[4] + map[8] === a * 3 || map[2] + map[4] + map[6] === a * 3) {
        return a;
    }
    return 0;
}

function evaluateGame(position, currentBoard) {//evaluate and strategize in a complex tic-tac-toe game scenario with multiple boards to check the advantageous and disadvantageous state of the ai
    var evale = 0;
    var mainBd = [];
    var evaluatorMul = [1.4, 1, 1.4, 1, 1.75, 1, 1.4, 1, 1.4];
    for (var eh = 0; eh < 9; eh++){
        evale += realEvaluateSquare(position[eh])*1.5*evaluatorMul[eh];
        if(eh === currentBoard){
            evale += realEvaluateSquare(position[eh])*evaluatorMul[eh];
        }
        var tmpEv = checkWinCondition(position[eh]);
        evale -= tmpEv*evaluatorMul[eh];
        mainBd.push(tmpEv);
    }
    evale -= checkWinCondition(mainBd)*5000;
    evale += realEvaluateSquare(mainBd)*150;
    return evale;
}

//implementation of  minmax algorithm with alpha beta pruning

function miniMax(position, boardToPlayOn, depth, alpha, beta, maximizingPlayer) {
    RUNS++;// Count the number of times the function is called

    var tmpPlay = -1;// Variable to store the temporary best 

    var calcEval = evaluateGame(position, boardToPlayOn); // Evaluate the current game state
    if(depth <= 0 || Math.abs(calcEval) > 5000) {//Base case: if depth limit reached or terminal state
        return {"mE": calcEval, "tP": tmpPlay};// Return the evaluation and the best mov
    }
    if(boardToPlayOn !== -1 && checkWinCondition(position[boardToPlayOn]) !== 0){
        boardToPlayOn = -1;//If the AI wins a sub-board it cannot play on that sub-board anymore
    }
    if(boardToPlayOn !== -1 && !position[boardToPlayOn].includes(0)){
        boardToPlayOn = -1;//if a subboard is full than ai should focus on other available board; 
    }

    if(maximizingPlayer){//ai will generate maximize value
        var maxEval = -Infinity;
        for(var mm = 0; mm < 9; mm++){
            var evalut = -Infinity;
            // Case where no specific board is targeted (boardToPlayOn === -1)
            if(boardToPlayOn === -1){
                //no specific board targeted
                for(var trr = 0; trr < 9; trr++){
                // Ensure the current sub-board is playable (no win condition)
                    if(checkWinCondition(position[mm]) === 0){
                        // If the position on the sub-board is empty
                        if(position[mm][trr] === 0){
                            // Try making a move for AI (maximizing player)
                            position[mm][trr] = ai;
                            evalut = miniMax(position, trr, depth-1, alpha, beta, false).mE;//means best evaluation score
                            position[mm][trr] = 0;
                        }
                        if(evalut > maxEval){
                            maxEval = evalut;
                            tmpPlay = mm;
                        }
                        alpha = Math.max(alpha, evalut);
                    }

                }
                if(beta <= alpha){
                    break;
                }
            }else{
                // Case where a specific board is targeted (boardToPlayOn !== -1)   
                if(position[boardToPlayOn][mm] === 0){
                    position[boardToPlayOn][mm] = ai;
                    evalut = miniMax(position, mm, depth-1, alpha, beta, false);
                    position[boardToPlayOn][mm] = 0;
                }
                var blop = evalut.mE;
                if(blop > maxEval){
                    maxEval = blop;
                    tmpPlay = evalut.tP;
                }
                alpha = Math.max(alpha, blop);
                if(beta <= alpha){
                    break;
                }
            }
        }
        return {"mE": maxEval, "tP": tmpPlay};
    }else{//here player will generate minimum value
        var minEval = Infinity;
        for(var mm = 0; mm < 9; mm++){
            var evalua = Infinity;
            if(boardToPlayOn === -1){
                for(var trr = 0; trr < 9; trr++){
                    if(checkWinCondition(position[mm]) === 0){
                        if(position[mm][trr] === 0){
                            position[mm][trr] = player;
                            evalua = miniMax(position, trr, depth-1, alpha, beta, true).mE;
                            position[mm][trr] = 0;
                        }
                        if(evalua < minEval){
                            minEval = evalua;
                            tmpPlay = mm;
                        }
                        beta = Math.min(beta, evalua);
                    }

                }
                if(beta <= alpha){
                    break;
                }
            }else{
                if(position[boardToPlayOn][mm] === 0){
                    position[boardToPlayOn][mm] = player;
                    evalua = miniMax(position, mm, depth-1, alpha, beta, true);
                    position[boardToPlayOn][mm] = 0;
                }
                var blep = evalua.mE;
                if(blep < minEval){
                    minEval = blep;
                    tmpPlay = evalua.tP;
                }
                beta = Math.min(beta, blep);
                if(beta <= alpha){
                    break;
                }
            }
        }
        return {"mE": minEval, "tP": tmpPlay};
    }
}

function evaluatePos(pos, square){
    pos[square] = ai;
    var evaluation = 0;
    var points = [0.2, 0.17, 0.2, 0.17, 0.22, 0.17, 0.2, 0.17, 0.2];

    var a = 2;
    evaluation+=points[square];
    a = -2;
    if(pos[0] + pos[1] + pos[2] === a || pos[3] + pos[4] + pos[5] === a || pos[6] + pos[7] + pos[8] === a || pos[0] + pos[3] + pos[6] === a || pos[1] + pos[4] + pos[7] === a ||
        pos[2] + pos[5] + pos[8] === a || pos[0] + pos[4] + pos[8] === a || pos[2] + pos[4] + pos[6] === a) {
        evaluation += 1;
    }
    a = -3;
    if(pos[0] + pos[1] + pos[2] === a || pos[3] + pos[4] + pos[5] === a || pos[6] + pos[7] + pos[8] === a || pos[0] + pos[3] + pos[6] === a || pos[1] + pos[4] + pos[7] === a ||
        pos[2] + pos[5] + pos[8] === a || pos[0] + pos[4] + pos[8] === a || pos[2] + pos[4] + pos[6] === a) {
        evaluation += 5;
    }
    pos[square] = player;

    a = 3;
    if(pos[0] + pos[1] + pos[2] === a || pos[3] + pos[4] + pos[5] === a || pos[6] + pos[7] + pos[8] === a || pos[0] + pos[3] + pos[6] === a || pos[1] + pos[4] + pos[7] === a ||
        pos[2] + pos[5] + pos[8] === a || pos[0] + pos[4] + pos[8] === a || pos[2] + pos[4] + pos[6] === a) {
        evaluation += 2;
    }

    pos[square] = ai;

    evaluation-=checkWinCondition(pos)*15;

    pos[square] = 0;
    return evaluation;
}

function realEvaluateSquare(pos){//evaluates the state of a single 3x3 Tic-Tac-Toe board,s
    var evaluation = 0;
    var points = [0.2, 0.17, 0.2, 0.17, 0.22, 0.17, 0.2, 0.17, 0.2];
    for(var bw in pos){
        evaluation -= pos[bw]*points[bw];
    }
    var a = 2;
    //checks if the player is close to winning 
    if(pos[0] + pos[1] + pos[2] === a || pos[3] + pos[4] + pos[5] === a || pos[6] + pos[7] + pos[8] === a) {
        evaluation -= 6;
    }
    if(pos[0] + pos[3] + pos[6] === a || pos[1] + pos[4] + pos[7] === a || pos[2] + pos[5] + pos[8] === a) {
        evaluation -= 6;
    }
    if(pos[0] + pos[4] + pos[8] === a || pos[2] + pos[4] + pos[6] === a) {
        evaluation -= 7;
    }
    //here subtraction because player is close to winning .so ai should take action to block the player.

    a = -1;
    //checks if ai is close to winning
    if((pos[0] + pos[1] === 2*a && pos[2] === -a) || (pos[1] + pos[2] === 2*a && pos[0] === -a) || (pos[0] + pos[2] === 2*a && pos[1] === -a)
        || (pos[3] + pos[4] === 2*a && pos[5] === -a) || (pos[3] + pos[5] === 2*a && pos[4] === -a) || (pos[5] + pos[4] === 2*a && pos[3] === -a)
        || (pos[6] + pos[7] === 2*a && pos[8] === -a) || (pos[6] + pos[8] === 2*a && pos[7] === -a) || (pos[7] + pos[8] === 2*a && pos[6] === -a)
        || (pos[0] + pos[3] === 2*a && pos[6] === -a) || (pos[0] + pos[6] === 2*a && pos[3] === -a) || (pos[3] + pos[6] === 2*a && pos[0] === -a)
        || (pos[1] + pos[4] === 2*a && pos[7] === -a) || (pos[1] + pos[7] === 2*a && pos[4] === -a) || (pos[4] + pos[7] === 2*a && pos[1] === -a)
        || (pos[2] + pos[5] === 2*a && pos[8] === -a) || (pos[2] + pos[8] === 2*a && pos[5] === -a) || (pos[5] + pos[8] === 2*a && pos[2] === -a)
        || (pos[0] + pos[4] === 2*a && pos[8] === -a) || (pos[0] + pos[8] === 2*a && pos[4] === -a) || (pos[4] + pos[8] === 2*a && pos[0] === -a)
        || (pos[2] + pos[4] === 2*a && pos[6] === -a) || (pos[2] + pos[6] === 2*a && pos[4] === -a) || (pos[4] + pos[6] === 2*a && pos[2] === -a)){
        evaluation-=9;
        //here player need to block ai
    }
    //checks for ai wins
    a = -2;
    if(pos[0] + pos[1] + pos[2] === a || pos[3] + pos[4] + pos[5] === a || pos[6] + pos[7] + pos[8] === a) {
        evaluation += 6;
    }
    if(pos[0] + pos[3] + pos[6] === a || pos[1] + pos[4] + pos[7] === a || pos[2] + pos[5] + pos[8] === a) {
        evaluation += 6;
    }
    if(pos[0] + pos[4] + pos[8] === a || pos[2] + pos[4] + pos[6] === a) {
        evaluation += 7;
        //here adding means this is highly advantaheous situtaion for ai
    }
    //player is close to winning
    a = 1;
    if((pos[0] + pos[1] === 2*a && pos[2] === -a) || (pos[1] + pos[2] === 2*a && pos[0] === -a) || (pos[0] + pos[2] === 2*a && pos[1] === -a)
        || (pos[3] + pos[4] === 2*a && pos[5] === -a) || (pos[3] + pos[5] === 2*a && pos[4] === -a) || (pos[5] + pos[4] === 2*a && pos[3] === -a)
        || (pos[6] + pos[7] === 2*a && pos[8] === -a) || (pos[6] + pos[8] === 2*a && pos[7] === -a) || (pos[7] + pos[8] === 2*a && pos[6] === -a)
        || (pos[0] + pos[3] === 2*a && pos[6] === -a) || (pos[0] + pos[6] === 2*a && pos[3] === -a) || (pos[3] + pos[6] === 2*a && pos[0] === -a)
        || (pos[1] + pos[4] === 2*a && pos[7] === -a) || (pos[1] + pos[7] === 2*a && pos[4] === -a) || (pos[4] + pos[7] === 2*a && pos[1] === -a)
        || (pos[2] + pos[5] === 2*a && pos[8] === -a) || (pos[2] + pos[8] === 2*a && pos[5] === -a) || (pos[5] + pos[8] === 2*a && pos[2] === -a)
        || (pos[0] + pos[4] === 2*a && pos[8] === -a) || (pos[0] + pos[8] === 2*a && pos[4] === -a) || (pos[4] + pos[8] === 2*a && pos[0] === -a)
        || (pos[2] + pos[4] === 2*a && pos[6] === -a) || (pos[2] + pos[6] === 2*a && pos[4] === -a) || (pos[4] + pos[6] === 2*a && pos[2] === -a)){
        evaluation+=9;
        //this is advnatageous situation for player
        //so ai must avoid the winning of player.
    }
    evaluation -= checkWinCondition(pos)*12;
    return evaluation;
}

function sign(x){
    if(x > 0){
        return 1;
    }else if(x < 0){
        return -1;
    }else{
        return 0;
    }
}

var bestMove = -1;
var bestScore = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];

function game(){
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.lineWidth = 3;
    var squareSize = WIDTH/4;
    if(currentTurn === -1 && gameRunning && AIACTIVE){
        //AI turn
        console.log("Start AI");;
        bestMove = -1;
        bestScore = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
        RUNS = 0; 
        var count = 0;
        for(var bt = 0; bt < boards.length; bt++){
            // Counting empty cells across all boards
            if(checkWinCondition(boards[bt]) === 0){
                boards[bt].forEach((v) => (v === 0 && count++));
            }
        }
        if(currentBoard === -1 || checkWinCondition(boards[currentBoard]) !== 0){
            var savedMm;  
            // Adjusting depth of search based on the number of moves made
            console.log("Remaining: " + count);
            if(MOVES < 10) {
                savedMm = miniMax(boards, -1, Math.min(4, count), -Infinity, Infinity, true); 
            }else if(MOVES < 18){
                savedMm = miniMax(boards, -1, Math.min(5, count), -Infinity, Infinity, true);
            }else{
                savedMm = miniMax(boards, -1, Math.min(6, count), -Infinity, Infinity, true);
            }
            console.log(savedMm.tP);
            currentBoard = savedMm.tP;
        }
        // Evaluating each move within the selected board
        for (var i = 0; i < 9; i++) {
            if (boards[currentBoard][i] === 0) {
                bestMove = i;
                break;
            }
        }
        if(bestMove !== -1) { 
               // Evaluate each potential move within the selected board
            for (var a = 0; a < 9; a++) {
                if (boards[currentBoard][a] === 0) {
                      // Calculate score for each possible move
                    var score = evaluatePos(boards[currentBoard], a, currentTurn)*45;
                    bestScore[a] = score;
                }
            }
            // Further evaluate potential moves by making hypothetical AI moves
            for(var b = 0; b < 9; b++){
                if(checkWinCondition(boards[currentBoard]) === 0){
                    if (boards[currentBoard][b] === 0) {
                        boards[currentBoard][b] = ai;
                        var savedMm;
                        if(MOVES < 20){
                            savedMm = miniMax(boards, b, Math.min(5, count), -Infinity, Infinity, false);
                        }else if(MOVES < 32){
                            console.log("DEEP SEARCH");
                            savedMm = miniMax(boards, b, Math.min(6, count), -Infinity, Infinity, false);
                        }else{
                            console.log("ULTRA DEEP SEARCH");
                            savedMm = miniMax(boards, b, Math.min(7, count), -Infinity, Infinity, false);
                        }
                        console.log(savedMm);
                        var score2 = savedMm.mE;
                        boards[currentBoard][b] = 0;
                        bestScore[b] += score2;
                    }
                }
            }

            console.log(bestScore);
            for(var i in bestScore){
                if(bestScore[i] > bestScore[bestMove]){
                    bestMove = i;
                }
            }
            if(boards[currentBoard][bestMove] === 0){
                boards[currentBoard][bestMove] = ai;
                currentBoard = bestMove;
            }

            console.log(evaluateGame(boards, currentBoard));
        }
        currentTurn = -currentTurn;

    }

    shapeSize = squareSize/6;
    //player turn
    if(clicked === true && gameRunning) {
        for (var i in boards) {
            if(currentBoard !== -1){i = currentBoard;if(mainBoard[currentBoard] !== 0){continue;}}
            for (var j in boards[i]) {
                if(boards[i][j] === 0) {
                    if (mousePosX > (WIDTH / 3 - squareSize) / 2 + squareSize / 6 - shapeSize + (j % 3) * squareSize / 3 + (i % 3) * WIDTH / 3 && mousePosX < (WIDTH / 3 - squareSize) / 2 + squareSize / 6 + shapeSize + (j % 3) * squareSize / 3 + (i % 3) * WIDTH / 3) {
                        if (mousePosY > (WIDTH / 3 - squareSize) / 2 + squareSize / 6 - shapeSize + Math.floor(j / 3) * squareSize / 3 + Math.floor(i / 3) * WIDTH / 3 && mousePosY < (WIDTH / 3 - squareSize) / 2 + squareSize / 6 + shapeSize + Math.floor(j / 3) * squareSize / 3 + Math.floor(i / 3) * WIDTH / 3) {
                            boards[i][j] = currentTurn;
                            currentBoard = j;
                            currentTurn = -currentTurn;
                            MOVES++;
                            break;
                        }
                    }
                }
            }
        }
    }


    //drawing the tic tac toe board
    squareSize = WIDTH/4;
    var shapeSize = WIDTH/36;

    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WIDTH/3, 0);
    ctx.lineTo(WIDTH/3, WIDTH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(WIDTH/3*2, 0);
    ctx.lineTo(WIDTH/3*2, WIDTH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, WIDTH/3);
    ctx.lineTo(WIDTH, WIDTH/3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, WIDTH/3*2);
    ctx.lineTo(WIDTH, WIDTH/3*2);
    ctx.stroke();

    ctx.lineWidth = 3;
    for(var i = 0; i < 3; i++){
        for(var j = 0; j < 3; j++){
            ctx.beginPath();
            ctx.moveTo(i*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize/3, j*WIDTH/3 + (WIDTH/3 - squareSize)/2);
            ctx.lineTo(i*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize/3, j*WIDTH/3 + (WIDTH/3 - squareSize)/2 + squareSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize*2/3, j*WIDTH/3 + (WIDTH/3 - squareSize)/2);
            ctx.lineTo(i*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize*2/3, j*WIDTH/3 + (WIDTH/3 - squareSize)/2 + squareSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i*WIDTH/3 + (WIDTH/3 - squareSize)/2, j*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize/3);
            ctx.lineTo(i*WIDTH/3 + (WIDTH/3 - squareSize)/2 + squareSize, j*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize/3);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i*WIDTH/3 + (WIDTH/3 - squareSize)/2, j*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize*2/3);
            ctx.lineTo(i*WIDTH/3 + (WIDTH/3 - squareSize)/2 + squareSize, j*WIDTH/3 + (WIDTH/3-squareSize)/2 + squareSize*2/3);
            ctx.stroke();
        }
    }

    ctx.lineWidth = 5;


    //visulaize which player mark x and which player mark 0

    for(var i in boards){
        if(mainBoard[i] === 0) {
            if (checkWinCondition(boards[i]) !== 0) {
                mainBoard[i] = checkWinCondition(boards[i]);
            }
        }
        for(var j in boards[i]){
            if(boards[i][j] === 1*switchAroo){
                ctx.strokeStyle = COLORS.red;
                ctx.beginPath();
                ctx.moveTo((WIDTH/3-squareSize)/2 + squareSize/6 - shapeSize + (j%3)*squareSize/3 + (i%3)*WIDTH/3, (WIDTH/3 - squareSize)/2 + squareSize/6 - shapeSize + Math.floor(j/3)*squareSize/3 + Math.floor(i/3)*WIDTH/3);
                ctx.lineTo((WIDTH/3-squareSize)/2 + squareSize/6 + shapeSize + (j%3)*squareSize/3 + (i%3)*WIDTH/3, (WIDTH/3 - squareSize)/2 + squareSize/6 + shapeSize + Math.floor(j/3)*squareSize/3 + Math.floor(i/3)*WIDTH/3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo((WIDTH/3-squareSize)/2 + squareSize/6 - shapeSize + (j%3)*squareSize/3 + (i%3)*WIDTH/3, (WIDTH/3 - squareSize)/2 + squareSize/6 + shapeSize + Math.floor(j/3)*squareSize/3 + Math.floor(i/3)*WIDTH/3);
                ctx.lineTo((WIDTH/3-squareSize)/2 + squareSize/6 + shapeSize + (j%3)*squareSize/3 + (i%3)*WIDTH/3, (WIDTH/3 - squareSize)/2 + squareSize/6 - shapeSize + Math.floor(j/3)*squareSize/3 + Math.floor(i/3)*WIDTH/3);
                ctx.stroke();
            }else if(boards[i][j] === -1*switchAroo){
                ctx.strokeStyle = COLORS.blue;
                ctx.beginPath();
                ctx.ellipse((WIDTH/3-squareSize)/2 + squareSize/6 + (j%3)*squareSize/3 + (i%3)*WIDTH/3, (WIDTH/3 - squareSize)/2 + squareSize/6 + Math.floor(j/3)*squareSize/3 + Math.floor(i/3)*WIDTH/3, shapeSize*1.1, shapeSize*1.1, 0, 0, Math.PI*2);
                ctx.stroke();
            }
        }
    }

    //handling to display the final state of the game
    if(gameRunning){
        if (checkWinCondition(mainBoard) !== 0) {
            gameRunning = false;
            document.getElementById("winMenu").removeAttribute("hidden");
            if(checkWinCondition(mainBoard) === 1){
                document.getElementById("result").innerHTML = playerNames[0] + " WINS!";
            }else{
                document.getElementById("result").innerHTML = playerNames[1] + " WINS!";
            }
        }
        var countw = 0;
        for(var bt = 0; bt < boards.length; bt++){
            if(checkWinCondition(boards[bt]) === 0){
                boards[bt].forEach((v) => (v === 0 && countw++));
            }
        }

        if(countw === 0){
            gameRunning = false;
            document.getElementById("winMenu").removeAttribute("hidden");
            document.getElementById("result").innerHTML = "IT'S A TIE!";
        }
    }

    shapeSize = squareSize/3;
    ctx.lineWidth = 20;
    for(var j in mainBoard){
        if(mainBoard[j] === 1*switchAroo){
            ctx.strokeStyle = COLORS.red;
            ctx.beginPath();
            ctx.moveTo(WIDTH/6 - shapeSize + (j%3)*WIDTH/3, WIDTH/6 - shapeSize + Math.floor(j/3)*WIDTH/3);
            ctx.lineTo(WIDTH/6 + shapeSize + (j%3)*WIDTH/3, WIDTH/6 + shapeSize + Math.floor(j/3)*WIDTH/3);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(WIDTH/6 - shapeSize + (j%3)*WIDTH/3, WIDTH/6 + shapeSize + Math.floor(j/3)*WIDTH/3);
            ctx.lineTo(WIDTH/6 + shapeSize + (j%3)*WIDTH/3, WIDTH/6 - shapeSize + Math.floor(j/3)*WIDTH/3);
            ctx.stroke();
        }else if(mainBoard[j] === -1*switchAroo){
            ctx.strokeStyle = COLORS.blue;
            ctx.beginPath();
            ctx.ellipse(WIDTH/6 + (j%3)*WIDTH/3, WIDTH/6 + Math.floor(j/3)*WIDTH/3, shapeSize*1.1, shapeSize*1.1, 0, 0, Math.PI*2);
            ctx.stroke();
        }
    }

    if(mainBoard[currentBoard] !== 0 || !boards[currentBoard].includes(0)){currentBoard = -1;}
    ctx.fillStyle = COLORS.red;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(WIDTH/3*(currentBoard%3), WIDTH/3*Math.floor(currentBoard/3), WIDTH/3, WIDTH/3);
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.9;
    if(evaluateGame(boards, currentBoard)*switchAroo > 0){
        ctx.fillStyle = COLORS.blue;
    }else{
        ctx.fillStyle = COLORS.red;
    }
    ctx.fillRect(WIDTH/2, WIDTH, evaluateGame(boards, currentBoard)*2*switchAroo, HEIGHT/16);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(WIDTH/2, WIDTH);
    ctx.lineTo(WIDTH/2, WIDTH+HEIGHT);
    ctx.stroke();
    if(AIACTIVE){
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(WIDTH/2, WIDTH, bestScore[bestMove]*2*switchAroo, HEIGHT/16);
        ctx.globalAlpha = 1;
    }

    clicked = false;

}


//key and mouse handler
var keys;
function findScreenCoords(mouseEvent)
{
    var rect = canvas.getBoundingClientRect();
    mousePosX = mouseEvent.clientX - rect.left;
    mousePosY = mouseEvent.clientY - rect.top;
}

function click(){
    clicked = true;
}
document.getElementById("myCanvas").onmousemove = findScreenCoords;
document.getElementById("myCanvas").onclick = click;

window.addEventListener('keydown', function (e) {
    keys = (keys || []);
    keys[e.keyCode] = (e.type == "keydown");

    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }

}, false);
window.addEventListener('keyup', function (e) {
    keys[e.keyCode] = (e.type == "keydown");
}, false);

function Reload() {
    localStorage.setItem("HighScoreBusiness", 0);
}

function startGame(type){
    boards = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]

    ];

    mainBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    MOVES = 0;
    currentBoard = -1;
    if(type === 0){
        AIACTIVE = true;
        gameRunning = true;
        playerNames[0] = "PLAYER";
        playerNames[1] = "AI";
    }else{
        AIACTIVE = false;
        gameRunning = true;
        switchAroo = 1;
        playerNames[0] = "PLAYER 1";
        playerNames[1] = "PLAYER 2";
    }
    document.getElementById("startMenu").setAttribute("hidden", "hidden");
    document.getElementById("turnMenu").setAttribute("hidden", "hidden");
}

function setGame(type){
    if(type === 0){
        currentTurn = 1;
        switchAroo = 1;
    }else{
        currentTurn = -1;
        switchAroo = -1;
    }
    startGame(0);
}

function menu(){
    document.getElementById("startMenu").removeAttribute("hidden");
    document.getElementById("turnMenu").setAttribute("hidden", "hidden");
    document.getElementById("winMenu").setAttribute("hidden", "hidden");
}

function pickTurns(){
    document.getElementById("startMenu").setAttribute("hidden", "hidden");
    document.getElementById("turnMenu").removeAttribute("hidden");
}
function repeatOften() {
    game();
    requestAnimationFrame(repeatOften);
}
requestAnimationFrame(repeatOften);