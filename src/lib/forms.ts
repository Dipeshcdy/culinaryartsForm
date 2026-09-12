import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { FormDoc, FormField, FormStatus } from '../types/form'

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

function mapForm(id: string, data: DocumentData): FormDoc {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    status: (data.status as FormStatus) ?? 'draft',
    fields: Array.isArray(data.fields) ? (data.fields as FormField[]) : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: data.createdBy ?? '',
  }
}

export async function listForms(): Promise<FormDoc[]> {
  const q = query(collection(db, 'forms'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapForm(d.id, d.data()))
}

export async function getForm(formId: string): Promise<FormDoc | null> {
  const snap = await getDoc(doc(db, 'forms', formId))
  if (!snap.exists()) return null
  return mapForm(snap.id, snap.data())
}

export async function getPublishedForm(formId: string): Promise<FormDoc | null> {
  const form = await getForm(formId)
  if (!form || form.status !== 'published') return null
  return form
}

export interface SaveFormInput {
  title: string
  description: string
  status: FormStatus
  fields: FormField[]
  createdBy: string
}

export async function createForm(input: SaveFormInput): Promise<string> {
  const ref = await addDoc(collection(db, 'forms'), {
    title: input.title,
    description: input.description,
    status: input.status,
    fields: input.fields,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateForm(
  formId: string,
  input: Omit<SaveFormInput, 'createdBy'>,
): Promise<void> {
  await updateDoc(doc(db, 'forms', formId), {
    title: input.title,
    description: input.description,
    status: input.status,
    fields: input.fields,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteForm(formId: string): Promise<void> {
  await deleteDoc(doc(db, 'forms', formId))
}
