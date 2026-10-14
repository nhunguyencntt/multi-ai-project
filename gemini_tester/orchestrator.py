import os
import json
import google.generativeai as genai

# Hỗ trợ lấy từ cả GEMINI_API_KEY hoặc GOOGLE_API_KEY
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ LỖI: Chưa cấu hình GEMINI_API_KEY trong GitHub Secrets hoặc biến môi trường bị trống!")

genai.configure(api_key=GEMINI_API_KEY)

def create_task_spec(user_prompt):
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    prompt = f"""
    Bạn là Cổng điều phối trung tâm (Orchestrator). Hãy phân tích yêu cầu công việc sau đây và tạo ra danh sách chi tiết các yêu cầu kỹ thuật (Technical Specifications) để các AI lập trình thực hiện.
    
    Yêu cầu công việc:
    "{user_prompt}"
    
    Trả về định dạng JSON thuần túy gồm:
    - "app_name": Tên ứng dụng
    - "description": Mô tả ứng dụng
    - "features": Danh sách tính năng chính
    - "files_to_generate": Danh sách các file code cần tạo
    """
    
    response = model.generate_content(prompt)
    print("Gemini Orchestrator Response:")
    print(response.text)
    
    # Lưu kết quả phân tích thành file spec
    with open("task_spec.json", "w", encoding="utf-8") as f:
        f.write(response.text)

if __name__ == "__main__":
    prompt = os.environ.get("USER_PROMPT", "Tạo một ứng dụng Web Todo List bằng HTML, CSS, JS thuần.")
    create_task_spec(prompt)
