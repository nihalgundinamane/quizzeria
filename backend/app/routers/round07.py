from fastapi import APIRouter
from app.data.round07.questions import (
    word_questions, game_questions, actors_questions,
    cricketer_questions, songs_questions
)
router = APIRouter()

@router.get("/emoji/word")
def get_word(): return {"questions": word_questions}

@router.get("/emoji/game")
def get_game(): return {"questions": game_questions}

@router.get("/emoji/actors")
def get_actors(): return {"questions": actors_questions}

@router.get("/emoji/cricketer")
def get_cricketer(): return {"questions": cricketer_questions}

@router.get("/emoji/songs")
def get_songs(): return {"questions": songs_questions}
