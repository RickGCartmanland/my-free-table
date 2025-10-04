import { NextRequest, NextResponse } from "next/server";
import { getDb, bookings } from "@/db";
import { inArray } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface BulkUpdateRequestBody {
  bookingIds: number[];
  status?: "confirmed" | "cancelled" | "completed" | "no_show";
}

interface BulkDeleteRequestBody {
  bookingIds: number[];
}

// PATCH /api/bookings/bulk - Bulk update bookings
export async function PATCH(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  try {
    const body = await request.json() as BulkUpdateRequestBody;
    const { bookingIds, status } = body;

    // Validate input
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "bookingIds array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (bookingIds.length > 50) {
      return NextResponse.json(
        { error: "Cannot update more than 50 bookings at once" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["confirmed", "cancelled", "completed", "no_show"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate all booking IDs are numbers
    const invalidIds = bookingIds.filter(id => typeof id !== 'number' || isNaN(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "All booking IDs must be valid numbers" },
        { status: 400 }
      );
    }

    // Check if all bookings exist
    const existingBookings = await db.query.bookings.findMany({
      where: inArray(bookings.id, bookingIds),
    });

    if (existingBookings.length !== bookingIds.length) {
      const foundIds = existingBookings.map(b => b.id);
      const missingIds = bookingIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Bookings not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Check business rules for status changes
    const invalidStatusChanges = existingBookings.filter(booking => {
      if (booking.status === "cancelled" && status !== "cancelled") return true;
      if (booking.status === "completed" && status !== "completed") return true;
      return false;
    });

    if (invalidStatusChanges.length > 0) {
      const invalidIds = invalidStatusChanges.map(b => b.id);
      return NextResponse.json(
        { error: `Cannot change status of cancelled/completed bookings: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if trying to cancel past bookings
    if (status === "cancelled") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pastBookings = existingBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate < today;
      });

      if (pastBookings.length > 0) {
        const pastIds = pastBookings.map(b => b.id);
        return NextResponse.json(
          { error: `Cannot cancel past bookings: ${pastIds.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Perform bulk update
    const updatedBookings = await db
      .update(bookings)
      .set({ status })
      .where(inArray(bookings.id, bookingIds))
      .returning();

    return NextResponse.json({
      message: `Successfully updated ${updatedBookings.length} bookings`,
      updatedCount: updatedBookings.length,
      bookings: updatedBookings,
    });
  } catch (error) {
    console.error("Error bulk updating bookings:", error);
    return NextResponse.json(
      { error: "Failed to bulk update bookings" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/bulk - Bulk cancel bookings
export async function DELETE(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  try {
    const body = await request.json() as BulkDeleteRequestBody;
    const { bookingIds } = body;

    // Validate input
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "bookingIds array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (bookingIds.length > 50) {
      return NextResponse.json(
        { error: "Cannot cancel more than 50 bookings at once" },
        { status: 400 }
      );
    }

    // Validate all booking IDs are numbers
    const invalidIds = bookingIds.filter(id => typeof id !== 'number' || isNaN(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "All booking IDs must be valid numbers" },
        { status: 400 }
      );
    }

    // Check if all bookings exist
    const existingBookings = await db.query.bookings.findMany({
      where: inArray(bookings.id, bookingIds),
    });

    if (existingBookings.length !== bookingIds.length) {
      const foundIds = existingBookings.map(b => b.id);
      const missingIds = bookingIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Bookings not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Check if any bookings are already cancelled
    const alreadyCancelled = existingBookings.filter(booking => booking.status === "cancelled");
    if (alreadyCancelled.length > 0) {
      const cancelledIds = alreadyCancelled.map(b => b.id);
      return NextResponse.json(
        { error: `Bookings already cancelled: ${cancelledIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if trying to cancel past bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastBookings = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDate);
      return bookingDate < today;
    });

    if (pastBookings.length > 0) {
      const pastIds = pastBookings.map(b => b.id);
      return NextResponse.json(
        { error: `Cannot cancel past bookings: ${pastIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Perform bulk cancellation
    const cancelledBookings = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(inArray(bookings.id, bookingIds))
      .returning();

    return NextResponse.json({
      message: `Successfully cancelled ${cancelledBookings.length} bookings`,
      cancelledCount: cancelledBookings.length,
      bookings: cancelledBookings,
    });
  } catch (error) {
    console.error("Error bulk cancelling bookings:", error);
    return NextResponse.json(
      { error: "Failed to bulk cancel bookings" },
      { status: 500 }
    );
  }
}
