import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AnswerValue, FormSubmission } from '../types/form'

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

function mapSubmission(id: string, data: DocumentData): FormSubmission {
  return {
    id,
    answers: (data.answers as Record<string, AnswerValue>) ?? {},
    submittedAt: toDate(data.submittedAt),
  }
}

export async function createSubmission(
  formId: string,
  answers: Record<string, AnswerValue>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'forms', formId, 'submissions'), {
    answers,
    submittedAt: serverTimestamp(),
  })
  return ref.id
}

export async function listSubmissions(formId: string): Promise<FormSubmission[]> {
  const q = query(
    collection(db, 'forms', formId, 'submissions'),
    orderBy('submittedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapSubmission(d.id, d.data()))
}
