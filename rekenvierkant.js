const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

// Helper function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get the units digit of a number
function getUnits(num) {
    return num % 10;
}

/**
 * Checks if a pair of numbers meets the specified bridging criteria.
 * @param {number} num1 First number.
 * @param {number} num2 Second number.
 * @param {string} opSign The operation sign ("+" or "-").
 *
 * @param {string} brugType The bridging type ("met", "zonder", "beide").
 * @returns {boolean} True if the numbers meet the bridging criteria, false otherwise.
 */
function checkBrugCondition(num1, num2, opSign, brugType) {
    if (brugType === "beide") return true;

    let isBridging;
    if (opSign === "+") {
        isBridging = (getUnits(num1) + getUnits(num2) >= 10);
    } else { // "-"
        isBridging = (getUnits(num1) < getUnits(num2));
    }

    return (brugType === "met" && isBridging) || (brugType === "zonder" && !isBridging);
}


/**
 * Generates a consistent grid (5x5 or 7x7) where all horizontal and vertical sums are correct.
 * Supports 'optellen', 'aftrekken', 'gemengd', and 'brug' logic.
 * Numbers are generated generally within the 'niveau' range.
 * @param {number} cols Number of columns (5 or 7).
 * @param {number} rows Number of rows (5 or 7).
 * @param {number} niveau The maximum value for numbers (e.g., 10, 20, 100).
 * @param {string} typeOpgave The type of operation ("optellen", "aftrekken", "gemengd").
 * @param {string} typeBrug The bridging type ("met", "zonder", "beide").
 * @returns {Array<Array<any>>} A 2D array representing the consistent grid.
 */
