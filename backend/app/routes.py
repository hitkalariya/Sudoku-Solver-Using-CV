from flask import Blueprint, request, jsonify, send_file
import io
import base64
import cv2
import numpy as np
from PIL import Image

# Import the extraction logic
from .services import image_processor

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/extract-sudoku', methods=['POST'])
def extract_sudoku():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Read the file to bytes
        image_bytes = file.read()
        
        
        # 1. Detect and Extract Sudoku Grid
        # image_processor now returns (grid_img, steps_dict, board)
        grid_image, steps, board = image_processor.extract_sudoku_grid(image_bytes)
        
        # Prepare response data
        response_data = {}
        
        # Encode all steps
        if steps:
            steps_data = {}
            for name, img in steps.items():
                success, buffer = cv2.imencode('.jpg', img)
                if success:
                    encoded = base64.b64encode(buffer).decode('utf-8')
                    steps_data[name] = f"data:image/jpeg;base64,{encoded}"
            response_data['steps'] = steps_data

        if grid_image is None:
            return jsonify({'error': 'Could not detect a valid Sudoku grid in the image', 'steps': response_data.get('steps', {})}), 422
            
        # Convert the main result (grid_image)
        success, buffer = cv2.imencode('.jpg', grid_image)
        if not success:
            return jsonify({'error': 'Failed to encode processed image'}), 500
            
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        response_data['message'] = 'Sudoku grid extracted successfully'
        response_data['image_data'] = f"data:image/jpeg;base64,{encoded_image}"
        response_data['board'] = board
        
        return jsonify(response_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/solve-sudoku', methods=['POST'])
def solve_sudoku():
    if not request.is_json:
        return jsonify({'error': 'Missing JSON in request'}), 400
        
    data = request.get_json()
    board = data.get('board')
    
    if not board or not isinstance(board, list) or len(board) != 9:
        return jsonify({'error': 'Invalid board format'}), 400
        
    try:
        from .services import sudoku_solver
        solution = sudoku_solver.solve_puzzle(board)
        
        if solution is None:
            return jsonify({'error': 'Puzzle is unsolvable'}), 422
            
        return jsonify({'message': 'Puzzle solved successfully', 'solution': solution})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200
