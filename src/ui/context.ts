import { TodoDB } from '../data/db'
import { createStore } from '../data/store'

export const db = new TodoDB()
export const store = createStore(db)
