from fastapi import APIRouter, HTTPException
from app.data.round02.questions import (
    logos_questions, animals_questions, actors_questions,
    gods_questions, cricketers_questions
)
router = APIRouter()

CAT_MAP = {
    'logos':      logos_questions,
    'animals':    animals_questions,
    'actors':     actors_questions,
    'gods':       gods_questions,
    'cricketers': cricketers_questions,
}

CAT_META = [
    {"id":"logos",      "label":"Chihn Grahana", "sub":"Brand Logos",        "kn":"ಚಿಹ್ನೆ ಗ್ರಹಣ", "count":len(logos_questions)},
    {"id":"animals",    "label":"Vanya Darshana", "sub":"Wild Animals",       "kn":"ವನ್ಯ ದರ್ಶನ",  "count":len(animals_questions)},
    {"id":"actors",     "label":"Nayaka Drushya", "sub":"Indian Actors",      "kn":"ನಾಯಕ ದೃಶ್ಯ",  "count":len(actors_questions)},
    {"id":"gods",       "label":"Devara Pratibimba","sub":"Gods & Deities",   "kn":"ದೇವರ ಪ್ರತಿಬಿಂಬ","count":len(gods_questions)},
    {"id":"cricketers", "label":"Krida Veerana", "sub":"Indian Cricketers",   "kn":"ಕ್ರೀಡಾ ವೀರಾ",  "count":len(cricketers_questions)},
]

@router.get("/categories")
def get_categories(): return {"categories": CAT_META}

@router.get("/{category}")
def get_questions(category: str):
    if category not in CAT_MAP: raise HTTPException(404, f"Category '{category}' not found")
    return {"category": category, "total": len(CAT_MAP[category]), "questions": CAT_MAP[category]}
