'use strict'

document.addEventListener("DOMContentLoaded", function(e) {
    init();
});


function init() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    let widthCanvas, heightCanvas;
    
    widthCanvas = width;
    heightCanvas = Math.floor(width * 5 / 7);
    
    if (width > 800) {  
        widthCanvas = 800;
        heightCanvas = 800 * 5 / 7;
    }

    if (height > width) {
        heightCanvas = height;
    }
    
    const config = {
        type: Phaser.AUTO,
        parent: 'gameBox',
        width: widthCanvas,
        height: heightCanvas,
        hideBanner: true,
        hidePhaser: true,
        scene: [ gameScene ]
    };

    const game = new Phaser.Game(config);
}

class gameScene extends Phaser.Scene
{
    constructor () {

        super();
    }

    preload () {
        let width = this.game.canvas.width;
        let height = this.game.canvas.height;

        this.load.atlas('gems', './img/gems.png', './img/gems.json');
        this.load.atlas('energy', './img/energy.png', './img/energy.json');
        this.MaxRow = 5;
        this.MaxCol = 7;
        this.baseSize = 64;

        if (width > height) {
            width = width / 2;
        }
        
        this.step = width / 9;
        this.scale = (width / 12) / 60;
        this.ofsetX = width / 9 * (1.5);
        this.ofsetY = (width > height) ? 100 : (height - width / 7 * 4);    
        
        this.prevtime = new Date().getTime(); 
        this.deltaTime = 0;

        this.matrix = new Array(this.MaxRow);
        for (let i = 0; i < this.MaxRow; i ++){
            this.matrix[i] = new Array(this.MaxCol).fill();
        }
    }

