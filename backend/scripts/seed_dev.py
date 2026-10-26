"""DEV ONLY seed. Quiz questions below are PLACEHOLDERS: real content is pending (OPEN_QUESTIONS Q-3)."""
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import get_engine
from app.models import Departure, Difficulty, Guide, QuizQuestion, Role, Tour, TourStatus, User

s = get_settings()
if s.environment not in ("development", "test"):
    raise SystemExit("Refusing to seed outside development/test")


def U(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&q=80&w=1000"


# ---------------- Гіди ----------------
GUIDES = [
    dict(key="taras", name="Тарас Бойко", experience_years=12,
         bio="Головний гід. Водить групи Чорногорою понад десять років, сертифікований рятувальник.",
         photo_url=U("photo-1500648767791-00dcc994a43e")),
    dict(key="maria", name="Марія Ткач", experience_years=8,
         bio="Спеціалізується на маршрутах Закарпаття та безпеці в горах.",
         photo_url=U("photo-1494790108377-be9c29b29330")),
    dict(key="oleh", name="Олег Гнатюк", experience_years=15,
         bio="Гід по Карпатах, любить складні хребтові маршрути та нічлігі в наметах.",
         photo_url=U("photo-1507003211169-0a1dd7228f2d")),
]

# ---------------- 9 турів ----------------
# (slug, title, region, difficulty, days, km, gain_m, max_alt_m, price, capacity, guide, photo, tags, description)
TOURS = [
    ("hoverla-classic", "Говерла: класичний підйом", "Чорногора", Difficulty.moderate, 1, 14, 1000, 2061, 2200, 12, "taras",
     "photo-1506905925346-21bda4d32df4", ["однодений", "новачкам"],
     "Одноденний підйом на найвищу вершину України зі старту в Заросляку."),
    ("chornohora-ridge", "Чорногірський хребет", "Чорногора", Difficulty.hard, 3, 38, 2400, 2061, 4800, 10, "oleh",
     "photo-1486870591958-9b9d0d1dda99", ["хребет", "намети"],
     "Триденний перехід головним хребтом Чорногори з ночівлями в наметах."),
    ("synevyr-zakarpattia", "Синевир та Закарпаття", "Закарпаття", Difficulty.easy, 2, 18, 500, 1000, 3100, 15, "maria",
     "photo-1501785888041-af3ef285b470", ["вікенд", "сімейний"],
     "Спокійний вікенд: озеро Синевир, водоспад Шипіт і дерев'яні церкви."),
    ("svydovets-ridge", "Свидовецький хребет", "Свидовець", Difficulty.moderate, 2, 24, 1300, 1883, 2900, 12, "taras",
     "photo-1454496522488-7a8e488e8606", ["хребет", "полонини"],
     "Дводенний траверс полонинами Свидовця з видом на Чорногору."),
    ("marmarosy-peaks", "Мармароські вершини", "Мармароси", Difficulty.hard, 3, 36, 2100, 1940, 4200, 8, "oleh",
     "photo-1519681393784-d120267933ba", ["вершини", "скелі"],
     "Складний маршрут скелястими гребенями Мармароського масиву."),
    ("gorgany-wild", "Горгани: дикі скелі", "Горгани", Difficulty.hard, 3, 32, 1900, 1883, 3800, 10, "oleh",
     "photo-1500530855697-b586d89ba3ee", ["дикі гори", "кам'яні розсипи"],
     "Горгани з кам'яними розсипами Довбушанки та Сивулі, найдикішою частиною Карпат."),
    ("borzhava-meadows", "Боржавські полонини", "Боржава", Difficulty.easy, 2, 20, 600, 1493, 2400, 14, "maria",
     "photo-1469474968028-56623f02e42e", ["полонини", "вікенд"],
     "Легка прогулянка Боржавською полониною з бескидними краєвидами."),
    ("hutsul-trails", "Гуцульські стежки", "Гуцульщина", Difficulty.easy, 1, 12, 400, 1100, 1800, 15, "maria",
     "photo-1472396961693-142e6e269027", ["однодений", "культура"],
     "Одноденний похід гуцульськими селами з дегустацією місцевої кухні."),
    ("pip-ivan-marmaroski", "Піп Іван Мармароський", "Мармароси", Difficulty.moderate, 2, 22, 1400, 1936, 3300, 10, "taras",
     "photo-1464822759023-fed622ff2c3b", ["вершина", "історія"],
     "Підйом до руїн польської обсерваторії на горі Піп Іван Мармароський."),
]

DEPARTURE_OFFSETS = [10, 24, 38]  # днів від сьогодні; для кожного туру зсув +i


def get_or_create_user(db, email: str, full_name: str, role: Role, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(email=email, full_name=full_name, role=role, password_hash=hash_password(password))
        db.add(user)
        db.flush()
    return user


with sessionmaker(bind=get_engine())() as db:
    get_or_create_user(db, "admin@example.com", "Dev Admin", Role.admin, "dev-admin-password-1")
    mgr = get_or_create_user(db, "manager@example.com", "Dev Manager", Role.manager, "dev-manager-password-1")

    # Гіди
    guide_ids: dict[str, int] = {}
    for g in GUIDES:
        row = db.scalar(select(Guide).where(Guide.name == g["name"]))
        if not row:
            row = Guide(name=g["name"], bio=g["bio"], experience_years=g["experience_years"],
                        photo_url=g["photo_url"])
            db.add(row)
            db.flush()
        guide_ids[g["key"]] = row.id

    # Тури та виїзди
    created = 0
    for i, (slug, title, region, diff, days, km, gain, alt, price, cap, guide_key, photo, tags, desc) in enumerate(TOURS):
        if db.scalar(select(Tour).where(Tour.slug == slug)):
            continue
        t = Tour(
            slug=slug, title=title, region=region, difficulty=diff, duration_days=days,
            distance_km=km, elevation_gain_m=gain, max_altitude_m=alt,
            description=desc,
            program=[{"day": d, "title": f"День {d}", "description": ""} for d in range(1, days + 1)],
            required_documents="Паспорт або ID-картка",
            included=["Гід", "Страхування", "Аптечка"],
            checklist=["Трекінгове взуття", "Вода 1.5 л", "Дощовик"],
            status=TourStatus.published, created_by=mgr.id,
            tags=tags, photo_urls=[U(photo)],
        )
        db.add(t)
        db.flush()
        for off in DEPARTURE_OFFSETS:
            db.add(Departure(
                tour_id=t.id, guide_id=guide_ids[guide_key],
                start_date=date.today() + timedelta(days=off + i),
                price_uah=price, capacity=cap,
            ))
        created += 1

    # Квіз (placeholder)
    if not db.scalar(select(QuizQuestion).where(QuizQuestion.position == 1)):
        db.add(QuizQuestion(position=1, text="PLACEHOLDER: preferred pace?",
                            options=[{"value": "calm", "label": "Calm"}, {"value": "fast", "label": "Fast"}]))

    db.commit()
    print(f"seeded: guides={len(guide_ids)}, new tours={created}, departures per tour={len(DEPARTURE_OFFSETS)}")
    print("admin@example.com / manager@example.com (dev passwords in scripts/seed_dev.py)")