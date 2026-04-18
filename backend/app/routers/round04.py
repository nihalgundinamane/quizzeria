from fastapi import APIRouter
from app.data.round04.questions import round04_questions

router = APIRouter()

@router.get("/questions")
def get_questions():
    qs = [{"id":i,"question_en":q.get("question_en",""),"question_kn":q.get("question_kn",""),
           "options_en":q.get("options_en",[]),"options_kn":q.get("options_kn",[]),
           "answer":q.get("answer",0),"hint_en":q.get("hint_en",""),"hint_kn":q.get("hint_kn","")}
          for i,q in enumerate(round04_questions)]
    return {"total": len(qs), "questions": qs}

@router.get("/{index}/hint")
def get_hint(index: int):
    if index >= len(round04_questions): return {"hint_en":"","hint_kn":""}
    q = round04_questions[index]
    return {"hint_en":q.get("hint_en",""),"hint_kn":q.get("hint_kn","")}
