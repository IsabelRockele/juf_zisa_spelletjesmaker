// Gedeelde puzzellogica en pagina-indeling; ook zonder browser te testen.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.SudokuV2 = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
'use strict';
    const GRID_SPECS = {
        4: { blockRows: 2, blockCols: 2 },
        6: { blockRows: 2, blockCols: 3 },
        9: { blockRows: 3, blockCols: 3 }
    };

    const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    function deepCopyGrid(grid) {
        return grid.map(row => row.slice());
    }

    // --- Sudoku solved grid generator (algemeen voor 4×4, 6×6, 9×9) ---
    function generateSolvedGrid(size) {
        const spec = GRID_SPECS[size];
        if (!spec) throw new Error("Onbekend formaat: " + size);

        const { blockRows, blockCols } = spec;
        const grid = Array(size).fill(null).map(() => Array(size).fill(0));

        // Basispatroon
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = ((r * blockCols + Math.floor(r / blockRows) + c) % size) + 1;
            }
        }

        // Rijen binnen banden shufflen
        const bandCount = size / blockRows;
        for (let band = 0; band < bandCount; band++) {
            const rowIndices = [];
            for (let i = 0; i < blockRows; i++) {
                rowIndices.push(band * blockRows + i);
            }
            const shuffledRows = shuffle(rowIndices.slice());
            const tempRows = shuffledRows.map(idx => grid[idx]);
            for (let i = 0; i < blockRows; i++) {
                grid[band * blockRows + i] = tempRows[i];
            }
        }

        // Kolommen binnen stacks shufflen
        const stackCount = size / blockCols;
        for (let stack = 0; stack < stackCount; stack++) {
            const colIndices = [];
            for (let i = 0; i < blockCols; i++) {
                colIndices.push(stack * blockCols + i);
            }
            const shuffledCols = shuffle(colIndices.slice());
            for (let r = 0; r < size; r++) {
                const tempCols = shuffledCols.map(idx => grid[r][idx]);
                for (let i = 0; i < blockCols; i++) {
                    grid[r][stack * blockCols + i] = tempCols[i];
                }
            }
        }

        // Banden shufflen
        {
            const bands = [];
            for (let b = 0; b < bandCount; b++) bands.push(b);
            const bandOrder = shuffle(bands);
            const newGrid = Array(size).fill(null).map(() => Array(size).fill(0));
            for (let newBand = 0; newBand < bandCount; newBand++) {
                const oldBand = bandOrder[newBand];
                for (let i = 0; i < blockRows; i++) {
                    const oldRow = oldBand * blockRows + i;
                    const newRow = newBand * blockRows + i;
                    newGrid[newRow] = grid[oldRow];
                }
            }
            for (let r = 0; r < size; r++) grid[r] = newGrid[r];
        }

        // Stacks shufflen
        {
            const stacks = [];
            for (let s = 0; s < stackCount; s++) stacks.push(s);
            const stackOrder = shuffle(stacks);
            const newGrid = Array(size).fill(null).map(() => Array(size).fill(0));
            for (let r = 0; r < size; r++) {
                for (let newStack = 0; newStack < stackCount; newStack++) {
                    const oldStack = stackOrder[newStack];
                    for (let i = 0; i < blockCols; i++) {
                        const oldCol = oldStack * blockCols + i;
                        const newCol = newStack * blockCols + i;
                        newGrid[r][newCol] = grid[r][oldCol];
                    }
                }
            }
            for (let r = 0; r < size; r++) grid[r] = newGrid[r];
        }

        // Cijfer-permutatie
        const perm = shuffle(Array.from({ length: size }, (_, i) => i + 1));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = perm[grid[r][c] - 1];
            }
        }

        return grid;
    }

    // --- Validator & oplosser voor unieke oplossing ---
    function isSafe(grid, row, col, num, size, blockRows, blockCols) {
        for (let i = 0; i < size; i++) {
            if (grid[row][i] === num) return false;
            if (grid[i][col] === num) return false;
        }
        const startRow = row - (row % blockRows);
        const startCol = col - (col % blockCols);
        for (let r = 0; r < blockRows; r++) {
            for (let c = 0; c < blockCols; c++) {
                if (grid[startRow + r][startCol + c] === num) return false;
            }
        }
        return true;
    }

    function countSolutions(grid, size, blockRows, blockCols, limit = 2) {
        let solutionCount = 0;

        function backtrack() {
            if (solutionCount >= limit) return;

            let row = -1, col = -1, candidates = null;
            outer: for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] !== 0) continue;
                    const options = [];
                    for (let n = 1; n <= size; n++) {
                        if (isSafe(grid, r, c, n, size, blockRows, blockCols)) options.push(n);
                    }
                    if (!options.length) return;
                    if (!candidates || options.length < candidates.length) {
                        row = r; col = c; candidates = options;
                        if (options.length === 1) break outer;
                    }
                }
            }

            if (row === -1) {
                solutionCount++;
                return;
            }

            for (const num of candidates) {
                if (isSafe(grid, row, col, num, size, blockRows, blockCols)) {
                    grid[row][col] = num;
                    backtrack();
                    grid[row][col] = 0;
                    if (solutionCount >= limit) return;
                }
            }
        }

        backtrack();
        return solutionCount;
    }

    function hasUniqueSolution(puzzle, size) {
        const spec = GRID_SPECS[size];
        const copy = deepCopyGrid(puzzle);
        const numSolutions = countSolutions(copy, size, spec.blockRows, spec.blockCols, 2);
        return numSolutions === 1;
    }

    function getTargetRemovals(size, difficulty) {
        if (size === 4) {
            switch (difficulty) {
                case 'easy': return 6;
                case 'medium': return 8;
                case 'hard': return 10;
                case 'expert': return 12;
                default: return 8;
            }
        } else if (size === 6) {
            switch (difficulty) {
                case 'easy': return 14;
                case 'medium': return 18;
                case 'hard': return 22;
                case 'expert': return 26;
                default: return 18;
            }
        } else if (size === 9) {
            switch (difficulty) {
                case 'easy': return 40;
                case 'medium': return 50;
                case 'hard': return 55;
                case 'expert': return 60;
                default: return 50;
            }
        }
        return Math.floor((size * size) / 2);
    }

    function createSudokuWithDifficulty(size, difficulty) {
        const spec = GRID_SPECS[size];
        const targetRemovals = getTargetRemovals(size, difficulty);
        const solution = generateSolvedGrid(size);
        const puzzle = deepCopyGrid(solution);

        let cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({ r, c });
            }
        }
        shuffle(cells);

        let removed = 0;
        for (const cell of cells) {
            if (removed >= targetRemovals) break;
            const { r, c } = cell;
            if (puzzle[r][c] === 0) continue;

            const backup = puzzle[r][c];
            puzzle[r][c] = 0;

            if (hasUniqueSolution(puzzle, size)) {
                removed++;
            } else {
                puzzle[r][c] = backup;
            }
        }

        return { solution, puzzle };
    }


    // Alle afmetingen in millimeter op A4. Knipvakjes zijn even groot als roostervakjes.
    function planPages(worksheet, solutions = false) {
        const { size, type, puzzles } = worksheet;
        const pages = [];
        const perPage = size === 4 ? 4 : 1;
        for (let offset = 0; offset < puzzles.length; offset += perPage) {
            const count = Math.min(perPage, puzzles.length - offset);
            const side = size === 4 ? (count === 1 ? 120 : 80) : (size === 6 ? 156 : 180);
            const grids = [];
            for (let i = 0; i < count; i++) {
                grids.push({ index: offset + i, x: count === 1 ? (210-side)/2 : 20 + (i%2)*90,
                    y: 48 + Math.floor(i/2)*(side+23), side });
            }
            pages.push({ kind: 'grids', solutions, grids });
        }
        if (type === 'afbeeldingen' && !solutions) {
            let page = null, y = 43;
            puzzles.forEach((puzzle, index) => {
                const grid = pages.flatMap(p => p.grids || []).find(g => g.index === index);
                const cell = grid.side / size;
                const columns = Math.floor((190+3)/(cell+3));
                const rows = Math.ceil(puzzle.missing.length/columns);
                const height = 10 + rows*(cell+3) + 7;
                if (!page || y + height > 282) {
                    page = { kind: 'cuts', sections: [] }; pages.push(page); y = 43;
                }
                page.sections.push({ index, x: 10, y, cell, columns, height });
                y += height;
            });
        }
        return pages;
    }
    return { GRID_SPECS, shuffle, generateSolvedGrid, createSudokuWithDifficulty,
        countSolutions, hasUniqueSolution, getTargetRemovals, planPages };
});
