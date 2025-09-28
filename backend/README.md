# AI Assistant - Бэкенд

Этот подраздел представляет собой RESTful API бэкенд, созданный с использованием **FastAPI**. Его основная задача — принимать запросы на естественном языке от клиентского приложения, преобразовывать их в SQL-запросы с помощью **Google API** и выполнять их в базе данных **PostgreSQL**.

## 🛠️ Технологический стек

*   **Фреймворк:** [FastAPI](https://fastapi.tiangolo.com/)
*   **Сервер:** [Uvicorn](https://www.uvicorn.org/)
*   **База данных:** [PostgreSQL](https://www.postgresql.org/)
*   **Драйвер БД:** [psycopg2-binary](https://www.psycopg.org/docs/)
*   **Языковая модель (LLM):** [Google Gemini](https://ai.google.dev/)
*   **Управление переменными окружения:** [python-dotenv](https://pypi.org/project/python-dotenv/)

## 🚀 Установка и запуск

Для развертывания этого бэкенда на локальной машине выполните следующие шаги.

### Предварительные требования

*   **Python 3.9+**
*   **PostgreSQL:** Запущенный и доступный экземпляр СУБД.
*   **Git**

### Пошаговая инструкция

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/stavrmoris/db_search.git
    cd db_search
    ```

2.  **Создайте и активируйте виртуальное окружение:**
    ```bash
    # Для macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # Для Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Установите зависимости:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Настройте переменные окружения:**
    *   Создайте файл `.env` в корневой папке проекта.
    *   Скопируйте в него содержимое из секции `.env.example` ниже и заполните своими данными.

5.  **Запустите сервер:**
    ```bash
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
    ```
    *   Флаг `--reload` включает автоматический перезапуск сервера при изменении кода, что удобно для разработки.

Сервер будет доступен по адресу `http://localhost:8000`.

## ⚙️ Переменные окружения

Для работы приложения необходимо определить следующие переменные. Создайте файл `.env` в корне проекта по этому шаблону.

```dotenv
# .env.example

# --- Настройки базы данных PostgreSQL ---
DB_HOST=localhost
DB_PORT=5434
DB_NAME=task_db
DB_USER=postgres
DB_PASS=postgres

# --- API Ключ для Google Gemini ---
GOOGLE_API_KEY="Ваш_Секретный_Ключ"
