import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { todo, completed, userId } = await req.json();
    if (!todo || userId === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch("https://dummyjson.com/todos/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todo, completed, userId }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Failed to add todo");

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
