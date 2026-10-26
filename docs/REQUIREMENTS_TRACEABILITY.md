# Трасування

Requirement → Story → Екран → Ендпоінт → Сутність → Тест

| FR | Story | Екран | Endpoint | Entity | Тест |
|---|---|---|---|---|---|
| FR-001/002 | T-01/02 | Catalog | GET /departures | Departure, Tour | test_catalog_lists_and_filters |
| FR-003/004 | T-03/04 | Quiz, Recommended | POST /quiz/submissions | QuizQuestion, QuizSubmission | test_quiz_*, test_rule_* |
| FR-005 | T-05 | Home, Recommended | GET /recommendations | QuizSubmission | test_quiz_not_stored… |
| FR-007 | T-07 | Profile | PATCH /users/me | User | test_quiz_not_stored… |
| FR-008/009 | T-08/09 | Tour info | GET /tours/{id} | Tour | test_closed_tour… (частково) |
| FR-010 | T-10 | Tour info | GET /tours/{id}/similar | — | test_ml_failure… |
| FR-012 | T-12 | Tour info | GET /tours/{id}/reviews | Review | ❌ |
| FR-013 | T-13 | Guide page | GET /guides/{id} | Guide | ❌ |
| FR-014 | T-14 | Header (Login) | POST /auth/register, /login | User | test_auth |
| FR-015/016 | T-15/16 | Tour info | POST /bookings | Booking | test_booking_* |
| FR-017 | T-17 | — | POST /bookings/{id}/payments | Payment | test_booking_hold_pay… |
| FR-018 | T-19 | Profile | GET /bookings/me | Booking | test_cannot_pay… |
| FR-019 | T-20 | Profile | POST /reviews | Review | ❌ |
| FR-020–023 | M-01…04 | (адмінка — вайфреймів немає) | /admin/tours… | Tour, Departure | test_admin |
| FR-024/025 | M-05/06 | — | /admin/bookings, participants.csv | Booking | test_csv_export… |
| FR-026 | M-07 | — | PATCH /admin/reviews/{id} | Review | ❌ |
| FR-027 | M-08 | — | PATCH /admin/users/{id}/role | User | test_only_admin… |

Виняток: вайфреймів адмін-панелі немає — UI не проєктувався (не вигадуємо).
