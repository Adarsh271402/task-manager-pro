#!/usr/bin/env python3
"""Task Manager Pro API — end-to-end test suite."""
import json
import os
import urllib.request
import urllib.error

BASE = os.environ.get("API_BASE", "http://localhost:3000")
PASS, FAIL = 0, 0


def call(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "null")
        except json.JSONDecodeError:
            return e.code, {"raw": raw[:200]}


def check(name, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name} {extra}")
    else:
        FAIL += 1
        print(f"  FAIL  {name} {extra}")


print("== AUTH ==")
s, d = call("POST", "/api/auth/login", body={"email": "admin@taskmanager.pro", "password": "Admin@123"})
ADMIN = d["token"]
check("admin login", s == 200)

s, d = call("POST", "/api/auth/login", body={"email": "manager@taskmanager.pro", "password": "Manager@123"})
MGR = d["token"]
check("manager login", s == 200)

s, d = call("POST", "/api/auth/login", body={"email": "member@taskmanager.pro", "password": "Member@123"})
MEM = d["token"]
check("member login", s == 200)

s, _ = call("POST", "/api/auth/login", body={"email": "admin@taskmanager.pro", "password": "wrong"})
check("bad password rejected (401)", s == 401)

s, _ = call("GET", "/api/tasks")
check("no token rejected (401)", s == 401)

s, d = call("GET", "/api/auth/me", ADMIN)
check("auth/me", s == 200 and d["role"] == "Admin", f"({d['fullName']})")

print("== DATA ==")
s, cols = call("GET", "/api/columns", ADMIN)
check("columns seeded", s == 200 and [c["name"] for c in cols] == ["Week 1", "Week 2", "Week 3", "Week 4"])

s, tasks = call("GET", "/api/tasks", ADMIN)
check("tasks seeded", s == 200 and len(tasks) >= 10, f"({len(tasks)} tasks)")

s, d = call("GET", "/api/stats/dashboard", ADMIN)
check("stats", s == 200 and d["totalTasks"] >= 10, f"(total={d['totalTasks']}, rate={d['completionRate']}%)")

print("== CRUD + ROLES ==")
s, t = call("POST", "/api/tasks", ADMIN, {"title": "Curl test task", "description": "x", "priority": "High", "boardColumnId": cols[0]["id"], "assigneeId": None, "dueDate": "2026-11-01"})
tid = t["id"]
check("admin creates task (201)", s == 201, f"(id={tid})")

s, _ = call("POST", "/api/tasks", MEM, {"title": "nope", "priority": "Low", "boardColumnId": cols[0]["id"]})
check("member cannot create (403)", s == 403)

s, _ = call("PUT", f"/api/tasks/{tid}", MEM, {"title": "hack", "description": None, "priority": "Low", "boardColumnId": cols[0]["id"], "assigneeId": None, "dueDate": None})
check("member cannot edit unassigned (403)", s == 403)

s, _ = call("PUT", f"/api/tasks/{tid}", MGR, {"title": "Manager edited", "description": "ok", "priority": "Urgent", "boardColumnId": cols[0]["id"], "assigneeId": None, "dueDate": None})
check("manager edits any task", s == 200 and t is not None)

# assign task to member, then member can edit + move it
s, _ = call("PUT", f"/api/tasks/{tid}", ADMIN, {"title": "Assigned to Sam", "description": "ok", "priority": "Urgent", "boardColumnId": cols[0]["id"], "assigneeId": 3, "dueDate": "2026-11-05"})
check("admin assigns task", s == 200)

s, _ = call("PUT", f"/api/tasks/{tid}", MEM, {"title": "Sam updated it", "description": "member edit ok", "priority": "High", "boardColumnId": cols[0]["id"], "assigneeId": 3, "dueDate": "2026-11-05"})
check("member edits own task", s == 200)

s, _ = call("PUT", f"/api/tasks/{tid}/move", MEM, {"columnId": cols[1]["id"], "position": 0})
check("member moves own task (204)", s == 204)

s, tasks2 = call("GET", "/api/tasks", ADMIN)
moved = next(t for t in tasks2 if t["id"] == tid)
check("move persisted to Week 2", moved["boardColumnName"] == "Week 2", f"(now in {moved['boardColumnName']})")

s, _ = call("GET", "/api/users", MEM)
check("member cannot list users (403)", s == 403)

s, users = call("GET", "/api/users", ADMIN)
check("admin lists users", s == 200 and len(users) >= 4, f"({len(users)} users)")

s, _ = call("DELETE", f"/api/tasks/{tid}", MEM)
check("member cannot delete (403)", s == 403)

s, _ = call("DELETE", f"/api/tasks/{tid}", ADMIN)
check("admin deletes task (204)", s == 204)

print("== COLUMNS ==")
s, c = call("POST", "/api/columns", ADMIN, {"name": "Blocked", "color": "#ef4444"})
check("admin creates column", s in (200, 201))
cid = c["id"] if c else None
s, _ = call("DELETE", f"/api/columns/{cid}", ADMIN)
check("admin deletes empty column (204)", s == 204)

print(f"\nRESULT: {PASS} passed, {FAIL} failed")
exit(1 if FAIL else 0)
