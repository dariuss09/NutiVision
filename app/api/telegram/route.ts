import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: "Telegram bot keys not configured in environment." },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    // Format the message with bold title if available
    const textToSend = title ? `*${title}*\n${message}` : message;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textToSend,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API returned ${response.status}: ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Telegram Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send Telegram notification" },
      { status: 500 }
    );
  }
}
