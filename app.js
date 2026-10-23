const $ = (s) => document.querySelector(s),
  clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
  reduce = matchMedia("(prefers-reduced-motion: reduce)");
let running = false,
  paused = false,
  elapsed = 0,
  lastTick = 0,
  logged = -1,
  route = "",
  simulation = 0;
const routeNames = {
  sales: "Sales team",
  nurture: "Nurture queue",
  review: "Manual review",
};
function chooseRoute() {
  if (!$("#approved").checked) return "review";
  return +$("#budget").value >= +$("#threshold").value ? "sales" : "nurture";
}
function logStep(step) {
  const messages = [
    `Captured: ${$("#lead-name").value.trim()}.`,
    `Rule: ${$("#approved").checked ? "complete details" : "missing details"}, value €${Number($("#budget").value).toLocaleString("en")} / threshold €${Number($("#threshold").value).toLocaleString("en")}.`,
    `Routed to ${routeNames[route]}. Sample complete.`,
  ];
  const li = document.createElement("li"),
    time = document.createElement("time"),
    span = document.createElement("span");
  time.textContent = (step * 1.2).toFixed(2);
  span.textContent = messages[step];
  li.append(time, span);
  $("#log").append(li);
}
function updateNodes(step) {
  for (let i = 0; i < 3; i++) {
    const n = $(`#node-${i}`);
    n.classList.toggle("active", step === i);
    n.classList.toggle("done", step > i);
  }
}
function unlock() {
  document
    .querySelectorAll("#workflow input")
    .forEach((x) => (x.disabled = false));
  $("#run").disabled = false;
  $("#pause").disabled = true;
  $("#pause").textContent = "Pause";
}
$("#workflow").addEventListener("submit", (e) => {
  e.preventDefault();
  if (running) return;
  route = chooseRoute();
  running = true;
  paused = false;
  elapsed = 0;
  lastTick = performance.now();
  logged = -1;
  simulation = 0;
  if (!simRAF) simRAF = requestAnimationFrame(simTick);
  $("#log").replaceChildren();
  $("#run-state").textContent = "RUNNING";
  $("#destination").textContent = "In motion.";
  $("#run").disabled = true;
  $("#pause").disabled = false;
  document
    .querySelectorAll("#workflow input")
    .forEach((x) => (x.disabled = true));
});
$("#pause").addEventListener("click", () => {
  paused = !paused;
  $("#pause").textContent = paused ? "Resume" : "Pause";
  $("#run-state").textContent = paused ? "PAUSED" : "RUNNING";
  lastTick = performance.now();
  if (!paused && !simRAF) simRAF = requestAnimationFrame(simTick);
});
$("#reset").addEventListener("click", () => {
  running = false;
  paused = false;
  elapsed = 0;
  logged = -1;
  simulation = 0;
  $("#log").replaceChildren();
  const li = document.createElement("li");
  li.textContent = "Waiting for your signal.";
  $("#log").append(li);
  $("#run-state").textContent = "READY";
  $("#destination").textContent = "Your call.";
  $("#route-label").textContent = "Choose the right team";
  updateNodes(-1);
  unlock();
  drawSignal();
});
let simRAF = 0;
function simTick(t) {
  simRAF = 0;
  if (running && !paused) {
    elapsed += Math.min((t - lastTick) / 1000, 0.08);
    simulation = clamp(elapsed / 3.6);
    const step = Math.min(2, Math.floor(elapsed / 1.2));
    if (step > logged) {
      for (let i = logged + 1; i <= step; i++) logStep(i);
      logged = step;
      updateNodes(step);
    }
    if (elapsed >= 3.6) {
      running = false;
      $("#destination").textContent = routeNames[route];
      $("#route-label").textContent = routeNames[route];
      $("#run-state").textContent = "COMPLETE";
      updateNodes(3);
      unlock();
    }
  }
  lastTick = t;
  if (running && !paused && !document.hidden)
    simRAF = requestAnimationFrame(simTick);
  drawSignal();
}
function calc() {
  const v = Number($("#volume").value),
    m = Number($("#minutes").value);
  $("#hours").textContent =
    Number.isFinite(v * m) && v > 0 && m > 0
      ? ((v * m) / 60).toLocaleString("en", { maximumFractionDigits: 1 })
      : "0";
}
$("#volume").addEventListener("input", calc);
$("#minutes").addEventListener("input", calc);
calc();
$("#brief-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = `SIGNAL | Automation starting brief\n\nRepetitive task:\n${$("#task").value.trim()}\n\nMonthly volume: ${$("#volume").value}\nMinutes per task: ${$("#minutes").value}\nCurrent manual time: ${$("#hours").textContent} hours/month\nFormula: volume x minutes / 60\n\nWorkflow sample:\nInput: ${$("#lead-name").value.trim()}\nValue: EUR ${$("#budget").value}\nSales threshold: EUR ${$("#threshold").value}\nDetails complete: ${$("#approved").checked ? "Yes" : "No"}\nChosen route: ${routeNames[chooseRoute()]}\n\nQuestions for discovery:\n1. Which tools receive and store the data?\n2. Who owns exceptional cases?\n3. Which permissions and data retention rules apply?\n4. What observable result defines a successful run?\n\nIndependent concept by BlackStack Studio.\nNo enquiry was sent. This file is a local planning brief.\nTime spent is not guaranteed time saved.\n`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
  a.download = "signal-automation-brief.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  $("#brief-status").textContent = "Brief downloaded. A clear place to begin.";
});
let scrollTarget = 0;
function measure() {
  scrollTarget = clamp(scrollY / ($("#lab").offsetTop - innerHeight * 0.35));
  $(".read-progress i").style.width =
    `${clamp(scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100}%`;
}
addEventListener("scroll", measure, { passive: true });
addEventListener("resize", measure);
measure();

