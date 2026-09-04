#!/usr/bin/env python3
"""Daily activity report for aircraftdefects.com and GitHub voelspriet.

Runs on the Hetzner server from cron. Reads the last 24 hours of the nginx
access log, groups hits into visitor sessions, geolocates them in one batch,
pulls GitHub traffic for voelspriet/aircraftdefects plus stars and public
events for the whole voelspriet account, compares with the previous run and
mails the result from admin@imagewhisperer.org (the only DMARC-safe sender on
this server) to admin@imagewhisperer.org.

Usage:  daily_report.py [--dry-run] [--hours 24] [--to addr]
"""
import argparse
import datetime as dt
import glob
import gzip
import json
import os
import re
import subprocess
import sys
import urllib.request
from collections import Counter, defaultdict
from email.mime.text import MIMEText

LOG = "/var/log/nginx/aircraftdefects.access.log"
HOME = "/root/aircraft-report"
STATE = os.path.join(HOME, "state.json")
GEO_CACHE = os.path.join(HOME, "geo_cache.json")
ENV = "/root/.aircraft-report.env"
REPO = "voelspriet/aircraftdefects"
USER = "voelspriet"
SENDER = "aircraftdefects report <admin@imagewhisperer.org>"
DEFAULT_TO = "admin@imagewhisperer.org"

BOT_UA = re.compile(r"bot|crawl|spider|curl|python|wget|go-http|headless|playwright|"
                    r"scrapy|httpx|axios|java/|libwww|okhttp|node-fetch|sec-scout|teardown",
                    re.I)
STATIC = re.compile(r"\.(css|js|png|jpg|webp|ico|woff2?|svg|mp4|map)(\?|$)", re.I)
MODEL_CALL = re.compile(r"^/z/api/(ask|question|stream/|recurs|airframe|differ|vocab|news|specimen\?|sheet/)")
OWN_ORG = re.compile(r"odido", re.I)          # Henk's mobile and fibre provider
PROXY_ORG = re.compile(r"zscaler|cloudflare warp|netskope|forcepoint|palo alto|iboss", re.I)

COUNTRY_FIX = {"The Netherlands": "Netherlands", "Türkiye": "Turkey", "Czechia": "Czech Republic"}

LINE = re.compile(r'^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d{3}) (\d+|-) "([^"]*)" "([^"]*)"')


def load_env():
    if os.path.exists(ENV):
        for line in open(ENV):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k, v)


def jload(path, default):
    try:
        return json.load(open(path))
    except Exception:
        return default


def jsave(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, "w"), indent=1)


def parse_ts(s):
    return dt.datetime.strptime(s[:20], "%d/%b/%Y:%H:%M:%S").replace(tzinfo=dt.timezone.utc)


def read_log_lines(since):
    """Yield parsed hits since `since` from the live log plus rotated copies."""
    paths = [LOG] + sorted(glob.glob(LOG + ".*"), key=os.path.getmtime, reverse=True)[:3]
    for p in paths:
        try:
            if os.path.getmtime(p) < since.timestamp() - 86400:
                continue
        except OSError:
            continue
        opener = gzip.open if p.endswith(".gz") else open
        with opener(p, "rt", errors="replace") as fh:
            for raw in fh:
                m = LINE.match(raw)
                if not m:
                    continue
                ip, ts, method, path, status, size, ref, ua = m.groups()
                try:
                    t = parse_ts(ts)
                except ValueError:
                    continue
                if t < since:
                    continue
                yield dict(ip=ip, t=t, method=method, path=path, status=int(status),
                           ref=ref, ua=ua)


def geolocate(ips):
    """One batch call to ip-api.com (free, 100 per call), cached on disk."""
    cache = jload(GEO_CACHE, {})
    todo = [ip for ip in ips if ip not in cache]
    for i in range(0, len(todo), 100):
        chunk = todo[i:i + 100]
        try:
            req = urllib.request.Request(
                "http://ip-api.com/batch?fields=query,country,city,org,isp,proxy,hosting",
                data=json.dumps(chunk).encode(), headers={"Content-Type": "application/json"})
            for row in json.load(urllib.request.urlopen(req, timeout=20)):
                cache[row.get("query")] = row
        except Exception as e:
            print("geo failed:", e, file=sys.stderr)
    jsave(GEO_CACHE, cache)
    return cache


