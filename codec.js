// WendlingWx packed forecast codec, version 2. Mirrors scripts/codec.py.
// Decode side only, plus multipart join. See spec/FORMAT.md.

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const VERSION = 2;
const DIRS = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
              "S","SSW","SW","WSW","W","WNW","NW","NNW"];
const STEP_HOURS = [1, 2, 3, 4, 6, 8, 12, 24];
const PTYPES = ["none", "rain", "snow", "mixed"];
const SOURCES = ["HRRR-AK", "RRFS", "Open-Meteo", "NWS", "GFS", "meteoblue", "?", "?"];
const F = { TEMP:1, WIND:2, GUST:4, PRECIP:8, CLOUD:16, FRZ:32, UPPER:64, UPPER1:128 };

// Winds aloft are reported at heights people plan around. The backend
// interpolates model pressure levels to these before encoding.
const UPPER_LEVELS = [
  { key: 'w3k',  m: 914,  ft: 3000  },
  { key: 'w6k',  m: 1829, ft: 6000  },
  { key: 'w10k', m: 3048, ft: 10000 }
];
// Basic replies carry one mid level instead of three.
const UPPER1_LEVEL = { key: 'w5k', m: 1524, ft: 5000 };

const PCP_TABLE = [0.0];
for (let i = 1; i < 32; i++) {
  PCP_TABLE.push(Math.round(0.005 * Math.pow(1.20, i - 1) * 10000) / 10000);
}

function crc8(bytes) {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xFF : (crc << 1) & 0xFF;
    }
  }
  return crc;
}

function bitsToBytes(bits) {
  const p = bits.slice();
  while (p.length % 8) p.push(0);
  const out = [];
  for (let i = 0; i < p.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | p[i + j];
    out.push(v);
  }
  return out;
}

// ---- multipart -----------------------------------------------------------
// The first character of each part encodes (index, total): ALPHABET[idx*8+total].
function joinParts(text) {
  // Returns the first candidate; decode() tries them all and lets the
  // checksum pick the right one.
  return joinCandidates(text)[0];
}

/**
 * Build every plausible reassembly of the pasted text, best guess first.
 *
 * Two shapes have to work: parts separated by whitespace (the normal case),
 * and parts pasted end to end as one blob. They are ambiguous on their own,
 * because payload characters look exactly like part markers, so we generate
 * candidates and let the CRC in decode() decide.
 */
function joinCandidates(text) {
  const chunks = (text || "").replace(/,/g, " ").split(/\s+/)
    .map(t => t.split("").filter(c => ALPHABET.includes(c)).join(""))
    .filter(t => t.length > 0);
  if (!chunks.length) throw new Error("Nothing to decode. Paste the reply first.");

  const marker = t => {
    const v = ALPHABET.indexOf(t[0]);
    return { idx: Math.floor(v / 8), total: v % 8 };
  };
  const first = marker(chunks[0]);
  if (first.total === 0 || first.idx >= first.total) {
    throw new Error("This does not look like a WendlingWx message. " +
      "Copy the reply messages exactly as they arrived.");
  }
  const total = first.total;
  const candidates = [];

  // Candidate 1: one chunk per part. Correct whenever the parts arrived on
  // separate lines, which is what happens when each is its own message.
  const assemble = pieces => {
    const seen = {};
    for (const p of pieces) {
      const m = marker(p);
      if (m.total !== total || m.idx >= total || (m.idx in seen)) return null;
      seen[m.idx] = p.slice(1);
    }
    if (Object.keys(seen).length !== total) return null;
    let out = "";
    for (let i = 0; i < total; i++) out += seen[i];
    return out;
  };
  const direct = assemble(chunks);
  if (direct !== null) candidates.push(direct);

  // Candidate 2+: the whole thing is one blob with the parts run together.
  // Every part is the same full length except exactly one short one, which
  // is the last part as sent but can land anywhere once the messages are
  // pasted out of order. Try each full-part size with the short part in
  // each possible position and let the checksum settle it.
  if (total > 1) {
    const blob = chunks.join("");
    for (let size = Math.ceil(blob.length / total); size < blob.length; size++) {
      const tail = blob.length - size * (total - 1);
      if (tail < 1 || tail > size) continue;
      for (let shortAt = 0; shortAt < total; shortAt++) {
        const pieces = [];
        let cursor = 0;
        for (let i = 0; i < total; i++) {
          const len = (i === shortAt) ? tail : size;
          pieces.push(blob.slice(cursor, cursor + len));
          cursor += len;
        }
        const joined = assemble(pieces);
        if (joined !== null && candidates.indexOf(joined) === -1) candidates.push(joined);
      }
    }
  }

  if (!candidates.length) {
    const seen = {};
    for (const c of chunks) {
      const m = marker(c);
      if (m.total === total && m.idx < total) seen[m.idx] = true;
    }
    const missing = [];
    for (let i = 0; i < total; i++) if (!(i in seen)) missing.push(i + 1);
    throw new Error(missing.length
      ? "Missing part " + missing.join(", ") + " of " + total +
        ". Paste every message you received, in any order."
      : "Could not reassemble the message. Re-copy each reply and paste again.");
  }
  return candidates;
}

