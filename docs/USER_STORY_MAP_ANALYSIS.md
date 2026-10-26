# Аналіз User Story Map (MVP)

Ієрархія: Роль → Activity → Task → Story. Критерії прийняття в джерелі **відсутні** — нижче «поведінка» виведена з тексту історії, не з AC.

| ID | Роль | Activity / Task | Тип | API | Тести |
|---|---|---|---|---|---|
| T-01 | Турист | Знайти похід / Переглянути каталог | — | GET /departures | test_catalog_lists_and_filters |
| T-02 | Турист | …/ Переглянути каталог | — | GET /departures?filters | те саме |
| T-03 | Турист | Пройти квіз | ML | POST /quiz/submissions | test_quiz_* |
| T-04 | Турист | Пройти квіз | Правило | в recommend_for_profile | test_rule_beginner*, test_quiz_beginner* |
| T-05 | Турист | Отримати рекомендації | ML | GET /recommendations | test_quiz_not_stored… |
| T-06 | Турист | Отримати рекомендації | ML | поле `reasons` | (mock) |
| T-07 | Турист | Отримати рекомендації | — | PATCH /users/me | test_quiz_not_stored… |
| T-08/09 | Турист | Обрати тур / Вивчити тур | — | GET /tours/{id} | — |
| T-10 | Турист | Порівняти варіанти | ML | GET /tours/{id}/similar | test_ml_failure… |
| T-11 | Турист | Порівняти варіанти | Правило | **не реалізовано** | — |
| T-12/13 | Турист | Перевірити довіру | — | GET /tours/{id}/reviews, /guides/{id} | — |
| T-14 | Турист | Оформити бронювання | — | POST /auth/register | test_auth |
| T-15/16 | Турист | Оформити бронювання | — | POST /bookings | test_booking_* |
| T-17 | Турист | Оплатити | — | POST /bookings/{id}/payments | test_booking_hold_pay… |
| T-18 | Турист | Отримати інформацію | — | дані туру | — [Q-6] |
| T-19 | Турист | Керувати бронюванням | — | GET /bookings/me | test_cannot_pay_someone… |
| T-20 | Турист | Поділитися враженнями | — | POST /reviews | **тестів ще немає** |
| M-01/02 | Менеджер | Керувати каталогом / Тури | — | POST/PATCH /admin/tours | test_admin |
| M-03 | Менеджер | …/ Виїзди | — | POST /admin/tours/{id}/departures | test_admin |
| M-04 | Менеджер | …/ Виїзди | Правило | PATCH status=closed | test_close_requires_reason, test_closed_tour… |
| M-05 | Менеджер | Бронювання | — | GET /admin/bookings | частково |
| M-06 | Менеджер | Бронювання | — | GET …/participants.csv | test_csv_export… |
| M-07 | Менеджер | Модерувати / Відгуки | — | PATCH /admin/reviews/{id} | **тестів ще немає** |
| M-08 | Адмін | Модерувати / Доступи | — | PATCH /admin/users/{id}/role, scope по created_by | test_manager_cannot…, test_only_admin… |
