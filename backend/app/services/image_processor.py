import cv2
import numpy as np

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
    Warp perspective to get a top-down view of the Sudoku grid
    """
    if polygon is None:
        return None  # Could not find a 4-sided polygon
        
    polygon = reorder_points(polygon)
    
    pts1 = np.float32(polygon)
    
    # Determine the width and height of the new image
    # Width: max distance between (top-left, top-right) and (bottom-left, bottom-right)
    # Height: max distance between (top-left, bottom-left) and (top-right, bottom-right)
    # For simplicity or standardization, we can fix a size or calculate dynamically
    
    width_top = np.linalg.norm(pts1[0] - pts1[1])
    width_bottom = np.linalg.norm(pts1[3] - pts1[2])
    max_width = max(int(width_top), int(width_bottom))
    
    height_left = np.linalg.norm(pts1[0] - pts1[3])
    height_right = np.linalg.norm(pts1[1] - pts1[2])
    max_height = max(int(height_left), int(height_right))
    
    # Define destination points
    pts2 = np.float32([[0, 0], [max_width, 0], [max_width, max_height], [0, max_height]])
    
    matrix = cv2.getPerspectiveTransform(pts1, pts2)
    img_warped = cv2.warpPerspective(img, matrix, (max_width, max_height))
    
    return img_warped

def extract_sudoku_grid(image_bytes):
    """
    Main function to extract Sudoku grid from image bytes.
    Returns:
        grid_img: The warped top-down view of the grid (or None)
        steps: A dictionary of images {'step_name': image_array}
    """
    steps = {}
    
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
        
        return grid_img, steps
    else:
        return None, steps

