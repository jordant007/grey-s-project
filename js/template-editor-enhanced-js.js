// Global variables
let selectedElement = null;
let elements = [];
let undoStack = [];
let redoStack = [];

// Initialize drag functionality
let isDragging = false;
let isResizing = false;
let startX, startY, startWidth, startHeight;

// Add new element to canvas
function addElement(type) {
    const element = document.createElement('div');
    element.className = 'template-element';
    element.dataset.type = type;
    
    // Set default position
    element.style.left = '50px';
    element.style.top = '50px';
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'element-resize-handle';
    element.appendChild(resizeHandle);
    
    // Set content based on type
    switch(type) {
        case 'text':
            element.textContent = 'Double click to edit';
            element.contentEditable = true;
            break;
        case 'shape':
            element.style.width = '100px';
            element.style.height = '100px';
            element.style.backgroundColor = '#5C6EFF';
            break;
        case 'image':
            const img = document.createElement('img');
            img.src = '/api/placeholder/100/100';
            img.alt = 'Template Image';
            element.appendChild(img);
            break;
    }
    
    // Add event listeners
    element.addEventListener('mousedown', startDragging);
    element.addEventListener('dblclick', handleDoubleClick);
    resizeHandle.addEventListener('mousedown', startResizing);
    
    // Add to canvas
    document.getElementById('canvas').appendChild(element);
    
    // Save state for undo
    saveState();
    
    // Select the new element
    selectElement(element);
}

// Handle element selection
function selectElement(element) {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    selectedElement = element;
    element.classList.add('selected');
    
    // Update sidebar controls
    updateSidebarControls(element);
}

// Update sidebar controls based on selected element
function updateSidebarControls(element) {
    const textContent = document.getElementById('textContent');
    const fontSize = document.getElementById('fontSize');
    
    if (element.dataset.type === 'text') {
        textContent.value = element.textContent;
        fontSize.value = parseInt(window.getComputedStyle(element).fontSize);
    }
}

// Handle dragging
function startDragging(e) {
    if (e.target.classList.contains('element-resize-handle')) return;
    
    isDragging = true;
    startX = e.clientX - e.target.offsetLeft;
    startY = e.clientY - e.target.offsetTop;
    
    selectElement(e.target);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
}

function drag(e) {
    if (!isDragging) return;
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    let newX = e.clientX - startX - canvasRect.left;
    let newY = e.clientY - startY - canvasRect.top;
    
    // Keep element within canvas bounds
    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - selectedElement.offsetWidth));
    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - selectedElement.offsetHeight));
    
    selectedElement.style.left = newX + 'px';
    selectedElement.style.top = newY + 'px';
}

function stopDragging() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    saveState();
}

// Handle resizing
function startResizing(e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = selectedElement.offsetWidth;
    startHeight = selectedElement.offsetHeight;
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
    
    e.stopPropagation();
}

function resize(e) {
    if (!isResizing) return;
    
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);
    
    selectedElement.style.width = Math.max(50, newWidth) + 'px';
    selectedElement.style.height = Math.max(30, newHeight) + 'px';
}

function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
    saveState();
}

// Update element properties
function updateSelectedElement(property, value) {
    if (!selectedElement) return;
    
    switch(property) {
        case 'text':
            selectedElement.textContent = document.getElementById('textContent').value;
            break;
        case 'fontSize':
            selectedElement.style.fontSize = document.getElementById('fontSize').value + 'px';
            break;
        case 'color':
            if (selectedElement.dataset.type === 'text') {
                selectedElement.style.color = value;
            } else {
                selectedElement.style.backgroundColor = value;
            }
            // Update color picker UI
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.toggle('selected', option.style.background === value);
            });
            break;
    }
    
    saveState();
}

// Handle double click for text editing
function handleDoubleClick(e) {
    if (e.target.dataset.type === 'text') {
        e.target.focus();
    }
}

// Canvas size update
function updateCanvasSize() {
    const canvas = document.getElementById('canvas');
    const size = document.getElementById('templateSize').value;
    
    switch(size) {
        case 'flyer':
            canvas.style.width = '612px';  // 8.5 inches * 72 DPI
            canvas.style.height = '792px'; // 11 inches * 72 DPI
            break;
        case 'poster':
            canvas.style.width = '1296px'; // 18 inches * 72 DPI
            canvas.style.height = '1728px'; // 24 inches * 72 DPI
            break;
        case 'social':
            canvas.style.width = '1080px';
            canvas.style.height = '1080px';
            break;
    }
    
    saveState();
}

