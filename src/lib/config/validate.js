import { CONVENTIONS, LAYOUTS, MASCOTS } from "./presets"

const BREAKPOINTS = ["sm", "md", "lg"]
const VALID_SIZING_AXES = ["width", "height", "contain"]

function hasKeys(value, keys) {
  return value && typeof value === "object" && keys.every((key) => key in value)
}

function hasBreakpointObject(value) {
  return hasKeys(value, BREAKPOINTS)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function validateConvention(item, index) {
  assert(typeof item.slug === "string", `Convention[${index}] missing slug`)
  assert(typeof item.name === "string", `Convention[${index}] missing name`)
  assert(typeof item.startDate === "string", `Convention[${index}] missing startDate`)
  assert(typeof item.endDate === "string", `Convention[${index}] missing endDate`)
  assert(typeof item.bannerPath === "string", `Convention[${index}] missing bannerPath`)
  assert(hasBreakpointObject(item.sizes), `Convention[${index}] missing sizes.{sm,md,lg}`)
}

function validateMascot(item, index) {
  assert(typeof item.id === "string", `Mascot[${index}] missing id`)
  assert(typeof item.name === "string", `Mascot[${index}] missing name`)
  assert(typeof item.path === "string", `Mascot[${index}] missing path`)
  assert(typeof item.thumbnail === "string", `Mascot[${index}] missing thumbnail`)
  if (item.defaults) {
    if (item.defaults.sizingAxis) {
      assert(VALID_SIZING_AXES.includes(item.defaults.sizingAxis),
        `Mascot[${index}] defaults.sizingAxis must be ${VALID_SIZING_AXES.join("|")}`)
    }
    if (item.defaults.sizes) {
      assert(hasBreakpointObject(item.defaults.sizes), `Mascot[${index}] defaults.sizes needs {sm,md,lg}`)
    }
  }
}

function validateLayout(item, index) {
  assert(typeof item.id === "string", `Layout[${index}] missing id`)
  assert(typeof item.name === "string", `Layout[${index}] missing name`)
  assert(hasBreakpointObject(item.inset), `Layout[${index}] missing inset.{sm,md,lg}`)
  assert(item.logo?.position, `Layout[${index}] missing logo.position`)
  assert(hasBreakpointObject(item.logo?.size), `Layout[${index}] missing logo.size.{sm,md,lg}`)
  assert(item.mascot?.position, `Layout[${index}] missing mascot.position`)
  assert(hasBreakpointObject(item.mascot?.sizes), `Layout[${index}] missing mascot.sizes.{sm,md,lg}`)
  if (item.mascot?.sizingAxis) {
    assert(VALID_SIZING_AXES.includes(item.mascot.sizingAxis),
      `Layout[${index}] mascot.sizingAxis must be ${VALID_SIZING_AXES.join("|")}`)
  }
  assert(item.convention?.position, `Layout[${index}] missing convention.position`)
  assert(hasBreakpointObject(item.title?.fontSize), `Layout[${index}] missing title.fontSize.{sm,md,lg}`)
  assert(item.qr?.position, `Layout[${index}] missing qr.position`)
  assert(hasBreakpointObject(item.qr?.size), `Layout[${index}] missing qr.size.{sm,md,lg}`)

  if (item.mascotOverrides) {
    for (const [mascotId, overrides] of Object.entries(item.mascotOverrides)) {
      if (overrides.sizingAxis) {
        assert(VALID_SIZING_AXES.includes(overrides.sizingAxis),
          `Layout[${index}] mascotOverrides.${mascotId}.sizingAxis must be ${VALID_SIZING_AXES.join("|")}`)
      }
    }
  }
}

export function validateConfigShapes() {
  if (process.env.NODE_ENV === "production") return true

  try {
    assert(Array.isArray(CONVENTIONS), "CONVENTIONS must be an array")
    assert(Array.isArray(MASCOTS), "MASCOTS must be an array")
    assert(Array.isArray(LAYOUTS), "LAYOUTS must be an array")

    CONVENTIONS.forEach(validateConvention)
    MASCOTS.forEach(validateMascot)
    LAYOUTS.forEach(validateLayout)

    return true
  } catch (error) {
    console.warn("[config validation]", error instanceof Error ? error.message : "Invalid config")
    return false
  }
}