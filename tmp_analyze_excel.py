import pandas as pd

def analyze_excel(file_path, output_file):
    try:
        df = pd.read_excel(file_path)
        output_file.write(f"\n--- Analysis for {file_path} ---\n")
        output_file.write(f"Columns: {list(df.columns)}\n")
        output_file.write(f"Data Types:\n{df.dtypes.to_string()}\n")
        output_file.write(f"First 3 Rows:\n{df.head(3).to_string()}\n")
    except Exception as e:
        output_file.write(f"Error reading {file_path}: {e}\n")

if __name__ == "__main__":
    with open("analysis_results.txt", "w", encoding="utf-8") as f:
        analyze_excel(r"c:\Users\marcu\OneDrive\Área de Trabalho\Projetos\saas-lavaggio\assets\Contas a pagar - 2026.xlsx", f)
        analyze_excel(r"c:\Users\marcu\OneDrive\Área de Trabalho\Projetos\saas-lavaggio\assets\Faturamento Lavaggio 2026.xlsx", f)
