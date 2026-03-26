"use client"

import { useCallback, useState } from "react"

export function useModalState(initialState) {
  const [modals, setModals] = useState(initialState)

  const openModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: true }))
  }, [])

  const closeModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: false }))
  }, [])

  return { modals, openModal, closeModal }
}