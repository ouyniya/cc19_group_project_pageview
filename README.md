## ติดตั้ง Backend (Node.js + Express + Prisma + Redis)

```bash
npm init -y
npm install express cors dotenv prisma @prisma/client redis
npm install --save-dev nodemon
```

.env
```
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
REDIS_URL="redis://localhost:6379"
PORT=5000
```

server.js
```js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const redis = require("redis");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();
const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect().catch(console.error); // เชื่อมต่อ Redis

app.use(cors());
app.use(express.json());

app.post("/track-view", async (req, res) => {
  const { token, pageId } = req.body;
  const key = `view:${pageId}:${token}`;

  const exists = await client.get(key);
  if (!exists) {
    await client.set(key, "1", { EX: 600 }); // หมดอายุใน 10 นาที

    await prisma.page.update({
      where: { id: Number(pageId) },
      data: { viewCount: { increment: 1 } },
    });
  }

  res.json({ message: "View recorded" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

## npx prisma init
```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Page {
  id        Int     @id @default(autoincrement())
  title     String
  viewCount Int     @default(0)
}
```

npx prisma db push


## ติดตั้ง Frontend (React)

```
npx create vite .
npm install
npm install axios
```


trackView.js
```js
import axios from "axios";

// สร้าง token ถ้ายังไม่มี
const getToken = () => {
  let token = localStorage.getItem("user_token");
  if (!token) {
    token = Math.random().toString(36).substr(2, 16); // สุ่ม token
    localStorage.setItem("user_token", token);
  }
  return token;
};

export const trackView = async (pageId) => {
  const token = getToken();
  try {
    await axios.post("http://localhost:5000/track-view", { token, pageId });
  } catch (error) {
    console.error("Error tracking view:", error);
  }
};
```


 เรียกใช้งาน trackView ใน Page.jsx

 ```js
import { useEffect } from "react";
import { trackView } from "./trackView";

const Page = ({ pageId }) => {
  useEffect(() => {
    trackView(pageId);
  }, [pageId]);

  return <h1>หน้าที่ {pageId}</h1>;
};

export default Page;
 ```

```
redis-server
npm run dev
```

## ดูว่า MySQL อัปเดตยอดวิวไหม


✅ ป้องกันนับซ้ำภายใน 10 นาที
✅ โหลดเร็วกว่าเก็บใน DB โดยตรง
