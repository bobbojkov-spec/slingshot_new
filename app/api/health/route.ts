import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ db: "ok" });
  } catch (error: unknown) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        db: "error",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}