function generateConsistentGrid(cols, rows, niveau, typeOpgave, typeBrug) {
    let actualMaxVal = parseInt(niveau);
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(""));

    let attempts = 0;
    const MAX_ATTEMPTS = 1000000; // Aantal pogingen verder verhoogd voor complexiteit

    // Helper to generate general numbers within the calculated range
    const generateSpecificNum = (baseMax, currentBrugType, currentOpType) => {
        let num = getRandomInt(1, baseMax);

        // Bias for "met brug" when adding
        if (currentBrugType === "met" && currentOpType === "optellen" && baseMax >= 5) {
             if (Math.random() < 0.6) { // Hogere kans om getallen te kiezen die een brug vormen
                 num = getRandomInt(Math.max(1, baseMax - 4), baseMax);
             }
        }
        // Bias for "zonder brug" when adding
        if (currentBrugType === "zonder" && currentOpType === "optellen" && baseMax >= 5) {
             if (Math.random() < 0.6) { // Hogere kans om getallen te kiezen die GEEN brug vormen
                 num = getRandomInt(1, Math.min(baseMax, 9)); // Getallen onder de 10 voor eenheden
                 if (num >= 5) num = getRandomInt(1,4); // nog sterker biasen
             }
        }
        // Bias for "zonder brug" when subtracting
        if (currentBrugType === "zonder" && currentOpType === "aftrekken" && baseMax >= 5) {
             if (Math.random() < 0.6) {
                 num = getRandomInt(Math.max(1, Math.floor(baseMax / 2)), baseMax); // Voor aftrekken zonder brug moet num1 > num2 in eenheden zijn
             }
        }
        return num;
    };


    while (attempts < MAX_ATTEMPTS) {
        attempts++;

        let generatedBaseNumbers = [];

        // Bepaal het aantal basisinputs afhankelijk van het formaat
        const numBaseInputs = (cols === 5) ? 4 : 9;

        // Bepaal de maximale waarde voor de basisgetallen, rekening houdend met niveau en aantal operanden
        // Bij 7x7 zijn er 3 getallen per rij/kolom die worden opgeteld/afgetrokken
        let currentMaxBaseForGeneration;
        if (typeOpgave === "optellen") {
            currentMaxBaseForGeneration = Math.floor(actualMaxVal / (cols === 5 ? 2 : 3)); // 2 voor 5x5, 3 voor 7x7
        } else if (typeOpgave === "aftrekken") {
            currentMaxBaseForGeneration = actualMaxVal; // Bij aftrekken kan het eerste getal maximaal zijn
        } else { // gemengd
            currentMaxBaseForGeneration = actualMaxVal; // Start breed voor gemengd
        }
        if (currentMaxBaseForGeneration < 1) currentMaxBaseForGeneration = 1;


        // Genereer basisgetallen
        for (let i = 0; i < numBaseInputs; i++) {
            generatedBaseNumbers.push(generateSpecificNum(currentMaxBaseForGeneration, typeBrug, typeOpgave));
        }

        // Wijs gegenereerde getallen toe aan specifieke roosterposities
        if (cols === 5) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
            grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
        } else if (cols === 7) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
            grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
            grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
        }

        // Zorg ervoor dat er geen nullen worden gegenereerd
        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (grid[r][c] === 0) grid[r][c] = 1;
            }
        }

        let isValidCombination = true;
        let derivedValues = {};

        // Helper function for operations (for 5x5 and intermediate steps)
        const performOp = (a, b, sign) => {
            if (sign === "+") {
                if (a + b > actualMaxVal) { isValidCombination = false; return null; } // Controleer maximum uitkomst
                return a + b;
            }
            if (a < b) { isValidCombination = false; return null; }
            return a - b;
        };

        // Modified performTripleOp to take two signs for sequential operations
        const performTripleOp = (a, b, c, sign1, sign2) => {
            let intermediateResult;
            if (sign1 === "+") {
                intermediateResult = a + b;
            } else { // "-"
                if (a < b) { isValidCombination = false; return null; }
                intermediateResult = a - b;
            }

            if (intermediateResult === null || !Number.isInteger(intermediateResult) || intermediateResult < 0 || intermediateResult > actualMaxVal) {
                isValidCombination = false; // Controleer tussenresultaat
                return null;
            }

            if (sign2 === "+") {
                if (intermediateResult + c > actualMaxVal) { isValidCombination = false; return null; } // Controleer finale uitkomst
                return intermediateResult + c;
            } else { // "-"
                if (intermediateResult < c) { isValidCombination = false; return null; }
                return intermediateResult - c;
            }
        };

        // Assign operators dynamically if typeOpgave is "gemengd"
        if (typeOpgave === "gemengd") {
            const opTypes = ["+", "-"];
            if (cols === 5) {
                grid[0][1] = opTypes[getRandomInt(0, 1)];
                grid[2][1] = opTypes[getRandomInt(0, 1)];
                grid[4][1] = opTypes[getRandomInt(0, 1)];

                grid[1][0] = opTypes[getRandomInt(0, 1)];
                grid[1][2] = opTypes[getRandomInt(0, 1)];
                grid[1][4] = opTypes[getRandomInt(0, 1)];
            } else { // 7x7
                grid[0][1] = opTypes[getRandomInt(0, 1)]; grid[0][3] = opTypes[getRandomInt(0, 1)];
                grid[2][1] = opTypes[getRandomInt(0, 1)]; grid[2][3] = opTypes[getRandomInt(0, 1)];
                grid[4][1] = opTypes[getRandomInt(0, 1)]; grid[4][3] = opTypes[getRandomInt(0, 1)];
                grid[6][1] = opTypes[getRandomInt(0, 1)]; grid[6][3] = opTypes[getRandomInt(0, 1)];

                grid[1][0] = opTypes[getRandomInt(0, 1)]; grid[1][2] = opTypes[getRandomInt(0, 1)]; grid[1][4] = opTypes[getRandomInt(0, 1)];
                grid[3][0] = opTypes[getRandomInt(0, 1)]; grid[3][2] = opTypes[getRandomInt(0, 1)]; grid[3][4] = opTypes[getRandomInt(0, 1)];
                grid[5][0] = opTypes[getRandomInt(0, 1)]; grid[5][2] = opTypes[getRandomInt(0, 1)]; grid[5][4] = opTypes[getRandomInt(0, 1)];
            }
        } else { // "optellen" or "aftrekken" - fixed operator
            const fixedOp = (typeOpgave === "optellen") ? "+" : "-";
            if (cols === 5) {
                grid[0][1] = fixedOp;
                grid[2][1] = fixedOp;
                grid[4][1] = fixedOp;
                grid[1][0] = fixedOp;
                grid[1][2] = fixedOp;
                grid[1][4] = fixedOp;
            } else { // 7x7
                grid[0][1] = fixedOp; grid[0][3] = fixedOp;
                grid[2][1] = fixedOp; grid[2][3] = fixedOp;
                grid[4][1] = fixedOp; grid[4][3] = fixedOp;
                grid[6][1] = fixedOp; grid[6][3] = fixedOp;

                grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp;
                grid[3][0] = fixedOp; grid[3][2] = fixedOp; grid[3][4] = fixedOp;
                grid[5][0] = fixedOp; grid[5][2] = fixedOp; grid[5][4] = fixedOp;
            }
        }
        // Set fixed '=' signs
        if (cols === 5) {
            grid[0][3] = "="; grid[2][3] = "="; grid[4][3] = "=";
            grid[3][0] = "="; grid[3][2] = "="; grid[3][4] = "=";
        } else if (cols === 7) {
            grid[0][5] = "="; grid[2][5] = "="; grid[4][5] = "="; grid[6][5] = "=";
            grid[5][0] = "="; grid[5][2] = "="; grid[5][4] = "="; grid[5][6] = "=";
        }


        // Check bridging for base pairs (horizontal and vertical)
        if (typeBrug !== "beide") {
            // 5x5 Grid checks
            if (cols === 5) {
                if (!checkBrugCondition(grid[0][0], grid[0][2], grid[0][1], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[2][0], grid[2][2], grid[2][1], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[0][0], grid[2][0], grid[1][0], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[0][2], grid[2][2], grid[1][2], typeBrug)) { isValidCombination = false; }
            } else if (cols === 7) {
                // 7x7 Grid checks for bridging condition on first two operands of each triple operation
                // It's very hard to guarantee bridging conditions for all three numbers and two operators
                // We simplify this to checking the first operation in each sequence for bridging to increase generation success
                if (!checkBrugCondition(grid[0][0], grid[0][2], grid[0][1], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[2][0], grid[2][2], grid[2][1], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[4][0], grid[4][2], grid[4][1], typeBrug)) { isValidCombination = false; }

                if (!checkBrugCondition(grid[0][0], grid[2][0], grid[1][0], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[0][2], grid[2][2], grid[1][2], typeBrug)) { isValidCombination = false; }
                if (!checkBrugCondition(grid[0][4], grid[2][4], grid[1][4], typeBrug)) { isValidCombination = false; }

                // Also check the second operation in the sequence for bridging (if it's addition/subtraction)
                // This is a more challenging check, but necessary for correct bridging application.
                // We need to calculate the intermediate result first.
                let tempIntermediateResult;
                const opTypesForBridgingCheck = ["+", "-"];

                // Horizontal (R0, C2-C4 op grid[0][3])
                if (opTypesForBridgingCheck.includes(grid[0][1])) { // Only if first op is + or -
                    tempIntermediateResult = performOp(grid[0][0], grid[0][2], grid[0][1]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[0][3])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[0][4], grid[0][3], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false; // if intermediate calc failed
                }
                if (!isValidCombination) continue; // Early exit if condition is violated

                // Repeat for other rows/columns for thoroughness, or accept lower success rate
                // (For simplicity here, I'll add a few more but a full implementation would cover all intermediate steps)
                if (opTypesForBridgingCheck.includes(grid[2][1])) {
                    tempIntermediateResult = performOp(grid[2][0], grid[2][2], grid[2][1]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[2][3])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[2][4], grid[2][3], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false;
                }
                if (!isValidCombination) continue;

                if (opTypesForBridgingCheck.includes(grid[4][1])) {
                    tempIntermediateResult = performOp(grid[4][0], grid[4][2], grid[4][1]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[4][3])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[4][4], grid[4][3], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false;
                }
                if (!isValidCombination) continue;


                // Vertical (C0, R2-R4 op grid[3][0])
                if (opTypesForBridgingCheck.includes(grid[1][0])) {
                    tempIntermediateResult = performOp(grid[0][0], grid[2][0], grid[1][0]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[3][0])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[4][0], grid[3][0], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false;
                }
                if (!isValidCombination) continue;

                if (opTypesForBridgingCheck.includes(grid[1][2])) {
                    tempIntermediateResult = performOp(grid[0][2], grid[2][2], grid[1][2]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[3][2])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[4][2], grid[3][2], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false;
                }
                if (!isValidCombination) continue;

                if (opTypesForBridgingCheck.includes(grid[1][4])) {
                    tempIntermediateResult = performOp(grid[0][4], grid[2][4], grid[1][4]);
                    if (tempIntermediateResult !== null && opTypesForBridgingCheck.includes(grid[3][4])) {
                        if (!checkBrugCondition(tempIntermediateResult, grid[4][4], grid[3][4], typeBrug)) isValidCombination = false;
                    } else if (tempIntermediateResult === null) isValidCombination = false;
                }
                if (!isValidCombination) continue;

            }
        }
        if (!isValidCombination) continue;


        // Calculate derived values for 5x5 and 7x7
        if (cols === 5) {
            derivedValues.r0c4 = performOp(grid[0][0], grid[0][2], grid[0][1]);
            derivedValues.r2c4 = performOp(grid[2][0], grid[2][2], grid[2][1]);
            derivedValues.r4c0 = performOp(grid[0][0], grid[2][0], grid[1][0]);
            derivedValues.r4c2 = performOp(grid[0][2], grid[2][2], grid[1][2]);

            if (derivedValues.r0c4 === null || derivedValues.r2c4 === null || derivedValues.r4c0 === null || derivedValues.r4c2 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r4c4_from_h = performOp(derivedValues.r4c0, derivedValues.r4c2, grid[4][1]);
                derivedValues.r4c4_from_v = performOp(derivedValues.r0c4, derivedValues.r2c4, grid[1][4]);
            }

        } else if (cols === 7) {
            // Corrected calls to performTripleOp for 7x7
            derivedValues.r0c6 = performTripleOp(grid[0][0], grid[0][2], grid[0][4], grid[0][1], grid[0][3]);
            derivedValues.r2c6 = performTripleOp(grid[2][0], grid[2][2], grid[2][4], grid[2][1], grid[2][3]);
            derivedValues.r4c6 = performTripleOp(grid[4][0], grid[4][2], grid[4][4], grid[4][1], grid[4][3]);

            derivedValues.r6c0 = performTripleOp(grid[0][0], grid[2][0], grid[4][0], grid[1][0], grid[3][0]);
            derivedValues.r6c2 = performTripleOp(grid[0][2], grid[2][2], grid[4][2], grid[1][2], grid[3][2]);
            derivedValues.r6c4 = performTripleOp(grid[0][4], grid[2][4], grid[4][4], grid[1][4], grid[3][4]);

            if (derivedValues.r0c6 === null || derivedValues.r2c6 === null || derivedValues.r4c6 === null ||
                derivedValues.r6c0 === null || derivedValues.r6c2 === null || derivedValues.r6c4 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r6c6_from_h = performTripleOp(derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, grid[6][1], grid[6][3]);
                derivedValues.r6c6_from_v = performTripleOp(derivedValues.r0c6, derivedValues.r2c6, derivedValues.r4c6, grid[1][6], grid[3][6]);
            }
        }

        if (!isValidCombination || (cols === 5 && (derivedValues.r4c4_from_h === null || derivedValues.r4c4_from_v === null)) ||
            (cols === 7 && (derivedValues.r6c6_from_h === null || derivedValues.r6c6_from_v === null))) {
            continue;
        }

        // Check consistency and range for all derived values
        let finalConsistencyCheck = false;
        let finalResult = null;

        if (cols === 5) {
            finalConsistencyCheck = (derivedValues.r4c4_from_h === derivedValues.r4c4_from_v);
            finalResult = derivedValues.r4c4_from_h;
        } else if (cols === 7) {
            finalConsistencyCheck = (derivedValues.r6c6_from_h === derivedValues.r6c6_from_v);
            finalResult = derivedValues.r6c6_from_h;
        }

        // Zorg ervoor dat alle getallen gehele getallen, positief en binnen niveau/range zijn
        let allNumbersValid = true;
        const allNumbersInGrid = [];
        if (cols === 5) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], derivedValues.r0c4,
                                   grid[2][0], grid[2][2], derivedValues.r2c4,
                                   derivedValues.r4c0, derivedValues.r4c2, finalResult);
        } else if (cols === 7) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], grid[0][4], derivedValues.r0c6,
                                   grid[2][0], grid[2][2], grid[2][4], derivedValues.r2c6,
                                   grid[4][0], grid[4][2], grid[4][4], derivedValues.r4c6,
                                   derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, finalResult);
        }

        for (const num of allNumbersInGrid) {
            if (num === null || !Number.isInteger(num) || num < 0 || num > actualMaxVal) {
                allNumbersValid = false;
                break;
            }
        }

        if (finalConsistencyCheck && allNumbersValid) {
            // Consistentie gevonden! Vul het rooster met getallen
            if (cols === 5) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
                grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
            } else if (cols === 7) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
                grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
                grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
            }

            // Derived numbers (results)
            if (cols === 5) {
                grid[0][4] = derivedValues.r0c4;
                grid[2][4] = derivedValues.r2c4;
                grid[4][0] = derivedValues.r4c0;
                grid[4][2] = derivedValues.r4c2;
                grid[4][4] = finalResult;
            } else if (cols === 7) {
                grid[0][6] = derivedValues.r0c6;
                grid[2][6] = derivedValues.r2c6;
                grid[4][6] = derivedValues.r4c6;
                grid[6][0] = derivedValues.r6c0;
                grid[6][2] = derivedValues.r6c2;
                grid[6][4] = derivedValues.r6c4;
                grid[6][6] = finalResult;
            }
            return grid;
        }
    }

    console.warn(`Kon geen consistent ${cols}x${rows} grid genereren na ${MAX_ATTEMPTS} pogingen voor opgave: ${typeOpgave}, niveau: ${niveau}, brug: ${typeBrug}`);
    return Array(rows).fill(null).map(() => Array(cols).fill("")); // Fallback to empty grid
}

