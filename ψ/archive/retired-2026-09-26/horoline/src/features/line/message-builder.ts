import type { ReadingOutput, SafetyCheck } from "@/shared/types/reading";

export function buildFlexReadingMessage(output: ReadingOutput): object {
  return {
    type: "flex",
    altText: `🔮 ทำนาย${output.period}ของคุณ`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `✨ ทำนาย${output.period}`,
            weight: "bold",
            size: "xl",
            color: "#6B21A8",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: output.mainReading,
            wrap: true,
            size: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: output.highlight || "",
            wrap: true,
            size: "sm",
            color: "#7C3AED",
            margin: "md",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🙏 การทำนายเป็นทางเลือกเสริมพลังงานบวก ไม่ใช่สิ่งที่กำหนดชีวิตคุณ",
            size: "xs",
            color: "#9CA3AF",
            wrap: true,
          },
        ],
      },
    },
  };
}

export function buildTextReadingMessage(output: ReadingOutput): string {
  let message = `✨ ทำนาย${output.period}\n\n`;
  message += output.mainReading;

  if (output.highlight) {
    message += `\n\n💜 ${output.highlight}`;
  }

  message += "\n\n🙏 เป็นทางเลือกเสริมพลังงานบวก ไม่ใช่สิ่งกำหนดชีวิตคุณ";

  return message;
}

export function buildShrineRecommendation(shrine: {
  nameTh: string;
  nameEn?: string;
  location?: string;
  reason?: string;
}): object {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🏛️ แนะนำสถานที่ศักดิ์สิทธิ์",
          weight: "bold",
          size: "lg",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: shrine.nameTh,
          weight: "bold",
          size: "xl",
        },
        ...(shrine.location
          ? [
              {
                type: "text",
                text: `📍 ${shrine.location}`,
                size: "sm",
                color: "#6B7280",
              },
            ]
          : []),
        ...(shrine.reason
          ? [
              {
                type: "text",
                text: shrine.reason,
                wrap: true,
                size: "sm",
                color: "#7C3AED",
                margin: "md",
              },
            ]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🙏 ไหว้ขอพรเพื่อเสริมพลังงานบวก",
          size: "xs",
          color: "#9CA3AF",
        },
      ],
    },
  };
}

export function buildOnboardingPrompt(step: string, data?: Record<string, unknown>): string {
  const prompts: Record<string, string> = {
    age_gate: 'ก่อนเริ่ม ขอยืนยันว่าคุณมีอายุ 15 ปีขึ้นไป ค่ะ 🙏\n\nพิมพ์ "ยืนยัน" เพื่อดำเนินการต่อ',
    consent: 'ขอสอบถามการยินยอมเก็บข้อมูลส่วนบุคคล (PDPA) ค่ะ\n\nพิมพ์ "ยินยอม" เพื่อดำเนินการต่อ',
    display_name: 'เรียนคุณว่าอะไรดีคะ? 💫\n\n(หรือพิมพ์ "ข้าม" เพื่อใช้ชื่อเริ่มต้น)',
    birth_date: "วันเกิดของคุณคือวันไหนคะ? 🎂\n\n(เช่น 15 มกราคม 2533 หรือ 15/01/1990)",
    birth_time: 'ถ้าจำเวลาเกิดได้ จะช่วยให้ดูดวงได้ละเอียดขึ้นค่ะ 🕐\n\n(พิมพ์ "ข้าม" ถ้าจำไม่ได้)',
    preferred_topics:
      "สนใจเรื่องอะไรเป็นพิเศษคะ?\n\n💼 การงาน\n💕 ความรัก\n💰 การเงิน\n🏥 สุขภาพ\n🧘 จิตวิญญาณ\n🎯 ทั่วไป\n\nเลือกได้หลายอย่างเลยค่ะ",
    welcome_reading: "ข้อมูลครบแล้วค่ะ! 🎉\n\nขออนุญาตทำนายรายวันให้เป็นการต้อนรับนะคะ ✨",
  };
  return prompts[step] ?? "สวัสดีค่ะ! ยินดีต้อนรับสู่ Horoline 💫";
}

export function buildSatisfactionSurvey(): object {
  return {
    type: "flex",
    altText: "📊 ประเมินความพึงพอใจ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 ทำนายเป็นยังไงบ้างคะ?",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: "ช่วยเราปรับปรุงให้ดีขึ้นนะคะ",
            size: "sm",
            color: "#6B7280",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "postback", data: "rating=1" },
            style: "primary",
            color: "#EF4444",
          },
          {
            type: "button",
            action: { type: "postback", data: "rating=2" },
            style: "primary",
            color: "#F97316",
          },
          {
            type: "button",
            action: { type: "postback", data: "rating=3" },
            style: "primary",
            color: "#EAB308",
          },
          {
            type: "button",
            action: { type: "postback", data: "rating=4" },
            style: "primary",
            color: "#22C55E",
          },
          {
            type: "button",
            action: { type: "postback", data: "rating=5" },
            style: "primary",
            color: "#15803D",
          },
        ],
      },
    },
  };
}
