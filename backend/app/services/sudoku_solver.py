def is_valid(board, row, col, num):
    """
    Check if it's valid to place `num` at `board[row][col]`.
    """
    # Check row
    for x in range(9):
        if board[row][x] == num:
            return False
            
    # Check column
    for x in range(9):
        if board[x][col] == num:
            return False
            
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[i + start_row][j + start_col] == num:
                return False
                
    return True

def solve_sudoku_grid(board):
    """
    Solves the Sudoku board using backtracking.
    Modifies the board in-place.
    Returns True if solved, False if unsolvable.
    """
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                for num in range(1, 10):
                    if is_valid(board, i, j, num):
                        board[i][j] = num
                        if solve_sudoku_grid(board):
                            return True
                        board[i][j] = 0
                return False
    return True

def solve_puzzle(board):
    """
    Wrapper function to solve a Sudoku puzzle.
    Returns the solved board or None if unsolvable.
    Does not modify the input board (creates a copy).
    """
    # Create a deep copy to avoid modifying the original
    solution = [row[:] for row in board]
    
    if solve_sudoku_grid(solution):
        return solution
    else:
        return None
