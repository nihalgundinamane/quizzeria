from fastapi import APIRouter
from app.data.round08.questions import boss_questions

router = APIRouter()

@router.get("/questions")
def get_questions():
    return {
        "total": len(boss_questions),
        "questions": [
            {
                "id": i,
                "question_en": q.get("question_en",""),
                "question_kn": q.get("question_kn",""),
                "options_en":  q.get("options_en",[]),
                "options_kn":  q.get("options_kn",[]),
                "answer":      q.get("answer",0),
                "hints_en":    q.get("hints_en",[]),
                "hints_kn":    q.get("hints_kn",[]),
            }
            for i,q in enumerate(boss_questions)
        ]
    }
