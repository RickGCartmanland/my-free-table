import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  try {
    const restaurants = await db.query.restaurants.findMany({
      orderBy: (restaurants, { asc }) => [asc(restaurants.name)],
    });
    
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

