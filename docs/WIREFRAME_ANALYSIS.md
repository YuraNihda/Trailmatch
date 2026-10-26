# Аналіз вайфреймів

Спільний хедер: логотип, 4 пункти меню, випадаючий «City», Login, «Take the Quiz». Футер: меню + соцмережі.

| Екран | Елементи | Дії | Дані / Backend | Неясно |
|---|---|---|---|---|
| Home | Hero (Take the Quiz / Browse All Trips); Upcoming Trips (3 картки, View all); Recommended for You; «як це працює» (квіз→дата→оплата); відгуки; Instagram; команда; FAQ; CTA | Перехід до квізу/каталогу/туру | GET /departures, /recommendations, reviews | Instagram, команда, FAQ немає в Story Map (контент, не API) |
| Catalog | Рядок категорій (11 кружків), Filters, сітка 3×3 карток (дата, назва, 3d, Moderate, ціна/особа, Book Now), Show more, CTA квізу | Фільтрація, пагінація | GET /departures | Що таке «категорії»? Які саме фільтри в панелі? |
| Tour info | Hero-фото; смуга з 6 показників; віджет бронювання (вибір дати, ціна, поле, кнопка); акордеон (програма); блок гіда; «Included»; галерея; відгуки; Similar tours | Вибір дати, кількості, Book | GET /tours/{id}, /similar, /reviews | Поле у віджеті — кількість учасників? Підписи показників |
| Quiz | Прогрес-бар, питання, 4 варіанти, Назад/Далі | Відповідь, навігація | GET /quiz/questions, POST /quiz/submissions | Самі питання; одно/мультивибір |
| Recommended | Сітка 6 карток + CTA-смуга з 2 кнопками | — | POST /quiz/submissions або GET /recommendations | Тексти CTA |
| Guide page | Фото/опис, «Tours with this guide» | — | GET /guides/{id}, /guides/{id}/departures | Поля профілю |
| Profile | Шапка (ім'я, email, телефон, Edit, Go out); My details; My Quiz + Upcoming Trips; My Bookings (Futures/Past); My reviews (форма зірок + список) | Редагування, відгук | /users/me, /quiz/submissions/me, /bookings/me, /reviews | Дії кнопок у картках бронювань (скасування? у MVP немає); бічне меню |

Стани loading/empty/error у вайфреймах не показані — визначати у фронтенді.
