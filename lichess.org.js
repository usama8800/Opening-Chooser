const COLOR = { WHITE: 0, BLACK: 1 };

const myNode = $('<div/>', { id: 'recommend' }).appendTo('body');

// Returns false to stop recommending moves
function recommendMove(color) {
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
    return true;
}

setTimeout(function () {
    const moveListContainer = $('rm6');
    if (!moveListContainer[0]) return; // Not on a game page

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