const host = $("#scene"),
  svgNS = "http://www.w3.org/2000/svg";
host.innerHTML = `<div class="signal-board"><svg viewBox="0 0 1200 500" role="img" aria-label="Requests follow paths through intake, decision and delivery"><defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#b6beb1"/></pattern></defs><rect width="1200" height="500" fill="url(#dots)"/>
<g class="route-lines" fill="none" stroke="#88927e" stroke-width="1"><path d="M0 90H180Q220 90 220 130V220Q220 250 250 250H950Q980 250 980 220V130Q980 90 1020 90H1200"/><path d="M0 250H1200"/><path d="M0 410H180Q220 410 220 370V280Q220 250 250 250H950Q980 250 980 280V370Q980 410 1020 410H1200"/></g>
<path id="live-path" d="M0 410H180Q220 410 220 370V280Q220 250 250 250H950Q980 250 980 220V130Q980 90 1020 90H1200" fill="none" stroke="#18221b" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
<g class="chip intake" transform="translate(290 170)"><rect width="150" height="160" rx="2" fill="#eeeeE7" stroke="#273421"/><text x="18" y="31" class="chip-micro">01 / CAPTURE</text><path d="M30 67h90m-90 20h60m-60 20h75" stroke="#273421" stroke-width="2"/><text x="18" y="140" class="chip-title">ENQUIRY</text></g>
<g class="chip decision" transform="translate(525 145)"><rect width="150" height="210" rx="2" fill="#17201b"/><text x="18" y="31" class="chip-micro inverse">02 / DECIDE</text><path d="M75 60 110 95 75 130 40 95Z" fill="none" stroke="#d8ff36" stroke-width="2"/><text x="18" y="188" class="chip-title inverse">QUALIFY</text></g>
<g class="chip delivery" transform="translate(760 170)"><rect width="150" height="160" rx="2" fill="#d8ff36" stroke="#273421"/><text x="18" y="31" class="chip-micro">03 / DELIVER</text><path d="m48 85 20 20 38-44" fill="none" stroke="#17201b" stroke-width="3"/><text x="18" y="140" class="chip-title" id="hero-route">SALES</text></g>
<circle id="packet" cx="0" cy="410" r="8" fill="#f16d36" stroke="#fff" stroke-width="3"/></svg><div class="board-foot"><span id="hero-example">ENQUIRY / QUALIFY / SALES</span><span>TRACE / <output id="trace">000</output></span></div></div>`;
document.body.classList.add("webgl");
const path = $("#live-path"),
  packet = $("#packet"),
  length = path.getTotalLength(),
  trace = $("#trace");
let paintRAF = 0,
  paintFrames = 0;
function drawSignal() {
  paintRAF = 0;
  if (document.hidden) {
    document.documentElement.dataset.renderMode = "hidden";
    return;
  }
  const r = host.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) {
    document.documentElement.dataset.renderMode = "offscreen";
    return;
  }
  host
    .querySelector("svg")
    .setAttribute(
      "viewBox",
      innerWidth < 701 ? "230 100 720 300" : "0 0 1200 500",
    );
  const p = reduce.matches
      ? 0.65
      : running || simulation > 0
        ? simulation
        : scrollTarget,
    pt = path.getPointAtLength(length * p);
  path.style.strokeDashoffset = 1 - p;
  packet.setAttribute("cx", pt.x);
  packet.setAttribute("cy", pt.y);
  trace.textContent = String(Math.round(p * 999)).padStart(3, "0");
  const destination = { sales: "SALES", nurture: "FOLLOWUP", review: "REVIEW" }[
    chooseRoute()
  ];
  $("#hero-route").textContent = destination;
  $("#hero-example").textContent = `ENQUIRY / QUALIFY / ${destination}`;
  const activeChip = Math.min(2, Math.floor(p * 3));
  host.querySelectorAll(".chip").forEach((chip, i) => {
    chip.classList.toggle("current", i === activeChip);
    chip.style.opacity = i === activeChip ? "1" : ".72";
  });
  document.documentElement.style.setProperty(
    "--signal-p",
    reduce.matches ? 0 : scrollTarget,
  );
  document.documentElement.dataset.renderFrames = String(++paintFrames);
  document.documentElement.dataset.drawCalls = "0";
  document.documentElement.dataset.renderMode = "idle";
}
function wakeSignal() {
  if (!paintRAF && !document.hidden)
    paintRAF = requestAnimationFrame(drawSignal);
}
addEventListener("scroll", wakeSignal, { passive: true });
addEventListener("resize", wakeSignal);
reduce.addEventListener("change", wakeSignal);
$("#workflow").addEventListener("input", wakeSignal);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(paintRAF);
    cancelAnimationFrame(simRAF);
    paintRAF = simRAF = 0;
    document.documentElement.dataset.renderMode = "hidden";
  } else {
    lastTick = performance.now();
    if (running && !paused) simRAF = requestAnimationFrame(simTick);
    wakeSignal();
  }
});
wakeSignal();

const phoneLayout = matchMedia("(max-width: 900px), (max-width: 1000px) and (pointer: coarse)");
const originalParent = host.parentNode, originalNext = host.nextSibling;
function positionBoard() {
  if (phoneLayout.matches) document.querySelector(".hero-copy").after(host);
  else originalParent.insertBefore(host, originalNext);
  measure();
  wakeSignal();
}
phoneLayout.addEventListener("change", positionBoard);
positionBoard();
