from fastapi import APIRouter
from app.data.round03.gadegalu    import gadegalu_questions
from app.data.round03.vagatugalu  import vagatugalu_questions
from app.data.round03.jumbled     import jumbled_questions
from app.data.round03.songs       import songs_questions
from app.data.round03.smart_funny import smart_funny_questions
from app.data.round03.eng_kn      import eng_kn_questions

router = APIRouter()

def fmt_q(i, q):
    return {"id":i, "question_en":q.get("question_en",""), "question_kn":q.get("question_kn",""),
            "options_en":q.get("options_en",[]), "options_kn":q.get("options_kn",[]),
            "answer":q.get("answer",0), "hint_en":q.get("hint_en",""), "hint_kn":q.get("hint_kn","")}

@router.get("/gadegalu")
def get_gadegalu():
    return {"category":"gadegalu","total":len(gadegalu_questions),"questions":[fmt_q(i,q) for i,q in enumerate(gadegalu_questions)]}

@router.get("/vagatugalu")
def get_vagatugalu():
    return {"category":"vagatugalu","total":len(vagatugalu_questions),"questions":[fmt_q(i,q) for i,q in enumerate(vagatugalu_questions)]}

@router.get("/jumbled")
def get_jumbled():
    return {"category":"jumbled","total":len(jumbled_questions),"questions":[{"id":i,"jumbled":q.get("jumbled",""),"answer":q.get("answer",""),"hint_en":q.get("hint_en",""),"hint_kn":q.get("hint_kn","")} for i,q in enumerate(jumbled_questions)]}

@router.get("/songs")
def get_songs():
    return {"category":"songs","total":len(songs_questions),"questions":[{"id":i,"question_kn":q.get("question_kn",""),"question_en":q.get("question_en",""),"answer_en":q.get("answer_en",""),"hint_en":q.get("hint_en","")} for i,q in enumerate(songs_questions)]}

@router.get("/smart-funny")
def get_smart_funny():
    return {"category":"smart_funny","total":len(smart_funny_questions),"questions":[fmt_q(i,q) for i,q in enumerate(smart_funny_questions)]}

@router.get("/eng-kn")
def get_eng_kn():
    return {"category":"eng_kn","total":len(eng_kn_questions),"questions":[{"id":i,"question_en":q.get("question_en",""),"answer_kn":q.get("answer_kn","")} for i,q in enumerate(eng_kn_questions)]}
