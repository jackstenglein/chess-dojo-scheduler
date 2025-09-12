import pandas as pd
import sqlite3

def import_csv_to_sqlite(csv_file_path, db_file_path, table_name):
    """
    Reads data from a CSV file and imports it into a new table in an SQLite database.

    Args:
        csv_file_path (str): The path to the input CSV file.
        db_file_path (str): The path for the output SQLite database file.
        table_name (str): The name of the table to create in the database.
    """
    try:
        # Step 1: Read the CSV file into a pandas DataFrame
        print(f"Reading data from '{csv_file_path}'...")
        df = pd.read_csv(csv_file_path)
        print("CSV data read successfully.")

        # Step 2: Establish a connection to the SQLite database
        # This will create the database file if it doesn't exist.
        print(f"Connecting to database '{db_file_path}'...")
        conn = sqlite3.connect(db_file_path)
        print("Database connection established.")

        # Step 3: Write the DataFrame to the SQLite database
        # - if_exists='replace': Drops the table before inserting new values.
        #   Alternatives: 'fail' (raises error), 'append' (adds data to existing table).
        # - index=False: Prevents pandas from writing the DataFrame index as a column.
        print(f"Importing data into table '{table_name}'...")
        df.to_sql(table_name, conn, if_exists='replace', index=False)

        # Step 4: Close the database connection
        conn.close()
        
        print(f"\n✅ Success! Data from '{csv_file_path}' has been imported into the '{table_name}' table in '{db_file_path}'.")

    except FileNotFoundError:
        print(f"❌ Error: The file '{csv_file_path}' was not found.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

# --- Main execution block ---
if __name__ == "__main__":
    # Configuration
    CSV_FILE = '/Users/jackstenglein/Downloads/lichess_db_puzzle.csv'
    DB_FILE = '/Users/jackstenglein/Documents/lichess_puzzles.db'
    TABLE_NAME = 'puzzles'

    # Run the import process
    import_csv_to_sqlite(CSV_FILE, DB_FILE, TABLE_NAME)
