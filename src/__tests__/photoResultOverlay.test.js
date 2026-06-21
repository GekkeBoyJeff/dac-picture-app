// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { PhotoResultOverlay } from "@/components/capture/PhotoResultOverlay"

// Timeline constants mirrored from the component (timer-driven, no network wait).
const REVEAL_MS = 400
const SENDING_MS = 1300
const OUTCOME_MS = 800
const JOIN_HINT_MS = 9000

describe("PhotoResultOverlay phase machine", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("shows the sending copy during the sending phase", async () => {
    const photo = { url: "blob:x", isStrip: false }
    render(<PhotoResultOverlay photo={photo} onDismiss={() => {}} />)
    await act(async () => {
      vi.advanceTimersByTime(REVEAL_MS) // reveal -> sending
    })
    expect(screen.getByText(/Versturen naar Discord/i)).toBeTruthy()
  })

  it("always shows the optimistic 'Verzonden' outcome (never waits on the send)", async () => {
    const photo = { url: "blob:x", isStrip: false }
    render(<PhotoResultOverlay photo={photo} onDismiss={() => {}} />)
    await act(async () => {
      vi.advanceTimersByTime(REVEAL_MS + SENDING_MS) // sending -> outcome
    })
    expect(screen.getByText(/Verzonden/i)).toBeTruthy()
  })

  it("auto-dismisses after the full sequence", async () => {
    const onDismiss = vi.fn()
    const photo = { url: "blob:x", isStrip: false }
    render(<PhotoResultOverlay photo={photo} onDismiss={onDismiss} />)
    await act(async () => {
      vi.advanceTimersByTime(REVEAL_MS + SENDING_MS + OUTCOME_MS + JOIN_HINT_MS)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("tap dismisses immediately during the join hint", async () => {
    const onDismiss = vi.fn()
    const photo = { url: "blob:x", isStrip: false }
    const { container } = render(<PhotoResultOverlay photo={photo} onDismiss={onDismiss} />)
    await act(async () => {
      vi.advanceTimersByTime(REVEAL_MS + SENDING_MS + OUTCOME_MS) // into joinHint
    })
    act(() => {
      container.firstChild.click()
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})