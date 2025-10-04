import { NextRequest, NextResponse } from "next/server";
import { getDb, customers, bookings } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface BookingRequestBody {
  restaurantId: number;
  tableId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  specialRequests?: string;
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  
  try {
    const body = await request.json() as BookingRequestBody;
    const {
      restaurantId,
      tableId,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      partySize,
      specialRequests,
    } = body;

    // Validate required fields
    if (!restaurantId || !tableId || !customerName || !customerEmail || 
        !customerPhone || !bookingDate || !bookingTime || !partySize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate party size
    if (partySize < 1 || partySize > 20) {
      return NextResponse.json(
        { error: "Party size must be between 1 and 20" },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDateObj = new Date(bookingDate);
    
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

    // Get restaurant with opening hours
    const restaurant = await db.query.restaurants.findFirst({
      where: (restaurants, { eq }) => eq(restaurants.id, restaurantId),
      with: {
        openingHours: true,
        tables: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if restaurant is open on this day
    const dayOfWeek = bookingDateObj.getDay();
    const hoursForDay = restaurant.openingHours.find(
      (h) => h.dayOfWeek === dayOfWeek
    );

    if (!hoursForDay || hoursForDay.isClosed) {
      return NextResponse.json(
        { error: "Restaurant is closed on this day" },
        { status: 400 }
      );
    }

    // Validate booking time is within opening hours
    const [bookingHour, bookingMinute] = bookingTime.split(":").map(Number);
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

    // Validate table exists and capacity
    const table = restaurant.tables.find((t) => t.id === tableId);
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

    if (partySize > table.capacity) {
      return NextResponse.json(
        { error: `Party size exceeds table capacity (max ${table.capacity})` },
        { status: 400 }
      );
    }

    // Check if customer exists, if not create one
    let customer = await db.query.customers.findFirst({
      where: eq(customers.email, customerEmail),
    });

    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        })
        .returning();
      customer = newCustomer;
    }

    // Check if customer already has a booking at this restaurant on this day
    const existingCustomerBooking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.customerId, customer.id),
        eq(bookings.restaurantId, restaurantId),
        eq(bookings.bookingDate, bookingDate),
        eq(bookings.status, "confirmed")
      ),
    });

    if (existingCustomerBooking) {
      return NextResponse.json(
        { error: "You already have a booking at this restaurant on this date" },
        { status: 409 }
      );
    }

    // Check if table is already booked at this time
    const existingTableBooking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.tableId, tableId),
        eq(bookings.bookingDate, bookingDate),
        eq(bookings.bookingTime, bookingTime),
        eq(bookings.status, "confirmed")
      ),
    });

    if (existingTableBooking) {
      return NextResponse.json(
        { error: "This table is already booked at this time. Please select a different time." },
        { status: 409 }
      );
    }

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        restaurantId,
        tableId,
        customerId: customer.id,
        bookingDate,
        bookingTime,
        partySize,
        specialRequests: specialRequests || null,
        status: "confirmed",
      })
      .returning();

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  
  try {
    if (email) {
      // Get bookings for a specific customer
      const customer = await db.query.customers.findFirst({
        where: eq(customers.email, email),
      });

      if (!customer) {
        return NextResponse.json({ bookings: [] });
      }

      const customerBookings = await db.query.bookings.findMany({
        where: eq(bookings.customerId, customer.id),
        with: {
          restaurant: true,
          table: true,
        },
        orderBy: (bookings, { desc }) => [desc(bookings.bookingDate)],
      });

      return NextResponse.json({ bookings: customerBookings });
    }

    // Get all bookings (for admin)
    const allBookings = await db.query.bookings.findMany({
      with: {
        restaurant: true,
        table: true,
        customer: true,
      },
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      limit: 100,
    });

    return NextResponse.json({ bookings: allBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

