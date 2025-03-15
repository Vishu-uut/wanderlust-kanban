import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://dummyjson.com/todos?limit=10");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch todos");
    }

    return NextResponse.json(data.todos);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
