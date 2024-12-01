"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeHiddenBlocks = void 0;
function computeHiddenBlocks(lineInformation, diffLines, extraLines) {
    let newBlockIndex = 0;
    let currentBlock;
    let lineBlocks = {};
    let blocks = [];
    lineInformation.forEach((line, lineIndex) => {
        const isDiffLine = diffLines.some(diffLine => diffLine >= lineIndex - extraLines && diffLine <= lineIndex + extraLines);
        if (!isDiffLine && currentBlock == undefined) {
            // block begins
            currentBlock = {
                index: newBlockIndex,
                startLine: lineIndex,
                endLine: lineIndex,
                lines: 1
            };
            blocks.push(currentBlock);
            lineBlocks[lineIndex] = currentBlock.index;
            newBlockIndex++;
        }
        else if (!isDiffLine) {
            // block continues
            currentBlock.endLine = lineIndex;
            currentBlock.lines++;
            lineBlocks[lineIndex] = currentBlock.index;
        }
        else {
            // not a block anymore
            currentBlock = undefined;
        }
    });
    return {
        lineBlocks,
        blocks: blocks
    };
}
exports.computeHiddenBlocks = computeHiddenBlocks;