    create () {
        this.firstSelBlock;
        this.dropBlocks = [];
        this.enrgiesBlocks = []
        this.gameScore = 0;
        
        this.gameBoard;

        this.energy = this.anims.create({ key: 'energy', delay :0, hideOnComplete: true, frames: this.anims.generateFrameNames('energy', { prefix: 'energy_', end: 15, zeroPad: 4 }), repeat: 0 });
        this.diamond = this.anims.create({ key: 'diamond', frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }), repeat: -1 });
        this.prism = this.anims.create({ key: 'prism', frames: this.anims.generateFrameNames('gems', { prefix: 'prism_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.ruby = this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.square = this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });
        this.animsBlock = [this.diamond, this.prism, this.ruby, this.square]; 

        for (let curRow = 0; curRow < this.MaxRow; curRow ++) {
            for (let curCol = 0; curCol < this.MaxCol; curCol ++) {
                this.matrix[curRow][curCol] = {};
                this.matrix[curRow][curCol].block = this.newBlock(curRow, curCol);
            }
        }
    }

    update() {

        this.deltaTime = new Date().getTime() - this.prevtime;
        this.prevtime += this.deltaTime;
        
        if (this.dropBlocks.length > 0) {
            this.dropAimation(this.dropBlocks);                
        } else {
            while (this.checkMatches()) {
//                console.log("again");
            }
        }

        if (this.enrgiesBlocks.length > 0) {
            this.enrgiesBlocks.forEach(block => {
                block.ttl = block.ttl - this.deltaTime;
                if (block.ttl < 0) {
                    block.destroy();
                }
            })
        }
    }

    /* return Array of lines > 3 */
    checkMatches() { 
        const lines = [];
        let line = [];
        let curKey;
        // vertical
        for (let curCol = 0; curCol < this.MaxCol; curCol ++) {
            curKey = this.matrix[0][curCol].key;
            line = [];
            line.push(this.matrix[0][curCol]); 

            for (let curRow = 1; curRow < this.MaxRow; curRow ++) {
                if (this.matrix[curRow][curCol].key === curKey) {
                    line.push(this.matrix[curRow][curCol]);
                }else{
                    if (line.length >= 3) { 
                        lines.push(line);
                    }
                    line = [];
                    curKey = this.matrix[curRow][curCol].key;
                    line.push(this.matrix[curRow][curCol]);
                }
                if (curRow === this.MaxRow-1) {
                    if (line.length >= 3) { 
                        lines.push(line);
                    }
                    line = [];
                    continue;
                }

            }       
        }
        // horizontal
        for (let curRow = 0; curRow < this.MaxRow; curRow ++) {
            curKey = this.matrix[curRow][0].key;
            line = [];
            line.push(this.matrix[curRow][0]); 

            for (let curCol = 1; curCol < this.MaxCol; curCol ++) {

                if (this.matrix[curRow][curCol].key === curKey) {
                    line.push(this.matrix[curRow][curCol]);
                }else{
                    if (line.length >= 3) { 
                        lines.push(line);
                    }
                    line = [];
                    curKey = this.matrix[curRow][curCol].key;
                    line.push(this.matrix[curRow][curCol]);
                }

                if (curCol === this.MaxCol-1) {
                    if (line.length >= 3) { 
                        lines.push(line);
                    }
                    line = [];
                    continue;
                }
            }       
        }
        if (lines.length > 0) {
            this.collapse(lines);
            this.dropped();

            return true;
        }
        return false;
    }


    checkPossibleMove () {

    }
    

    collapse(blocks) {
        blocks.forEach(line => {
            line.forEach( element => {
                this.matrix[element.block.row][element.block.col].key = null;

                let block = this.add.sprite(element.block.x, element.block.y, 'energy');
                block.play(this.energy);
                block.ttl = 300; 
                this.enrgiesBlocks.push(block);
                this.matrix[element.block.row][element.block.col].block.destroy();
            })
        })
    }


    clicked (element) {
        element.stop();
        if (this.firstSelBlock == null) {     
            this.firstSelBlock = element;
            return;
         // повторный клик на первой фишке    
         } else if (this.firstSelBlock == element) {   
            element.play(this.animsBlock[this.matrix[element.row][element.col].key]);
            this.firstSelBlock = null; 
            return;
        }
        // проверка что соседи
        if ( Math.abs(this.firstSelBlock.row - element.row) + Math.abs(this.firstSelBlock.col - element.col) === 1 ) {
            this.makeSwap(this.firstSelBlock, element);
        }else{
            this.firstSelBlock.play(this.animsBlock[this.matrix[this.firstSelBlock.row][this.firstSelBlock.col].key]);
            this.firstSelBlock = element;
        }
    }


    makeSwap(element1, element2, force = 0) {
        //try
        let tmp = this.matrix[element2.row][element2.col].key;
        this.matrix[element2.row][element2.col].key = this.matrix[element1.row][element1.col].key; 
        this.matrix[element1.row][element1.col].key = tmp; 
        element1.play(this.animsBlock[this.matrix[element1.row][element1.col].key]);
        element2.play(this.animsBlock[this.matrix[element2.row][element2.col].key]);
        this.firstSelBlock = null; 

        if(force || this.checkMatches()) {
            return;
        }else{
            this.makeSwap(element1, element2, 1)
        };
    }


    dropped() {

        for (let curCol = 0; curCol < this.MaxCol; curCol ++) {
            let empties = 0;

            for (let curRow = (this.MaxRow - 1); curRow >= 0; curRow --) {

                if (this.matrix[curRow][curCol].key === null) {
                    empties++;
                }else if (empties > 0) {
                // shift current block
                    this.matrix[curRow + empties][curCol].key = this.matrix[curRow][curCol].key;
                    this.matrix[curRow + empties][curCol].block = this.matrix[curRow][curCol].block;
                    this.matrix[curRow][curCol].key = 'energy';
                    this.matrix[curRow + empties][curCol].block.col = curCol;
                    this.matrix[curRow + empties][curCol].block.row = curRow + empties;

                    this.matrix[curRow + empties][curCol].block.newY = this.ofsetY + (curRow + empties) * this.step;
                    this.matrix[curRow + empties][curCol].block.dy = empties * 2;
                    this.dropBlocks.push(this.matrix[curRow + empties][curCol].block);
                }
            }
                // create new blocks
            if (empties !== 0) {
                for (let i= 0; i < empties; i ++) {
                    let block = this.newBlock(i, curCol, -1, curCol);
                    block.newY = block.y + empties * this.step;
                    block.dy = i;
                    this.matrix[i][curCol].block = block;
                    this.matrix[i][curCol].block.newY = this.ofsetY + i * this.step;
                    this.matrix[i][curCol].block.dy = empties * 2;
                    this.dropBlocks.push(block);
                }
            }
        }
    }


    newBlock(curRow, curCol, posRow = curRow, posCol = curCol) {
        let key = Math.floor(Math.random()*4);
        (this.matrix[curRow][curCol] && (this.matrix[curRow][curCol].key = key));
        this.x = this.ofsetX + this.step * posCol;
        this.y = this.ofsetY + this.step * posRow;
        let block = this.add.sprite(this.x, this.y, 'gems');
        block.play(this.animsBlock[key]);
        block.col = curCol;
        block.row = curRow;
        block.setInteractive();
        block.on('pointerdown', () => {
            this.clicked(block);
        })
        block.setDisplaySize(this.baseSize * this.scale, this.baseSize * this.scale);
        return block;
    }


    dropAimation(blocks) {
        blocks.forEach( (block, index) => {
            if (block.newY > block.y) {
                block.y += block.dy;
            }else{
                blocks.splice(index,1);
            }
        })
    }
}