// State management
function saveState() {
    const canvas = document.getElementById('canvas');
    undoStack.push(canvas.innerHTML);
    redoStack = []; // Clear redo stack when new action is performed
}

function undoAction() {
    if (undoStack.length <= 1) return;
    
    const canvas = document.getElementById('canvas');
    redoStack.push(undoStack.pop());
    canvas.innerHTML = undoStack[undoStack.length - 1];
}

function redoAction() {
    if (redoStack.length === 0) return;
    
    const canvas = document.getElementById('canvas');
    const state = redoStack.pop();
    undoStack.push(state);
    canvas.innerHTML = state;
}

// Save and export functions
function saveTemplate() {
    const canvas = document.getElementById('canvas');
    localStorage.setItem('savedTemplate', canvas.innerHTML);
    alert('Template saved successfully!');
}

function exportTemplate() {
    alert('Template ready for export! In a production environment, this would generate a downloadable file.');
}

// ... (previous code remains the same until the initialization part)

// Initialize the canvas size and load saved template when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Set initial canvas size
    updateCanvasSize();
    
    // Load saved template if exists
    const savedTemplate = localStorage.getItem('savedTemplate');
    if (savedTemplate) {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = savedTemplate;
        
        // Add event listeners to loaded elements
        canvas.querySelectorAll('.template-element').forEach(element => {
            element.addEventListener('mousedown', startDragging);
            element.addEventListener('dblclick', handleDoubleClick);
            element.querySelector('.element-resize-handle')?.addEventListener('mousedown', startResizing);
        });
    }
    
    // Initialize undo stack with empty canvas
    saveState();
    
    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redoAction();
                } else {
                    undoAction();
                }
            }
        }
    });
    
    // Prevent accidental page navigation
    window.addEventListener('beforeunload', (e) => {
        if (undoStack.length > 1) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

// Make sure elements stay within canvas bounds when canvas size changes
function updateCanvasSize() {
    const canvas = document.getElementById('canvas');
    const size = document.getElementById('templateSize').value;
    
    let newWidth, newHeight;
    switch(size) {
        case 'flyer':
            newWidth = 612;  // 8.5 inches * 72 DPI
            newHeight = 792; // 11 inches * 72 DPI
            break;
        case 'poster':
            newWidth = 1296; // 18 inches * 72 DPI
            newHeight = 1728; // 24 inches * 72 DPI
            break;
        case 'social':
            newWidth = 1080;
            newHeight = 1080;
            break;
        default:
            newWidth = 612;
            newHeight = 792;
    }
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    
    // Adjust elements that may be outside the new canvas bounds
    canvas.querySelectorAll('.template-element').forEach(element => {
        const rect = element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        let newLeft = parseInt(element.style.left);
        let newTop = parseInt(element.style.top);
        
        // Adjust horizontal position if needed
        if (newLeft + rect.width > newWidth) {
            newLeft = newWidth - rect.width;
        }
        
        // Adjust vertical position if needed
        if (newTop + rect.height > newHeight) {
            newTop = newHeight - rect.height;
        }
        
        element.style.left = `${Math.max(0, newLeft)}px`;
        element.style.top = `${Math.max(0, newTop)}px`;
    });
    
    saveState();
}

// Export functionality enhancement
function exportTemplate() {
    const canvas = document.getElementById('canvas');
    
    // Create a cleanup copy of the canvas
    const exportCanvas = canvas.cloneNode(true);
    
    // Remove selection and resize handles for export
    exportCanvas.querySelectorAll('.template-element').forEach(element => {
        element.classList.remove('selected');
        element.querySelectorAll('.element-resize-handle').forEach(handle => handle.remove());
    });
    
    // In a real implementation, you would:
    // 1. Convert the HTML to an image or PDF
    // 2. Apply proper scaling based on DPI
    // 3. Generate a downloadable file
    
    // For now, we'll just show what would be exported
    const exportWindow = window.open('', '_blank');
    exportWindow.document.write(`
        <html>
            <head>
                <title>Template Export Preview</title>
                <style>
                    body { margin: 0; padding: 20px; }
                    .template-element { position: absolute; }
                </style>
            </head>
            <body>
                <div style="position: relative; width: ${canvas.style.width}; height: ${canvas.style.height}; border: 1px solid #ddd;">
                    ${exportCanvas.innerHTML}
                </div>
            </body>
        </html>
    `);
}