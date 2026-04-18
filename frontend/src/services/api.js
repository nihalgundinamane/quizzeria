const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

async function get(url) {
  const res = await fetch(`${BASE}${url}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`)
  return res.json()
}

export const api = {
  // Round 01
  getR01Categories: ()         => get('/round01/categories'),
  getR01Questions:  (cat)      => get(`/round01/${cat}`),
  getR01Hint:       (cat, idx) => get(`/round01/${cat}/${idx}/hint`),
  // Round 02
  getR02Questions:  (cat)      => get(`/round02/${cat}`),
  // Round 03
  getR03Questions:  (endpoint) => get(endpoint),
  // Round 04
  getR04Questions:  ()         => get('/round04/questions'),
  getR04Hint:       (idx)      => get(`/round04/${idx}/hint`),
  // Round 05
  getR05Questions:  ()         => get('/round05/questions'),
  // Round 07
  getR07Questions:  (endpoint) => get(endpoint),
  // Round 08
  getR08Questions:  ()         => get('/round08/questions'),
}

