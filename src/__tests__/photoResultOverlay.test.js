// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { PhotoResultOverlay } from "@/components/capture/PhotoResultOverlay"

function flushMicrotasks() {
  return act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

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
    render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.resolve({ success: true, queued: false })}
        onDismiss={() => {}}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400) // reveal -> sending
    })
    expect(screen.getByText(/Versturen naar Discord/i)).toBeTruthy()
  })

  it("renders the success outcome when the send succeeds", async () => {
    const photo = { url: "blob:x", isStrip: false }
    render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.resolve({ success: true, queued: false })}
        onDismiss={() => {}}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400 + 1600) // reveal + sending min
    })
    await flushMicrotasks()
    expect(screen.getByText(/Verzonden/i)).toBeTruthy()
  })

  it("renders the queued outcome when the send is queued", async () => {
    const photo = { url: "blob:x", isStrip: false }
    render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.resolve({ success: false, queued: true })}
        onDismiss={() => {}}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400 + 1600)
    })
    await flushMicrotasks()
    expect(screen.getByText(/weer online bent/i)).toBeTruthy()
  })

  it("renders the error outcome when the send rejects", async () => {
    const photo = { url: "blob:x", isStrip: false }
    render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.reject(new Error("boom"))}
        onDismiss={() => {}}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400 + 1600)
    })
    await flushMicrotasks()
    expect(screen.getByText(/proberen het automatisch opnieuw/i)).toBeTruthy()
  })

  it("auto-dismisses after the full sequence", async () => {
    const onDismiss = vi.fn()
    const photo = { url: "blob:x", isStrip: false }
    render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.resolve({ success: true, queued: false })}
        onDismiss={onDismiss}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400 + 1600)
    })
    await flushMicrotasks()
    await act(async () => {
      vi.advanceTimersByTime(600 + 9000) // outcome + joinHint
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("tap dismisses immediately during the join hint", async () => {
    const onDismiss = vi.fn()
    const photo = { url: "blob:x", isStrip: false }
    const { container } = render(
      <PhotoResultOverlay
        photo={photo}
        sendPromise={Promise.resolve({ success: true, queued: false })}
        onDismiss={onDismiss}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(400 + 1600)
    })
    await flushMicrotasks()
    await act(async () => {
      vi.advanceTimersByTime(600) // into joinHint
    })
    act(() => {
      container.firstChild.click()
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})