// Shared ICE servers for the remote-control peer connections.
//
// STUN handles the common case (data channel almost always traverses with it).
// The public OpenRelay TURN relay is the fallback for the *media* stream, which
// frequently fails between a phone on mobile data and the booth on Wi-Fi when
// only STUN is available. No backend needed — works from a static GitHub Pages
// build. Override with NEXT_PUBLIC_TURN_URL / _USER / _CRED for a private TURN.
const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL
const TURN_USER = process.env.NEXT_PUBLIC_TURN_USER
const TURN_CRED = process.env.NEXT_PUBLIC_TURN_CRED

const customTurn =
  TURN_URL && TURN_USER && TURN_CRED
    ? [{ urls: TURN_URL, username: TURN_USER, credential: TURN_CRED }]
    : [
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ]

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  ...customTurn,
]

/** PeerJS expects { config: { iceServers } }. */
export const PEER_CONFIG = { config: { iceServers: ICE_SERVERS } }
