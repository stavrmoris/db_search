import os
from typing import Dict, Any
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


DB_SCHEMA = """
Таблицы:
users(id, first_name, last_name, email, username, department_id, is_manager, is_active)
tasks(id, title, description, status, priority, created_by_user_id, assigned_user_id, assigned_department_id, created_at, updated_at, due_date)
task_history(id, task_id, changed_by_user_id, field_name, old_value, new_value, changed_at)
"""

def nl_to_sql(user_text: str, user_info: Dict[str, Any]) -> str:
    user_context = f"""
Информация о текущем пользователе, от имени которого выполняется запрос:
- ID: {user_info['id']}
- Имя: {user_info['first_name']} {user_info['last_name']}
- ID отдела: {user_info['department_id']}
- Является менеджером: {'Да' if user_info['is_manager'] else 'Нет'}
"""

    prompt = f"""
Ты — генератор SQL для PostgreSQL.
Всегда отвечай ТОЛЬКО валидным SQL-запросом без пояснений, без markdown, без текста.
Используй только таблицы и поля из схемы ниже.

{user_context} # <--- ВОТ ОНО! ДОБАВЛЯЕМ КОНТЕКСТ

Важно:
- Если пользователь говорит "мои задачи", "задачи для меня", используй `assigned_user_id = {user_info['id']}`.
- Если пользователь говорит "задачи моего отдела", используй `assigned_department_id = {user_info['department_id']}`.
- Всегда используй значения статусов задач в нижнем регистре: new, in_progress, completed, cancelled, on_hold
- Всегда используй значения приоритетов в нижнем регистре: low, medium, high, urgent

Схема:
{DB_SCHEMA}

Пример:
Вопрос: "Покажи все мои задачи"
Ответ: SELECT id, title, status, priority FROM tasks WHERE assigned_user_id = {user_info['id']};

Теперь преобразуй:
"{user_text}"
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    sql = response.text

    if not sql.lower().startswith(("select", "insert", "update", "delete")):
        raise ValueError(f"LLM вернула не-SQL: {sql}")

    return sql