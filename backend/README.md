# Sudoku Solver Backend

This is the Python Flash backend for the Sudoku Solver application.

## Structure

- `app/`: Main application package
  - `routes.py`: API endpoints
  - `services/`: Business logic (Image processing, Sudoku solving)
  - `utils/`: Helper functions
- `run.py`: Entry point
- `requirements.txt`: Python dependencies

## Setup

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Run the application using:
```bash
python run.py
```

The server will start at `http://localhost:5000`.

## API Endpoints

### POST /api/extract-sudoku
Input: Form-data with key `image` (file).
Output: JSON with `image_data` (base64 encoded extracted grid) or error message.