// ---- decode --------------------------------------------------------------
function decode(text) {
  const candidates = joinCandidates(text);
  let lastErr = null;
  for (const code of candidates) {
    try { return decodeCode(code); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function decodeCode(code) {
  const bits = [];
  for (const ch of code) {
    const v = ALPHABET.indexOf(ch);
    for (let i = 5; i >= 0; i--) bits.push((v >> i) & 1);
  }

  let pos = 0;
  const read = n => {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (bits[pos + i] || 0);
    pos += n;
    return v;
  };

  const ver = read(4);
  if (ver !== VERSION) {
    throw new Error("Unsupported format version " + ver +
      ". Update the app, or this reply came from an older backend.");
  }
  const header = {
    version: ver,
    lat: read(15) / 100 - 90,
    lon: read(16) / 100 - 180,
    elevM: read(12),
    runYday: read(9),
    runHour: read(5),
  };
  const nseg = read(2) + 1;

  const segments = [];
  for (let s = 0; s < nseg; s++) {
    const seg = {
      src: SOURCES[read(3)],
      fields: read(8),
      firstH: read(8),
      nsteps: read(6),
      stepH: STEP_HOURS[read(3)],
      steps: [],
    };
    for (let i = 0; i < seg.nsteps; i++) {
      const st = {};
      if (seg.fields & F.TEMP) st.tempF = read(8) - 80;
      let wspd = 0;
      if (seg.fields & F.WIND) {
        wspd = read(6);
        st.windMph = wspd;
        const wd = read(4);
        st.windDir = DIRS[wd];
        st.windDirDeg = wd * 22.5;
      }
      if (seg.fields & F.GUST) st.gustMph = wspd + read(4) * 2;
      if (seg.fields & F.PRECIP) {
        st.precipIn = PCP_TABLE[read(5)];
        st.ptype = PTYPES[read(2)];
      }
      if (seg.fields & F.CLOUD) st.cloudPct = Math.round(read(3) / 7 * 100);
      if (seg.fields & F.FRZ) st.frzLevelM = read(7) * 50;
      if (seg.fields & F.UPPER) {
        for (const lv of UPPER_LEVELS) {
          st[lv.key + 'Mph'] = read(6);
          const d = read(4);
          st[lv.key + 'Dir'] = DIRS[d];
          st[lv.key + 'DirDeg'] = d * 22.5;
        }
      }
      if (seg.fields & F.UPPER1) {
        st.w5kMph = read(6);
        const d5 = read(4);
        st.w5kDir = DIRS[d5];
        st.w5kDirDeg = d5 * 22.5;
      }
      seg.steps.push(st);
    }
    segments.push(seg);
  }

  const payload = pos;
  const stated = read(8);
  if (crc8(bitsToBytes(bits.slice(0, payload))) !== stated) {
    throw new Error("Checksum failed. Part of the message is garbled or missing. " +
      "Re-copy every message and paste again.");
  }

  header.runTime = ydayToDate(header.runYday, header.runHour);
  return { header, segments };
}

// Year is not transmitted. Assume this year, roll back if that lands in the future.
function ydayToDate(yday, hour) {
  const now = new Date();
  let d = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, hour));
  d.setUTCDate(yday);
  if (d.getTime() - now.getTime() > 3 * 86400000) {
    d = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1, hour));
    d.setUTCDate(yday);
  }
  return d;
}

function stepTime(header, seg, index) {
  return new Date(header.runTime.getTime() +
    (seg.firstH + index * seg.stepH) * 3600000);
}

if (typeof module !== "undefined") {
  module.exports = { decode, joinParts, stepTime, F, ALPHABET, UPPER_LEVELS, UPPER1_LEVEL };
}
