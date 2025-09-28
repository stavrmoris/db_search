from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from db import execute_query, get_connection
from llm import nl_to_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    user_id: int
    text: str


@app.post("/query")
def run_query(req: QueryRequest):
    try:
        user_info_list = execute_query(
            f"SELECT id, first_name, last_name, department_id, is_manager FROM users WHERE id = {req.user_id}")
        if not user_info_list:
            raise HTTPException(status_code=404, detail=f"Пользователь с ID {req.user_id} не найден")
        user_info = user_info_list[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении данных пользователя: {e}")

    sql = nl_to_sql(req.text, user_info)

    if "{USER_ID}" in sql:
        sql = sql.replace("{USER_ID}", str(req.user_id))

    try:
        result = execute_query(sql)
        return {"sql": sql, "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "sql": sql})


@app.get("/users")
def get_users():
    try:
        users = execute_query("SELECT id, first_name, last_name, is_manager FROM users ORDER BY last_name, first_name")
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
