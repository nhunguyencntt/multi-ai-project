import os
import json
from google import genai

# Lấy GEMINI_API_KEY từ biến môi trường
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ LỖI: Chưa cấu hình GEMINI_API_KEY trong GitHub Secrets!")

# Khởi tạo client chuẩn theo thư viện mới google-genai
client = genai.Client(api_key=GEMINI_API_KEY)

def create_task_spec(user_prompt):
    print("🤖 Gemini đang phân tích yêu cầu công việc...")
    
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
    
    # Sử dụng model gemini-3.8-flash hoặc gemini-3.8-pro chuẩn mới nhất
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
    )
    
    print("Gemini Orchestrator Response:")
    print(response.text)
    
    # Lưu kết quả phân tích thành file spec
    with open("task_spec.json", "w", encoding="utf-8") as f:
        f.write(response.text)

if __name__ == "__main__":
    prompt = os.environ.get("USER_PROMPT", "Tạo một ứng dụng Web Todo List bằng HTML, CSS, JS thuần.")
    create_task_spec(prompt)
