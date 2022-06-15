const COLOR = { WHITE: 0, BLACK: 1 };

const myNode = $('<div/>', { id: 'recommend' }).appendTo('body');
const mySVG = $(document.createElementNS("http://www.w3.org/2000/svg", 'svg'));

function boardCoordsToIndices(coord) {
    return {
        x: coord.charCodeAt(0) - 'a'.charCodeAt(0),
        y: Number(coord[1]) - 1
    };
}

function drawArrow(color, from, to) {
    from = boardCoordsToIndices(from);
    to = boardCoordsToIndices(to);

    const board = $('cg-container svg');
    const boardWidth = board[0].clientWidth;
    const boardHeight = board[0].clientHeight;
    const blockWidth = boardWidth / 8;
    const blockHeight = boardHeight / 8;

    let x1 = (from.x + 0.5) * blockWidth;
    let x2 = (to.x + 0.5) * blockWidth;
    let y1 = (from.y + 0.5) * blockHeight;
    let y2 = (to.y + 0.5) * blockHeight;
    if (color) {
        x1 = boardWidth - x1;
        x2 = boardWidth - x2;
    } else {
        y1 = boardHeight - y1;
        y2 = boardHeight - y2;
    }

    mySVG.html(`
    <defs>
        <marker id="arrowhead" orient="auto" markerWidth="4" markerHeight="8" refX="2.05" refY="2.01">
            <path d="M0,0 V4 L3,2 Z" fill="#003088"></path>
        </marker>
    </defs>
    <line stroke="#003088" stroke-width="10" stroke-linecap="round" marker-end="url(#arrowhead)" opacity="0.4" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>
    `);
}

// Returns false to stop recommending moves
function recommendMove(color) {
    mySVG.html('');
    myNode.css('display', 'none');
    const moves = $('u8t').map(function () {
        return $(this).text();
    });
    if (moves.length > 35) return false; // Longest line in eco.js

    // Don't recommend if not your move
    if (color === COLOR.BLACK && moves.length % 2 === 0
        || color === COLOR.WHITE && moves.length % 2 === 1) return true;

    // Get to current position in chess.js
    const chess = new Chess();
    for (const move of moves) {
        chess.move(move);
    }

    // Find current opening by FEN
    const fen = chess.fen();
    const findFEN = eco.find(line => line[2] === fen.slice(0, fen.length - 6).trim());
    if (!findFEN) return true;

    // Find continuations of opening
    const findLines = eco.filter(line => line[3].startsWith(`${findFEN[3]} `));
    // Remove variations before recommending main line
    const smallestLineLength = Math.min(...findLines.map(line => line[3].length))
    const smallestLines = findLines.filter(line => line[3].length === smallestLineLength);
    const chosenLine = smallestLines[Math.floor(Math.random() * smallestLines.length)];
    // Convert UCI to SAN
    const chosenUCIMove = chosenLine[3].slice(moves.length * 5, moves.length * 5 + 4);
    chess.move({ from: chosenUCIMove.slice(0, 2), to: chosenUCIMove.slice(2) });
    const chosenMove = chess.history().pop();

    myNode.html(`Play <h2>${chosenMove}</h2> for ${chosenLine[1]}`);
    myNode.css('display', 'block');
    drawArrow(color, chosenUCIMove.slice(0, 2), chosenUCIMove.slice(2));
    return true;
}

setTimeout(function () {
    const moveListContainer = $('rm6');
    if (!moveListContainer[0]) return; // Not on a game page

    $('cg-container').append(mySVG);

    const username = $('#user_tag').text();
    const whitePlayer = $('.player.is.white').text().split(' ')[0];
    const blackPlayer = $('.player.is.black').text().split(' ')[0];
    const coords = $('coords').attr('class');

    let color = COLOR.WHITE;
    if (username && username === blackPlayer && username !== whitePlayer
        || coords && coords.split(/\s+/).includes('black')) color = COLOR.BLACK;

    const moveList = moveListContainer.find('l4x')[0];
    const moveListObserver = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes[0]?.nodeName === 'U8T') {
                    if (!recommendMove(color)) {
                        observer.disconnect();
                        return;
                    }
                }
            }
        }
    });
    if (!moveList) {
        const moveListContainerObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes[0]?.nodeName === 'L4X') {
                        moveListObserver.observe(mutation.addedNodes[0], { childList: true })
                        observer.disconnect();
                        recommendMove(color);
                        return;
                    }
                }
            }
        });
        moveListContainerObserver.observe(moveListContainer[0], { childList: true });
    } else {
        moveListObserver.observe(moveList, { childList: true })
    }
}, 1000);