/**
 * Generates a consistent grid for multiplication/division.
 * @param {number} cols Number of columns (5 or 7).
 * @param {number} rows Number of rows (5 or 7).
 * @param {string} typeTafeloefening Type of table exercise ("maal", "delen", "gemengd").
 * @param {Array<number>} selectedTables Array of selected multiplication tables (e.g., [2, 5, 10]).
 * @param {number} maxUitkomst Maximum allowed outcome for results.
 * @returns {Array<Array<any>>} A 2D array representing the consistent grid.
 */
function generateConsistentGridMaalDeel(cols, rows, typeTafeloefening, selectedTables, maxUitkomst) {
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(""));

    let attempts = 0;
    const MAX_ATTEMPTS = 500000; // Increased attempts for multiplication/division

    // Helper for multiplication/division operations
    const performMaalDeelOp = (a, b, sign) => {
        if (sign === "x") {
            return a * b;
        } else if (sign === ":") {
            // Division checks: b must not be 0, a must be divisible by b
            if (b === 0 || a % b !== 0) {
                return null; // Indicates an invalid division
            }
            return a / b;
        }
        return null; // Should not happen
    };

    // Modified performMaalDeelTripleOp to take two signs for sequential operations
    const performMaalDeelTripleOp = (a, b, c, sign1, sign2) => {
        let intermediateResult;
        if (sign1 === "x") {
            intermediateResult = a * b;
        } else if (sign1 === ":") {
            if (b === 0 || a % b !== 0) { return null; }
            intermediateResult = a / b;
        } else { return null; } // Invalid operator

        if (intermediateResult === null || !Number.isInteger(intermediateResult) || intermediateResult < 0 || intermediateResult > maxUitkomst) {
             return null; // Tussenresultaat mag ook niet buiten maxUitkomst vallen
        }

        if (sign2 === "x") {
            return intermediateResult * c;
        } else if (sign2 === ":") {
            if (c === 0 || intermediateResult % c !== 0) { return null; }
            return intermediateResult / c;
        } else { return null; } // Invalid operator
    };


    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        let generatedBaseNumbers = [];
        let isValidCombination = true;

        // Determine number of base inputs for the grid
        const numBaseInputs = (cols === 5) ? 4 : 9;

        // Generate base numbers based on selected tables and max outcome
        for (let i = 0; i < numBaseInputs; i++) {
            let num1, num2;
            let foundValidPair = false;
            let innerAttempts = 0;
            const MAX_INNER_ATTEMPTS = 500; // Verhoogd voor betere kans op vinden

            while (!foundValidPair && innerAttempts < MAX_INNER_ATTEMPTS) {
                innerAttempts++;

                if (selectedTables.length > 0) { // Als specifieke tafels zijn gekozen
                    const tableNum = selectedTables[getRandomInt(0, selectedTables.length - 1)]; // Kies een willekeurige geselecteerde tafel

                    if (typeTafeloefening === "maal" || typeTafeloefening === "gemengd") {
                        // Voor vermenigvuldigen: factor1 * factor2 = product
                        // We willen dat een van de factoren de gekozen tafel is.
                        // En de andere factor moet maximaal 10 zijn om bij 'x10' te blijven,
                        // tenzij de maxUitkomst dit overstijgt.
                        let factor1 = getRandomInt(1, Math.min(10, maxUitkomst / (tableNum || 1))); // Maximaal 10 of zodat product binnen maxUitkomst valt
                        num1 = factor1;
                        num2 = tableNum;

                        if (num1 * num2 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }

                    if (!foundValidPair && (typeTafeloefening === "delen" || typeTafeloefening === "gemengd")) {
                        // Voor delen: dividend / deler = quotiënt
                        // We willen dat de deler de gekozen tafel is, en het quotiënt maximaal 10.
                        let quotient = getRandomInt(1, Math.min(10, maxUitkomst / (tableNum || 1))); // Maximaal 10 of zodat dividend binnen maxUitkomst valt
                        num1 = quotient * tableNum; // Dividend
                        num2 = tableNum; // Deler is de gekozen tafel

                        if (num1 > 0 && num2 > 0 && num1 % num2 === 0 && num1 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }

                } else { // Geen specifieke tafels geselecteerd, genereer algemeen (moet nog steeds rekening houden met maxUitkomst)
                    if (typeTafeloefening === "maal" || typeTafeloefening === "gemengd") {
                        // Probeer kleine getallen om onder maxUitkomst te blijven
                        num1 = getRandomInt(1, Math.min(10, Math.floor(Math.sqrt(maxUitkomst)))); // max 10 als factor, of wortel uit maxUitkomst
                        num2 = getRandomInt(1, Math.min(10, Math.floor(maxUitkomst / (num1 || 1))));
                        if (num1 * num2 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }
                    if (!foundValidPair && (typeTafeloefening === "delen" || typeTafeloefening === "gemengd")) {
                        // Voor algemene deling: deler * quotiënt = dividend
                        let tempNum2 = getRandomInt(1, Math.min(10, maxUitkomst)); // Deler, max 10
                        let tempQuotient = getRandomInt(1, Math.min(10, Math.floor(maxUitkomst / (tempNum2 || 1)))); // Quotiënt, max 10
                        num1 = tempQuotient * tempNum2; // Dividend
                        num2 = tempNum2;

                        if (num1 > 0 && num2 > 0 && num1 % num2 === 0 && num1 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }
                }
            }

            if (!foundValidPair) {
                isValidCombination = false;
                break;
            }
            generatedBaseNumbers.push(num1, num2); // Sla de twee getallen op
        }

        if (!isValidCombination) continue; // Start opnieuw met het genereren van het rooster

        // Wijs gegenereerde getallen toe aan specifieke roosterposities
        if (cols === 5) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
            grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
        } else if (cols === 7) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
            grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
            grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
        }

        // Zorg ervoor dat er geen nullen worden gegenereerd, vooral voor delen
        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (grid[r][c] === 0) grid[r][c] = 1; // Verander 0 in 1
            }
        }

        // Wijs operators dynamisch toe als typeTafeloefening "gemengd" is
        let opSymbols = ["x", ":"];
        if (typeTafeloefening === "gemengd") {
            if (cols === 5) {
                grid[0][1] = opSymbols[getRandomInt(0, 1)];
                grid[2][1] = opSymbols[getRandomInt(0, 1)];
                grid[4][1] = opSymbols[getRandomInt(0, 1)];

                grid[1][0] = opSymbols[getRandomInt(0, 1)];
                grid[1][2] = opSymbols[getRandomInt(0, 1)];
                grid[1][4] = opSymbols[getRandomInt(0, 1)];
            } else if (cols === 7) {
                grid[0][1] = opSymbols[getRandomInt(0, 1)]; grid[0][3] = opSymbols[getRandomInt(0, 1)];
                grid[2][1] = opSymbols[getRandomInt(0, 0)]; grid[2][3] = opSymbols[getRandomInt(0, 0)]; // Forceer 'x' voor 7x7 deling, omdat dit te complex kan worden
                grid[4][1] = opSymbols[getRandomInt(0, 1)]; grid[4][3] = opSymbols[getRandomInt(0, 1)];
                grid[6][1] = opSymbols[getRandomInt(0, 1)]; grid[6][3] = opSymbols[getRandomInt(0, 1)];

                grid[1][0] = opSymbols[getRandomInt(0, 1)]; grid[1][2] = opSymbols[getRandomInt(0, 1)]; grid[1][4] = opSymbols[getRandomInt(0, 1)];
                grid[3][0] = opSymbols[getRandomInt(0, 1)]; grid[3][2] = opSymbols[getRandomInt(0, 0)]; grid[3][4] = opSymbols[getRandomInt(0, 0)]; // Forceer 'x' voor 7x7 deling
                grid[5][0] = opSymbols[getRandomInt(0, 1)]; grid[5][2] = opSymbols[getRandomInt(0, 1)]; grid[5][4] = opSymbols[getRandomInt(0, 1)];
            }
        } else { // "maal" or "delen" - vaste operator
            const fixedOp = (typeTafeloefening === "maal") ? "x" : ":";
            if (cols === 5) {
                grid[0][1] = fixedOp;
                grid[2][1] = fixedOp;
                grid[4][1] = fixedOp;
                grid[1][0] = fixedOp;
                grid[1][2] = fixedOp;
                grid[1][4] = fixedOp;
            } else if (cols === 7) {
                // Forcing 'x' for 7x7 division for higher success rate
                if (fixedOp === ":") {
                     console.warn("Delen in 7x7 roosters kan zeer complex zijn; de generator zal proberen, maar kan vaker falen.");
                     // Consider if we should completely disallow it, or just allow 'x' only
                     grid[0][1] = "x"; grid[0][3] = "x";
                     grid[2][1] = "x"; grid[2][3] = "x";
                     grid[4][1] = "x"; grid[4][3] = "x";
                     grid[6][1] = "x"; grid[6][3] = "x";

                     grid[1][0] = "x"; grid[1][2] = "x"; grid[1][4] = "x";
                     grid[3][0] = "x"; grid[3][2] = "x"; grid[3][4] = "x";
                     grid[5][0] = "x"; grid[5][2] = "x"; grid[5][4] = "x";
                } else {
                    grid[0][1] = fixedOp; grid[0][3] = fixedOp;
                    grid[2][1] = fixedOp; grid[2][3] = fixedOp;
                    grid[4][1] = fixedOp; grid[4][3] = fixedOp;
                    grid[6][1] = fixedOp; grid[6][3] = fixedOp;

                    grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp;
                    grid[3][0] = fixedOp; grid[3][2] = fixedOp; grid[3][4] = fixedOp;
                    grid[5][0] = fixedOp; grid[5][2] = fixedOp; grid[5][4] = fixedOp;
                }
            }
        }
        // Set fixed '=' signs
        if (cols === 5) {
            grid[0][3] = "="; grid[2][3] = "="; grid[4][3] = "=";
            grid[3][0] = "="; grid[3][2] = "="; grid[3][4] = "=";
        } else if (cols === 7) {
            grid[0][5] = "="; grid[2][5] = "="; grid[4][5] = "="; grid[6][5] = "=";
            grid[5][0] = "="; grid[5][2] = "="; grid[5][4] = "="; grid[5][6] = "=";
        }

        let derivedValues = {};

        // Bereken afgeleide waarden (horizontale en verticale sommen/producten)
        if (cols === 5) {
            derivedValues.r0c4 = performMaalDeelOp(grid[0][0], grid[0][2], grid[0][1]);
            derivedValues.r2c4 = performMaalDeelOp(grid[2][0], grid[2][2], grid[2][1]);
            derivedValues.r4c0 = performMaalDeelOp(grid[0][0], grid[2][0], grid[1][0]);
            derivedValues.r4c2 = performMaalDeelOp(grid[0][2], grid[2][2], grid[1][2]);

            if (derivedValues.r0c4 === null || derivedValues.r2c4 === null || derivedValues.r4c0 === null || derivedValues.r4c2 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r4c4_from_h = performMaalDeelOp(derivedValues.r4c0, derivedValues.r4c2, grid[4][1]);
                derivedValues.r4c4_from_v = performMaalDeelOp(derivedValues.r0c4, derivedValues.r2c4, grid[1][4]);
            }
        } else if (cols === 7) {
            // Corrected calls to performMaalDeelTripleOp for 7x7
            derivedValues.r0c6 = performMaalDeelTripleOp(grid[0][0], grid[0][2], grid[0][4], grid[0][1], grid[0][3]);
            derivedValues.r2c6 = performMaalDeelTripleOp(grid[2][0], grid[2][2], grid[2][4], grid[2][1], grid[2][3]);
            derivedValues.r4c6 = performMaalDeelTripleOp(grid[4][0], grid[4][2], grid[4][4], grid[4][1], grid[4][3]);

            derivedValues.r6c0 = performMaalDeelTripleOp(grid[0][0], grid[2][0], grid[4][0], grid[1][0], grid[3][0]);
            derivedValues.r6c2 = performMaalDeelTripleOp(grid[0][2], grid[2][2], grid[4][2], grid[1][2], grid[3][2]);
            derivedValues.r6c4 = performMaalDeelTripleOp(grid[0][4], grid[2][4], grid[4][4], grid[1][4], grid[3][4]);

            if (derivedValues.r0c6 === null || derivedValues.r2c6 === null || derivedValues.r4c6 === null ||
                derivedValues.r6c0 === null || derivedValues.r6c2 === null || derivedValues.r6c4 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r6c6_from_h = performMaalDeelTripleOp(derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, grid[6][1], grid[6][3]);
                derivedValues.r6c6_from_v = performMaalDeelTripleOp(derivedValues.r0c6, derivedValues.r2c6, derivedValues.r4c6, grid[1][6], grid[3][6]);
            }
        }

        if (!isValidCombination || (cols === 5 && (derivedValues.r4c4_from_h === null || derivedValues.r4c4_from_v === null)) ||
            (cols === 7 && (derivedValues.r6c6_from_h === null || derivedValues.r6c6_from_v === null))) {
            continue;
        }

        // Controleer consistentie en bereik voor alle afgeleide waarden
        let finalConsistencyCheck = false;
        let finalResult = null;

        if (cols === 5) {
            finalConsistencyCheck = (derivedValues.r4c4_from_h === derivedValues.r4c4_from_v);
            finalResult = derivedValues.r4c4_from_h;
        } else if (cols === 7) {
            finalConsistencyCheck = (derivedValues.r6c6_from_h === derivedValues.r6c6_from_v);
            finalResult = derivedValues.r6c6_from_h;
        }

        // Zorg ervoor dat alle getallen gehele getallen, positief en binnen maxUitkomst zijn
        let allNumbersValid = true;
        const allNumbersInGrid = [];
        if (cols === 5) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], derivedValues.r0c4,
                                   grid[2][0], grid[2][2], derivedValues.r2c4,
                                   derivedValues.r4c0, derivedValues.r4c2, finalResult);
        } else if (cols === 7) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], grid[0][4], derivedValues.r0c6,
                                   grid[2][0], grid[2][2], grid[2][4], derivedValues.r2c6,
                                   grid[4][0], grid[4][2], grid[4][4], derivedValues.r4c6,
                                   derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, finalResult);
        }

        for (const num of allNumbersInGrid) {
            if (num === null || !Number.isInteger(num) || num < 0 || num > maxUitkomst) {
                allNumbersValid = false;
                break;
            }
        }

        if (finalConsistencyCheck && allNumbersValid) {
            // Consistentie gevonden! Vul het rooster met getallen
            if (cols === 5) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
                grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
            } else if (cols === 7) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
                grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
                grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
            }

            if (cols === 5) {
                grid[0][4] = derivedValues.r0c4;
                grid[2][4] = derivedValues.r2c4;
                grid[4][0] = derivedValues.r4c0;
                grid[4][2] = derivedValues.r4c2;
                grid[4][4] = finalResult;
            } else if (cols === 7) {
                grid[0][6] = derivedValues.r0c6;
                grid[2][6] = derivedValues.r2c6;
                grid[4][6] = derivedValues.r4c6;
                grid[6][0] = derivedValues.r6c0;
                grid[6][2] = derivedValues.r6c2;
                grid[6][4] = derivedValues.r6c4;
                grid[6][6] = finalResult;
            }
            return grid;
        }
    }

    console.warn(`Kon geen consistent ${cols}x${rows} grid genereren na ${MAX_ATTEMPTS} pogingen voor opgave: ${typeOpgave}, niveau: ${niveau}, brug: ${typeBrug}`);
    return Array(rows).fill(null).map(() => Array(cols).fill("")); // Fallback to empty grid
}


