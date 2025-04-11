import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const BACKGROUND_COLOR = 0xfcf3cf;

const RENDERER_HEIGHT = window.innerHeight*0.9;
const RENDERER_WIDTH = window.innerWidth;

const scene = new THREE.Scene();
scene.background = new THREE.Color( BACKGROUND_COLOR );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( RENDERER_WIDTH, RENDERER_HEIGHT );
document.getElementById('scene-container').appendChild( renderer.domElement );

const textRenderer = new CSS2DRenderer();
textRenderer.setSize(RENDERER_WIDTH, RENDERER_HEIGHT);
textRenderer.domElement.style.position = 'absolute';
textRenderer.domElement.style.top = '0px';
textRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('scene-container').appendChild(textRenderer.domElement);

const camera = new THREE.PerspectiveCamera(75, RENDERER_WIDTH / RENDERER_HEIGHT, 0.1, 1000);
camera.position.z = 15;
camera.lookAt( 0, 0, 0 );

function createTitleLabel() {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title-container';
    
    const title = document.createElement('h1');
    title.textContent = 'Two Level Perfect Hash Table';
    title.className = 'title';
    titleDiv.appendChild(title);
    
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        <p style="text-align:center"><strong>Instructions:</strong></p>
        <ul>
            <li>Enter comma-separated numbers (0-100) in the input box</li>
            <li>Click "Submit" to visualize the hash table creation</li>
            <li>Use "Reset" to clear the visualization</li>
            <li>Adjust animation speed with the slider</li>
        </ul>
    `;
    titleDiv.appendChild(instructions);
    
    const titleLabel = new CSS2DObject(titleDiv);
    titleLabel.position.set(0, 0, 0); // Center of the scene
    
    return titleLabel;
}
const titleLabel = createTitleLabel();
scene.add(titleLabel);


let speedMultiplier=1;

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function estimateTextWidth(text) {
    const tempSpan = document.createElement('span');
    tempSpan.className = 'label';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.textContent = text;
    document.body.appendChild(tempSpan);
    const width = tempSpan.getBoundingClientRect().width / 100; // Convert to scene units
    document.body.removeChild(tempSpan);
    return width;
}

function createSquareWithBorder(size, fillColor) {
    const group = new THREE.Group();

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({ color: fillColor });
    const square = new THREE.Mesh(geometry, material);

    square.renderOrder = 1;
    group.add(square);

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    group.add(line);

    return group;
}

function createRightArrow(length, headSize, color) {
    const group = new THREE.Group();

    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(length, 0, 0));

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    const arrowHeadGeometry = new THREE.BufferGeometry();
    const arrowHeadVertices = new Float32Array([
        length, 0, 0,
        length - headSize, headSize/2, 0,
        length - headSize, -headSize/2, 0
    ]);
    arrowHeadGeometry.setAttribute('position', new THREE.BufferAttribute(arrowHeadVertices, 3));
    arrowHeadGeometry.setIndex([0, 1, 2]);
    const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: color });
    const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowHeadMaterial);
    group.add(arrowHead);

    return group;
}

function createTextCSS2DObj(text) {
    const div = document.createElement('div');
    div.textContent = text;

    const textObj = new CSS2DObject(div);
    return textObj;
}

function getAdjustedDuration(baseDuration) {
    return baseDuration / speedMultiplier;
}

const TOP_ROW_HEIGHT=10;
const CURRENT_STEP_HEIGHT=8;
const HASH_TEXT_POS = [0, 6];
const PRIMARY_HASH_TEXT_POS=[-10, 4];
const SECONDARY_HASH_TEXT_POS=[10, 4];
const PRIMARY_TABLE_POS=[-10, 3];
const SECONDARY_TABLE_POS=[10, 3];

const arrowLength = 1.5;
const arrowHeadSize = 0.3;
const arrowOffset = 0.3;

const primarySquareSize = 1
const primarySquareSpacing = 0.2

const secondarySquareSize = 1
const secondarySquareSpacing = 0.2


let topRowElements = [];
let currentStep = null;
let hashTextObject = null;
let primaryHashTextObj = null;
let secondaryHashTextObj = null;
let primaryTableElements = [];
let secondaryTableElements = [];

function displayS(numbers) {
    return new Promise(resolve => {
        topRowElements.forEach(element => {
            scene.remove(element);
        });
        topRowElements = [];
        
        if (numbers.length === 0) return;
        
        const topSquareSize = 0.8;
        const topSquareSpacing = 0.15;
        const totalWidth = numbers.length * topSquareSize + (numbers.length - 1) * topSquareSpacing;
        
        for (let i = 0; i < numbers.length; i++) {
            const topSquare = createSquareWithBorder(topSquareSize, new THREE.Color(1,1,1));
            const xPosition = -totalWidth/2 + i * (topSquareSize + topSquareSpacing) + topSquareSize/2;
            const yPosition = topSquareSize/2 + TOP_ROW_HEIGHT;
            
            topSquare.position.set(xPosition, yPosition, 0);
            scene.add(topSquare);
            
            const textLabel = createTextCSS2DObj(numbers[i].toString());
            textLabel.position.set(xPosition, yPosition, 0);
            scene.add(textLabel);
            topRowElements.push({
                                    square:topSquare,
                                    label:textLabel
                                });
        }

        resolve();
    });
}

function highlightTopRowElement(index, color = 0xff0000) {
    return new Promise(resolve => {
        if (topRowElements[index]) {
            topRowElements[index].square.children[0].material.color.set(color);
            
            const originalScale = topRowElements[index].square.scale.x;
            // @ts-ignore
            // @ts-ignore
            const scaleTween = { value: originalScale };
            
            let startTime = null;
            const duration = getAdjustedDuration(0.3);
            
            function pulseAnimation(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = (timestamp - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                
                const newScale = originalScale * (1 + 0.2 * Math.sin(progress * Math.PI));
                topRowElements[index].square.scale.set(newScale, newScale, newScale);
                
                if (progress < 1) {
                    requestAnimationFrame(pulseAnimation);
                } else {
                    topRowElements[index].square.scale.set(originalScale, originalScale, originalScale);
                    setTimeout(resolve, getAdjustedDuration(300));
                }
            }
            
            requestAnimationFrame(pulseAnimation);
        } else {
            resolve();
        }
    });
}

function removeTopRowElement(index) {
    return new Promise(resolve => {
        if (topRowElements[index]) {
            const element = topRowElements[index];
            
            let startTime = null;
            const duration = getAdjustedDuration(0.5);
            
            function fadeOutAnimation(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = (timestamp - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                
                const newScale = element.square.scale.x * (1 - progress);
                element.square.scale.set(newScale, newScale, newScale);
                
                element.square.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 1 - progress;
                    }
                });
                
                if (element.label && element.label.element) {
                    element.label.element.style.opacity = 1 - progress;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(fadeOutAnimation);
                } else {
                    scene.remove(element.square);
                    if (element.label) scene.remove(element.label);
                    
                    topRowElements[index] = null;
                    setTimeout(resolve, getAdjustedDuration(200));
                }
            }
            
            requestAnimationFrame(fadeOutAnimation);
        } else {
            resolve();
        }
    });
}

function updateStepText(newText) {
    return new Promise((resolve) => {
        if (!currentStep) {
            currentStep = createTextCSS2DObj('');
            currentStep.position.set(0, CURRENT_STEP_HEIGHT, 0);
            currentStep.element.classList.add('step-label');
            scene.add(currentStep);
        }
        const element = currentStep.element;
        element.classList.add('fade-out');

        setTimeout(() => {
            element.textContent = newText;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
            
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, getAdjustedDuration(500));
        }, getAdjustedDuration(300));
        resolve();
    });
}

function updateHashText(newText) {
    return new Promise((resolve) => {
        if (!hashTextObject) {
            hashTextObject = createTextCSS2DObj('');
            hashTextObject.position.set(HASH_TEXT_POS[0], HASH_TEXT_POS[1], 0);
            hashTextObject.element.classList.add('hash-text-label');
            scene.add(hashTextObject);
        }
        const element = hashTextObject.element;
        element.classList.add('fade-out');

        setTimeout(() => {
            element.textContent = newText;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
            
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, getAdjustedDuration(500));
        }, getAdjustedDuration(300));
        resolve();
    });
}

function updatePrimaryHashText(newText) {
    return new Promise((resolve) => {
        if (!primaryHashTextObj) {
            primaryHashTextObj = createTextCSS2DObj('');
            primaryHashTextObj.position.set(PRIMARY_HASH_TEXT_POS[0], PRIMARY_HASH_TEXT_POS[1], 0);
            primaryHashTextObj.element.classList.add('primary-hash-label');
            scene.add(primaryHashTextObj);
        }
        const element = primaryHashTextObj.element;
        element.textContent = newText;
        setTimeout(() => {
            resolve();
        }
        , getAdjustedDuration(500));
    });
}

function updateSecondaryHashText(newText) {
    return new Promise((resolve) => {
        if (!secondaryHashTextObj) {
            secondaryHashTextObj = createTextCSS2DObj('');
            secondaryHashTextObj.position.set(SECONDARY_HASH_TEXT_POS[0], SECONDARY_HASH_TEXT_POS[1], 0);
            secondaryHashTextObj.element.classList.add('secondary-hash-label');
            scene.add(secondaryHashTextObj);
        }
        const element = secondaryHashTextObj.element;
        element.textContent = newText;
        setTimeout(() => {
            resolve();
        }
        , getAdjustedDuration(500));
    });
}

function displayPrimaryTable(n) {
    return new Promise((resolve) => {
        // @ts-ignore
        const totalHeight = n * primarySquareSize + (n - 1) * primarySquareSpacing;

        // @ts-ignore
        // @ts-ignore
        const nilSquareSize = 0.6;

        for (let i = 0; i < n; i++) {
            const square = createSquareWithBorder(primarySquareSize, new THREE.Color(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5));
            
            const yPosition = - i * (primarySquareSize + primarySquareSpacing) - primarySquareSize/2;
            square.position.set(PRIMARY_TABLE_POS[0],PRIMARY_TABLE_POS[1] + yPosition, 0);

            const arrow = createRightArrow(arrowLength, arrowHeadSize, 0x000000);
            arrow.position.set(PRIMARY_TABLE_POS[0] + primarySquareSize/2 + arrowOffset,PRIMARY_TABLE_POS[1] + yPosition, 0);
            
            const label = createTextCSS2DObj((i).toString());
            label.position.set(PRIMARY_TABLE_POS[0],PRIMARY_TABLE_POS[1] + yPosition, 0.01);
            
            // const nilSquare = createSquareWithBorder(nilSquareSize, new THREE.Color(1,0,0));
            // nilSquare.position.set(HORIZONTAL_OFFSET + nilSquareSize/2 + arrowOffset + arrowLength + 0.5, yPosition, 0);

            primaryTableElements[i] = {
                square: square,
                label: label,
                arrow: arrow,
                secondaryElements: [],
                position: { x: PRIMARY_TABLE_POS[0], y: PRIMARY_TABLE_POS[1]+yPosition, z: 0 }
            };
        }

        animatePrimarySquares(0,resolve);
    });
}

function animatePrimarySquares(index,resolvePromise) {
    if (index >= primaryTableElements.length) {
        resolvePromise();
        return;
    }

    const item = primaryTableElements[index];
    const square = item.square;
    const label = item.label;
    const arrow = item.arrow;
    // const nilSquare = item.secondaryElements[0];

    // @ts-ignore
    // @ts-ignore
    const scaleTween = {
        value: 0.01
    };

    const duration = getAdjustedDuration(0.5);
    
    let startTime = null;

    let added = false;

    function animateStep(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const easedProgress = easeInOut(progress);
        
        const newScale = 0.01 + easedProgress * 0.99;
        square.scale.set(newScale, newScale, newScale);
        
        square.children.forEach(child => {
            if (child.material) {
                child.material.opacity = easedProgress;
            }
        });

        arrow.scale.set(newScale, newScale, newScale);
        arrow.children.forEach(child => {
            if (child.material) {
                child.material.opacity = easedProgress;
            }
        });
        
        label.element.style.opacity = easedProgress;

        // nilSquare.scale.set(newScale, newScale, newScale);
        // nilSquare.children.forEach(child => {
        //     if (child.material) {
        //         child.material.opacity = easedProgress;
        //     }
        // });

        if(!added) {
            scene.add(square);
            scene.add(label);
            scene.add(arrow);
            // scene.add(nilSquare);
            added = true;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
        setTimeout(() => {
            animatePrimarySquares(index + 1,resolvePromise);
        }, getAdjustedDuration(500));
        }
    }
    requestAnimationFrame(animateStep);
}

function highlightPrimaryElement(index, color = 0xff0000) {
    return new Promise((resolve) => {
        const primaryElement = primaryTableElements[index];
        if (!primaryElement) {
            resolve();
            return;
        }

        const square = primaryElement.square;

        square.children[0].material.color.set(color);

        const originalScale = square.scale.x;
        let startTime = null;
        const duration = getAdjustedDuration(0.3);

        function pulseAnimation(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            const newScale = originalScale * (1 + 0.2 * Math.sin(progress * Math.PI));
            square.scale.set(newScale, newScale, newScale);

            if (progress < 1) {
                requestAnimationFrame(pulseAnimation);
            } else {
                square.scale.set(originalScale, originalScale, originalScale);
                setTimeout(resolve, getAdjustedDuration(300));
            }
        }
        requestAnimationFrame(pulseAnimation);
    });
}

function addSquareToPrimaryElement(h, value, squareSize = 0.8) {
    return new Promise(resolve => {
        const secondarySquareSpacing = 0.15;
        if (!primaryTableElements[h]) {
            resolve();
            return;
        }
        
        const color = new THREE.Color(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.5);
        const square = createSquareWithBorder(squareSize, color);

        let xPos=0;
        if (primaryTableElements[h].secondaryElements.length == 0){
            xPos = primaryTableElements[h].arrow.position.x + arrowLength + squareSize/2 + secondarySquareSpacing
        } else {
            xPos = primaryTableElements[h].secondaryElements[primaryTableElements[h].secondaryElements.length - 1].square.position.x + squareSize + secondarySquareSpacing
        }

        square.position.set(xPos, primaryTableElements[h].position.y, 0);
        
        square.scale.set(0.01, 0.01, 0.01);
        
        const label = createTextCSS2DObj(value.toString());
        label.position.set(xPos, primaryTableElements[h].position.y, 0.01);
        // @ts-ignore
        label.element.style.opacity = 0;
        
        scene.add(square);
        scene.add(label);
        
        primaryTableElements[h].secondaryElements.push({
            square: square,
            label: label,
        });

        let startTime = null;
        const duration = getAdjustedDuration(0.5);
        
        function animateAppearance(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = easeInOut(progress);
            
            // Grow square
            const newScale = 0.01 + easedProgress * 0.99;
            square.scale.set(newScale, newScale, newScale);
            
            // Fade in
            square.children.forEach(child => {
                // @ts-ignore
                if (child.material) {
                    // @ts-ignore
                    child.material.opacity = easedProgress;
                }
            });
            
            // Fade in label
            // @ts-ignore
            label.element.style.opacity = easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateAppearance);
            } else {
                setTimeout(resolve, getAdjustedDuration(200));
            }
        }
        
        requestAnimationFrame(animateAppearance);
    });
}

function removePrimaryTableSecondarySquares(h) {
    return new Promise(resolve => {
        const secondaryElementsLength = primaryTableElements[h].secondaryElements.length 
        const secondaryElements = primaryTableElements[h].secondaryElements;
        let startTime = null;
        const duration = getAdjustedDuration(0.5);
            
        function fadeOutAnimation(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            for(let j=0;j<secondaryElementsLength;j++){
                const element = secondaryElements[j];
                const newScale = element.square.scale.x * (1 - progress);
                element.square.scale.set(newScale, newScale, newScale);
                
                element.square.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 1 - progress;
                    }
                });
                
                if (element.label && element.label.element) {
                    element.label.element.style.opacity = 1 - progress;
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(fadeOutAnimation);
            } else {
                for(let j=0;j<secondaryElementsLength;j++){
                    const element = secondaryElements[j];
                    scene.remove(element.square);
                    if (element.label) scene.remove(element.label);
                    
                    primaryTableElements[h].secondaryElements = [];
                    setTimeout(resolve, getAdjustedDuration(200));
                }
            }
        }
        
        requestAnimationFrame(fadeOutAnimation);
    });
}

// @ts-ignore
function removeAllPrimaryTableSecondarySquares(){
    return new Promise(resolve => {
        for(let i=0;i<primaryTableElements.length;i++){
            let secondaryElementsLength = primaryTableElements[i].secondaryElements.length 
            for(let j=0;j<secondaryElementsLength;j++){
                const element = primaryTableElements[i].secondaryElements[j]
                scene.remove(element.square);
                scene.remove(element.label);
            }
            primaryTableElements[i].secondaryElements = [];
        }
        setTimeout(resolve, getAdjustedDuration(200));
    });
}

function addPerfectTableToPrimaryTable(h,perfectTable,hash){
    return new Promise(resolve => {
        const secondarySquareSpacing = 0.15;
        const hashLabelOffset = 1;
        const squareSize=0.8;
        if (!primaryTableElements[h]) {
            resolve();
            return;
        }

        for(let i=0;i<perfectTable.length;i++){
            let color;
            let value;
            if(perfectTable[i]==-1){
                color = new THREE.Color(0.5,0.5,0.5);
                value = 'X';
            } else {
                color = new THREE.Color(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.5);
                value = perfectTable[i];
            }
            const square = createSquareWithBorder(squareSize, color);
            const xPos = primaryTableElements[h].arrow.position.x + arrowLength + squareSize/2 + secondarySquareSpacing *(i+1) + squareSize*i;
            square.position.set(xPos, primaryTableElements[h].position.y, 0);
            square.scale.set(0.01, 0.01, 0.01);

            const label = createTextCSS2DObj(value.toString());
            label.position.set(xPos, primaryTableElements[h].position.y, 0.01);
            // @ts-ignore
            label.element.style.opacity = 0;

            scene.add(square);
            scene.add(label);

            primaryTableElements[h].secondaryElements.push({
                square: square,
                label: label,
            });
        }
        const l=primaryTableElements[h].secondaryElements.length
        const hashText = `x=${hash[0].toString()},y=${hash[1].toString()}`;
        const hashLabel = createTextCSS2DObj(hashText);
        const width = estimateTextWidth(hashText);
        const xPos = primaryTableElements[h].secondaryElements[l-1].square.position.x + squareSize/2 + width + hashLabelOffset;
        hashLabel.position.set(xPos, primaryTableElements[h].position.y, 0.01);
        // @ts-ignore
        hashLabel.element.style.opacity = 0;
        hashLabel.element.classList.add('hash-label');
        scene.add(hashLabel);
        primaryTableElements[h].hashLabel = hashLabel;

        let startTime = null;
        const duration = getAdjustedDuration(0.5);

        function animateAppearance(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = easeInOut(progress);
            
            // Grow square
            const newScale = 0.01 + easedProgress * 0.99;

            primaryTableElements[h].secondaryElements.forEach(element => {
                const square = element.square;
                const label = element.label;

                square.scale.set(newScale, newScale, newScale);
            
                square.children.forEach(child => {
                    // @ts-ignore
                    if (child.material) {
                        // @ts-ignore
                        child.material.opacity = easedProgress;
                    }
                });

                // @ts-ignore
                label.element.style.opacity = easedProgress;
            })
            // @ts-ignore
            hashLabel.element.style.opacity = easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateAppearance);
            } else {
                setTimeout(resolve, getAdjustedDuration(200));
            }
        }
        
        requestAnimationFrame(animateAppearance);
    });
}

function highlightSecondaryElement(i,j, color = 0xff0000) {
    return new Promise((resolve) => {
        const secondaryElement = primaryTableElements[i].secondaryElements[j];
        if (!secondaryElement) {
            resolve();
            return;
        }

        const square = secondaryElement.square;

        square.children[0].material.color.set(color);

        const originalScale = square.scale.x;
        let startTime = null;
        const duration = getAdjustedDuration(0.3);

        function pulseAnimation(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            const newScale = originalScale * (1 + 0.2 * Math.sin(progress * Math.PI));
            square.scale.set(newScale, newScale, newScale);

            if (progress < 1) {
                requestAnimationFrame(pulseAnimation);
            } else {
                square.scale.set(originalScale, originalScale, originalScale);
                setTimeout(resolve, getAdjustedDuration(300));
            }
        }
        requestAnimationFrame(pulseAnimation);
    });
}

function displaySecondaryTable(n) {
    return new Promise(resolve => {
        // @ts-ignore
        const totalHeight = n * secondarySquareSize + (n - 1) * secondarySquareSpacing;
        for (let i = 0; i < n; i++) {
            const square = createSquareWithBorder(secondarySquareSize, new THREE.Color(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5));
            
            const yPosition = - i * (secondarySquareSize + secondarySquareSpacing) - secondarySquareSize/2;
            square.position.set(SECONDARY_TABLE_POS[0], SECONDARY_TABLE_POS[1] + yPosition, 0);

            const arrow = createRightArrow(arrowLength, arrowHeadSize, 0x000000);
            arrow.position.set(SECONDARY_TABLE_POS[0] + primarySquareSize/2 + arrowOffset, SECONDARY_TABLE_POS[1] + yPosition, 0);

            const label = createTextCSS2DObj((i).toString());
            label.position.set(SECONDARY_TABLE_POS[0], SECONDARY_TABLE_POS[1]+yPosition, 0.01);

            secondaryTableElements[i] = {
                square: square,
                label: label,
                arrow: arrow,
                secondaryElements: [],
                position: { x: SECONDARY_TABLE_POS[0], y: SECONDARY_TABLE_POS[1]+yPosition, z: 0 }
            };
        };
        animateSecondaryTableSquares(0,resolve);
    });
}

function animateSecondaryTableSquares(index,resolvePromise) {
    if (index >= secondaryTableElements.length) {
        resolvePromise();
        return;
    }

    const item = secondaryTableElements[index];
    const square = item.square;
    const label = item.label;
    const arrow = item.arrow;

    // @ts-ignore
    // @ts-ignore
    const scaleTween = {
        value: 0.01
    };

    const duration = getAdjustedDuration(0.2);
    
    let startTime = null;

    let added = false;

    function animateStep(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const easedProgress = easeInOut(progress);
        
        const newScale = 0.01 + easedProgress * 0.99;
        square.scale.set(newScale, newScale, newScale);
        
        square.children.forEach(child => {
            if (child.material) {
                child.material.opacity = easedProgress;
            }
        });

        arrow.scale.set(newScale, newScale, newScale);
        arrow.children.forEach(child => {
            if (child.material) {
                child.material.opacity = easedProgress;
            }
        });
        
        label.element.style.opacity = easedProgress;

        if(!added) {
            scene.add(square);
            scene.add(label);
            scene.add(arrow);
            added = true;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
        setTimeout(() => {
            animateSecondaryTableSquares(index + 1,resolvePromise);
        }, getAdjustedDuration(200));
        }
    }
    requestAnimationFrame(animateStep);
}

function addSquareToSecondaryTable(h, value, squareSize = 0.8) {
    return new Promise(resolve => {
        const secondarySquareSpacing = 0.15;
        if (!secondaryTableElements[h]) {
            resolve();
            return;
        }
        
        const color = new THREE.Color(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.5);
        const square = createSquareWithBorder(squareSize, color);

        let xPos=0;
        if (secondaryTableElements[h].secondaryElements.length == 0){
            xPos = secondaryTableElements[h].arrow.position.x + arrowLength + squareSize/2 + secondarySquareSpacing
        } else {
            xPos = secondaryTableElements[h].secondaryElements[secondaryTableElements[h].secondaryElements.length - 1].square.position.x + squareSize + secondarySquareSpacing
        }

        square.position.set(xPos, secondaryTableElements[h].position.y, 0);
        
        square.scale.set(0.01, 0.01, 0.01);
        
        const label = createTextCSS2DObj(value.toString());
        label.position.set(xPos, secondaryTableElements[h].position.y, 0.01);
        // @ts-ignore
        label.element.style.opacity = 0;
        
        scene.add(square);
        scene.add(label);
        
        secondaryTableElements[h].secondaryElements.push({
            square: square,
            label: label,
        });

        let startTime = null;
        const duration = getAdjustedDuration(0.5);
        
        function animateAppearance(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = easeInOut(progress);
            
            const newScale = 0.01 + easedProgress * 0.99;
            square.scale.set(newScale, newScale, newScale);
            
            square.children.forEach(child => {
                // @ts-ignore
                if (child.material) {
                    // @ts-ignore
                    child.material.opacity = easedProgress;
                }
            });
            
            // @ts-ignore
            label.element.style.opacity = easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateAppearance);
            } else {
                setTimeout(resolve, getAdjustedDuration(200));
            }
        }
        
        requestAnimationFrame(animateAppearance);
    });
}

// @ts-ignore
function removeAllSquaresFromSecondaryTable(){
    return new Promise(resolve => {
        for(let i=0;i<secondaryTableElements.length;i++){
            let secondaryElementsLength = secondaryTableElements[i].secondaryElements.length 
            for(let j=0;j<secondaryElementsLength;j++){
                const element = secondaryTableElements[i].secondaryElements[j]
                scene.remove(element.square);
                scene.remove(element.label);
            }
            secondaryTableElements[i].secondaryElements = [];
        }
        setTimeout(resolve, getAdjustedDuration(200));
    });
}

function removeSecondaryTable() {
    return new Promise(resolve => {
        for (let i = 0; i < secondaryTableElements.length; i++) {
            const element = secondaryTableElements[i];
            scene.remove(element.square);
            scene.remove(element.label);
            scene.remove(element.arrow);
        }
        secondaryTableElements = [];
        resolve();
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    textRenderer.render(scene, camera); // Render the labels
}
animate();

function clearScene() {
    while (scene.children.length > 0) {
        const object = scene.children[0];
        scene.remove(object);
    }

    topRowElements = [];
    currentStep = null;
    hashTextObject = null;
    primaryHashTextObj = null;
    secondaryHashTextObj = null;
    primaryTableElements = [];
    secondaryTableElements = [];
}

function generateRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate_xy(p){
    const x = generateRandomInt(1, p-1);
    const y = generateRandomInt(0, p-1);
    return [x, y];
}

function calculate_hash(x,y,p,n,key){
    return ((x*key + y) % p) % n;
}

// @ts-ignore
// @ts-ignore
const UNIV_SIZE = 100;
const P = 101;

// @ts-ignore
let searchDisabled=true

let S = [];
let perfectHashTables = [];
let primaryHash = [];
let hashes = new Array(S.length).fill(null).map(() => [])

function createHashTable() {
    return new Promise(async function (resolve){
        clearScene();
        const s = S.length;
        let primaryHashTable = new Array(S.length).fill(null).map(() => []);
        primaryHash = [];
        hashes = new Array(S.length).fill(null).map(() => [])
        perfectHashTables = [];
        
        await displayS(S);

        await updateStepText("Creating Primary Hash Table...")
        
        updateHashText("Hash Function : h(i) = ((ix+y) mod p) mod n  |  p=101")

        await displayPrimaryTable(s);

        let acceptableCollisions = false;
        let num_collisions = 0;
        while(!acceptableCollisions){
            num_collisions = 0;
            primaryHashTable = new Array(s).fill(null).map(() => []);
            primaryHash = generate_xy(P);

            let x = primaryHash[0];
            let y = primaryHash[1];
            await updatePrimaryHashText(`Primary Hash: x=${x} , y=${y}`);
            for (let i = 0; i < s; i++){
                
                await highlightTopRowElement(i);
                
                let key = S[i];
                let h = calculate_hash(x,y,P,s,key);

                await updatePrimaryHashText(`Primary Hash: x=${x} , y=${y} | h(${key}) = ${h}`);

                primaryHashTable[h].push(key);

                await removeTopRowElement(i);

                await addSquareToPrimaryElement(h,key)
            }
            for (let i = 0; i < s; i++){
                num_collisions += (primaryHashTable[i].length)*(primaryHashTable[i].length - 1)/2;
            }
            if (num_collisions<s){
                await updatePrimaryHashText(`Primary Hash: x=${x} , y=${y}`);
                await updateStepText(`Number of collisions = ${num_collisions} < |S| = ${s}`);
                sleep(getAdjustedDuration(2000));
                acceptableCollisions = true;
            } else {
                await updateStepText(`Number of collisions = ${num_collisions} > |S| = ${s}`);
                await sleep(getAdjustedDuration(2000));
                await updateStepText("Creating Primary Hash Table Again...");

                await removeAllPrimaryTableSecondarySquares();

                topRowElements = [];
                await displayS(S);
            }
        }
        await updateStepText(`Resolving Second Level Collisions...`);

        for (let i = 0; i < s; i++){
            const originalColor = primaryTableElements[i].square.children[0].material.color.clone();
            await highlightPrimaryElement(i);

            const Zi = primaryHashTable[i].length;
            const secondaryTableSize = Zi*Zi;
            if(Zi > 1){
                await displaySecondaryTable(secondaryTableSize);
                let secondaryHashTable = new Array(secondaryTableSize).fill(-1);
                let noCollisons=false;
                while(!noCollisons){
                    secondaryHashTable = new Array(secondaryTableSize).fill(-1);
                    noCollisons=true;
                    let hash2 = generate_xy(P);
                    let x = hash2[0];
                    let y = hash2[1];
                    await updateSecondaryHashText(`Secondary Hash: x=${x} , y=${y}`);
                    for(let j=0;j<Zi;j++){
                        const secondaryElementOriginalColor = primaryTableElements[i].secondaryElements[j].square.children[0].material.color.clone();
                        await highlightSecondaryElement(i,j)
                        let key = primaryHashTable[i][j]
                        let h = calculate_hash(x,y,P,secondaryTableSize,key)
                        await updateSecondaryHashText(`Secondary Hash: x=${x} , y=${y} | h(${key}) = ${h}`);
                        await addSquareToSecondaryTable(h,key)
                        if(secondaryHashTable[h]!=-1){
                            noCollisons=false;
                            primaryTableElements[i].secondaryElements[j].square.children[0].material.color.set(secondaryElementOriginalColor);
                            break;
                        } else {
                            secondaryHashTable[h]=key;
                        }
                        primaryTableElements[i].secondaryElements[j].square.children[0].material.color.set(secondaryElementOriginalColor);
                    }
                    if(noCollisons){
                        await removePrimaryTableSecondarySquares(i);
                        hashes[i] = (hash2);
                        console.log(hashes)
                        await addPerfectTableToPrimaryTable(i,secondaryHashTable,hash2);
                    } else {
                        // await updateSecondaryHashText(`Secondary Hash: x=${x} , y=${y}`);
                        await removeAllSquaresFromSecondaryTable();
                    }
                }
                perfectHashTables.push(secondaryHashTable);
            } else if (Zi==1) {
                perfectHashTables.push(new Array(1).fill(primaryHashTable[i][0]));
            }
            else {
                perfectHashTables.push(new Array(0));
            }
            updateSecondaryHashText(``)
            await removeAllSquaresFromSecondaryTable();
            await removeSecondaryTable();
            primaryTableElements[i].square.children[0].material.color.set(originalColor);
        }

        let space=s;
        for(let i=0;i<perfectHashTables.length;i++){
            space+=perfectHashTables[i].length;
        }

        await updateStepText(`Perfect Hash Table Created!   |   Space required=${space}`);
        console.log("2->",hashes)
        resolve();
    })
}

// @ts-ignore
async function search(key){
    let present = 0;
    await updateStepText(`Searching key ${key}`)
    let originalColor1=null,originalColor2=null;
    let n1 = S.length;
    let x1=primaryHash[0],y1=primaryHash[1];
    let h1 = calculate_hash(x1,y1,P,n1,key),h2=0;
    await updatePrimaryHashText(`Primary Hash: x=${x1} , y=${y1} | h(${key}) = ${h1}`);

    originalColor1 = primaryTableElements[h1].square.children[0].material.color.clone();
    await highlightPrimaryElement(h1);

    if(perfectHashTables[h1].length==0){
        present=0;
    } else if(perfectHashTables[h1].length==1){
        originalColor2 = primaryTableElements[h1].secondaryElements[0].square.children[0].material.color.clone();
        await highlightSecondaryElement(h1,0);
        if(perfectHashTables[h1][0]==key){
            present=1;
        } else {
            present=0;
        }
    } else{
        let x2=hashes[h1][0],y2=hashes[h1][1];
        let n2= perfectHashTables[h1].length;
        h2 = calculate_hash(x2,y2,P,n2,key);
        await updateSecondaryHashText(`Secondary Hash: x=${x2} , y=${y2} | h(${key}) = ${h2}`);
        originalColor2 = primaryTableElements[h1].secondaryElements[h2].square.children[0].material.color.clone();
        await highlightSecondaryElement(h1,h2);
        let res = perfectHashTables[h1][h2];
        if(res == -1){
            present=0;
            
        } else {
            present=1;
        }
    }
    if(present){
        await updateStepText(`${key} is present`);
    } else {
        await updateStepText(`${key} is not present`);
    }
    primaryTableElements[h1].square.children[0].material.color.set(originalColor1);
    if(originalColor2)
        primaryTableElements[h1].secondaryElements[h2].square.children[0].material.color.set(originalColor2);
}

function parseInput(input) {
    if (typeof input !== 'string' || input.trim() === '') {
        return ["Empty set S given", []];
    }

    const parts = input.split(',').map(part => part.trim());
    const result = [];
    
    for (const part of parts) {
        if (!/^-?\d+$/.test(part)) {
            return ["S contains element outside of universe", []];
        }
        
        const num = parseInt(part, 10);
        
        if (num < 0 || num > 100) {
            return ["S contains element outside of universe", []];
        }
        
        if (!result.includes(num)) {
            result.push(num);
        }
    }
    return ["", result];
}

document.getElementById('submit-button').addEventListener('click', async function() {
    scene.remove(titleLabel)
    searchDisabled=true;
    // @ts-ignore
    document.getElementById("search-button").disabled = true;
    // @ts-ignore
    document.getElementById("search-input-box").disabled = true;
    // @ts-ignore
    document.getElementById("submit-button").disabled = true;
    // @ts-ignore
    document.getElementById("S-input-box").disabled = true;
    // @ts-ignore
    const input = parseInput(document.getElementById('S-input-box').value);
    const errMsg=input[0],elements=input[1];

    const errorDiv = document.getElementById('error-msg');
    if(errMsg.length>0){
        errorDiv.textContent = errMsg.toString();
        errorDiv.style.display = 'block';
    } else {
        errorDiv.textContent = "";
        errorDiv.style.display = 'none';
        // @ts-ignore
        document.getElementById('S-input-box').value = '';

        // @ts-ignore
        S = elements;

        await createHashTable();
        searchDisabled=false;
        // @ts-ignore
        document.getElementById("search-button").disabled = false;
        // @ts-ignore
        document.getElementById("search-input-box").disabled = false;
    }
    // @ts-ignore
    document.getElementById("submit-button").disabled = false;
    // @ts-ignore
    document.getElementById("S-input-box").disabled = false;
});

function showSearchError(message) {
    const errorDiv = document.getElementById('error-msg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    const searchBox = document.getElementById('search-input-box');
    searchBox.style.borderColor = '#d32f2f';
    searchBox.style.boxShadow = '0 0 0 2px rgba(211, 47, 47, 0.2)';
    
    setTimeout(() => {
        searchBox.style.borderColor = '#ddd';
        searchBox.style.boxShadow = 'none';
    }, 3000);
}

document.getElementById('search-button').addEventListener('click', function() {
    if(searchDisabled){
        return;
    }
    // @ts-ignore
    const searchInput = document.getElementById('search-input-box').value.trim();
    const errorDiv = document.getElementById('error-msg');
    
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    if (!searchInput) {
        showSearchError('Please enter a number to search');
        return;
    }
    
    if (!/^\d+$/.test(searchInput)) {
        showSearchError('Search input must be a whole number');
        return;
    }
    
    const number = parseInt(searchInput, 10);
    
    if (number < 0 || number > 100) {
        showSearchError('Number must be in Universe');
        return;
    }
    
    search(number);
});

document.getElementById('reset-button').addEventListener('click', function() {
    window.location.reload()
});

document.getElementById('speed-slider').addEventListener('input', function(e) {
    // @ts-ignore
    speedMultiplier = parseFloat(e.target.value);
    document.getElementById('speed-value').textContent = speedMultiplier + 'x';
});

let cameraOffset=0;
const scrollSpeed=0.005;
window.addEventListener('wheel', (event) => {
    cameraOffset += event.deltaY * scrollSpeed;
    camera.position.y = -cameraOffset; // Adjust based on your scene orientation
    camera.lookAt(0, -cameraOffset, 0); // Keep focus on content
});

window.addEventListener('resize', function() {
    camera.aspect = RENDERER_WIDTH / RENDERER_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(RENDERER_WIDTH, RENDERER_HEIGHT);
    textRenderer.setSize(RENDERER_WIDTH, RENDERER_HEIGHT);
});