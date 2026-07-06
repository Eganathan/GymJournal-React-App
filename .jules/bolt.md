## 2024-05-19 - [Parallelizing MetricsLog Updates]
**Learning:** Sequential updates inside a loop (`for (const u of updates) { await updateEntry(...) }`) are O(N) when it comes to API delays. If there are many updates being saved at once in `MetricsLog.js`, it creates a noticeable delay blocking the user.
**Action:** Replace the `for...await` loop with `await Promise.all(updates.map(u => updateEntry(u.id, { value: u.value, unit: u.unit, logDate: u.logDate }, { skipSnapshotRefresh: true })));`. Make sure to invalidate snapshot cache manually.
