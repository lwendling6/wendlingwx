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
const F = { TEMP:1, WIND:2, GUST:4, PRECIP:8, CLOUD:16, FRZ:32, UPPER:64 };

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
  // First try the input as given. If that leaves gaps, the parts were probably
  // pasted in mixed groupings, so retry with all whitespace removed.
  try {
    return joinPartsOnce(text);
  } catch (e) {
    const glued = (text || "").split("").filter(c => ALPHABET.includes(c)).join("");
    if (glued.length && glued !== (text || "").trim()) {
      try { return joinPartsOnce(glued); } catch (e2) { throw e; }
    }
    throw e;
  }
}

function joinPartsOnce(text) {
  // Parts may arrive separated by whitespace, or pasted end to end as one
  // blob. Whitespace separation is the reliable case; for a single blob we
  // rely on every part except the last being exactly the same length.
  const chunks = (text || "").replace(/,/g, " ").split(/\s+/)
    .map(t => t.split("").filter(c => ALPHABET.includes(c)).join(""))
    .filter(t => t.length > 0);
  if (!chunks.length) throw new Error("Nothing to decode. Paste the reply first.");

  const marker = t => {
    const v = ALPHABET.indexOf(t[0]);
    return { idx: Math.floor(v / 8), total: v % 8 };
  };

  let tokens = [];
  for (const c of chunks) {
    const m = marker(c);
    if (m.total === 0 || m.idx >= m.total) {
      throw new Error("This does not look like a WendlingWx message. " +
        "Copy the reply messages exactly as they arrived.");
    }
    // A single chunk holding every part pasted end to end. Parts 1..n-1 are
    // all the same full length and only the last is short, so try each
    // plausible full-part size and keep the split whose markers all check out.
    if (m.total > 1) {
      let split = null;
      const maxSize = c.length;
      for (let size = Math.ceil(c.length / m.total); size <= maxSize; size++) {
        // n-1 full parts of `size`, plus a final remainder of 1..size
        const tail = c.length - size * (m.total - 1);
        if (tail < 1 || tail > size) continue;
        const guess = [];
        for (let i = 0; i < m.total - 1; i++) guess.push(c.slice(i * size, (i + 1) * size));
        guess.push(c.slice(size * (m.total - 1)));
        const idxs = new Set();
        const ok = guess.every(g => {
          if (!g.length) return false;
          const gm = marker(g);
          if (gm.total !== m.total || gm.idx >= m.total || idxs.has(gm.idx)) return false;
          idxs.add(gm.idx);
          return true;
        });
        if (ok && idxs.size === m.total) { split = guess; break; }
      }
      if (split) { tokens = tokens.concat(split); continue; }
    }
    tokens.push(c);
  }

  const seen = {};
  let total = null;
  for (const t of tokens) {
    const m = marker(t);
    if (m.total === 0 || m.idx >= m.total) {
      throw new Error("This does not look like a WendlingWx message. " +
        "Copy the reply messages exactly as they arrived.");
    }
    if (total === null) total = m.total;
    if (m.total !== total) throw new Error("These parts came from different forecasts.");
    seen[m.idx] = t.slice(1);
  }

  const missing = [];
  for (let i = 0; i < total; i++) if (!(i in seen)) missing.push(i + 1);
  if (missing.length) {
    throw new Error("Missing part " + missing.join(", ") + " of " + total +
      ". Paste every message you received, in any order.");
  }
  let out = "";
  for (let i = 0; i < total; i++) out += seen[i];
  return out;
}


// ---- decode --------------------------------------------------------------
function decode(text) {
  const code = joinParts(text);
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
        st.w850Mph = read(6);
        st.w850Dir = DIRS[read(4)];
        st.w700Mph = read(6);
        st.w700Dir = DIRS[read(4)];
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
  module.exports = { decode, joinParts, stepTime, F, ALPHABET };
}
