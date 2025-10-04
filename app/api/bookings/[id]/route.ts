import { NextRequest, NextResponse } from "next/server";
import { getDb, bookings, customers } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface UpdateBookingRequestBody {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingDate?: string;
  bookingTime?: string;
  partySize?: number;
  specialRequests?: string;
  tableId?: number;
}

// GET /api/bookings/[id] - Get single booking details
export async function GET(
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

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        restaurant: true,
        table: true,
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
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

    const body = await request.json() as UpdateBookingRequestBody;
    const {
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      partySize,
      specialRequests,
      tableId,
    } = body;

    // Get existing booking
    const existingBooking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        restaurant: {
          with: {
            openingHours: true,
            tables: true,
          },
        },
        customer: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking is already cancelled
    if (existingBooking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot modify cancelled booking" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<typeof bookings.$inferInsert> = {};

    // Validate and update customer information if provided
    if (customerName || customerEmail || customerPhone) {
      const customerData: Partial<typeof customers.$inferInsert> = {};
      
      if (customerName) {
        if (customerName.length < 2) {
          return NextResponse.json(
            { error: "Name must be at least 2 characters" },
            { status: 400 }
          );
        }
        customerData.name = customerName;
      }
      
      if (customerEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
          return NextResponse.json(
            { error: "Invalid email address" },
            { status: 400 }
          );
        }
        customerData.email = customerEmail;
      }
      
      if (customerPhone) {
        if (customerPhone.length < 10) {
          return NextResponse.json(
            { error: "Phone number must be at least 10 characters" },
            { status: 400 }
          );
        }
        customerData.phone = customerPhone;
      }

      // Update customer
      await db
        .update(customers)
        .set(customerData)
        .where(eq(customers.id, existingBooking.customerId));
    }

    // Validate and update booking date/time if provided
    if (bookingDate || bookingTime) {
      const newDate = bookingDate || existingBooking.bookingDate;
      const newTime = bookingTime || existingBooking.bookingTime;

      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDateObj = new Date(newDate);
      
      if (bookingDateObj < today) {
        return NextResponse.json(
          { error: "Cannot book in the past" },
          { status: 400 }
        );
      }

      // Validate date is not too far in the future (max 90 days)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      if (bookingDateObj > maxDate) {
        return NextResponse.json(
          { error: "Cannot book more than 90 days in advance" },
          { status: 400 }
        );
      }

      // Check if restaurant is open on this day
      const dayOfWeek = bookingDateObj.getDay();
      const hoursForDay = existingBooking.restaurant.openingHours.find(
        (h) => h.dayOfWeek === dayOfWeek
      );

      if (!hoursForDay || hoursForDay.isClosed) {
        return NextResponse.json(
          { error: "Restaurant is closed on this day" },
          { status: 400 }
        );
      }

      // Validate booking time is within opening hours
      const [bookingHour, bookingMinute] = newTime.split(":").map(Number);
      const [openHour, openMinute] = hoursForDay.openTime.split(":").map(Number);
      const [closeHour, closeMinute] = hoursForDay.closeTime.split(":").map(Number);

      const bookingMinutes = bookingHour * 60 + bookingMinute;
      const openMinutes = openHour * 60 + openMinute;
      
      // Handle midnight (00:00) as 24:00 (1440 minutes)
      const closeMinutes = closeHour === 0 && closeMinute === 0 
        ? 1440  // Midnight = 24:00 = 1440 minutes
        : closeHour * 60 + closeMinute;

      if (bookingMinutes < openMinutes || bookingMinutes > closeMinutes - 60) {
        return NextResponse.json(
          { error: `Restaurant hours: ${hoursForDay.openTime} - ${hoursForDay.closeTime}` },
          { status: 400 }
        );
      }

      updateData.bookingDate = newDate;
      updateData.bookingTime = newTime;
    }

    // Validate and update party size if provided
    if (partySize !== undefined) {
      if (partySize < 1 || partySize > 20) {
        return NextResponse.json(
          { error: "Party size must be between 1 and 20" },
          { status: 400 }
        );
      }
      updateData.partySize = partySize;
    }

    // Validate and update table if provided
    if (tableId !== undefined) {
      const table = existingBooking.restaurant.tables.find((t) => t.id === tableId);
      if (!table) {
        return NextResponse.json(
          { error: "Table not found" },
          { status: 404 }
        );
      }

      if (!table.isActive) {
        return NextResponse.json(
          { error: "Table is not available" },
          { status: 400 }
        );
      }

      const finalPartySize = partySize || existingBooking.partySize;
      if (finalPartySize > table.capacity) {
        return NextResponse.json(
          { error: `Party size exceeds table capacity (max ${table.capacity})` },
          { status: 400 }
        );
      }

      updateData.tableId = tableId;
    }

    // Check for conflicts with other bookings (if date/time/table changed)
    if (updateData.bookingDate || updateData.bookingTime || updateData.tableId) {
      const checkDate = updateData.bookingDate || existingBooking.bookingDate;
      const checkTime = updateData.bookingTime || existingBooking.bookingTime;
      const checkTableId = updateData.tableId || existingBooking.tableId;

      const conflictingBooking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.tableId, checkTableId),
          eq(bookings.bookingDate, checkDate),
          eq(bookings.bookingTime, checkTime),
          eq(bookings.status, "confirmed"),
          // Exclude current booking from conflict check
          // Note: We need to use a different approach since we can't easily negate the ID
        ),
      });

      // Additional check to exclude the current booking
      if (conflictingBooking && conflictingBooking.id !== bookingId) {
        return NextResponse.json(
          { error: "This table is already booked at this time. Please select a different time." },
          { status: 409 }
        );
      }
    }

    // Update special requests if provided
    if (specialRequests !== undefined) {
      updateData.specialRequests = specialRequests || null;
    }

    // Update the booking
    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
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

    // Check if booking is already cancelled
    if (existingBooking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Check if booking is in the past (optional business rule)
    const bookingDate = new Date(existingBooking.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return NextResponse.json(
        { error: "Cannot cancel past bookings" },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const [cancelledBooking] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({ 
      booking: cancelledBooking,
      message: "Booking cancelled successfully" 
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
