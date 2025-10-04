import { NextRequest, NextResponse } from "next/server";
import { getDb, bookings, customers } from "@/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// GET /api/bookings/search - Search bookings with filters
export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const { searchParams } = new URL(request.url);
  
  try {
    // Extract search parameters
    const restaurantId = searchParams.get("restaurantId");
    const customerEmail = searchParams.get("customerEmail");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const tableId = searchParams.get("tableId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: "Limit cannot exceed 100" },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [];

    if (restaurantId) {
      const restaurantIdNum = parseInt(restaurantId);
      if (isNaN(restaurantIdNum)) {
        return NextResponse.json(
          { error: "Invalid restaurant ID" },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.restaurantId, restaurantIdNum));
    }

    if (customerEmail) {
      // First find customer by email
      const customer = await db.query.customers.findFirst({
        where: eq(customers.email, customerEmail),
      });
      
      if (customer) {
        conditions.push(eq(bookings.customerId, customer.id));
      } else {
        // Return empty results if customer not found
        return NextResponse.json({ bookings: [], total: 0 });
      }
    }

    if (status) {
      const validStatuses = ["confirmed", "cancelled", "completed", "no_show"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.status, status));
    }

    if (dateFrom) {
      const dateFromObj = new Date(dateFrom);
      if (isNaN(dateFromObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateFrom format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      conditions.push(gte(bookings.bookingDate, dateFrom));
    }

    if (dateTo) {
      const dateToObj = new Date(dateTo);
      if (isNaN(dateToObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateTo format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      conditions.push(lte(bookings.bookingDate, dateTo));
    }

    if (tableId) {
      const tableIdNum = parseInt(tableId);
      if (isNaN(tableIdNum)) {
        return NextResponse.json(
          { error: "Invalid table ID" },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.tableId, tableIdNum));
    }

    // Execute query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const searchResults = await db.query.bookings.findMany({
      where: whereClause,
      with: {
        restaurant: true,
        table: true,
        customer: true,
      },
      orderBy: (bookings, { desc }) => [desc(bookings.bookingDate), desc(bookings.bookingTime)],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(whereClause);

    return NextResponse.json({
      bookings: searchResults,
      total: totalCount.length,
      limit,
      offset,
      hasMore: offset + limit < totalCount.length,
    });
  } catch (error) {
    console.error("Error searching bookings:", error);
    return NextResponse.json(
      { error: "Failed to search bookings" },
      { status: 500 }
    );
  }
}
