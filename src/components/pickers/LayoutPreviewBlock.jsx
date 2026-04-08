/**
 * Shared layout preview block — positioned absolutely within a preview card.
 * Used by both LayoutPicker and LayoutSlider.
 *
 * @param {{ position: string, className: string, offset?: number }} props
 */
export function LayoutPreviewBlock({ position, className, offset = 4 }) {
  const pos = { position: "absolute" }
  if (position.includes("top")) pos.top = offset
  if (position.includes("bottom")) pos.bottom = offset
  if (position.includes("left")) pos.left = offset
  if (position.includes("right")) pos.right = offset
  if (position === "middle-right") {
    pos.right = offset
    pos.top = "50%"
    pos.transform = "translateY(-50%)"
  }
  return <div className={className} style={pos} />
}
