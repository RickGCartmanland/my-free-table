import { NextRequest, NextResponse } from "next/server";
import { getDb, bookings } from "@/db";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface UpdateStatusRequestBody {
  status: "confirmed" | "cancelled" | "completed" | "no_show";
}

// PATCH /api/bookings/[id]/status - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  try {
    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);
    
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const body = await request.json() as UpdateStatusRequestBody;
    const { status } = body;

    // Validate status
    const validStatuses = ["confirmed", "cancelled", "completed", "no_show"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get existing booking
    const existingBooking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Business rules for status changes
    if (existingBooking.status === "cancelled" && status !== "cancelled") {
      return NextResponse.json(
        { error: "Cannot change status of cancelled booking" },
        { status: 400 }
      );
    }

    if (existingBooking.status === "completed" && status !== "completed") {
      return NextResponse.json(
        { error: "Cannot change status of completed booking" },
        { status: 400 }
      );
    }

    // Check if trying to cancel past bookings
    if (status === "cancelled") {
      const bookingDate = new Date(existingBooking.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        return NextResponse.json(
          { error: "Cannot cancel past bookings" },
          { status: 400 }
        );
      }
    }

    // Update booking status
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({ 
      booking: updatedBooking,
      message: `Booking status updated to ${status}` 
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Failed to update booking status" },
      { status: 500 }
    );
  }
}
