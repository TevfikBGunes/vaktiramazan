---
"vaktiramazan": patch
---

Fix AI SDK streaming error in Akıllı Şef feature

- Replace useObject hook with manual fetch to avoid empty body error
- Replace streamObject with generateObject for non-streaming response
- Fix React Native ReadableStream polyfill compatibility issue
