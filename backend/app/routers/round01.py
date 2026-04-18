from fastapi import APIRouter, HTTPException
from app.data.round01.gk           import gk_questions
from app.data.round01.karnataka    import karnataka_questions
from app.data.round01.science      import science_questions
from app.data.round01.sports       import sports_questions
from app.data.round01.technology   import technology_questions
from app.data.round01.geography    import geography_questions
from app.data.round01.history      import history_questions
from app.data.round01.food_culture import food_culture_questions
from app.data.round01.ramayana     import ramayana_questions
from app.data.round01.mahabharata  import mahabharata_questions

router = APIRouter()

CATEGORY_MAP = {
    "gk": gk_questions, "karnataka": karnataka_questions,
    "science": science_questions, "sports": sports_questions,
    "technology": technology_questions, "geography": geography_questions,
    "history": history_questions, "food_culture": food_culture_questions,
    "ramayana": ramayana_questions, "mahabharata": mahabharata_questions,
}

CATEGORY_META = [
    {"id":"gk",           "label":"Sarvagna",          "sub":"General Knowledge", "count":len(gk_questions)},
    {"id":"karnataka",    "label":"Namma Nadu",         "sub":"Karnataka",         "count":len(karnataka_questions)},
    {"id":"science",      "label":"Einstein's Corner",  "sub":"Science",           "count":len(science_questions)},
    {"id":"sports",       "label":"Arena",              "sub":"Sports & Cricket",  "count":len(sports_questions)},
    {"id":"technology",   "label":"Tech Titans",        "sub":"Technology",        "count":len(technology_questions)},
    {"id":"geography",    "label":"Terra Firma",        "sub":"Geography",         "count":len(geography_questions)},
    {"id":"history",      "label":"Itihaas",            "sub":"History",           "count":len(history_questions)},
    {"id":"food_culture", "label":"Ruchi & Sanskriti",  "sub":"Food & Culture",    "count":len(food_culture_questions)},
    {"id":"ramayana",     "label":"Raama Katha",        "sub":"Ramayana",          "count":len(ramayana_questions)},
    {"id":"mahabharata",  "label":"Kurukshetra",        "sub":"Mahabharata",       "count":len(mahabharata_questions)},
]

def fmt_q(i, q):
    return {
        "id": i,
        "question_en": q.get("question_en", ""),
        "question_kn": q.get("question_kn", ""),
        "options_en":  q.get("options_en", []),
        "options_kn":  q.get("options_kn", []),
        "answer": q.get("answer", 0),
    }

@router.get("/categories")
def get_categories():
    return {"categories": CATEGORY_META}

@router.get("/{category}")
def get_questions(category: str):
    if category not in CATEGORY_MAP:
        raise HTTPException(404, f"Category '{category}' not found")
    qs = CATEGORY_MAP[category]
    return {"category": category, "total": len(qs), "questions": [fmt_q(i,q) for i,q in enumerate(qs)]}

@router.get("/{category}/{index}/hint")
def get_hint(category: str, index: int):
    if category not in CATEGORY_MAP:
        raise HTTPException(404, "Category not found")
    qs = CATEGORY_MAP[category]
    if index >= len(qs): raise HTTPException(404, "Index out of range")
    q = qs[index]
    return {"hint_en": q.get("hint_en",""), "hint_kn": q.get("hint_kn","")}