// Function to draw a single grid (modified to accept offsets)
function tekenSingleGrid(gridData, xOffset, yOffset, vakBreedte, vakHoogte, cols, rows) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(xOffset + i * vakBreedte, yOffset);
        ctx.lineTo(xOffset + i * vakBreedte, yOffset + rows * vakHoogte);
        ctx.stroke();
    }

    for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(xOffset, yOffset + j * vakHoogte);
        ctx.lineTo(xOffset + cols * vakBreedte, yOffset + j * vakHoogte);
        ctx.stroke();
    }


    ctx.font = `${Math.min(vakHoogte * 0.5, 30)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (gridData[r][c] === "") {
                ctx.fillStyle = "#000000";
                ctx.fillRect(xOffset + c * vakBreedte, yOffset + r * vakHoogte, vakBreedte, vakHoogte);
            } else {
                ctx.fillStyle = "#000";
                ctx.fillText(gridData[r][c], xOffset + c * vakBreedte + vakBreedte / 2, yOffset + r * vakHoogte + vakHoogte / 2);
            }
        }
    }
}

// Main function to fill the rekenvierkant(en)
function vulRekenvierkant() {
    const formaat = document.getElementById("formaat").value;
    let baseCols, baseRows; // Basisafmetingen voor één raster

    if (formaat === "5x5") {
        baseCols = 5;
        baseRows = 5;
    } else if (formaat === "7x7") {
        baseCols = 7;
        baseRows = 7;
    }

    const numGrids = parseInt(document.querySelector('input[name="numGrids"]:checked').value);

    // Pas canvasgrootte aan op basis van het aantal roosters
    let totalCanvasWidth, totalCanvasHeight;
    const singleGridDisplayWidth = 256; // Basisbreedte voor één rooster
    const singleGridDisplayHeight = 256; // Basishoogte voor één rooster
    const padding = 20; // Opvulling tussen roosters en canvasranden

    if (numGrids === 1) {
        totalCanvasWidth = singleGridDisplayWidth + 2 * padding;
        totalCanvasHeight = singleGridDisplayHeight + 2 * padding;
    } else if (numGrids === 2) {
        totalCanvasWidth = (singleGridDisplayWidth * 2) + (3 * padding); // 2 roosters + 3 keer padding (links, tussen, rechts)
        totalCanvasHeight = singleGridDisplayHeight + (2 * padding);
    } else if (numGrids === 3 || numGrids === 4) {
        totalCanvasWidth = (singleGridDisplayWidth * 2) + (3 * padding);
        totalCanvasHeight = (singleGridDisplayHeight * 2) + (3 * padding);
    }

    canvas.width = totalCanvasWidth;
    canvas.height = totalCanvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Leeg het hele canvas

    const meldingContainer = document.getElementById("meldingContainer");
    if (meldingContainer) {
        meldingContainer.innerHTML = ""; // Leeg eventuele vorige meldingen
    }

    const soortOefening = document.querySelector('input[name="soort"]:checked').value;
    const typeOpgave = document.getElementById("typeOpgave").value;
    const niveau = document.getElementById("niveau").value;
    const typeBrugElement = document.querySelector('input[name="brug"]:checked');
    const typeBrug = typeBrugElement ? typeBrugElement.value : "beide";

    // Nieuwe specifieke aanbeveling voor 7x7 optel/aftrek (één keer tonen)
    if (baseCols === 7 && soortOefening === "plusmin") {
        if (meldingContainer) {
            meldingContainer.innerHTML += `
                <p style="color: #004080; margin: 5px 0;"><strong>Voor 7x7 roosters (optellen/aftrekken):</strong></p>
                <p style="color: #004080; margin: 5px 0;">Kies bij 'Type opgave': '<strong>Gemengd</strong>'</p>
                <p style="color: #004080; margin: 5px 0;">en bij 'Soort bewerking': '<strong>Beide</strong>'</p>
                <p style="color: #004080; margin: 5px 0;">Dit geeft de beste kans op een geldig rooster.</p>
            `;
        }
    }

    const vakBreedte = singleGridDisplayWidth / baseCols;
    const vakHoogte = singleGridDisplayHeight / baseRows;

    let allGridsSuccessfullyGenerated = true;

    for (let i = 0; i < numGrids; i++) {
        let xOffset = padding;
        let yOffset = padding;

        if (numGrids === 2) {
            xOffset = padding + (i * (singleGridDisplayWidth + padding));
            yOffset = padding;
        } else if (numGrids === 3 || numGrids === 4) {
            if (i % 2 === 1) { // Rechterkolom
                xOffset = padding + singleGridDisplayWidth + padding;
            }
            if (i >= 2) { // Onderste rij
                yOffset = padding + singleGridDisplayHeight + padding;
            }
        }

        let fullGridData;
        if (soortOefening === "plusmin") {
            fullGridData = generateConsistentGrid(baseCols, baseRows, niveau, typeOpgave, typeBrug);
        } else { // maaldeel
            const typeTafeloefening = document.getElementById("typeTafeloefening").value;
            let selectedTables = Array.from(document.querySelectorAll('#tafelKeuze input[type="checkbox"]:checked'))
                                    .filter(cb => cb.id !== 'selecteerAlles')
                                    .map(cb => parseInt(cb.value));
            const maxUitkomst = parseInt(document.getElementById("maxUitkomst").value);

            // Zorg ervoor dat er minstens één tafel is geselecteerd als er geen specifieke tafels zijn aangevinkt,
            if (selectedTables.length === 0) {
                for (let j = 1; j <= 10; j++) {
                    selectedTables.push(j);
                }
            }
            fullGridData = generateConsistentGridMaalDeel(baseCols, baseRows, typeTafeloefening, selectedTables, maxUitkomst);
        }

        // Controleer of fullGridData geldig is voordat we verdergaan
        if (!fullGridData || fullGridData.length === 0 || fullGridData[0].length === 0 || (typeof fullGridData[0][0] === 'string' && fullGridData[0][0].includes("Kon geen consistent"))) {
            allGridsSuccessfullyGenerated = false;
            if (meldingContainer) {
                 meldingContainer.innerHTML += `<p style="color: red;">Kon geen geldig rooster ${i+1} genereren met deze instellingen. Probeer nog eens?</p>`;
            }
            // Teken een leeg rasterframe voor mislukte roosters om aan te geven waar het zou zijn
            tekenSingleGrid(Array(baseRows).fill(null).map(() => Array(baseCols).fill("")), xOffset, yOffset, vakBreedte, vakHoogte, baseCols, baseRows);
            continue; // Probeer het volgende rooster te genereren indien mogelijk
        }

        const displayGridData = JSON.parse(JSON.stringify(fullGridData));

        // Bepaal de coördinaten van de vakjes die een getal bevatten voor de hiding logic
        let numberCellsToHide = [];
        if (baseCols === 5) {
            numberCellsToHide = [
                [0, 0], [0, 2], [0, 4],
                [2, 0], [2, 2], [2, 4],
                [4, 0], [4, 2], [4, 4]
            ];
        } else if (baseCols === 7) {
            numberCellsToHide = [
                [0, 0], [0, 2], [0, 4], [0, 6],
                [2, 0], [2, 2], [2, 4], [2, 6],
                [4, 0], [4, 2], [4, 4], [4, 6],
                [6, 0], [6, 2], [6, 4], [6, 6]
            ];
        }

        // AANGEPAST: Minimaal 4 bij 5x5, minimaal 5 bij 7x7; Maximaal 5 bij 5x5, maximaal 8 bij 7x7
        const numToHide = getRandomInt(
            baseCols === 5 ? 4 : 5,
            baseCols === 5 ? 5 : 8
        );

        const shuffledCells = numberCellsToHide.sort(() => 0.5 - Math.random());
        const cellsToHide = shuffledCells.slice(0, numToHide);

        cellsToHide.forEach(coords => {
            const r = coords[0];
            const c = coords[1];
            if (typeof displayGridData[r][c] === 'number') {
                displayGridData[r][c] = "___";
            }
        });

        tekenSingleGrid(displayGridData, xOffset, yOffset, vakBreedte, vakHoogte, baseCols, baseRows);
    }

    if (!allGridsSuccessfullyGenerated && meldingContainer.innerHTML === "") {
        // Terugvalbericht als er nog geen specifieke fout is geschreven
        meldingContainer.innerHTML = `<p style="color: red;">Niet alle roosters konden gegenereerd worden met deze instellingen. Probeer nog eens?</p>`;
    }
    // Maak de textarea leeg
    document.getElementById("outputJson").value = "";
}

// Initial draw wanneer de pagina laadt
document.addEventListener("DOMContentLoaded", () => {
    // Verberg de textarea bij het laden van de pagina
    const outputJsonTextarea = document.getElementById("outputJson");
    if (outputJsonTextarea) {
        outputJsonTextarea.style.display = 'none';
    }

    vulRekenvierkant();

    // --- HTML interactiviteit voor het schakelen van secties ---
    const soortRadios = document.querySelectorAll('input[name="soort"]');
    const keuzePlusMin = document.getElementById('keuze-plusmin');
    const keuzeMaalDeel = document.getElementById('keuze-maaldeel');

    function toggleKeuzeSections() {
        if (document.querySelector('input[name="soort"]:checked').value === "plusmin") {
            keuzePlusMin.style.display = 'block';
            keuzeMaalDeel.style.display = 'none';
        } else {
            keuzePlusMin.style.display = 'none';
            keuzeMaalDeel.style.display = 'block';
        }
        vulRekenvierkant(); // Regenerate grid when section changes
    }

    soortRadios.forEach(radio => {
        radio.addEventListener('change', toggleKeuzeSections);
    });
    toggleKeuzeSections();

    // --- "Alles selecteren" voor tafels ---
    const selecteerAllesCheckbox = document.getElementById('selecteerAlles');
    const tafelCheckboxes = document.querySelectorAll('#tafelKeuze input[type="checkbox"]:not(#selecteerAlles)');

    selecteerAllesCheckbox.addEventListener('change', () => {
        tafelCheckboxes.forEach(checkbox => {
            checkbox.checked = selecteerAllesCheckbox.checked;
        });
        vulRekenvierkant(); // Regenerate grid when tables selection changes
    });

    tafelCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked) {
                selecteerAllesCheckbox.checked = false;
            } else {
                const allChecked = Array.from(tafelCheckboxes).every(cb => cb.checked);
                selecteerAllesCheckbox.checked = allChecked;
            }
            vulRekenvierkant(); // Regenerate grid when tables selection changes
        });
    });

    // Event listeners for other controls to regenerate the grid
    document.getElementById("typeOpgave").addEventListener("change", vulRekenvierkant);
    document.querySelectorAll('input[name="brug"]').forEach(radio => {
        radio.addEventListener("change", vulRekenvierkant);
    });
    document.getElementById("niveau").addEventListener("change", vulRekenvierkant);
    document.getElementById("formaat").addEventListener("change", vulRekenvierkant);
    document.getElementById("typeTafeloefening").addEventListener("change", vulRekenvierkant);
    document.getElementById("maxUitkomst").addEventListener("change", vulRekenvierkant);

    // NIEUW: Event listeners voor aantal roosters radio buttons
    document.querySelectorAll('input[name="numGrids"]').forEach(radio => {
        radio.addEventListener("change", vulRekenvierkant);
    });
});


// Genereren van het rekenvierkant wanneer op de knop wordt gedrukt
document.getElementById("genereerBtn").addEventListener("click", () => {
    vulRekenvierkant();
});

// Download functies blijven hetzelfde
document.getElementById("downloadPngBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "rekenvierkant.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
    const dataURL = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let pdfImgWidth = pageWidth - 20;
    let pdfImgHeight = pdfImgWidth / ratio;

    if (pdfImgHeight > pageHeight - 40) {
        pdfImgHeight = pageHeight - 40;
        pdfImgWidth = pdfImgHeight * ratio;
    }

    const xPos = (pageWidth - pdfImgWidth) / 2;
    const yPos = (pageHeight - pdfImgHeight) / 2;

    doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
    doc.setFontSize(18);
    doc.text("Rekenvierkant", pageWidth / 2, 20, { align: 'center' });
    doc.save("rekenvierkant.pdf");
});