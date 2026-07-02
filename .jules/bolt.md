## 2024-07-02 - [Replace sequential awaits with Promise.all]
**Learning:** Sequential I/O operations inside loops can significantly harm performance (O(N) time).
**Action:** Replace sequential API calls with Promise.all to execute them in parallel (O(1) time), but remember to bypass redundant side-effects (like state refreshes) and perform them once at the end.
