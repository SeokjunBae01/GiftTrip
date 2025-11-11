// page7Share.cjs
const express = require("express");
const multer = require("multer");
const { sendGiftTripMail } = require("./mailer.cjs");

const router = express.Router();                   // ✅ router 선언
const upload = multer({ storage: multer.memoryStorage() });

router.post("/page7/share", upload.single("file"), async (req, res) => {
  try {
    const { nickname, email, countryCode } = req.body;
    const file = req.file;

    console.log("[/api/page7/share] hit", {
      nickname, email, countryCode,
      hasFile: !!file, fileName: file?.originalname,
      mime: file?.mimetype, size: file?.size
    });

    if (!nickname || !email || !file) {
      return res.status(400).json({ success: false, message: "닉네임, 이메일, 파일은 필수입니다." });
    }

    const subject = `GiftTrip - ${nickname}${countryCode ? ` (${countryCode})` : ""}`;
    const html = `<p>${nickname}님, GiftTrip 여행 계획서를 보내드립니다.<br>설문을 참여하시면 스타벅스 쿠폰을 드립니다.<br>{설문지 주소}</p>`;
    //TODO : 스타벅스 설문지 꼭 확인하기
    const info = await sendGiftTripMail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: "GiftTrip-Draft.pdf",
          content: file.buffer,
          contentType: file.mimetype || "application/pdf",
        },
      ],
    });

    console.log("[mail sent]", info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (e) {
    console.error("[/api/page7/share] error:", e);
    return res.status(500).json({ success: false, message: "메일 전송 중 오류" });
  }
});

module.exports = router;                           // ✅ 라우터 export