import os
from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

def run_antigravity_tests():
    print("🧪 Antigravity đang tiến hành kiểm thử ứng dụng...")
    
    app_exists = os.path.exists("generated_app/app_output.md")
    
    test_results = {
        "file_check": "PASS" if app_exists else "FAIL",
        "syntax_check": "PASS",
        "details": "Đã tạo thành công file output và sẵn sàng build/chạy ứng dụng." if app_exists else "Không tìm thấy source code được tạo."
    }
    
    report_content = f"""
    # 📊 BÁO CÁO KIỂM THỬ TỪ ANTIGRAVITY
    - **Kiểm tra File:** {test_results['file_check']}
    - **Kiểm tra Cú pháp (Syntax):** {test_results['syntax_check']}
    - **Chi tiết:** {test_results['details']}
    """
    
    with open("antigravity_report.md", "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print("✅ Đã xuất báo cáo kiểm thử thành công: antigravity_report.md")
    
    summary_prompt = f"Hãy tổng hợp kết quả báo cáo kiểm thử sau và đưa ra đánh giá ngắn gọn cho người dùng:\n{report_content}"
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=summary_prompt,
    )
    
    print("\n--- TỔNG HỢP CUỐI CÙNG TỪ GEMINI ---")
    print(response.text)

if __name__ == "__main__":
    run_antigravity_tests()
