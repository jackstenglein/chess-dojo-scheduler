import pandas as pd

def combine_csvs_case_insensitive(file1, file2, output_file, duplicate_col):
    # 1. Load the CSV files
    df1 = pd.read_csv(file1, quotechar='"', on_bad_lines='warn')
    df2 = pd.read_csv(file2, quotechar='"', on_bad_lines='warn')

    # 2. Combine the two DataFrames
    combined_df = pd.concat([df1, df2], ignore_index=True)

    # 3. Create a temporary lowercase column for comparison
    # We use .astype(str) to ensure no errors if there are numbers/NaNs
    temp_col_name = '_temp_lowercase_check'
    combined_df[temp_col_name] = combined_df[duplicate_col].astype(str).str.lower().str.strip()

    # 4. Remove duplicates based on the temporary column
    cleaned_df = combined_df.drop_duplicates(subset=[temp_col_name], keep='first')

    # 5. Remove the temporary column before saving
    cleaned_df = cleaned_df.drop(columns=[temp_col_name])

    # 6. Save the result
    cleaned_df.to_csv(output_file, index=False)
    
    print(f"Success! Combined file saved as: {output_file}")
    print(f"Original rows: {len(combined_df)} | Final rows: {len(cleaned_df)}")

# --- Configuration ---
TARGET_COLUMN = 'email' 
combine_csvs_case_insensitive('CognitoUsers.csv', 'subscribers_google_sheets.csv', 'combined_subscribers.csv', TARGET_COLUMN)
