import os
import json
from google import genai

# Lấy GEMINI_API_KEY từ biến môi trường
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    raise SystemExit(
        "❌ LỖI: Chưa cấu hình GEMINI_API_KEY trong GitHub Secrets! "
        "Vào Settings > Secrets and variables > Actions > New repository secret."
    )

# Khởi tạo client chuẩn theo thư viện google-genai
client = genai.Client(api_key=GEMINI_API_KEY)


def create_task_spec(user_prompt):
    print("🤖 Gemini đang phân tích yêu cầu công việc...")

    prompt = f"""
    Bạn là Cổng điều phối trung tâm (Orchestrator). Hãy phân tích yêu cầu công việc sau đây và tạo ra danh sách chi tiết các yêu cầu kỹ thuật (Technical Specification) cho một ứng dụng web hoàn chỉnh.

    Yêu cầu công việc:
    "{user_prompt}"

    Trả về định dạng JSON thuần túy gồm:
    - "app_name": Tên ứng dụng
    - "description": Mô tả ứng dụng
    - "features": Danh sách tính năng chính
    - "files_to_generate": Danh sách các file code cần tạo
    """

    try:
        # Dùng model hợp lệ với Google GenAI SDK; gemini-3.8-flash không phải tên model hợp lệ.
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        response_text = getattr(response, "text", None)
        if response_text is None:
            response_text = json.dumps(response.model_dump(), ensure_ascii=False, indent=2)

        print("Gemini Orchestrator Response:")
        print(response_text)

        # Lưu kết quả phân tích thành file spec
        with open("task_spec.json", "w", encoding="utf-8") as f:
            f.write(response_text)

    except Exception as exc:
        raise RuntimeError(
            f"❌ LỖI khi gọi Gemini model '{GEMINI_MODEL}': {exc}. "
            "Kiểm tra lại GEMINI_API_KEY và tên model được hỗ trợ bởi Google AI Studio."
        ) from exc


if __name__ == "__main__":
    prompt = os.environ.get("USER_PROMPT", "Tạo một ứng dụng Web Todo List bằng HTML, CSS, JS thuần.")
    create_task_spec(prompt)
