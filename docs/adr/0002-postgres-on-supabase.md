# Postgres on Supabase

**27 Oct 2026.** Our data lives in Postgres, a relational database hosted on Supabase, instead of a document store like Firebase's Firestore. Postgres checks every write, which matters when an LLM and coding agents make the riskiest writes, and it reaches planetary scale by sharding on user ID, since no daily query reads across users. Supabase is open source and self-hostable, so moving to our own servers or to AWS later stays possible.

We'd reconsider if offline logging became a hard requirement.
