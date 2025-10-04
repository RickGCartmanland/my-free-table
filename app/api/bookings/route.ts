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

    // Check if table is already booked at this time
    const existingBooking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.tableId, tableId),
        eq(bookings.bookingDate, bookingDate),
        eq(bookings.bookingTime, bookingTime),
        eq(bookings.status, "confirmed")
      ),
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Table is already booked at this time" },
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

