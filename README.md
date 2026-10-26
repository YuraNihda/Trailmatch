# TrailMatch — MVP backend (FastAPI + PostgreSQL)

Бекенд MVP (29 історій зі Story Map: T-01…T-20, M-01…M-08; Release 2/3 не входять).

## Статус (чесно)
| Що | Стан |
|---|---|
| Код API, моделі, міграція 0001, сервіси | Написано |
| Компіляція Python (`py_compile`) | Перевірено |
| Чиста логіка (правило T-04, sanitize ML-виходу) | Запущено, проходить |
| `pytest` (API/БД/авторизація) | **Написано, але НЕ запускалось** — у середовищі генерації не було доступу до PyPI |
| Міграція на реальному PostgreSQL | **Не перевірялась** |
| Frontend | Не входить (лише бекенд) |

Перший крок у вас: `pytest -q` — і виправити те, що впаде.

## Запуск
```bash
cp .env.example .env            # згенеруйте JWT_SECRET
docker compose up --build       # API: http://127.0.0.1:8000/docs
docker compose exec api python scripts/seed_dev.py   # dev-дані (ENVIRONMENT=development)
```
Локально без Docker:
```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
export JWT_SECRET=$(python -c "import secrets;print(secrets.token_urlsafe(48))") ML_MODE=mock PAYMENT_MODE=mock
export DATABASE_URL=sqlite:///./dev.db && alembic upgrade head && uvicorn app.main:app --reload
pytest -q
```

## Важливо
* **ML**: реальних моделей немає (SPECIFICATION_PENDING). `ML_MODE=mock` — лише dev/test, у staging/production застосунок не стартує. Відповіді mock мають `is_mock: true`.
* **Оплата**: провайдер не обраний. `PAYMENT_MODE=mock` — лише dev/test; без нього `POST /bookings/{id}/payments` → 501.
* Правило T-04 (новачок → лише easy) виконується і до, і після ML.
* Документація: `docs/` (вимоги, трасування, відкриті питання, рішення, ML-план).
