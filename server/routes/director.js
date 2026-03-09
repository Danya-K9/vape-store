import { Router } from 'express';
import multer from 'multer';
import { sendTelegramDirectorMessage } from '../telegram/bot.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const file = req.file; // multer puts file in req.file

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Укажите имя, email и сообщение' });
    }

    const data = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
    };

    if (file && file.buffer) {
      data.fileBuffer = file.buffer;
      data.fileName = file.originalname || 'file';
    }

    await sendTelegramDirectorMessage(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Ошибка отправки' });
  }
});

export default router;
