import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const { id, title } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Todo ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`https://dummyjson.com/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todo: title }),
    });

    const data = await response.json();
    console.log(data);
    console.log("IAMHERERERE");
    if (!response.ok) throw new Error(data.message || "Failed to update todo");

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
