const assert = require('node:assert/strict');
const { GRID_SPECS, createSudokuWithDifficulty, planPages } = require('./sudoku_versie2_core.js');
// Onafhankelijke oplosser: controleer de geproduceerde puzzels, niet alleen de interne validator.
function solutions(board,n,br,bc) {
    const grid=board.map(r=>r.slice()); let found=0;
    function visit(){
        if(found>=2)return;
        let chosen=null;
        for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!grid[r][c]){
            const possible=[];
            for(let v=1;v<=n;v++){
                if(grid[r].includes(v)||grid.some(row=>row[c]===v))continue;
                let blocked=false;
                for(let y=r-r%br;y<r-r%br+br;y++)for(let x=c-c%bc;x<c-c%bc+bc;x++)if(grid[y][x]===v)blocked=true;
                if(!blocked)possible.push(v);
            }
            if(!possible.length)return;
            if(!chosen||possible.length<chosen.possible.length)chosen={r,c,possible};
        }
        if(!chosen){found++;return;}
        for(const v of chosen.possible){grid[chosen.r][chosen.c]=v;visit();grid[chosen.r][chosen.c]=0;if(found>=2)return;}
    } visit();return found;
}
let generated=0, layouts=0;
for(const size of [4,6,9])for(const difficulty of ['easy','medium','hard','expert']){
    const puzzles=[];
    for(let sample=0;sample<10;sample++){
        const {puzzle,solution}=createSudokuWithDifficulty(size,difficulty);
        const {blockRows:br,blockCols:bc}=GRID_SPECS[size];
        for(let r=0;r<size;r++){
            assert.equal(new Set(solution[r]).size,size);
            assert.equal(new Set(solution.map(row=>row[r])).size,size);
            for(let c=0;c<size;c++)assert.ok(puzzle[r][c]===0||puzzle[r][c]===solution[r][c]);
        }
        for(let r=0;r<size;r+=br)for(let c=0;c<size;c+=bc){const vals=[];for(let y=0;y<br;y++)for(let x=0;x<bc;x++)vals.push(solution[r+y][c+x]);assert.equal(new Set(vals).size,size);}
        assert.equal(solutions(puzzle,size,br,bc),1);
        const missing=[];puzzle.forEach((row,r)=>row.forEach((v,c)=>{if(!v)missing.push(solution[r][c]);}));
        puzzles.push({puzzle,solution,missing});generated++;
    }
    for(const count of [1,2,3,4])for(const type of ['getallen','afbeeldingen'])for(const answers of [false,true]){
        const sheet={size,type,puzzles:puzzles.slice(0,count)};
        const pages=planPages(sheet,answers);
        const grids=pages.flatMap(p=>p.grids||[]);assert.equal(grids.length,count);
        const sections=pages.flatMap(p=>p.sections||[]);
        assert.equal(sections.length,type==='afbeeldingen'&&!answers?count:0);
        for(const g of grids){assert.ok(g.side>0);assert.ok(g.x>=10&&g.x+g.side<=200);assert.ok(g.y>=40&&g.y+g.side<=282);}
        for(const p of pages){let bottom=40;for(const section of p.sections||[]){
            assert.ok(section.y>=bottom);bottom=section.y+section.height;assert.ok(bottom<=282);
            assert.equal(section.cell,grids.find(g=>g.index===section.index).side/size);
            sheet.puzzles[section.index].missing.forEach((v,i)=>{
                const x=section.x+(i%section.columns)*(section.cell+3), y=section.y+10+Math.floor(i/section.columns)*(section.cell+3);
                assert.ok(x>=10&&x+section.cell<=200);assert.ok(y>=40&&y+section.cell<=282);
            });
        }}layouts++;
    }
}
console.log(`PASS: ${generated} unieke geldige puzzels; ${layouts} pagina-indelingen, inclusief knipmaten en paginagrenzen.`);
