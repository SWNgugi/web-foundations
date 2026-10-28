# SnapShare Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow.

## 1. Assumptions

- 10 million registered users.
- 10% are active each day.
- Each active user uploads 1 photo per day and views 50 feed pages per day.
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail.
- One day has 86,400 seconds, and one year has 365 days.
- One feed view is one request for one page of the feed.
- Average load is spread evenly over the day. Peak load is 5 times the average.
- Units are decimal (1 TB = 1,000,000 MB). Backups and extra copies are not counted.

**Daily active users (DAU):** 10,000,000 x 10% = **1,000,000 users per day**.

## 2. Estimates

### Uploads per second

- Uploads per day: 1,000,000 x 1 = 1,000,000
- Average: 1,000,000 / 86,400 = about **12 uploads per second**
- Peak (5x): about **58 uploads per second**

### Feed views per second

- Feed views per day: 1,000,000 x 50 = 50,000,000
- Average: 50,000,000 / 86,400 = about **579 views per second**
- Peak (5x): about **2,900 views per second**

### Storage per year

- Original photos per day: 1,000,000 x 2 MB = 2 TB
- Thumbnails per day: 1,000,000 x 50 KB = 50 GB
- Per year, photos: 2 TB x 365 = **730 TB**
- Per year, thumbnails: 50 GB x 365 = about **18 TB**
- **Total: about 748 TB per year** (roughly 0.75 PB)

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 feed views for every 1 upload, a ratio of about 50 to 1. This means the design should focus on making reads fast and cheap: a cache for hot data, a CDN for photo delivery, and a database read replica so most queries do not touch the primary database. Writes still need to be reliable, but there are few of them (about 12 per second), so they can be handled by a small number of app servers and a queue.

## 4. Why photos do not go in the database

A photo is a large binary file. Storing 730 TB a year of them in the database would make it huge, slow to back up and expensive to run, and the database would waste its effort serving files instead of answering queries. Photos belong in **object storage** (such as Amazon S3), which is cheap, very durable and built for large files, and which works with a CDN. The database stores only small details: the photo id, owner, caption, upload time and the **key or URL** that points to the file in object storage.

## 5. Architecture diagram

```
                      +----------------------+
   Users ------------>|         CDN          |  serves photos and thumbnails
 (mobile / web)       +----------+-----------+
      |                          | cache miss
      |                          v
      |                +----------------------+
      |                |    Object storage    |  original photos + thumbnails
      |                +----------+-----------+
      |                           ^
      | API requests              | save / read files
      v                           |
+------------------+              |
|  Load balancer   |              |
+--------+---------+              |
         |                        |
   +-----+------+                 |
   v            v                 |
+--------+  +--------+            |
| App    |  | App    |  ...       |
| server |  | server |  (many)    |
+---+----+  +---+----+            |
    |           |-----------------+
    |
    +-------------------+-------------------+
    |                   |                   |
    v                   v                   v
+---------+      +-------------+      +-----------+
|  Cache  |      | Primary DB  |      |   Queue   |
| (Redis) |      |  (writes)   |      +-----+-----+
+---------+      +------+------+            |
                        | replication       v
                        v            +--------------+
                 +-------------+     |  Thumbnail   |
                 | Read replica|     |   worker     |
                 |  (reads)    |     +------+-------+
                 +-------------+            |
                                            v
                              reads the original, saves the thumbnail
                              to object storage, updates the database
```

## 6. What each component does

- **CDN:** Delivers photos and thumbnails from servers close to the user, so images load quickly and most of the heavy traffic never reaches our servers.
- **Load balancer:** Spreads incoming requests across many app servers so no single server is overloaded, and keeps working if one server fails.
- **App servers:** Run the application logic (login, upload, feed) and can be added or removed as traffic changes.
- **Cache:** Keeps frequently requested data, such as popular feeds, in fast memory so the database is asked less often.
- **Primary database:** Stores the reliable record of users, follows and photo details, and is the only place that accepts writes.
- **Read replica:** Holds a copy of the primary database to answer read queries, which takes the read load off the primary.
- **Object storage:** Holds the original photos and thumbnails cheaply and durably, at a size a database could not handle.
- **Queue:** Holds slow jobs such as thumbnail creation so the upload request can finish quickly instead of waiting.
- **Thumbnail worker:** Picks jobs from the queue, creates the 50 KB thumbnail and saves it, so the work happens in the background.

## 7. Upload flow, step by step

1. The user picks a photo in the app and taps upload.
2. The request goes through the load balancer to an app server.
3. The app server checks that the user is logged in and that the file is a valid image within the size limit.
4. The app server saves the original photo to object storage.
5. The app server writes a new photo row (owner, time, file key, status "processing") to the primary database.
6. The app server puts a "create thumbnail" job on the queue, then tells the user the upload succeeded.
7. A thumbnail worker takes the job from the queue and reads the original photo from object storage.
8. The worker creates the 50 KB thumbnail and saves it to object storage.
9. The worker updates the database row to status "ready" and clears the affected feed entries in the cache.
10. Followers' feeds now show the photo, and the CDN serves the thumbnail and photo to them. If the worker fails, the job stays in the queue and is retried.

## 8. Trade-offs

- **Cache speed vs fresh data:** Caching feeds makes them much faster, but a cached feed can be a few seconds or minutes out of date, so a new photo or a deleted photo may not appear immediately. A shorter cache time is fresher but sends more load to the database.
- **Read replica vs consistency:** Replicas take load off the primary, but they copy data with a small delay. A user could upload a photo and not see it straight away if their next request hits a replica that is behind.
- **Background thumbnails vs instant results:** Using a queue keeps uploads fast, but the thumbnail is not ready immediately, so the photo may briefly show as "processing".
- **CDN cost vs speed:** A CDN makes images load faster worldwide and protects our servers, but it adds a monthly cost and means deleted photos can stay visible until the cache expires.
