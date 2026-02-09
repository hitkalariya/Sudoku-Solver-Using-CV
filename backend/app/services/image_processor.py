import cv2
import numpy as np
import easyocr


# Helper functions

def reorder_points(points):
    """
    Reorder points to: top-left, top-right, bottom-right, bottom-left
    """
    points = points.reshape((4, 2))
    new_points = np.zeros((4, 1, 2), dtype=np.int32)
    
    add = points.sum(1)
    new_points[0] = points[np.argmin(add)]  # Top-left has smallest sum
    new_points[2] = points[np.argmax(add)]  # Bottom-right has largest sum
    
    diff = np.diff(points, axis=1)
    new_points[1] = points[np.argmin(diff)] # Top-right has smallest difference
    new_points[3] = points[np.argmax(diff)] # Bottom-left has largest difference
    
    return new_points

def warp_perspective(img, polygon):
    """
    Warp perspective to get a top-down view of the Sudoku grid.
    Resizes output to 450x450 for consistent cell extraction.
    """
    if polygon is None:
        return None
        
    polygon = reorder_points(polygon)
    
    pts1 = np.float32(polygon)
    
    # We force a square size for easier splitting
    width = 450
    height = 450
    
    # Define destination points
    pts2 = np.float32([[0, 0], [width, 0], [width, height], [0, height]])
    
    matrix = cv2.getPerspectiveTransform(pts1, pts2)
    img_warped = cv2.warpPerspective(img, matrix, (width, height))
    
    return img_warped

def split_boxes(img):
    """
    Split the image into 81 cells (9x9 grid).
    Assumes image is 450x450 px.
    """
    rows = np.vsplit(img, 9)
    boxes = []
    for r in rows:
        cols = np.hsplit(r, 9)
        for box in cols:
            boxes.append(box)
    return boxes

def clean_and_center_digit(img):
    """
    Isolate the digit using contours, crop it, and center it on a white background.
    Returns: The processed image ready for OCR, or None if empty.
    """
    h, w = img.shape[:2]
    
    # 1. Preprocessing
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
        
    # Threshold: text should be White, BG Black for contour finding
    # Use generic thresholding or adaptive
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    
    # 2. Find Contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
        
    # 3. Find the best candidate contour (largest, centered)
    best_cnt = None
    max_area = 0
    center_x, center_y = w // 2, h // 2
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Filter small noise
        if area < 50: 
            continue
            
        x, y, cw, ch = cv2.boundingRect(cnt)
        
        # Filter grid lines (too thin or too wide/tall reaching edges)
        if cw < 5 or ch < 5: continue
        # If it touches the edge, it might be a grid line
        if x < 2 or y < 2 or (x+cw) > w-2 or (y+ch) > h-2:
            continue
            
        current_center_dist = abs((x + cw/2) - center_x) + abs((y + ch/2) - center_y)
        
        # We prefer larger area, but also centralization
        # Heuristic: Score = Area - Distance*Factor
        if area > max_area:
            max_area = area
            best_cnt = cnt
            
    if best_cnt is None:
        return None
        
    # 4. Crop to bounding rect
    x, y, cw, ch = cv2.boundingRect(best_cnt)
    roi = thresh[y:y+ch, x:x+cw]
    
    # 5. Create a new square image (Black Text on White BG for Tesseract)
    # Tesseract prefers Black text. 'roi' is currently White text (THRESH_BINARY_INV).
    # So we need to invert 'roi' to be Black text, 
    # OR we make a White canvas and paste the Black version of 'roi' on it.
    
    # Let's invert ROI first -> Black text
    roi = cv2.bitwise_not(roi)
    
    # Prepare canvas
    side = max(cw, ch) + 20 # 10px padding
    canvas = np.ones((side, side), dtype=np.uint8) * 255 # White square
    
    # Center ROI on canvas
    off_x = (side - cw) // 2
    off_y = (side - ch) // 2
    
    # Copy ROI onto canvas
    canvas[off_y:off_y+ch, off_x:off_x+cw] = roi
    
    # 6. Resize for Tesseract (e.g. 28x28 is standard for ML, but Tesseract likes slightly larger)
    final = cv2.resize(canvas, (50, 50), interpolation=cv2.INTER_AREA)
    
    return final

def get_prediction(boxes):
    """
    Use EasyOCR to predict numbers in each box.
    """
    board = []
    print("Starting OCR extraction with EasyOCR...")
    
    # Initialize reader once
    # gpu=False to be safe on standard machines, set to True if CUDA available
    reader = easyocr.Reader(['en'], gpu=False) 
    
    debug_dir = "backend/debug_cells"
    import os
    if not os.path.exists(debug_dir):
        os.makedirs(debug_dir, exist_ok=True)
    
    for i, box in enumerate(boxes):
        # Clean and isolate digit
        digit_img = clean_and_center_digit(box)
        
        if digit_img is None:
            board.append(0)
            continue
            
        # Debug: Save first few cells
        if i < 5:
            cv2.imwrite(f"{debug_dir}/cell_{i}.png", digit_img)
        
        try:
            # EasyOCR prediction
            # allowlist='123456789' ensures we only get digits
            result = reader.readtext(digit_img, allowlist='0123456789', detail=0)
            
            if result:
                text = result[0]
                if text.isdigit():
                    board.append(int(text))
                else:
                    board.append(0)
            else:
                board.append(0)
                
        except Exception as e:
            print(f"Error on cell {i}: {e}")
            board.append(0)
            
    # Reshape
    np_board = np.array(board).reshape(9, 9)
    print("OCR Result:")
    print(np_board)
    return np_board.tolist()

def extract_sudoku_grid(image_bytes):
    """
    Main function to extract Sudoku grid from image bytes.
    Returns:
        grid_img: The warped top-down view of the grid (or None)
        steps: A dictionary of images {'step_name': image_array}
        board: 9x9 list of integers (or None)
    """
    steps = {}
    board = None
    
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    steps['Original'] = img
    
    # 1. Preprocess
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    steps['Grayscale'] = gray
    
    blur = cv2.GaussianBlur(gray, (5, 5), 1)
    steps['Blur'] = blur
    
    thresh = cv2.adaptiveThreshold(blur, 255, 1, 1, 11, 2)
    steps['Running Threshold'] = thresh
    
    # 2. Find Contours (Grid)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    # Visualization: Draw all contours
    img_contours = img.copy()
    cv2.drawContours(img_contours, contours, -1, (0, 255, 0), 2)
    steps['Contours'] = img_contours
    
    polygon = None
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 50:
            perimeter = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * perimeter, True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                polygon = approx
                break
    
    # Visualization: Draw the detected polygon
    if polygon is not None:
        img_polygon = img.copy()
        cv2.drawContours(img_polygon, [polygon], -1, (0, 0, 255), 2)
        
        # Draw corners
        for point in polygon:
            x, y = point[0]
            cv2.circle(img_polygon, (x, y), 5, (255, 0, 0), -1)
            
        steps['Detected Polygon'] = img_polygon
        
        # 3. Warp Perspective
        grid_img = warp_perspective(img, polygon)
        steps['Warped Grid'] = grid_img
        
        # 4. Extract Digits (OCR)
        try:
            boxes = split_boxes(grid_img)
            board = get_prediction(boxes)
        except Exception as e:
            print(f"OCR Error: {e}")
            # board stays None or maybe empty 9x9
            board = [[0]*9 for _ in range(9)]

        return grid_img, steps, board
    else:
        return None, steps, None

