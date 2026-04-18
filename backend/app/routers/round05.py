from fastapi import APIRouter
from app.data.round05.questions import set1_questions, set2_questions

router = APIRouter()

def fmt(i, q):
    return {
        "id": i,
        "question_en": q.get("question_en", ""),
        "question_kn": q.get("question_kn", ""),
        "options_en":  q.get("options_en", []),
        "options_kn":  q.get("options_kn", []),
        "answer":      q.get("answer", 0),
        "hint_en":     q.get("hint_en", ""),
        "hint_kn":     q.get("hint_kn", ""),
    }

@router.get("/questions")
def get_questions():
    return {
        "set1": [fmt(i, q) for i, q in enumerate(set1_questions)],
        "set2": [fmt(i, q) for i, q in enumerate(set2_questions)],
    }
