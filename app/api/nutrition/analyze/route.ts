import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60; // Allow up to 60 seconds for advanced vision analysis

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const nutritionSchemaString = `{
  "mealName": "string",
  "servingWeight": "string",
  "healthScore": "number (1-100)",
  "confidenceLevel": "number (0-100)",
  "confidenceRationale": "string",
  "glycemicIndex": {
    "rating": "string (Low, Medium, High)",
    "explanation": "string"
  },
  "macros": {
    "calories": "number",
    "protein": "number",
    "carbs": "number",
    "fat": "number",
    "fiber": "number",
    "sugar": "number",
    "saturatedFat": "number",
    "netCarbs": "number"
  },
  "micros": {
    "sodiumMg": "number",
    "potassiumMg": "number",
    "calciumMg": "number",
    "ironMg": "number",
    "vitaminCMg": "number",
    "vitaminDIU": "number",
    "cholesterolMg": "number"
  },
  "ingredients": [
    {
      "name": "string",
      "portion": "string",
      "calories": "number",
      "proteinG": "number",
      "carbsG": "number",
      "fatG": "number",
      "category": "string",
      "confidence": "number (0-100)"
    }
  ],
  "dietaryTags": ["string"],
  "allergens": ["string"],
  "healthPros": ["string"],
  "healthWatchouts": ["string"],
  "dietitianAdvice": "string"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, contextSentence, mealType = "lunch" } = body;

    let imageUrl = "";
    if (imageBase64 && typeof imageBase64 === "string") {
      let mimeType = "image/jpeg";
      let pureBase64 = imageBase64;
      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        pureBase64 = matches[2];
      }
      imageUrl = `data:${mimeType};base64,${pureBase64}`;
    }

    const systemInstruction = `You are a world-class clinical dietitian and advanced AI food analyzer.
Your objective is to analyze meals (either via photo or text description) with machine learning precision.
Accurately identify food items, compute macros/micros, and estimate portions.
You MUST output your response strictly in JSON format that matches the following structure exactly:
${nutritionSchemaString}`;

    const promptText = `Please perform a detailed nutritional analysis of this meal.
${contextSentence ? `User's meal hint / description: "${contextSentence}"` : "Analyze this based on the provided inputs."}
Meal category: ${mealType}

Remember to return ONLY valid JSON.`;

    // Use Groq's Qwen Vision Model
    const modelName = "qwen/qwen3.8-27b";
    
    const userContent: any[] = [{ type: "text", text: promptText }];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: userContent
        }
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response text received from vision model.");
    }

    const parsedData = JSON.parse(responseText.trim());

    // Enrich with id, timestamp, mealType, image and model tag
    const result = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      mealType,
      ...parsedData,
      imageUrl: imageUrl,
      userContextPrompt: contextSentence || "",
      aiModelUsed: modelName,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error analyzing nutrition photo via Groq:", error);
    
    // Check for API limits/auth errors safely
    let errMessage = error instanceof Error ? error.message : "Failed to analyze food image";
    if (error?.status === 401) errMessage = "Invalid Groq API Key.";
    if (error?.status === 429) errMessage = "Groq rate limit exceeded.";

    return NextResponse.json(
      { error: errMessage, details: "Please ensure the image is clear and try again." },
      { status: 500 }
    );
  }
}
