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
  try {
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
    
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