def gh(path):
    tok = os.environ.get("GITHUB_TOKEN", "")
    req = urllib.request.Request("https://api.github.com" + path,
                                 headers={"Authorization": "token " + tok,
                                          "Accept": "application/vnd.github+json",
                                          "User-Agent": "aircraft-report"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except Exception as e:
        return {"_error": str(e)}


def fmt_dur(sec):
    sec = int(sec)
    return "%dm%02ds" % (sec // 60, sec % 60) if sec >= 60 else "%ds" % sec


# --------------------------------------------------------------------------- site
def site_section(hours, state):
    now = dt.datetime.now(dt.timezone.utc)
    since = now - dt.timedelta(hours=hours)
    hits = list(read_log_lines(since))
    total = len(hits)
    errors5 = Counter()
    per_ip = defaultdict(list)
    bot_hits = 0
    for h in hits:
        if h["status"] >= 500:
            errors5[h["path"].split("?")[0]] += 1
        if BOT_UA.search(h["ua"]):
            bot_hits += 1
            continue
        per_ip[h["ip"]].append(h)

    geo = geolocate(sorted(per_ip))
    sessions = []
    for ip, rows in per_ip.items():
        g = geo.get(ip, {})
        g["country"] = COUNTRY_FIX.get(g.get("country"), g.get("country", "?"))
        org = g.get("org") or g.get("isp") or ""
        own = bool(OWN_ORG.search(org)) or ip.startswith("148.251.82.")
        rows.sort(key=lambda r: r["t"])
        pages = [r for r in rows if not STATIC.search(r["path"]) and not r["path"].startswith(("/api/", "/z/api/"))]
        cases = sorted({r["path"].split("?")[0].rsplit("/", 1)[-1] for r in rows if r["path"].startswith("/case/")})
        model = sum(1 for r in rows if r["method"] == "POST" and r["path"].startswith("/z/api/")
                    or MODEL_CALL.match(r["path"]) and "specimen?" not in r["path"] and "sheet/" not in r["path"])
        queries = sorted({m.group(1) for r in rows for m in [re.search(r"[?&]q=([^&]+)", r["path"])] if m})
        queries = [urllib.request.unquote(q.replace("+", " ")) for q in queries][:8]
        tails = sorted({m.group(1) for r in rows for m in [re.search(r"/plane/(N?\w+)", r["path"])] if m})[:6]
        flights = sum(1 for r in rows if r["path"].startswith("/z/api/flight"))
        notes = sum(1 for r in rows if r["method"] == "POST" and "/note" in r["path"])
        refs = sorted({r["ref"] for r in rows if r["ref"] not in ("-", "") and "aircraftdefects" not in r["ref"]})
        ua = rows[-1]["ua"]
        dev = ("iPhone" if "iPhone" in ua else "Android" if "Android" in ua else
               "Mac" if "Macintosh" in ua else "Windows" if "Windows" in ua else "Linux" if "Linux" in ua else "?")
        sessions.append(dict(
            ip=ip, hits=len(rows), first=rows[0]["t"], last=rows[-1]["t"],
            dur=(rows[-1]["t"] - rows[0]["t"]).total_seconds(), pages=len(pages),
            cases=cases, model=model, queries=queries, tails=tails, flights=flights, notes=notes,
            refs=refs, dev=dev, own=own, country=g.get("country", "?"), city=g.get("city", ""),
            org=org, proxy=bool(PROXY_ORG.search(org)),
            hosting=bool(g.get("hosting")) or "warp" in org.lower(),
        ))

    human = [s for s in sessions if not s["own"]]
    own = [s for s in sessions if s["own"]]
    uniques = len(human)
    countries = Counter(s["country"] for s in human)
    prev_countries = set(state.get("countries_seen", []))
    new_countries = sorted(c for c in countries if c not in prev_countries and c != "?")

    def score(s):
        # a real reading session: several requests, and case sheets, model use,
        # searches or a referrer. Two hits spread over hours is a monitor, not a reader.
        if s["hits"] < 5:
            return 0
        return (s["model"] * 3 + len(s["cases"]) * 2 + len(s["queries"]) * 2 + s["flights"] * 2
                + s["notes"] * 5 + len(s["refs"]) * 2 + (s["dur"] >= 120 and s["pages"] >= 3) * 3)

    notable = sorted((s for s in human if score(s) >= 3 and not s["hosting"]), key=score, reverse=True)[:15]
    refs = Counter(r for s in human for r in s["refs"])

    L = []
    L.append("AIRCRAFTDEFECTS.COM  (last %dh, %s to %s UTC)" % (
        hours, since.strftime("%d %b %H:%M"), now.strftime("%d %b %H:%M")))
    L.append("-" * 72)
    prev = state.get("site", {})
    L.append("requests total %d | bots %d | visitors %d (previous run %s) | own sessions (Odido) %d | model calls %d" % (
        total, bot_hits, uniques, prev.get("uniques", "-"), len(own), sum(s["model"] for s in human)))
    L.append("countries: " + ", ".join("%s %d" % (c, n) for c, n in countries.most_common(12)))
    if new_countries:
        L.append("NEW countries never seen before: " + ", ".join(new_countries))
    if refs:
        L.append("external referrers: " + "; ".join("%s (%d)" % (r[:60], n) for r, n in refs.most_common(8)))
    else:
        L.append("external referrers: none (all direct, typed, or from mail/chat/apps)")
    if errors5:
        L.append("5xx ERRORS: " + ", ".join("%s x%d" % (p, n) for p, n in errors5.most_common(5)))
    L.append("")
    L.append("Notable sessions (real reading: case sheets, model use, time on site, referrer, notes):")
    if not notable:
        L.append("  none")
    for s in notable:
        where = ", ".join(x for x in (s["city"], s["country"]) if x)
        tag = " [corporate proxy: %s]" % s["org"][:30] if s["proxy"] else ""
        L.append("  %s %s  %s  %s%s" % (s["first"].strftime("%d %b %H:%M"), s["dev"], where, s["org"][:40], tag))
        bits = ["%s on site" % fmt_dur(s["dur"]), "%d hits" % s["hits"], "%d pages" % s["pages"]]
        if s["cases"]:
            bits.append("%d case sheets" % len(s["cases"]))
        if s["model"]:
            bits.append("%d model calls" % s["model"])
        if s["flights"]:
            bits.append("%d flight lookups" % s["flights"])
        if s["notes"]:
            bits.append("%d NOTES POSTED" % s["notes"])
        L.append("      " + ", ".join(bits))
        if s["queries"]:
            L.append("      searched: " + " | ".join(s["queries"]))
        if s["tails"]:
            L.append("      tails: " + " ".join(s["tails"]))
        if s["cases"]:
            L.append("      cases: " + " ".join(s["cases"][:6]) + (" ..." if len(s["cases"]) > 6 else ""))
        if s["refs"]:
            L.append("      came from: " + " ".join(r[:70] for r in s["refs"][:3]))
    L.append("")
    quick = sorted((s for s in human if s not in notable and not s["hosting"]), key=lambda s: -s["hits"])[:12]
    if quick:
        L.append("Other visitors (landing page only): " + "; ".join(
            "%s %s %s" % (s["city"] or s["country"], s["dev"], fmt_dur(s["dur"])) for s in quick))
    hosting = [s for s in human if s["hosting"]]
    if hosting:
        L.append("Datacentre traffic (scrapers with browser UA): %d IPs, %d hits, top orgs: %s" % (
            len(hosting), sum(s["hits"] for s in hosting),
            ", ".join(o for o, _ in Counter(re.split(r"[,(]", s["org"])[0].strip()[:25] for s in hosting).most_common(4))))

    state["site"] = dict(uniques=uniques, total=total, model=sum(s["model"] for s in human))
    state["countries_seen"] = sorted(prev_countries | set(countries))
    return L


# ------------------------------------------------------------------------- github
def github_section(state):
    L = ["GITHUB  voelspriet/aircraftdefects and the whole voelspriet account"]
    L.append("-" * 72)
    repo = gh("/repos/" + REPO)
    if "_error" in repo:
        L.append("GitHub API failed: " + repo["_error"])
        return L
    prev = state.get("github", {})
    stars, forks, watch = repo["stargazers_count"], repo["forks_count"], repo["subscribers_count"]
    L.append("stars %d (%+d) | forks %d (%+d) | watchers %d | open issues %d | last push %s" % (
        stars, stars - prev.get("stars", stars), forks, forks - prev.get("forks", forks), watch,
        repo["open_issues_count"], repo["pushed_at"][:16].replace("T", " ")))

    views = gh("/repos/%s/traffic/views" % REPO)
    clones = gh("/repos/%s/traffic/clones" % REPO)
    if "views" in views:
        last = views["views"][-3:]
        L.append("views per day:  " + " | ".join("%s %d views/%d people" % (v["timestamp"][5:10], v["count"], v["uniques"]) for v in last)
                 + "   (14d: %d views, %d people)" % (views["count"], views["uniques"]))
    if "clones" in clones:
        last = clones["clones"][-3:]
        L.append("clones per day: " + " | ".join("%s %d/%d" % (v["timestamp"][5:10], v["count"], v["uniques"]) for v in last)
                 + "   (mostly crawlers; humans rarely clone)")
    refs = gh("/repos/%s/traffic/popular/referrers" % REPO)
    if isinstance(refs, list) and refs:
        L.append("referrers (14d): " + ", ".join("%s %d/%d" % (r["referrer"], r["count"], r["uniques"]) for r in refs[:8]))
    paths = gh("/repos/%s/traffic/popular/paths" % REPO)
    if isinstance(paths, list) and paths:
        L.append("most read files (14d): " + ", ".join("%s (%d)" % (p["path"].replace("/voelspriet/", ""), p["uniques"]) for p in paths[:6]))

    gazers = gh("/repos/%s/stargazers" % REPO)
    if isinstance(gazers, list):
        names = [g["login"] for g in gazers]
        new = [n for n in names if n not in prev.get("stargazers", [])]
        if new and prev.get("stargazers") is not None:
            L.append("NEW STARGAZERS: " + ", ".join("https://github.com/" + n for n in new))
        state.setdefault("github", {})["stargazers"] = names
    forkers = gh("/repos/%s/forks" % REPO)
    if isinstance(forkers, list) and forkers:
        L.append("forks by: " + ", ".join(f["owner"]["login"] for f in forkers[:10]))

    # whole account: stars across all repos, followers, public events
    me = gh("/users/" + USER)
    repos = gh("/users/%s/repos?per_page=100&sort=updated" % USER)
    if isinstance(repos, list):
        tot = {r["name"]: r["stargazers_count"] for r in repos}
        old = prev.get("all_stars", {})
        diff = [(n, tot[n] - old.get(n, 0)) for n in tot if old and tot[n] != old.get(n, 0)]
        if diff:
            L.append("STAR CHANGES on other repos: " + ", ".join("%s %+d" % d for d in diff))
        state["github"]["all_stars"] = tot
    if "followers" in me:
        f0 = prev.get("followers")
        L.append("followers %d%s" % (me["followers"], " (%+d)" % (me["followers"] - f0) if f0 is not None else ""))
        state["github"]["followers"] = me["followers"]

    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=24)
    ev = gh("/users/%s/events/public?per_page=50" % USER)
    if isinstance(ev, list):
        mine = Counter()
        for e in ev:
            if dt.datetime.fromisoformat(e["created_at"].replace("Z", "+00:00")) >= since:
                mine[(e["type"].replace("Event", ""), e["repo"]["name"])] += 1
        if mine:
            L.append("your own activity (24h): " + ", ".join("%s x%d on %s" % (t, n, r) for (t, r), n in mine.most_common(8)))
    rec = gh("/users/%s/received_events/public?per_page=50" % USER)
    if isinstance(rec, list):
        other = []
        for e in rec:
            if (dt.datetime.fromisoformat(e["created_at"].replace("Z", "+00:00")) >= since
                    and e["actor"]["login"] != USER and e["repo"]["name"].startswith(USER + "/")):
                other.append("%s %s %s" % (e["actor"]["login"], e["type"].replace("Event", ""), e["repo"]["name"]))
        if other:
            L.append("others acting on your repos (24h): " + "; ".join(other[:10]))
    state["github"].update(stars=stars, forks=forks)
    return L


# --------------------------------------------------------------------------- mail
def send(to, subject, body):
    m = MIMEText(body, "plain", "utf-8")
    m["Subject"] = subject
    m["From"] = SENDER
    m["To"] = to
    r = subprocess.run(["/usr/sbin/sendmail", "-t"], input=m.as_bytes(), timeout=30)
    return r.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--hours", type=int, default=24)
    ap.add_argument("--to", default=DEFAULT_TO)
    a = ap.parse_args()
    load_env()
    state = jload(STATE, {})
    body = "\n".join(site_section(a.hours, state) + [""] + github_section(state))
    body += "\n\n(generated by /root/aircraft-report/daily_report.py on the Hetzner server, cron 07:00 UTC)\n"
    subject = "aircraftdefects daily: %s" % dt.datetime.now(dt.timezone.utc).strftime("%a %d %b %Y")
    if a.dry_run:
        print(subject)
        print(body)
        return
    jsave(STATE, state)
    rc = send(a.to, subject, body)
    print("sent rc=%d to %s" % (rc, a.to))


if __name__ == "__main__":
    main()
