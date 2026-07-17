---
"@basica/core": patch
---

Fix start-failure rollback stopping the wrong items. When startup failed, the lifecycle manager applied the "only stop these" partial set to the bottom collection instead of the failure-level one — so it called `shutdown` on the item that had just failed to start (and on its whole collection) while skipping the items below it that had actually started. Now a failed-to-start item is left alone and everything that did start is rolled back correctly.
