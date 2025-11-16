import express from "express";
import { chatbotReply } from "../controllers/chatbotController.js";

const router = express.Router();

// POST /api/chatbot
router.post("/", chatbotReply);

export default router;
